import type { OverlayEntitlements } from "@/lib/providers/types";
import { parseFlagParam } from "@/lib/chess-com/build-url";

/** Default Dark Minimalist styles (replaces theme marketplace). */
export const DEFAULT_OVERLAY_STYLES = {
  background: "rgba(0,0,0,0.55)",
  border: "rgba(255,255,255,0.15)",
  text: "#ffffff",
  muted: "#a1a1aa",
  win: "#34d399",
  loss: "#f87171",
  accent: "#22c55e",
} as const;

/** Build display flags from overlay URL search params (all features free). */
export function entitlementsFromSearchParams(
  params: URLSearchParams,
): OverlayEntitlements {
  return {
    showCurrentRating: true,
    showDeltaElo: parseFlagParam(params.get("show_delta"), true),
    showWinRate: parseFlagParam(params.get("show_winrate"), true),
    showStreak: parseFlagParam(params.get("show_streak"), true),
    allowDualProvider: true,
    allowCustomTheme: true,
    allowSponsorLogo: Boolean(params.get("logo")?.trim()),
    allowAlerts: parseFlagParam(params.get("alerts"), true),
  };
}
