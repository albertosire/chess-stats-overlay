const DRAW_RESULTS = new Set([
  "agreed",
  "repetition",
  "stalemate",
  "insufficient",
  "timevsinsufficient",
  "50move",
]);

export type GameOutcome = "win" | "draw" | "loss";

export function classifyResult(result: string): GameOutcome {
  if (result === "win") return "win";
  if (DRAW_RESULTS.has(result)) return "draw";
  return "loss";
}
