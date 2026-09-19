import type { GameType } from "./types";

export type PeriodMode = "session" | "today" | "week" | "month" | "custom";

export const DEFAULT_REFRESH_SECONDS = 25;
export const MIN_REFRESH_SECONDS = 20;
export const MAX_REFRESH_SECONDS = 120;
export const MAX_OVERLAY_NAME_LENGTH = 40;

export interface OverlayConfig {
  username: string;
  name?: string;
  type: GameType;
  periodMode: PeriodMode;
  from?: string;
  to?: string;
  refresh: number;
  timeControl?: string;
  initialRating?: string;
  sessionStart?: string;
  /** Free overlay: single provider only */
  provider?: "chesscom" | "lichess";
}

export function normalizeOverlayName(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, MAX_OVERLAY_NAME_LENGTH);
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

export function validateOverlayConfig(config: OverlayConfig): string[] {
  const errors: string[] = [];

  if (!config.username.trim()) {
    errors.push("Informe o usuário da plataforma escolhida.");
  }

  if (config.type === "manual" && !config.timeControl?.trim()) {
    errors.push("Informe o time control para o modo manual (ex: 600+0).");
  }

  if (config.type === "puzzles" && !config.initialRating?.trim()) {
    errors.push("Informe o rating inicial para o modo problemas.");
  }

  if (config.periodMode === "custom") {
    if (!config.from || !config.to) {
      errors.push("Informe as datas inicial e final.");
    } else if (config.from > config.to) {
      errors.push("A data inicial deve ser anterior ou igual à final.");
    }
  }

  if (config.periodMode === "session" && !config.sessionStart) {
    errors.push("Clique em Iniciar Contador para marcar o início da sessão.");
  }

  if (config.refresh < MIN_REFRESH_SECONDS) {
    errors.push(`O intervalo de atualização mínimo é ${MIN_REFRESH_SECONDS} segundos.`);
  }

  return errors;
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
