export const GITHUB_URL = "https://github.com/albertosire/chess-stats-overlay";

export const DEFAULT_SITE_URL = "https://www.chesstats.online";

export function siteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim() || DEFAULT_SITE_URL;
  return raw.replace(/\/$/, "");
}
