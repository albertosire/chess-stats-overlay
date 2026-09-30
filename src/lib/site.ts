export const GITHUB_URL = "https://github.com/albertosire/chess-stats-overlay";

export function siteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";
  return raw.replace(/\/$/, "");
}
