import type {
  GameType,
  NormalizedStatsParams,
  NormalizedStatsResult,
  StatsProvider,
} from "../types";

const USER_AGENT = "ChessStatsOverlay/1.0 (https://github.com/albertosire/chess-stats-overlay)";

interface LichessUser {
  username: string;
  perfs?: Record<
    string,
    {
      rating?: number;
      games?: number;
    }
  >;
}

interface LichessGamePlayer {
  user?: { name?: string };
  rating?: number;
}

interface LichessGame {
  createdAt?: number;
  lastMoveAt?: number;
  status?: string;
  winner?: "white" | "black";
  rated?: boolean;
  speed?: string;
  perf?: string;
  players?: {
    white?: LichessGamePlayer;
    black?: LichessGamePlayer;
  };
}

function mapTypeToLichessPerf(type: GameType): string | null {
  switch (type) {
    case "bullet":
      return "bullet";
    case "blitz":
      return "blitz";
    case "rapid":
      return "rapid";
    case "daily":
      return "correspondence";
    default:
      return null;
  }
}

async function lichessFetch<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": USER_AGENT,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Lichess API ${response.status}: ${response.statusText}`);
  }

  return (await response.json()) as T;
}

async function fetchLichessGames(
  username: string,
  from: Date,
  to: Date,
  perf: string | null,
): Promise<LichessGame[]> {
  const params = new URLSearchParams({
    since: String(from.getTime()),
    until: String(to.getTime()),
    max: "300",
    rated: "true",
  });

  if (perf) {
    params.set("perfType", perf);
  }

  const response = await fetch(
    `https://lichess.org/api/games/user/${encodeURIComponent(username)}?${params}`,
    {
      headers: {
        Accept: "application/x-ndjson",
        "User-Agent": USER_AGENT,
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`Lichess games API ${response.status}`);
  }

  const text = await response.text();
  if (!text.trim()) return [];

  return text
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line) as LichessGame);
}

function sideOf(game: LichessGame, username: string): "white" | "black" | null {
  const normalized = username.toLowerCase();
  const white = game.players?.white?.user?.name?.toLowerCase();
  const black = game.players?.black?.user?.name?.toLowerCase();
  if (white === normalized) return "white";
  if (black === normalized) return "black";
  return null;
}

function outcomeFor(
  game: LichessGame,
  side: "white" | "black",
): "win" | "draw" | "loss" {
  if (!game.winner) return "draw";
  return game.winner === side ? "win" : "loss";
}

export const lichessProvider: StatsProvider = {
  id: "lichess",
  label: "Lichess",
  async fetchStats(params: NormalizedStatsParams): Promise<NormalizedStatsResult> {
    const period = {
      from: params.from.toISOString().slice(0, 10),
      to: params.to.toISOString().slice(0, 10),
    };

    if (params.type === "puzzles" || params.type === "daily960" || params.type === "manual") {
      return {
        provider: "lichess",
        username: params.username,
        type: params.type,
        period,
        stats: {
          wins: 0,
          draws: 0,
          losses: 0,
          games: 0,
          ratingDelta: null,
          currentRating: null,
          winRate: null,
          streak: 0,
        },
        meta: {
          ratedGames: 0,
          fetchedAt: new Date().toISOString(),
          mode: params.type === "puzzles" ? "puzzles" : "games",
          note: "Modalidade não suportada no Lichess neste overlay.",
        },
      };
    }

    const perf = mapTypeToLichessPerf(params.type);
    const [user, games] = await Promise.all([
      lichessFetch<LichessUser>(
        `https://lichess.org/api/user/${encodeURIComponent(params.username)}`,
      ),
      fetchLichessGames(params.username, params.from, params.to, perf),
    ]);

    let wins = 0;
    let draws = 0;
    let losses = 0;
    let ratedGames = 0;
    const ratedByTime: { endTime: number; rating: number }[] = [];
    const outcomes: Array<"win" | "draw" | "loss"> = [];

    const sorted = [...games].sort(
      (a, b) => (a.lastMoveAt ?? a.createdAt ?? 0) - (b.lastMoveAt ?? b.createdAt ?? 0),
    );

    for (const game of sorted) {
      const side = sideOf(game, params.username);
      if (!side) continue;

      const outcome = outcomeFor(game, side);
      outcomes.push(outcome);
      if (outcome === "win") wins += 1;
      else if (outcome === "draw") draws += 1;
      else losses += 1;

      const rating = game.players?.[side]?.rating;
      if (game.rated && rating != null) {
        ratedGames += 1;
        ratedByTime.push({
          endTime: game.lastMoveAt ?? game.createdAt ?? 0,
          rating,
        });
      }
    }

    let ratingDelta: number | null = 0;
    if (ratedByTime.length >= 2) {
      ratingDelta =
        ratedByTime[ratedByTime.length - 1].rating - ratedByTime[0].rating;
    }

    let streak = 0;
    for (let i = outcomes.length - 1; i >= 0; i -= 1) {
      if (outcomes[i] !== "win") break;
      streak += 1;
    }

    const total = wins + draws + losses;
    const currentRating =
      (perf && user.perfs?.[perf]?.rating) ||
      ratedByTime.at(-1)?.rating ||
      null;

    return {
      provider: "lichess",
      username: user.username || params.username,
      type: params.type,
      period,
      stats: {
        wins,
        draws,
        losses,
        games: total,
        ratingDelta,
        currentRating,
        winRate: total === 0 ? null : Math.round((wins / total) * 1000) / 10,
        streak,
      },
      meta: {
        ratedGames,
        fetchedAt: new Date().toISOString(),
        mode: "games",
      },
    };
  },
};
