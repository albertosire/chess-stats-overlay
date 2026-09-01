import type { GameType } from "./types";

export type PeriodMode = "session" | "today" | "week" | "month" | "custom";

export interface OverlayConfig {
  username: string;
  type: GameType;
  periodMode: PeriodMode;
  from?: string;
  to?: string;
  refresh: number;
  timeControl?: string;
  initialRating?: string;
}

export function buildOverlaySearchParams(config: OverlayConfig): URLSearchParams {
  const params = new URLSearchParams();

  if (config.username.trim()) {
    params.set("username", config.username.trim().toLowerCase());
  }

  params.set("type", config.type);
  params.set("refresh", String(Math.max(15, config.refresh || 30)));

  if (config.periodMode === "custom") {
    if (config.from) params.set("from", config.from);
    if (config.to) params.set("to", config.to);
  } else {
    params.set("period", config.periodMode);
  }

  if (config.type === "manual" && config.timeControl?.trim()) {
    params.set("timeControl", config.timeControl.trim());
  }

  if (config.type === "puzzles" && config.initialRating?.trim()) {
    params.set("initialRating", config.initialRating.trim());
  }

  return params;
}

export function buildOverlayPath(config: OverlayConfig): string {
  return `/overlay?${buildOverlaySearchParams(config).toString()}`;
}

export function buildApiPath(config: OverlayConfig): string {
  return `/api/stats?${buildOverlaySearchParams(config).toString()}`;
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
    errors.push("Informe o usuário do Chess.com.");
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

  if (config.refresh < 15) {
    errors.push("O intervalo de atualização mínimo é 15 segundos.");
  }

  return errors;
}

export const GAME_TYPE_OPTIONS: { value: GameType; label: string; hint: string }[] = [
  { value: "blitz", label: "Blitz", hint: "Partidas blitz padrão" },
  { value: "rapid", label: "Rápido", hint: "Partidas rapid padrão" },
  { value: "daily", label: "Diário", hint: "Xadrez diário clássico" },
  { value: "daily960", label: "Diário960", hint: "Xadrez960 diário" },
  { value: "puzzles", label: "Problemas", hint: "Tracking de rating com valor inicial informado" },
  { value: "manual", label: "Manual", hint: "Filtra por time control específico" },
];

export const PERIOD_OPTIONS: { value: PeriodMode; label: string; hint: string }[] = [
  { value: "session", label: "Sessão ao vivo", hint: "Desde que a página foi aberta — ideal para streams" },
  { value: "today", label: "Hoje", hint: "Partidas de hoje" },
  { value: "week", label: "Últimos 7 dias", hint: "Semana corrente" },
  { value: "month", label: "Mês atual", hint: "Do dia 1 até hoje" },
  { value: "custom", label: "Personalizado", hint: "Escolha data inicial e final" },
];
