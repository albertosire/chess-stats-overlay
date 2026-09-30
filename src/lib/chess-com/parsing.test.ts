import { describe, expect, it } from "vitest";
import { classifyResult } from "@/lib/chess-com/results";
import { isInPeriod, matchesGameType } from "@/lib/chess-com/filters";
import { parseStatsParams } from "@/lib/chess-com/params";
import { summarizeChessComGames } from "@/lib/chess-com/stats";
import type { ChessGame } from "@/lib/chess-com/types";
import { ChessApiError, publicErrorMessage, toLoadStatsFailure } from "@/lib/errors";

function game(partial: Partial<ChessGame> & Pick<ChessGame, "white" | "black">): ChessGame {
  return {
    url: partial.url ?? "https://www.chess.com/game/live/1",
    pgn: "",
    time_control: partial.time_control ?? "180+2",
    end_time: partial.end_time ?? 1_700_000_000,
    rated: partial.rated ?? true,
    time_class: partial.time_class ?? "blitz",
    rules: partial.rules ?? "chess",
    white: partial.white,
    black: partial.black,
  };
}

describe("classifyResult", () => {
  it("maps chess.com result codes", () => {
    expect(classifyResult("win")).toBe("win");
    expect(classifyResult("agreed")).toBe("draw");
    expect(classifyResult("stalemate")).toBe("draw");
    expect(classifyResult("checkmated")).toBe("loss");
    expect(classifyResult("timeout")).toBe("loss");
  });
});

describe("matchesGameType", () => {
  const blitz = game({
    white: { username: "a", result: "win" },
    black: { username: "b", result: "checkmated" },
  });

  it("filters by time class and rules", () => {
    expect(matchesGameType(blitz, "blitz")).toBe(true);
    expect(matchesGameType(blitz, "bullet")).toBe(false);
    expect(matchesGameType({ ...blitz, rules: "chess960", time_class: "daily" }, "daily960")).toBe(
      true,
    );
    expect(matchesGameType({ ...blitz, time_control: "600+0" }, "manual", "600+0")).toBe(true);
    expect(matchesGameType(blitz, "manual", "180+0")).toBe(false);
  });

  it("keeps games inside the requested period", () => {
    const from = new Date("2024-01-01T00:00:00.000Z");
    const to = new Date("2024-01-02T00:00:00.000Z");
    const inside = game({
      end_time: Math.floor(new Date("2024-01-01T12:00:00.000Z").getTime() / 1000),
      white: { username: "a", result: "win" },
      black: { username: "b", result: "resigned" },
    });
    expect(isInPeriod(inside, from, to)).toBe(true);
    expect(isInPeriod({ ...inside, end_time: 1 }, from, to)).toBe(false);
  });
});

describe("chess.com archive parsing", () => {
  it("summarizes a public archive payload", () => {
    const payload = JSON.parse(`{
      "games": [
        {
          "url": "https://www.chess.com/game/live/1",
          "pgn": "",
          "time_control": "180+2",
          "end_time": 100,
          "rated": true,
          "time_class": "blitz",
          "rules": "chess",
          "white": { "username": "Hikaru", "rating": 1800, "result": "win" },
          "black": { "username": "opponent", "rating": 1700, "result": "checkmated" }
        },
        {
          "url": "https://www.chess.com/game/live/2",
          "pgn": "",
          "time_control": "180+2",
          "end_time": 200,
          "rated": true,
          "time_class": "blitz",
          "rules": "chess",
          "white": { "username": "opponent", "rating": 1690, "result": "win" },
          "black": { "username": "hikaru", "rating": 1837, "result": "resigned" }
        },
        {
          "url": "https://www.chess.com/game/live/3",
          "pgn": "",
          "time_control": "60+0",
          "end_time": 300,
          "rated": true,
          "time_class": "bullet",
          "rules": "chess",
          "white": { "username": "hikaru", "rating": 2100, "result": "win" },
          "black": { "username": "other", "rating": 2000, "result": "timeout" }
        }
      ]
    }`) as { games: ChessGame[] };

    const blitz = payload.games.filter((entry) => matchesGameType(entry, "blitz"));
    const summary = summarizeChessComGames(blitz, "hikaru");

    expect(summary.wins).toBe(1);
    expect(summary.losses).toBe(1);
    expect(summary.games).toBe(2);
    expect(summary.ratingDelta).toBe(37);
    expect(summary.streak).toBe(0);
    expect(summary.lastRating).toBe(1837);
  });
});

describe("stats params", () => {
  it("rejects missing and invalid configuration without echoing the raw value", () => {
    expect(parseStatsParams(new URLSearchParams())).toEqual({ error: "missing_username" });
    expect(parseStatsParams(new URLSearchParams("username=hikaru"))).toEqual({
      error: "invalid_type",
    });
    expect(
      parseStatsParams(new URLSearchParams("username=hikaru&type=blitz&period=nope")),
    ).toEqual({ error: "invalid_period" });
  });
});

describe("public errors", () => {
  it("hides status codes and stack traces", () => {
    const failure = toLoadStatsFailure(new ChessApiError("rate_limited", 429));
    expect(failure).toEqual({
      error: publicErrorMessage("rate_limited"),
      status: 429,
    });
    expect(failure.error).not.toMatch(/\d{3}/);
    expect(failure.error).not.toMatch(/at \//);

    const leaked = toLoadStatsFailure(new Error("Lichess API 500: Internal Server Error"));
    expect(leaked.error).toBe(publicErrorMessage("unavailable"));
    expect(leaked.error).not.toContain("500");
  });
});
