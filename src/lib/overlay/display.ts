import type { OverlayEntitlements } from "@/lib/providers/types";
import { parseFlagParam } from "@/lib/chess-com/build-url";

/** Default ink-on-board styles (preto + sépia). */
export const DEFAULT_OVERLAY_STYLES = {
  background: "rgba(17,17,17,0.72)",
  border: "rgba(196,165,116,0.45)",
  text: "#f4ede3",
  muted: "#c4b5a0",
  win: "#c5d4b0",
  loss: "#e8b4a4",
  accent: "#c4a574",
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
