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

/** Display flags for the overlay UI (all features are free / OSS). */
export interface OverlayEntitlements {
  showDeltaElo: boolean;
  showWinRate: boolean;
  showStreak: boolean;
  showCurrentRating: boolean;
  allowDualProvider: boolean;
  allowCustomTheme: boolean;
  allowSponsorLogo: boolean;
  allowAlerts: boolean;
}

export const ALL_FEATURES_ON: OverlayEntitlements = {
  showCurrentRating: true,
  showDeltaElo: true,
  showWinRate: true,
  showStreak: true,
  allowDualProvider: true,
  allowCustomTheme: true,
  allowSponsorLogo: true,
  allowAlerts: true,
};
