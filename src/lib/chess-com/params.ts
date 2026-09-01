import type { GameType, StatsParams } from "./types";

const VALID_TYPES = new Set<GameType>([
  "rapid",
  "blitz",
  "daily",
  "daily960",
  "puzzles",
  "manual",
]);

function startOfDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function endOfDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999),
  );
}

function parseDate(value: string | null): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function resolvePeriod(
  searchParams: URLSearchParams,
): { from: Date; to: Date } | { error: string } {
  const period = searchParams.get("period");
  const now = new Date();

  if (period) {
    switch (period) {
      case "today":
        return { from: startOfDay(now), to: endOfDay(now) };
      case "week": {
        const from = new Date(now);
        from.setUTCDate(from.getUTCDate() - 6);
        return { from: startOfDay(from), to: endOfDay(now) };
      }
      case "month": {
        const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
        return { from, to: endOfDay(now) };
      }
      case "session":
        return { from: now, to: endOfDay(now) };
      default:
        return { error: `Período inválido: ${period}` };
    }
  }

  const fromRaw = searchParams.get("from");
  const toRaw = searchParams.get("to");

  if (!fromRaw || !toRaw) {
    return { error: "Informe from/to (YYYY-MM-DD) ou period." };
  }

  const from = parseDate(fromRaw);
  const to = parseDate(toRaw);

  if (!from || !to) {
    return { error: "Datas from/to inválidas." };
  }

  if (from > to) {
    return { error: "A data from deve ser anterior ou igual a to." };
  }

  return { from: startOfDay(from), to: endOfDay(to) };
}

export function parseStatsParams(
  searchParams: URLSearchParams,
): { params: StatsParams } | { error: string } {
  const username = searchParams.get("username")?.trim().toLowerCase();
  const type = searchParams.get("type") as GameType | null;

  if (!username) {
    return { error: "Parâmetro username é obrigatório." };
  }

  if (!type || !VALID_TYPES.has(type)) {
    return { error: "Parâmetro type inválido." };
  }

  if (type === "manual" && !searchParams.get("timeControl")) {
    return { error: "Para type=manual, informe timeControl." };
  }

  const periodResult = resolvePeriod(searchParams);
  if ("error" in periodResult) {
    return { error: periodResult.error };
  }

  const initialRatingRaw = searchParams.get("initialRating");
  const overrideRatingRaw = searchParams.get("overrideRating");

  return {
    params: {
      username,
      type,
      from: periodResult.from,
      to: periodResult.to,
      timeControl: searchParams.get("timeControl") ?? undefined,
      initialRating: initialRatingRaw ? Number(initialRatingRaw) : undefined,
      overrideRating: overrideRatingRaw ? Number(overrideRatingRaw) : undefined,
    },
  };
}

export function typeLabel(type: GameType): string {
  const labels: Record<GameType, string> = {
    rapid: "Rápido",
    blitz: "Blitz",
    daily: "Diário",
    daily960: "Diário960",
    puzzles: "Problemas",
    manual: "Manual",
  };
  return labels[type];
}
