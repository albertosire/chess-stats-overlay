export type ChessProviderId = "chesscom" | "lichess";

export type GameType =
  | "bullet"
  | "rapid"
  | "blitz"
  | "daily"
  | "daily960"
  | "puzzles"
  | "manual";

export interface NormalizedStatsParams {
  username: string;
  type: GameType;
  from: Date;
  to: Date;
  timeControl?: string;
  initialRating?: number;
  overrideRating?: number;
}

export interface NormalizedStatsResult {
  provider: ChessProviderId;
  username: string;
  type: GameType;
  period: { from: string; to: string };
  stats: {
    wins: number;
    draws: number;
    losses: number;
    games: number;
    ratingDelta: number | null;
    currentRating: number | null;
    winRate: number | null;
    streak: number;
  };
  meta: {
    ratedGames: number;
    fetchedAt: string;
    mode: "games" | "puzzles";
    note?: string;
  };
}

export interface StatsProvider {
  id: ChessProviderId;
  label: string;
  fetchStats(params: NormalizedStatsParams): Promise<NormalizedStatsResult>;
}

export interface OverlayEntitlements {
  isPro: boolean;
  showDeltaElo: boolean;
  showWinRate: boolean;
  showStreak: boolean;
  showCurrentRating: boolean;
  allowDualProvider: boolean;
  allowCustomTheme: boolean;
  allowSponsorLogo: boolean;
  allowAlerts: boolean;
  activeThemeId: string;
}

export function resolveEntitlements(
  isPro: boolean,
  flags?: {
    show_delta_elo?: boolean;
    show_winrate?: boolean;
    show_streak?: boolean;
    active_theme_id?: string;
    custom_sponsor_logo_url?: string | null;
  },
): OverlayEntitlements {
  const freeTheme = "default-dark";
  return {
    isPro,
    showCurrentRating: true,
    showDeltaElo: isPro && Boolean(flags?.show_delta_elo),
    showWinRate: isPro && Boolean(flags?.show_winrate),
    showStreak: isPro && Boolean(flags?.show_streak),
    allowDualProvider: isPro,
    allowCustomTheme: isPro,
    allowSponsorLogo: isPro && Boolean(flags?.custom_sponsor_logo_url),
    allowAlerts: isPro,
    activeThemeId: isPro ? (flags?.active_theme_id ?? freeTheme) : freeTheme,
  };
}

export function applyFreeCap(
  result: NormalizedStatsResult,
  entitlements: OverlayEntitlements,
): NormalizedStatsResult {
  return {
    ...result,
    stats: {
      ...result.stats,
      ratingDelta: entitlements.showDeltaElo ? result.stats.ratingDelta : null,
      winRate: entitlements.showWinRate ? result.stats.winRate : null,
      streak: entitlements.showStreak ? result.stats.streak : 0,
      currentRating: entitlements.showCurrentRating ? result.stats.currentRating : result.stats.currentRating,
    },
  };
}
