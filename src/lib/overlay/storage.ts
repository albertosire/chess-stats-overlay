import {
  DEFAULT_OVERLAY_CONFIG,
  type OverlayConfig,
} from "@/lib/chess-com/build-url";

export const OVERLAY_STORAGE_KEY = "chess-overlay-config:v1";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

/** Merge a partial/unknown object into a full OverlayConfig. */
export function normalizeStoredConfig(raw: unknown): OverlayConfig {
  if (!isRecord(raw)) return { ...DEFAULT_OVERLAY_CONFIG };

  const provider = raw.provider === "lichess" || raw.provider === "chesscom"
    ? raw.provider
    : DEFAULT_OVERLAY_CONFIG.provider;

  const provider2 = raw.provider2 === "lichess" || raw.provider2 === "chesscom"
    ? raw.provider2
    : DEFAULT_OVERLAY_CONFIG.provider2;

  const periodMode =
    raw.periodMode === "session" ||
    raw.periodMode === "today" ||
    raw.periodMode === "week" ||
    raw.periodMode === "month" ||
    raw.periodMode === "custom"
      ? raw.periodMode
      : DEFAULT_OVERLAY_CONFIG.periodMode;

  const type =
    typeof raw.type === "string" && raw.type.length > 0
      ? (raw.type as OverlayConfig["type"])
      : DEFAULT_OVERLAY_CONFIG.type;

  return {
    username: asString(raw.username),
    username2: asString(raw.username2),
    name: asString(raw.name),
    type,
    periodMode,
    from: asString(raw.from),
    to: asString(raw.to),
    refresh: asNumber(raw.refresh, DEFAULT_OVERLAY_CONFIG.refresh),
    timeControl: asString(raw.timeControl, DEFAULT_OVERLAY_CONFIG.timeControl),
    initialRating: asString(raw.initialRating),
    sessionStart: asString(raw.sessionStart) || undefined,
    provider,
    provider2,
    showDelta: asBoolean(raw.showDelta, true),
    showWinRate: asBoolean(raw.showWinRate, true),
    showStreak: asBoolean(raw.showStreak, true),
    showAlerts: asBoolean(raw.showAlerts, true),
    primaryColor: asString(raw.primaryColor, DEFAULT_OVERLAY_CONFIG.primaryColor),
    accentColor: asString(raw.accentColor, DEFAULT_OVERLAY_CONFIG.accentColor),
    fontFamily: asString(raw.fontFamily, DEFAULT_OVERLAY_CONFIG.fontFamily),
    logoUrl: asString(raw.logoUrl),
  };
}

export function loadOverlayConfig(): OverlayConfig {
  if (typeof window === "undefined") return { ...DEFAULT_OVERLAY_CONFIG };
  try {
    const raw = window.localStorage.getItem(OVERLAY_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_OVERLAY_CONFIG };
    return normalizeStoredConfig(JSON.parse(raw) as unknown);
  } catch {
    return { ...DEFAULT_OVERLAY_CONFIG };
  }
}

export function saveOverlayConfig(config: OverlayConfig): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(OVERLAY_STORAGE_KEY, JSON.stringify(config));
  } catch {
    // Quota / private mode — ignore.
  }
}

export function exportOverlayConfigJson(config: OverlayConfig): string {
  return JSON.stringify(config, null, 2);
}

export function importOverlayConfigJson(json: string): OverlayConfig {
  const parsed = JSON.parse(json) as unknown;
  return normalizeStoredConfig(parsed);
}
