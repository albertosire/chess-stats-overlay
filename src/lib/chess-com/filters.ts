import type { ChessGame, GameType } from "./types";

function normalizeTimeControl(value: string): string {
  const cleaned = value.trim().replace(/\s+/g, "");
  if (!cleaned.includes("+")) {
    return `${cleaned}+0`;
  }
  return cleaned;
}

export function matchesGameType(
  game: ChessGame,
  type: GameType,
  timeControl?: string,
): boolean {
  switch (type) {
    case "rapid":
      return game.time_class === "rapid" && game.rules === "chess";
    case "blitz":
      return game.time_class === "blitz" && game.rules === "chess";
    case "daily":
      return game.time_class === "daily" && game.rules === "chess";
    case "daily960":
      return game.time_class === "daily" && game.rules === "chess960";
    case "manual":
      if (!timeControl) return false;
      return (
        normalizeTimeControl(game.time_control) ===
        normalizeTimeControl(timeControl)
      );
    default:
      return false;
  }
}

export function isInPeriod(game: ChessGame, from: Date, to: Date): boolean {
  const endMs = game.end_time * 1000;
  return endMs >= from.getTime() && endMs <= to.getTime();
}
