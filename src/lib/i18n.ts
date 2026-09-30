import en from "@/locales/en.json";
import ptBR from "@/locales/pt-BR.json";

export const LOCALES = ["en", "pt-BR"] as const;
export type Locale = (typeof LOCALES)[number];
export type Dictionary = typeof en;

export const LOCALE_COOKIE = "chesstats-locale";
export const DEFAULT_LOCALE: Locale = "en";

export function isLocale(value: string | null | undefined): value is Locale {
  return value === "en" || value === "pt-BR";
}

export function getDictionary(locale: Locale): Dictionary {
  return locale === "pt-BR" ? (ptBR as Dictionary) : en;
}

export function localePath(locale: Locale, path = ""): string {
  if (!path || path === "/") return `/${locale}`;
  return `/${locale}${path.startsWith("/") ? path : `/${path}`}`;
}
