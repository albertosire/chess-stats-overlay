export type GameOutcome = "win" | "draw" | "loss";

export interface OutcomeTally {
  wins: number;
  draws: number;
  losses: number;
  games: number;
}

/** Count wins, draws, and losses. `games` is the sum of the three. */
export function tallyOutcomes(outcomes: readonly GameOutcome[]): OutcomeTally {
  let wins = 0;
  let draws = 0;
  let losses = 0;

  for (const outcome of outcomes) {
    if (outcome === "win") wins += 1;
    else if (outcome === "draw") draws += 1;
    else losses += 1;
  }

  return { wins, draws, losses, games: wins + draws + losses };
}

/** Win rate as a percentage with one decimal, or null when there are no games. */
export function computeWinRate(wins: number, draws: number, losses: number): number | null {
  const total = wins + draws + losses;
  if (total === 0) return null;
  return Math.round((wins / total) * 1000) / 10;
}

/** Consecutive wins counting backward from the latest game. A draw or loss breaks it. */
export function computeStreak(outcomes: readonly GameOutcome[]): number {
  let streak = 0;
  for (let index = outcomes.length - 1; index >= 0; index -= 1) {
    if (outcomes[index] !== "win") break;
    streak += 1;
  }
  return streak;
}

/**
 * Difference between the last and first rating.
 * Ratings must already be in chronological order.
 * Returns null when fewer than two ratings are known.
 */
export function computeRatingDelta(ratingsInTimeOrder: readonly number[]): number | null {
  if (ratingsInTimeOrder.length < 2) return null;
  return ratingsInTimeOrder[ratingsInTimeOrder.length - 1] - ratingsInTimeOrder[0];
}
