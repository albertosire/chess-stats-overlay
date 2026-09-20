import { chessFetch, fetchWithConcurrency } from "./client";
import type { ArchivesResponse, ChessGame, MonthlyArchive } from "./types";

function parseArchiveUrl(url: string): { year: number; month: number } | null {
  const match = url.match(/\/games\/(\d{4})\/(\d{2})$/);
  if (!match) return null;
  return { year: Number(match[1]), month: Number(match[2]) };
}

function archiveOverlapsPeriod(
  year: number,
  month: number,
  from: Date,
  to: Date,
): boolean {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  return start <= to && end >= from;
}

function utcMonth(date: Date): { year: number; month: number } {
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 };
}

function isSameUtcMonth(from: Date, to: Date): boolean {
  const start = utcMonth(from);
  const end = utcMonth(to);
  return start.year === end.year && start.month === end.month;
}

function monthlyArchiveUrl(username: string, year: number, month: number): string {
  const paddedMonth = String(month).padStart(2, "0");
  return `https://api.chess.com/pub/player/${encodeURIComponent(username)}/games/${year}/${paddedMonth}`;
}

async function fetchMonthlyArchive(url: string): Promise<ChessGame[]> {
  const archive = await chessFetch<MonthlyArchive>(url, { notFound: { games: [] } });
  return archive.games ?? [];
}

export async function fetchGamesInPeriod(
  username: string,
  from: Date,
  to: Date,
): Promise<ChessGame[]> {
  if (isSameUtcMonth(from, to)) {
    const { year, month } = utcMonth(from);
    return fetchMonthlyArchive(monthlyArchiveUrl(username, year, month));
  }

  const archives = await chessFetch<ArchivesResponse>(
    `https://api.chess.com/pub/player/${encodeURIComponent(username)}/games/archives`,
    { notFound: { archives: [] } },
  );

  const relevantUrls = archives.archives.filter((url) => {
    const parsed = parseArchiveUrl(url);
    if (!parsed) return false;
    return archiveOverlapsPeriod(parsed.year, parsed.month, from, to);
  });

  if (relevantUrls.length === 0) {
    return [];
  }

  const monthlyArchives = await fetchWithConcurrency(relevantUrls, (url) =>
    fetchMonthlyArchive(url),
  );

  return monthlyArchives.flat();
}
