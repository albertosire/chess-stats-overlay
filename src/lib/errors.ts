export type ExternalErrorCode =
  | "not_found"
  | "rate_limited"
  | "unavailable"
  | "invalid_config"
  | "timeout";

const PUBLIC_MESSAGES: Record<ExternalErrorCode, string> = {
  not_found: "Couldn't load this player's games.",
  rate_limited: "Too many requests. Try again in a few seconds.",
  unavailable: "Couldn't load this player's games. Try again in a few seconds.",
  invalid_config: "This overlay configuration is invalid.",
  timeout: "Couldn't load this player's games. Try again in a few seconds.",
};

export function publicErrorMessage(code: ExternalErrorCode): string {
  return PUBLIC_MESSAGES[code];
}

/** Failure from Chess.com or Lichess. `message` is always safe to show in the overlay. */
export class ChessApiError extends Error {
  readonly code: ExternalErrorCode;
  readonly status: number;

  constructor(code: ExternalErrorCode, status: number) {
    super(publicErrorMessage(code));
    this.name = "ChessApiError";
    this.code = code;
    this.status = status;
  }
}

export function toLoadStatsFailure(error: unknown): { error: string; status: number } {
  if (error instanceof ChessApiError) {
    return { error: publicErrorMessage(error.code), status: error.status };
  }
  return { error: publicErrorMessage("unavailable"), status: 503 };
}

export type StatsParamErrorCode =
  | "missing_username"
  | "invalid_type"
  | "missing_time_control"
  | "invalid_period"
  | "missing_period"
  | "invalid_dates"
  | "inverted_dates";

const PARAM_MESSAGES: Record<StatsParamErrorCode, string> = {
  missing_username: "Enter a username.",
  invalid_type: "Choose a valid game mode.",
  missing_time_control: "Enter a time control for manual mode.",
  invalid_period: "Choose a valid period.",
  missing_period: "Enter a period or a date range.",
  invalid_dates: "Enter valid dates.",
  inverted_dates: "The start date must be on or before the end date.",
};

export function statsParamMessage(code: StatsParamErrorCode): string {
  return PARAM_MESSAGES[code];
}
