/**
 * WCAG 2.x relative luminance + contrast helpers.
 * @see https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 * @see https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 */

const SOBER_LIGHT = {
  text: "#f4ede3",
  muted: "#c4b5a0",
  win: "#c5d4b0",
  loss: "#e8b4a4",
  alertFg: "#1a1410",
} as const;

const SOBER_DARK = {
  text: "#1a1410",
  muted: "#6b5c4e",
  win: "#3f5d3a",
  loss: "#8b3a2a",
  alertFg: "#f4ede3",
} as const;

export type OverlayReadableColors = {
  text: string;
  muted: string;
  win: string;
  loss: string;
  alertFg: string;
  /** Prefer light or dark palette against the background */
  onDark: boolean;
};

function clampByte(value: number): number {
  return Math.min(255, Math.max(0, Math.round(value)));
}

/** Parse #RGB, #RRGGBB, #RRGGBBAA, rgb(), rgba() into sRGB 0–255. */
export function parseCssColor(input: string): { r: number; g: number; b: number; a: number } | null {
  const raw = input.trim();

  const hex = raw.match(/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i);
  if (hex) {
    let h = hex[1];
    if (h.length === 3) {
      h = h
        .split("")
        .map((c) => c + c)
        .join("");
    }
    const hasAlpha = h.length === 8;
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    const a = hasAlpha ? parseInt(h.slice(6, 8), 16) / 255 : 1;
    return { r, g, b, a };
  }

  const rgb = raw.match(
    /^rgba?\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)(?:\s*,\s*([0-9.]+))?\s*\)$/i,
  );
  if (rgb) {
    return {
      r: clampByte(Number(rgb[1])),
      g: clampByte(Number(rgb[2])),
      b: clampByte(Number(rgb[3])),
      a: rgb[4] != null ? Number(rgb[4]) : 1,
    };
  }

  return null;
}

function channelToLinear(c8: number): number {
  const c = c8 / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** Relative luminance L in [0, 1] (WCAG). */
export function relativeLuminance(r: number, g: number, b: number): number {
  return (
    0.2126 * channelToLinear(r) +
    0.7152 * channelToLinear(g) +
    0.0722 * channelToLinear(b)
  );
}

/** Contrast ratio between two luminances (≥ 1). */
export function contrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Composite a (possibly translucent) foreground over an opaque backdrop.
 * Overlay primary is often painted at ~80% opacity on stream — we approximate
 * against near-black (typical OBS transparent scene).
 */
function compositeOver(
  fg: { r: number; g: number; b: number; a: number },
  bg: { r: number; g: number; b: number },
): { r: number; g: number; b: number } {
  const a = Math.min(1, Math.max(0, fg.a));
  return {
    r: clampByte(fg.r * a + bg.r * (1 - a)),
    g: clampByte(fg.g * a + bg.g * (1 - a)),
    b: clampByte(fg.b * a + bg.b * (1 - a)),
  };
}

const OBS_BACKDROP = { r: 0, g: 0, b: 0 };

/**
 * Pick sober text/muted/win/loss colors that meet WCAG AA (4.5:1) for normal text
 * against the effective primary background.
 */
export function readableColorsForBackground(
  backgroundCss: string | null | undefined,
  options?: { alphaHint?: number },
): OverlayReadableColors | null {
  if (!backgroundCss) return null;

  const parsed = parseCssColor(backgroundCss);
  if (!parsed) return null;

  const alpha = options?.alphaHint ?? parsed.a;
  const effective = compositeOver({ ...parsed, a: alpha }, OBS_BACKDROP);
  const bgL = relativeLuminance(effective.r, effective.g, effective.b);

  const lightL = relativeLuminance(244, 237, 227); // #f4ede3
  const darkL = relativeLuminance(26, 20, 16); // #1a1410
  const contrastLight = contrastRatio(lightL, bgL);
  const contrastDark = contrastRatio(darkL, bgL);

  // Prefer the option that clears AA (4.5); if both do, pick higher contrast.
  // If neither does, still pick the higher contrast (best effort).
  const preferLight =
    contrastLight >= 4.5 && contrastDark >= 4.5
      ? contrastLight >= contrastDark
      : contrastLight >= 4.5
        ? true
        : contrastDark >= 4.5
          ? false
          : contrastLight >= contrastDark;

  return preferLight
    ? { ...SOBER_LIGHT, onDark: true }
    : { ...SOBER_DARK, onDark: false };
}

/** Contrast of accent (e.g. alert chip) vs sober alert foreground. */
export function alertTextOnAccent(accentCss: string | null | undefined): string {
  const parsed = accentCss ? parseCssColor(accentCss) : null;
  if (!parsed) return SOBER_LIGHT.alertFg;
  const L = relativeLuminance(parsed.r, parsed.g, parsed.b);
  const light = contrastRatio(relativeLuminance(250, 250, 250), L);
  const dark = contrastRatio(relativeLuminance(24, 24, 27), L);
  return light >= dark ? SOBER_DARK.alertFg : SOBER_LIGHT.alertFg;
}
