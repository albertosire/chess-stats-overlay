import type { GameType } from "./types";

export type PeriodMode = "session" | "today" | "week" | "month" | "custom";
export type ChessSite = "chesscom" | "lichess";

export const DEFAULT_REFRESH_SECONDS = 25;
export const MIN_REFRESH_SECONDS = 20;
export const MAX_REFRESH_SECONDS = 120;
export const MAX_OVERLAY_NAME_LENGTH = 40;

export const DEFAULT_PRIMARY_COLOR = "#111111";
export const DEFAULT_ACCENT_COLOR = "#c4a574";
export const DEFAULT_FONT_FAMILY = "Inter";

export const OVERLAY_PALETTES = [
  {
    id: "ink",
    label: "Preto",
    hint: "Tinta sobre o tabuleiro",
    primary: "#111111",
    accent: "#c4a574",
    fontFamily: "Inter",
  },
  {
    id: "paper",
    label: "Branco",
    hint: "Papel de partitura",
    primary: "#f7f1e6",
    accent: "#3d2b1f",
    fontFamily: "Georgia",
  },
  {
    id: "sepia",
    label: "Sépia",
    hint: "Coluna clássica de xadrez",
    primary: "#3b2a1a",
    accent: "#d4a574",
    fontFamily: "Georgia",
  },
] as const;

export type OverlayPaletteId = (typeof OVERLAY_PALETTES)[number]["id"];

export function matchingOverlayPalette(
  primary?: string,
  accent?: string,
): (typeof OVERLAY_PALETTES)[number] | null {
  const p = primary?.trim().toLowerCase();
  const a = accent?.trim().toLowerCase();
  if (!p || !a) return null;
  return OVERLAY_PALETTES.find((palette) => palette.primary === p && palette.accent === a) ?? null;
}

export interface OverlayConfig {
  username: string;
  username2?: string;
  name?: string;
  type: GameType;
  periodMode: PeriodMode;
  from?: string;
  to?: string;
  refresh: number;
  timeControl?: string;
  initialRating?: string;
  sessionStart?: string;
  provider?: ChessSite;
  provider2?: ChessSite;
  showDelta?: boolean;
  showWinRate?: boolean;
  showStreak?: boolean;
  showAlerts?: boolean;
  primaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
  logoUrl?: string;
}

export const DEFAULT_OVERLAY_CONFIG: OverlayConfig = {
  username: "",
  username2: "",
  name: "",
  type: "blitz",
  periodMode: "session",
  from: "",
  to: "",
  refresh: DEFAULT_REFRESH_SECONDS,
  timeControl: "600+0",
  initialRating: "",
  provider: "chesscom",
  provider2: "lichess",
  showDelta: true,
  showWinRate: true,
  showStreak: true,
  showAlerts: true,
  primaryColor: DEFAULT_PRIMARY_COLOR,
  accentColor: DEFAULT_ACCENT_COLOR,
  fontFamily: DEFAULT_FONT_FAMILY,
  logoUrl: "",
};

export function normalizeOverlayName(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, MAX_OVERLAY_NAME_LENGTH);
}

function flagParam(enabled: boolean | undefined): string | null {
  // Omit when enabled (default on); set =0 when disabled.
  if (enabled === false) return "0";
  return null;
}

export function buildOverlaySearchParams(config: OverlayConfig): URLSearchParams {
  const params = new URLSearchParams();

  if (config.username.trim()) {
    params.set("username", config.username.trim().toLowerCase());
  }

  const overlayName = normalizeOverlayName(config.name);
  if (overlayName) {
    params.set("name", overlayName);
  }

  params.set("type", config.type);
  params.set("refresh", String(Math.max(MIN_REFRESH_SECONDS, config.refresh || DEFAULT_REFRESH_SECONDS)));

  if (config.periodMode === "custom") {
    if (config.from) params.set("from", config.from);
    if (config.to) params.set("to", config.to);
  } else {
    params.set("period", config.periodMode);
  }

  if (config.periodMode === "session" && config.sessionStart) {
    params.set("sessionStart", config.sessionStart);
  }

  if (config.type === "manual" && config.timeControl?.trim()) {
    params.set("timeControl", config.timeControl.trim());
  }

  if (config.type === "puzzles" && config.initialRating?.trim()) {
    params.set("initialRating", config.initialRating.trim());
  }

  params.set("provider", config.provider || "chesscom");

  if (config.username2?.trim()) {
    params.set("username2", config.username2.trim().toLowerCase());
    params.set("provider2", config.provider2 || "lichess");
  }

  const showDelta = flagParam(config.showDelta);
  if (showDelta) params.set("show_delta", showDelta);
  const showWinRate = flagParam(config.showWinRate);
  if (showWinRate) params.set("show_winrate", showWinRate);
  const showStreak = flagParam(config.showStreak);
  if (showStreak) params.set("show_streak", showStreak);
  const showAlerts = flagParam(config.showAlerts);
  if (showAlerts) params.set("alerts", showAlerts);

  if (config.primaryColor && config.primaryColor !== DEFAULT_PRIMARY_COLOR) {
    params.set("primaryColor", config.primaryColor);
  }
  if (config.accentColor && config.accentColor !== DEFAULT_ACCENT_COLOR) {
    params.set("accentColor", config.accentColor);
  }
  if (config.fontFamily?.trim() && config.fontFamily.trim() !== DEFAULT_FONT_FAMILY) {
    params.set("font", config.fontFamily.trim());
  }
  if (config.logoUrl?.trim()) {
    params.set("logo", config.logoUrl.trim());
  }

  return params;
}

export function buildOverlayPath(config: OverlayConfig): string {
  return `/overlay?${buildOverlaySearchParams(config).toString()}`;
}

export function buildApiPath(config: OverlayConfig): string {
  return `/api/stats?${buildOverlaySearchParams(config).toString()}`;
}

export function buildTextApiPath(config: OverlayConfig): string {
  return `/api/stats.txt?${buildOverlaySearchParams(config).toString()}`;
}

export function buildAbsoluteUrl(origin: string, path: string): string {
  return `${origin.replace(/\/$/, "")}${path}`;
}

export function buildIframeSnippet(absoluteOverlayUrl: string, width = 420, height = 220): string {
  return `<iframe
  src="${absoluteOverlayUrl}"
  width="${width}"
  height="${height}"
  frameborder="0"
  scrolling="no"
  style="background: transparent; border: none; overflow: hidden;"
  allowtransparency="true"
></iframe>`;
}

export type OverlayConfigErrorCode =
  | "missing_username"
  | "same_provider"
  | "missing_time_control"
  | "missing_initial_rating"
  | "missing_dates"
  | "inverted_dates"
  | "missing_session_start"
  | "refresh_too_low";

export function validateOverlayConfig(config: OverlayConfig): OverlayConfigErrorCode[] {
  const errors: OverlayConfigErrorCode[] = [];

  if (!config.username.trim()) {
    errors.push("missing_username");
  }

  if (config.username2?.trim() && config.provider === config.provider2) {
    errors.push("same_provider");
  }

  if (config.type === "manual" && !config.timeControl?.trim()) {
    errors.push("missing_time_control");
  }

  if (config.type === "puzzles" && !config.initialRating?.trim()) {
    errors.push("missing_initial_rating");
  }

  if (config.periodMode === "custom") {
    if (!config.from || !config.to) {
      errors.push("missing_dates");
    } else if (config.from > config.to) {
      errors.push("inverted_dates");
    }
  }

  if (config.periodMode === "session" && !config.sessionStart) {
    errors.push("missing_session_start");
  }

  if (config.refresh < MIN_REFRESH_SECONDS) {
    errors.push("refresh_too_low");
  }

  return errors;
}

/** Parse a query-flag: omit / "1" / "true" = on; "0" / "false" = off. */
export function parseFlagParam(value: string | null, defaultOn = true): boolean {
  if (value == null || value === "") return defaultOn;
  if (value === "0" || value.toLowerCase() === "false") return false;
  return true;
}

export const GAME_TYPE_OPTIONS: { value: GameType; label: string; hint: string }[] = [
  { value: "blitz", label: "Blitz", hint: "Partidas blitz padrão" },
  { value: "bullet", label: "Bullet", hint: "Partidas bullet padrão" },
  { value: "rapid", label: "Rápido", hint: "Partidas rapid padrão" },
  { value: "daily", label: "Diário", hint: "Xadrez diário clássico" },
  { value: "daily960", label: "Diário960", hint: "Xadrez960 diário" },
  { value: "puzzles", label: "Problemas", hint: "Tracking de rating com valor inicial informado" },
  { value: "manual", label: "Manual", hint: "Filtra por time control específico" },
];

export const PERIOD_OPTIONS: { value: PeriodMode; label: string; hint: string }[] = [
  {
    value: "session",
    label: "Sessão ao vivo",
    hint: "Clique em Iniciar Contador para marcar T início — ideal para streams",
  },
  { value: "today", label: "Hoje", hint: "Partidas de hoje" },
  { value: "week", label: "Últimos 7 dias", hint: "Semana corrente" },
  { value: "month", label: "Mês atual", hint: "Do dia 1 até hoje" },
  { value: "custom", label: "Personalizado", hint: "Escolha data inicial e final" },
];

export const FONT_OPTIONS = [
  "Inter",
  "system-ui",
  "Georgia",
  "monospace",
  "Segoe UI",
  "Roboto",
];
