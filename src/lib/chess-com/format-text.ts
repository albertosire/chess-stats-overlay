import type { NormalizedStatsResult } from "@/lib/providers/types";

function formatDelta(value: number | null): string {
  if (value == null) return "—";
  if (value > 0) return `+${value}`;
  return String(value);
}

export function formatStatsText(result: NormalizedStatsResult, displayName?: string): string {
  const title = displayName?.trim();
  const prefix = title ? `${title}\n` : "";
  const rating =
    result.stats.currentRating != null ? `ELO ${result.stats.currentRating}` : null;

  if (result.meta.mode === "puzzles") {
    const delta = formatDelta(result.stats.ratingDelta);
    return `${prefix}${rating ? `${rating} | ` : ""}dRating ${delta}\n`;
  }

  const { wins, draws, losses } = result.stats;
  const parts = [`${wins}-${draws}-${losses}`, `W ${wins}`, `D ${draws}`, `L ${losses}`];
  if (rating) parts.unshift(rating);
  if (result.stats.ratingDelta != null) {
    parts.push(`dRating ${formatDelta(result.stats.ratingDelta)}`);
  }
  return `${prefix}${parts.join(" | ")}\n`;
}
