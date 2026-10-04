export const CHESSCOM_AFFILIATE_PLACEMENTS = ["footer", "faq"] as const;

export type ChessComAffiliatePlacement = (typeof CHESSCOM_AFFILIATE_PLACEMENTS)[number];

/** Measurement tags. Existing values on the affiliate URL are kept. */
const AFFILIATE_UTM = {
  utm_source: "chesstats",
  utm_medium: "affiliate",
  utm_campaign: "chesscom",
} as const;

/**
 * Chess.com affiliate URL for one disclosed text link.
 * Returns null when the env var is missing, blank, or not an http(s) URL,
 * so the line is omitted instead of rendering a placeholder.
 *
 * `utm_content` is always the placement (`footer` or `faq`) so the two
 * lines can be counted separately. Other UTM keys are added only when
 * the pasted URL does not already define them.
 */
export function chessComAffiliateHref(
  placement: ChessComAffiliatePlacement,
  raw: string | undefined = process.env.NEXT_PUBLIC_CHESSCOM_AFFILIATE_URL,
): string | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (!url.hostname) return null;

  for (const [key, value] of Object.entries(AFFILIATE_UTM)) {
    if (!url.searchParams.has(key)) url.searchParams.set(key, value);
  }
  url.searchParams.set("utm_content", placement);

  return url.toString();
}
