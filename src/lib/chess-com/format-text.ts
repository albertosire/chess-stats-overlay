import type { StatsResult } from "./types";

function formatDelta(value: number | null): string {
  if (value == null) return "0";
  if (value > 0) return `+${value}`;
  return String(value);
}

export function formatStatsText(result: StatsResult, displayName?: string): string {
  const delta = formatDelta(result.stats.ratingDelta);
  const title = displayName?.trim();
  const prefix = title ? `${title}\n` : "";

  if (result.meta.mode === "puzzles") {
    return `${prefix}dRating ${delta}\n`;
  }

  const { wins, draws, losses } = result.stats;
  return `${prefix}${wins}-${draws}-${losses}\nW ${wins} | D ${draws} | L ${losses} | dRating ${delta}\n`;
}
