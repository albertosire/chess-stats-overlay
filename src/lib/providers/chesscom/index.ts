import { buildStats } from "@/lib/chess-com/stats";
import { chessFetch } from "@/lib/chess-com/client";
import type { PlayerStats } from "@/lib/chess-com/types";
import type {
  NormalizedStatsParams,
  NormalizedStatsResult,
  StatsProvider,
} from "../types";

function computeWinRate(wins: number, draws: number, losses: number): number | null {
  const total = wins + draws + losses;
  if (total === 0) return null;
  return Math.round((wins / total) * 1000) / 10;
}

async function fetchCurrentRating(
  username: string,
  type: NormalizedStatsParams["type"],
): Promise<number | null> {
  if (type === "puzzles" || type === "manual") return null;

  try {
    const stats = await chessFetch<PlayerStats>(
      `https://api.chess.com/pub/player/${encodeURIComponent(username)}/stats`,
    );

    const map: Record<string, number | undefined> = {
      bullet: stats.chess_bullet?.last?.rating,
      blitz: stats.chess_blitz?.last?.rating,
      rapid: stats.chess_rapid?.last?.rating,
      daily: stats.chess_daily?.last?.rating,
      daily960: stats.chess960_daily?.last?.rating,
    };

    return map[type] ?? null;
  } catch {
    return null;
  }
}

export const chessComProvider: StatsProvider = {
  id: "chesscom",
  label: "Chess.com",
  async fetchStats(params: NormalizedStatsParams): Promise<NormalizedStatsResult> {
    const result = await buildStats(params);
    const liveRating = await fetchCurrentRating(params.username, params.type);
    const currentRating = liveRating ?? result.stats.currentRating ?? null;

    return {
      provider: "chesscom",
      username: result.username,
      type: result.type,
      period: result.period,
      stats: {
        wins: result.stats.wins,
        draws: result.stats.draws,
        losses: result.stats.losses,
        games: result.stats.games,
        ratingDelta: result.stats.ratingDelta,
        currentRating,
        winRate: computeWinRate(result.stats.wins, result.stats.draws, result.stats.losses),
        streak: result.stats.streak ?? 0,
      },
      meta: result.meta,
    };
  },
};
