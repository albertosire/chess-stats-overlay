export type GameType =
  | "rapid"
  | "blitz"
  | "daily"
  | "daily960"
  | "puzzles"
  | "manual";

export interface ChessGamePlayer {
  username: string;
  rating?: number;
  result: string;
}

export interface ChessGame {
  url: string;
  pgn: string;
  time_control: string;
  end_time: number;
  rated: boolean;
  time_class: string;
  rules: string;
  white: ChessGamePlayer;
  black: ChessGamePlayer;
}

export interface MonthlyArchive {
  games: ChessGame[];
}

export interface ArchivesResponse {
  archives: string[];
}

export interface TacticsStats {
  highest?: { rating: number; date: number };
  lowest?: { rating: number; date: number };
}

export interface PlayerStats {
  chess_rapid?: { last?: { rating: number; date: number } };
  chess_blitz?: { last?: { rating: number; date: number } };
  chess_daily?: { last?: { rating: number; date: number } };
  chess960_daily?: { last?: { rating: number; date: number } };
  tactics?: TacticsStats;
}

export interface StatsResult {
  username: string;
  type: GameType;
  period: { from: string; to: string };
  stats: {
    wins: number;
    draws: number;
    losses: number;
    games: number;
    ratingDelta: number | null;
  };
  meta: {
    ratedGames: number;
    fetchedAt: string;
    mode: "games" | "puzzles";
    note?: string;
  };
}

export interface StatsParams {
  username: string;
  type: GameType;
  from: Date;
  to: Date;
  timeControl?: string;
  initialRating?: number;
  overrideRating?: number;
}
