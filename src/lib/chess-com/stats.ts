import {
  computeRatingDelta,
  computeStreak,
  tallyOutcomes,
  type GameOutcome,
} from "@/lib/domain/stats";
import { fetchGamesInPeriod } from "./archives";
import { chessFetch } from "./client";
import { isInPeriod, matchesGameType } from "./filters";
import { classifyResult } from "./results";
import type {
  ChessGame,
  PlayerStats,
  StatsParams,
  StatsResult,
} from "./types";

function gameId(game: ChessGame): string {
  return game.url || `${game.end_time}-${game.white.username}-${game.black.username}`;
}

function dedupeGames(games: ChessGame[]): ChessGame[] {
  const seen = new Set<string>();
  const unique: ChessGame[] = [];

  for (const game of games) {
    const id = gameId(game);
    if (seen.has(id)) continue;
    seen.add(id);
    unique.push(game);
  }

  return unique;
}

function getPlayerSide(
  game: ChessGame,
  username: string,
): "white" | "black" | null {
  const normalized = username.toLowerCase();
  if (game.white.username.toLowerCase() === normalized) return "white";
  if (game.black.username.toLowerCase() === normalized) return "black";
  return null;
}

export function summarizeChessComGames(games: ChessGame[], username: string) {
  let ratedGames = 0;
  const ratedByTime: { endTime: number; rating: number }[] = [];
  const outcomes: GameOutcome[] = [];

  const ordered = [...games].sort((a, b) => a.end_time - b.end_time);

  for (const game of ordered) {
    const side = getPlayerSide(game, username);
    if (!side) continue;

    outcomes.push(classifyResult(game[side].result));

    if (game.rated && game[side].rating != null) {
      ratedGames += 1;
      ratedByTime.push({ endTime: game.end_time, rating: game[side].rating! });
    }
  }

  ratedByTime.sort((a, b) => a.endTime - b.endTime);
  const tally = tallyOutcomes(outcomes);

  return {
    ...tally,
    ratedGames,
    ratingDelta: computeRatingDelta(ratedByTime.map((entry) => entry.rating)),
    streak: computeStreak(outcomes),
    lastRating: ratedByTime.at(-1)?.rating ?? null,
  };
}

function estimateTacticsRating(
  stats: PlayerStats,
  sessionStartMs?: number,
  initialRating?: number,
  overrideRating?: number,
): { current: number; delta: number; note?: string } {
  if (overrideRating != null && initialRating != null) {
    return {
      current: overrideRating,
      delta: overrideRating - initialRating,
    };
  }

  const tactics = stats.tactics;
  if (!tactics || initialRating == null) {
    return {
      current: initialRating ?? 0,
      delta: 0,
      note: "Informe initialRating para acompanhar puzzles.",
    };
  }

  const candidates: { rating: number; date: number }[] = [];
  if (tactics.highest) candidates.push(tactics.highest);
  if (tactics.lowest) candidates.push(tactics.lowest);

  const sessionStart = sessionStartMs ?? 0;
  const recent = candidates.filter((entry) => entry.date * 1000 >= sessionStart);

  let current = initialRating;
  if (recent.length > 0) {
    recent.sort((a, b) => b.date - a.date);
    current = recent[0].rating;
  } else if (candidates.length > 0) {
    const closest = candidates.reduce((best, entry) => {
      const distance = Math.abs(entry.rating - initialRating);
      const bestDistance = Math.abs(best.rating - initialRating);
      return distance < bestDistance ? entry : best;
    });
    current = closest.rating;
  }

  return {
    current,
    delta: current - initialRating,
    note:
      "Modo puzzles: a API pública expõe apenas highest/lowest de tactics. Use overrideRating se necessário.",
  };
}

export async function buildStats(params: StatsParams): Promise<StatsResult> {
  const { username, type, from, to, timeControl, initialRating, overrideRating } =
    params;

  const period = {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };

  if (type === "puzzles") {
    const playerStats = await chessFetch<PlayerStats>(
      `https://api.chess.com/pub/player/${encodeURIComponent(username)}/stats`,
    );

    const sessionStartMs = from.getTime();
    const { delta, note } = estimateTacticsRating(
      playerStats,
      sessionStartMs,
      initialRating,
      overrideRating,
    );

    return {
      username,
      type,
      period,
      stats: {
        wins: 0,
        draws: 0,
        losses: 0,
        games: 0,
        ratingDelta: delta,
      },
      meta: {
        ratedGames: 0,
        fetchedAt: new Date().toISOString(),
        mode: "puzzles",
        note,
      },
    };
  }

  const allGames = await fetchGamesInPeriod(username, from, to);
  const filtered = dedupeGames(
    allGames.filter(
      (game) =>
        isInPeriod(game, from, to) &&
        matchesGameType(game, type, timeControl),
    ),
  );

  const computed = summarizeChessComGames(filtered, username);

  return {
    username,
    type,
    period,
    stats: {
      wins: computed.wins,
      draws: computed.draws,
      losses: computed.losses,
      games: computed.games,
      ratingDelta: computed.ratingDelta,
      currentRating: computed.lastRating,
      streak: computed.streak,
    },
    meta: {
      ratedGames: computed.ratedGames,
      fetchedAt: new Date().toISOString(),
      mode: "games",
    },
  };
}
