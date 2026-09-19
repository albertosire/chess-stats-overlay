"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserIsPro, getOwnedThemeIds } from "@/lib/billing/entitlements";
import { canUseTheme } from "@/lib/themes";
import type { ChessProviderId } from "@/lib/providers/types";
import { isChessProviderId } from "@/lib/providers/registry";
import type { Database } from "@/lib/supabase/database.types";

export async function saveLinkedAccount(provider: ChessProviderId, username: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const cleaned = username.trim().toLowerCase();
  if (!cleaned) throw new Error("Username obrigatório.");

  const { error } = await supabase.from("linked_accounts").upsert(
    {
      user_id: user.id,
      provider,
      username: cleaned,
    },
    { onConflict: "user_id,provider" },
  );

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}

export async function removeLinkedAccount(provider: ChessProviderId) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const { error } = await supabase
    .from("linked_accounts")
    .delete()
    .eq("user_id", user.id)
    .eq("provider", provider);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}

export type OverlayConfigInput = {
  active_theme_id?: string;
  primary_color?: string;
  accent_color?: string;
  font_family?: string;
  show_delta_elo?: boolean;
  show_winrate?: boolean;
  show_streak?: boolean;
  game_type?: string;
  period_mode?: string;
  refresh_seconds?: number;
  time_control?: string | null;
  display_name?: string | null;
  primary_provider?: string;
  secondary_provider?: string | null;
  custom_sponsor_logo_url?: string | null;
};

export async function saveOverlayConfig(input: OverlayConfigInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const isPro = await getCurrentUserIsPro(user.id);
  const ownedThemes = await getOwnedThemeIds(user.id);

  const primaryProvider: ChessProviderId = isChessProviderId(input.primary_provider)
    ? input.primary_provider
    : "chesscom";

  const patch: Database["public"]["Tables"]["overlay_configs"]["Update"] = {
    game_type: input.game_type,
    period_mode: input.period_mode,
    refresh_seconds: input.refresh_seconds,
    time_control: input.time_control,
    display_name: input.display_name,
    primary_provider: primaryProvider,
    updated_at: new Date().toISOString(),
  };

  if (isPro) {
    patch.show_delta_elo = Boolean(input.show_delta_elo);
    patch.show_winrate = Boolean(input.show_winrate);
    patch.show_streak = Boolean(input.show_streak);
    patch.primary_color = input.primary_color;
    patch.accent_color = input.accent_color;
    patch.font_family = input.font_family;
    patch.custom_sponsor_logo_url = input.custom_sponsor_logo_url ?? null;

    if (
      input.secondary_provider &&
      isChessProviderId(input.secondary_provider) &&
      input.secondary_provider !== primaryProvider
    ) {
      patch.secondary_provider = input.secondary_provider;
    } else {
      patch.secondary_provider = null;
    }

    if (input.active_theme_id && canUseTheme(input.active_theme_id, ownedThemes, isPro)) {
      patch.active_theme_id = input.active_theme_id;
    }
  } else {
    patch.show_delta_elo = false;
    patch.show_winrate = false;
    patch.show_streak = false;
    patch.secondary_provider = null;
    patch.active_theme_id = "default-dark";
    patch.custom_sponsor_logo_url = null;
  }

  const { error } = await supabase
    .from("overlay_configs")
    .update(patch)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}

export async function regenerateObsToken() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const { error } = await supabase
    .from("overlay_configs")
    .update({ obs_token: token, updated_at: new Date().toISOString() })
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  return token;
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/");
}
