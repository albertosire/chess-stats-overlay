-- Chess Stats Overlay SaaS schema

create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  stripe_customer_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.linked_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  provider text not null check (provider in ('chesscom', 'lichess')),
  username text not null,
  created_at timestamptz not null default now(),
  unique (user_id, provider)
);

create table public.overlay_configs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  active_theme_id text not null default 'default-dark',
  primary_color text not null default '#18181b',
  accent_color text not null default '#22c55e',
  font_family text not null default 'Inter',
  show_delta_elo boolean not null default false,
  show_winrate boolean not null default false,
  show_streak boolean not null default false,
  custom_sponsor_logo_url text,
  game_type text not null default 'blitz',
  period_mode text not null default 'session',
  refresh_seconds integer not null default 25,
  time_control text,
  display_name text,
  primary_provider text not null default 'chesscom' check (primary_provider in ('chesscom', 'lichess')),
  secondary_provider text check (secondary_provider is null or secondary_provider in ('chesscom', 'lichess')),
  obs_token text not null unique default encode(gen_random_bytes(32), 'hex'),
  updated_at timestamptz not null default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  stripe_subscription_id text unique,
  stripe_price_id text,
  status text not null default 'inactive',
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.theme_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  theme_id text not null,
  stripe_session_id text unique,
  amount_paid numeric(10, 2) not null default 0,
  currency text not null default 'USD',
  purchased_at timestamptz not null default now(),
  unique (user_id, theme_id)
);

create index linked_accounts_user_id_idx on public.linked_accounts (user_id);
create index overlay_configs_obs_token_idx on public.overlay_configs (obs_token);
create index theme_purchases_user_id_idx on public.theme_purchases (user_id);

alter table public.profiles enable row level security;
alter table public.linked_accounts enable row level security;
alter table public.overlay_configs enable row level security;
alter table public.subscriptions enable row level security;
alter table public.theme_purchases enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "linked_accounts_select_own"
  on public.linked_accounts for select
  using (auth.uid() = user_id);

create policy "linked_accounts_insert_own"
  on public.linked_accounts for insert
  with check (auth.uid() = user_id);

create policy "linked_accounts_update_own"
  on public.linked_accounts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "linked_accounts_delete_own"
  on public.linked_accounts for delete
  using (auth.uid() = user_id);

create policy "overlay_configs_select_own"
  on public.overlay_configs for select
  using (auth.uid() = user_id);

create policy "overlay_configs_update_own"
  on public.overlay_configs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "subscriptions_select_own"
  on public.subscriptions for select
  using (auth.uid() = user_id);

create policy "theme_purchases_select_own"
  on public.theme_purchases for select
  using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, coalesce(new.email, ''));

  insert into public.overlay_configs (user_id)
  values (new.id);

  insert into public.subscriptions (user_id, status)
  values (new.id, 'inactive');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_pro_user(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.subscriptions s
    where s.user_id = p_user_id
      and s.status in ('active', 'trialing')
      and (s.current_period_end is null or s.current_period_end > now())
  );
$$;

revoke all on function public.is_pro_user(uuid) from public;
grant execute on function public.is_pro_user(uuid) to authenticated, anon, service_role;

create or replace function public.get_overlay_by_token(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  select jsonb_build_object(
    'user_id', oc.user_id,
    'is_pro', public.is_pro_user(oc.user_id),
    'config', jsonb_build_object(
      'active_theme_id', oc.active_theme_id,
      'primary_color', oc.primary_color,
      'accent_color', oc.accent_color,
      'font_family', oc.font_family,
      'show_delta_elo', oc.show_delta_elo,
      'show_winrate', oc.show_winrate,
      'show_streak', oc.show_streak,
      'custom_sponsor_logo_url', oc.custom_sponsor_logo_url,
      'game_type', oc.game_type,
      'period_mode', oc.period_mode,
      'refresh_seconds', oc.refresh_seconds,
      'time_control', oc.time_control,
      'display_name', oc.display_name,
      'primary_provider', oc.primary_provider,
      'secondary_provider', oc.secondary_provider,
      'obs_token', oc.obs_token
    ),
    'accounts', coalesce((
      select jsonb_agg(jsonb_build_object(
        'provider', la.provider,
        'username', la.username
      ))
      from public.linked_accounts la
      where la.user_id = oc.user_id
    ), '[]'::jsonb),
    'owned_themes', coalesce((
      select jsonb_agg(tp.theme_id)
      from public.theme_purchases tp
      where tp.user_id = oc.user_id
    ), '[]'::jsonb)
  )
  into result
  from public.overlay_configs oc
  where oc.obs_token = p_token;

  return result;
end;
$$;

revoke all on function public.get_overlay_by_token(text) from public;
grant execute on function public.get_overlay_by_token(text) to anon, authenticated, service_role;

-- Storage bucket for sponsor logos (Pro)
insert into storage.buckets (id, name, public)
values ('sponsor-logos', 'sponsor-logos', true)
on conflict (id) do nothing;

create policy "sponsor_logos_select_public"
  on storage.objects for select
  using (bucket_id = 'sponsor-logos');

create policy "sponsor_logos_insert_own"
  on storage.objects for insert
  with check (
    bucket_id = 'sponsor-logos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "sponsor_logos_update_own"
  on storage.objects for update
  using (
    bucket_id = 'sponsor-logos'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'sponsor-logos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "sponsor_logos_delete_own"
  on storage.objects for delete
  using (
    bucket_id = 'sponsor-logos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
