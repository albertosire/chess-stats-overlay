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

export async function fetchGamesInPeriod(
  username: string,
  from: Date,
  to: Date,
): Promise<ChessGame[]> {
  const archives = await chessFetch<ArchivesResponse>(
    `https://api.chess.com/pub/player/${encodeURIComponent(username)}/games/archives`,
  );

  const relevantUrls = archives.archives.filter((url) => {
    const parsed = parseArchiveUrl(url);
    if (!parsed) return false;
    return archiveOverlapsPeriod(parsed.year, parsed.month, from, to);
  });

  if (relevantUrls.length === 0) {
    return [];
  }

  const monthlyArchives = await fetchWithConcurrency(
    relevantUrls,
    (url) => chessFetch<MonthlyArchive>(url),
  );

  return monthlyArchives.flatMap((archive) => archive.games ?? []);
}
