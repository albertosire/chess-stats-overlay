import { ChessApiError } from "@/lib/errors";
import {
  computeRatingDelta,
  computeStreak,
  computeWinRate,
  tallyOutcomes,
  type GameOutcome,
} from "@/lib/domain/stats";
import type {
  GameType,
  NormalizedStatsParams,
  NormalizedStatsResult,
  StatsProvider,
} from "../types";

const USER_AGENT = "ChessStatsOverlay/1.0 (https://github.com/albertosire/chess-stats-overlay)";

function isTimeoutError(error: unknown): boolean {
  return error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
}

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

export interface LichessGame {
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
  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": USER_AGENT,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    });
  } catch (error) {
    if (isTimeoutError(error)) throw new ChessApiError("timeout", 504);
    throw new ChessApiError("unavailable", 503);
  }

  if (response.status === 404) {
    throw new ChessApiError("not_found", 404);
  }
  if (response.status === 429) {
    throw new ChessApiError("rate_limited", 429);
  }
  if (!response.ok) {
    throw new ChessApiError("unavailable", 503);
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

  let response: Response;
  try {
    response = await fetch(
      `https://lichess.org/api/games/user/${encodeURIComponent(username)}?${params}`,
      {
        headers: {
          Accept: "application/x-ndjson",
          "User-Agent": USER_AGENT,
        },
        cache: "no-store",
        signal: AbortSignal.timeout(12_000),
      },
    );
  } catch (error) {
    if (isTimeoutError(error)) throw new ChessApiError("timeout", 504);
    throw new ChessApiError("unavailable", 503);
  }

  if (response.status === 404) {
    throw new ChessApiError("not_found", 404);
  }
  if (response.status === 429) {
    throw new ChessApiError("rate_limited", 429);
  }
  if (!response.ok) {
    throw new ChessApiError("unavailable", 503);
  }

  const text = await response.text();
  return parseLichessNdjson(text);
}

export function parseLichessNdjson(text: string): LichessGame[] {
  if (!text.trim()) return [];

  return text
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line) as LichessGame);
}

export function summarizeLichessGames(games: LichessGame[], username: string) {
  let ratedGames = 0;
  const ratedByTime: { endTime: number; rating: number }[] = [];
  const outcomes: GameOutcome[] = [];

  const sorted = [...games].sort(
    (a, b) => (a.lastMoveAt ?? a.createdAt ?? 0) - (b.lastMoveAt ?? b.createdAt ?? 0),
  );

  for (const game of sorted) {
    const side = sideOf(game, username);
    if (!side) continue;

    outcomes.push(outcomeFor(game, side));

    const rating = game.players?.[side]?.rating;
    if (game.rated && rating != null) {
      ratedGames += 1;
      ratedByTime.push({
        endTime: game.lastMoveAt ?? game.createdAt ?? 0,
        rating,
      });
    }
  }

  ratedByTime.sort((a, b) => a.endTime - b.endTime);
  const tally = tallyOutcomes(outcomes);

  return {
    ...tally,
    ratedGames,
    ratingDelta: computeRatingDelta(ratedByTime.map((entry) => entry.rating)),
    streak: computeStreak(outcomes),
    winRate: computeWinRate(tally.wins, tally.draws, tally.losses),
    lastRating: ratedByTime.at(-1)?.rating ?? null,
  };
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

    const summary = summarizeLichessGames(games, params.username);
    const currentRating =
      (perf && user.perfs?.[perf]?.rating) || summary.lastRating || null;

    return {
      provider: "lichess",
      username: user.username || params.username,
      type: params.type,
      period,
      stats: {
        wins: summary.wins,
        draws: summary.draws,
        losses: summary.losses,
        games: summary.games,
        ratingDelta: summary.ratingDelta,
        currentRating,
        winRate: summary.winRate,
        streak: summary.streak,
      },
      meta: {
        ratedGames: summary.ratedGames,
        fetchedAt: new Date().toISOString(),
        mode: "games",
      },
    };
  },
};
