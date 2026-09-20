# Chess Stats Overlay

Overlay HTML para OBS com estatísticas Chess.com / Lichess. Gratuito e open source — configuração salva no navegador (`localStorage`); a URL do OBS leva os parâmetros na query string.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind
- Framer Motion (alertas no overlay)
- APIs públicas Chess.com / Lichess (proxy em `/api/stats`)

## Setup rápido

```bash
npm install
cp .env.example .env.local   # opcional
npm run dev
```

## Rotas principais

| Rota | Descrição |
|------|-----------|
| `/` | Builder (todas as features) + preview + copiar URL OBS |
| `/overlay?username=…` | Overlay para Browser Source |
| `GET /api/stats` | JSON de estatísticas |
| `GET /api/stats.txt` | Texto puro |

`/login` e `/dashboard` redirecionam para `/`. Links tokenizados `/overlay/[token]` exibem aviso de descontinuação.

## Recursos

- ELO atual, W/D/L, Δ ELO, win rate, streak
- Dual Chess.com + Lichess
- Cores, fonte e logo do patrocinador (URL pública)
- Alertas de vitória / marcos de rating
- Exportar / importar JSON da configuração

## OBS

Builder → **Copiar URL** → Fonte Browser (~420×220, ou ~840×220 com dual; fundo transparente).
