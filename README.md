# Chess Stats Overlay

Overlay HTML para transmissões (OBS) com estatísticas de partidas do Chess.com.

## Funcionalidades

- Vitórias, empates, derrotas e variação de rating por período
- Modalidades: rapid, blitz, daily, daily960, puzzles, manual (time control)
- Atualização automática enquanto a página estiver aberta
- Endpoint JSON e página `/overlay` pronta para Browser Source

## Interface de configuração

A página inicial (`/`) inclui um **builder interativo** que permite:

- Configurar usuário, modalidade, período e intervalo de atualização
- Pré-visualizar o overlay em tempo real
- Copiar a **URL** para OBS Browser Source
- Copiar o **snippet HTML** (`<iframe>`) para embutir em sites e widgets
- Copiar a **URL da API JSON** para integrações customizadas
- Abrir o overlay diretamente em nova aba

## Desenvolvimento

```bash
npm install
npm run dev
```

Abra `http://localhost:3000/overlay?username=SEU_USUARIO&type=blitz&period=session&refresh=30`.

## OBS Browser Source

Use uma URL como:

```
https://seu-dominio/overlay?username=hikaru&type=blitz&period=session&refresh=30
```

Recomendações:
- Largura: 420px, Altura: 220px
- Fundo transparente habilitado no OBS

## Parâmetros

| Parâmetro | Descrição |
|-----------|-----------|
| `username` | Conta Chess.com |
| `type` | rapid, blitz, daily, daily960, puzzles, manual |
| `period` | session, today, week, month |
| `from` / `to` | Intervalo YYYY-MM-DD |
| `refresh` | Segundos entre atualizações (mín. 15) |
| `timeControl` | Para manual (ex: 600+0) |
| `initialRating` | Para puzzles |
| `overrideRating` | Força rating atual em puzzles |

## API

```
GET /api/stats?username=hikaru&type=blitz&period=session&sessionStart=2026-08-31T10:00:00.000Z
```

Resposta:

```json
{
  "username": "hikaru",
  "type": "blitz",
  "period": { "from": "2026-08-31", "to": "2026-08-31" },
  "stats": { "wins": 3, "draws": 1, "losses": 2, "games": 6, "ratingDelta": 12 },
  "meta": { "ratedGames": 6, "fetchedAt": "...", "mode": "games" }
}
```

## Limitações da API Chess.com

- Rate limit: requisições moderadas com cache desabilitado no overlay
- Puzzles: API pública não expõe rating atual; use `initialRating` + `overrideRating` se necessário
- Histórico mensal pode retornar 403 em contas com muitas partidas se consultado em excesso

## Deploy

Compatível com Vercel:

```bash
npm run build
```
