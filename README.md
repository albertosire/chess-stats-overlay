# Chess Stats Overlay

Overlay HTML para OBS com estatísticas Chess.com / Lichess. Modelo freemium (Free + Pro + Brand Kits).

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind
- Supabase (Auth, Postgres, RLS, Storage)
- Stripe (assinatura Pro + temas avulsos)
- Framer Motion (alertas no overlay)

## Setup rápido

```bash
npm install
cp .env.example .env.local
# Preencha Supabase + Stripe
npx supabase db push   # ou aplique supabase/migrations/*.sql no SQL Editor
npm run dev
```

### Supabase

1. Crie um projeto e rode a migration `supabase/migrations/20260915030909_init_saas_schema.sql`.
2. Ative Email + Google Auth.
3. Configure Redirect URL: `http://localhost:3000/auth/callback` (e o domínio de produção).

### Stripe

1. Crie Products/Prices (Pro USD/BRL, temas, bundle).
2. Cole os Price IDs no `.env.local`.
3. Webhook endpoint: `/api/webhooks/stripe` (eventos: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`).
4. Habilite Pix (BRL) e cartão via Dynamic Payment Methods no Dashboard — **não** fixe `payment_method_types` no código.

## Rotas principais

| Rota | Descrição |
|------|-----------|
| `/` | Builder Free + pricing |
| `/login` | Auth e-mail/Google |
| `/dashboard` | Contas, config, copy OBS link, checkout |
| `/overlay?username=…` | Overlay legado **sempre Free** |
| `/overlay/[token]` | Overlay tokenizado (Free/Pro) |
| `GET /api/stats` | JSON (cap Free sem `token`) |
| `POST /api/checkout` | Stripe Checkout |
| `POST /api/webhooks/stripe` | Liberação Pro / temas |

## Free vs Pro

- **Free:** ELO atual, W/D/L, tema Dark Minimalist, 1 provider
- **Pro:** Δ ELO, win rate, streak, dual Chess.com+Lichess, cores/fonte, alertas, logo sponsor
- **Brand Kits:** compra avulsa ou Mega Bundle

## OBS

Dashboard → **Copiar link OBS** → Browser Source (~420×220, fundo transparente).
