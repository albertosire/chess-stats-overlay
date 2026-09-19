export type ThemeId =
  | "default-dark"
  | "cyberpunk"
  | "grandmaster"
  | "neon-arcade"
  | "glass-dark";

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  description: string;
  priceUsd: number;
  priceBrl: number;
  isFree: boolean;
  styles: {
    background: string;
    border: string;
    text: string;
    muted: string;
    win: string;
    loss: string;
    accent: string;
  };
}

export const THEMES: Record<ThemeId, ThemeDefinition> = {
  "default-dark": {
    id: "default-dark",
    name: "Dark Minimalist",
    description: "Tema padrão gratuito, limpo e discreto.",
    priceUsd: 0,
    priceBrl: 0,
    isFree: true,
    styles: {
      background: "rgba(0,0,0,0.55)",
      border: "rgba(255,255,255,0.15)",
      text: "#ffffff",
      muted: "#a1a1aa",
      win: "#34d399",
      loss: "#f87171",
      accent: "#22c55e",
    },
  },
  cyberpunk: {
    id: "cyberpunk",
    name: "Cyberpunk Chess",
    description: "Neon magenta/ciano para streams noturnas.",
    priceUsd: 4.99,
    priceBrl: 24.9,
    isFree: false,
    styles: {
      background: "rgba(15,5,30,0.75)",
      border: "rgba(236,72,153,0.45)",
      text: "#fce7f3",
      muted: "#c084fc",
      win: "#22d3ee",
      loss: "#fb7185",
      accent: "#e879f9",
    },
  },
  grandmaster: {
    id: "grandmaster",
    name: "Grandmaster Wooden Board",
    description: "Tons de madeira e ouro clássicos.",
    priceUsd: 4.99,
    priceBrl: 24.9,
    isFree: false,
    styles: {
      background: "rgba(60,40,20,0.8)",
      border: "rgba(212,175,55,0.5)",
      text: "#fef3c7",
      muted: "#d6b981",
      win: "#86efac",
      loss: "#fca5a5",
      accent: "#d4af37",
    },
  },
  "neon-arcade": {
    id: "neon-arcade",
    name: "Neon Arcade",
    description: "Estética arcade anos 80.",
    priceUsd: 4.99,
    priceBrl: 24.9,
    isFree: false,
    styles: {
      background: "rgba(5,10,30,0.8)",
      border: "rgba(34,211,238,0.5)",
      text: "#e0f2fe",
      muted: "#67e8f9",
      win: "#a3e635",
      loss: "#fb923c",
      accent: "#22d3ee",
    },
  },
  "glass-dark": {
    id: "glass-dark",
    name: "Glassmorphism Dark",
    description: "Vidro fosco moderno com blur.",
    priceUsd: 4.99,
    priceBrl: 24.9,
    isFree: false,
    styles: {
      background: "rgba(24,24,27,0.45)",
      border: "rgba(255,255,255,0.25)",
      text: "#fafafa",
      muted: "#d4d4d8",
      win: "#4ade80",
      loss: "#f87171",
      accent: "#a78bfa",
    },
  },
};

export const THEME_BUNDLE_ID = "mega-bundle";
export const THEME_BUNDLE_PRICE_USD = 14.99;
export const THEME_BUNDLE_PRICE_BRL = 69.9;

export const PAID_THEME_IDS = Object.values(THEMES)
  .filter((theme) => !theme.isFree)
  .map((theme) => theme.id);

export function getTheme(id: string | null | undefined): ThemeDefinition {
  if (id && id in THEMES) {
    return THEMES[id as ThemeId];
  }
  return THEMES["default-dark"];
}

export function canUseTheme(themeId: string, ownedThemeIds: string[], isPro: boolean): boolean {
  const theme = getTheme(themeId);
  if (theme.isFree) return true;
  if (ownedThemeIds.includes(THEME_BUNDLE_ID)) return true;
  if (ownedThemeIds.includes(theme.id)) return true;
  // Pro does not automatically unlock paid brand kits — only subscription features.
  void isPro;
  return false;
}
