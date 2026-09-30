import { describe, expect, it } from "vitest";
import {
  computeRatingDelta,
  computeStreak,
  computeWinRate,
  tallyOutcomes,
} from "@/lib/domain/stats";

describe("session stats", () => {
  it("counts wins, draws, and losses", () => {
    expect(tallyOutcomes(["win", "win", "draw", "loss"])).toEqual({
      wins: 2,
      draws: 1,
      losses: 1,
      games: 4,
    });
  });

  it("returns a one-decimal win rate and null when there are no games", () => {
    expect(computeWinRate(8, 1, 2)).toBe(72.7);
    expect(computeWinRate(1, 0, 0)).toBe(100);
    expect(computeWinRate(0, 0, 0)).toBeNull();
  });

  it("counts a win streak from the latest game", () => {
    expect(computeStreak(["loss", "win", "win", "win"])).toBe(3);
    expect(computeStreak(["win", "win", "draw"])).toBe(0);
    expect(computeStreak([])).toBe(0);
  });

  it("returns the rating delta only when two ratings exist", () => {
    expect(computeRatingDelta([1817, 1830, 1854])).toBe(37);
    expect(computeRatingDelta([1500])).toBeNull();
    expect(computeRatingDelta([])).toBeNull();
  });
});
