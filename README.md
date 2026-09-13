# Chess Stats Overlay

Overlay open source de estatísticas do Chess.com para transmissões (OBS).

Autor: [Alberto Horta](https://github.com/albertosire). Issues e contato do projeto: [github.com/albertosire](https://github.com/albertosire).

A PubAPI do Chess.com **não é tempo real**. Este app consulta o arquivo do mês vigente a cada 20–30s. Partidas recém-terminadas podem levar alguns minutos para aparecer.

## Funcionalidades

- Vitórias, empates, derrotas e variação de rating por período
- Modalidades: bullet, blitz, rapid, daily, daily960, puzzles, manual (time control)
- **Iniciar Contador**: marca \(T_{inicio}\) na URL (`sessionStart`) para a sessão da stream
- Overlay HTML (`/overlay`) para OBS Browser Source
- Texto puro (`/api/stats.txt`) para arquivo local ou Browser Source mínimo
- JSON (`/api/stats`) para integrações

## Interface de configuração

A página inicial (`/`) inclui um **builder interativo** que permite:

- Configurar usuário, nome de exibição, modalidade, período e intervalo de atualização
- Iniciar (ou reiniciar) o contador da sessão
- Pré-visualizar o overlay
- Copiar a **URL HTML**, o **snippet iframe**, a **URL de texto** e a **URL JSON**

## Desenvolvimento

```bash
npm install
npm run dev
```

No Windows, o `dev`/`start` usa `--use-system-ca` para o Node aceitar o certificado TLS da PubAPI (sem isso o fetch pode falhar com `UNABLE_TO_VERIFY_LEAF_SIGNATURE`).

Abra `http://localhost:3000`, preencha o usuário, clique em **Iniciar Contador** e copie a URL.

Exemplo com marco de sessão:

```
http://localhost:3000/overlay?username=SEU_USUARIO&type=blitz&period=session&sessionStart=2026-09-13T21:00:00.000Z&refresh=25
```

## Duas saídas

### Overlay HTML (Browser Source)

```
https://seu-dominio/overlay?username=hikaru&type=blitz&period=session&sessionStart=...&refresh=25
```

No OBS: Fonte → Browser → cole a URL → largura ~420px, altura ~220px, fundo transparente.

### Texto puro

```
GET /api/stats.txt?username=hikaru&type=blitz&period=session&sessionStart=...
```

Formato:

```
3-1-2
W 3 | D 1 | L 2 | dRating +12
```

O **Text (GDI+)** do OBS não lê URL. Opções:

1. Browser Source apontando para `/api/stats.txt?...`
2. Script local gravando arquivo a cada 25s:

```bash
curl -s "https://seu-dominio/api/stats.txt?username=hikaru&type=blitz&period=session&sessionStart=..." -o stats.txt
```

Depois use Text (GDI+) com “Ler de um arquivo”.

## Parâmetros

| Parâmetro | Descrição |
|-----------|-----------|
| `username` | Conta Chess.com |
| `name` | Título de exibição do overlay (opcional, máx. 40 caracteres) |
| `type` | bullet, rapid, blitz, daily, daily960, puzzles, manual |
| `period` | session, today, week, month |
| `sessionStart` | ISO 8601 do **Iniciar Contador** (obrigatório para sessão estável no OBS) |
| `from` / `to` | Intervalo YYYY-MM-DD |
| `refresh` | Segundos entre atualizações (mín. 20, padrão 25) |
| `timeControl` | Para manual (ex: 600+0) |
| `initialRating` | Para puzzles |
| `overrideRating` | Força rating atual em puzzles |

## API JSON

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

## PubAPI Chess.com

- User-Agent: `ChessStatsOverlay/1.0 (Alberto Horta; https://github.com/albertosire)` (override em `CHESS_COM_USER_AGENT` se fizer fork)
- Polling 20–30s; ETag / If-None-Match no arquivo mensal para reduzir carga
- Períodos que cabem no mês vigente buscam só `.../games/{YYYY}/{MM}`
- Puzzles: a API pública não expõe rating atual; use `initialRating` + `overrideRating`
- Arquivo mensal pode atrasar alguns minutos após o fim da partida
- Histórico muito grande pode retornar 403 se consultado em excesso

## Deploy

Compatível com Vercel:

```bash
npm run build
```
