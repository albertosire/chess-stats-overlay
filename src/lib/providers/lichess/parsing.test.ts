import { describe, expect, it } from "vitest";
import { parseLichessNdjson, summarizeLichessGames } from "@/lib/providers/lichess";

describe("lichess game parsing", () => {
  it("summarizes an ndjson games payload", () => {
    const text = [
      JSON.stringify({
        createdAt: 1_000,
        lastMoveAt: 2_000,
        winner: "white",
        rated: true,
        players: {
          white: { user: { name: "DrNykterstein" }, rating: 2800 },
          black: { user: { name: "opponent" }, rating: 2700 },
        },
      }),
      JSON.stringify({
        createdAt: 3_000,
        lastMoveAt: 4_000,
        winner: "white",
        rated: true,
        players: {
          white: { user: { name: "DrNykterstein" }, rating: 2812 },
          black: { user: { name: "opponent" }, rating: 2690 },
        },
      }),
      JSON.stringify({
        createdAt: 5_000,
        lastMoveAt: 6_000,
        rated: true,
        players: {
          white: { user: { name: "opponent" }, rating: 2700 },
          black: { user: { name: "DrNykterstein" }, rating: 2804 },
        },
      }),
    ].join("\n");

    const summary = summarizeLichessGames(parseLichessNdjson(text), "drnykterstein");

    expect(summary.wins).toBe(2);
    expect(summary.draws).toBe(1);
    expect(summary.games).toBe(3);
    expect(summary.winRate).toBe(66.7);
    expect(summary.ratingDelta).toBe(4);
    expect(summary.streak).toBe(0);
    expect(summary.lastRating).toBe(2804);
  });

  it("returns an empty list for a blank body", () => {
    expect(parseLichessNdjson(" \n ")).toEqual([]);
  });
});
