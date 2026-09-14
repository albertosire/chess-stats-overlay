import { parseStatsParams } from "./params";
import { buildStats } from "./stats";
import { ChessApiError } from "./client";
import type { StatsParams, StatsResult } from "./types";

function applySessionStart(searchParams: URLSearchParams, params: StatsParams): void {
  const period = searchParams.get("period");
  const sessionStartRaw = searchParams.get("sessionStart");
  if (!sessionStartRaw) return;
  if (period && period !== "session") return;

  const sessionStart = new Date(sessionStartRaw);
  if (Number.isNaN(sessionStart.getTime())) return;

  params.from = sessionStart;
  params.to = new Date();
}

export async function loadStats(
  searchParams: URLSearchParams,
): Promise<{ result: StatsResult } | { error: string; status: number }> {
  const parsed = parseStatsParams(searchParams);
  if ("error" in parsed) {
    return { error: parsed.error, status: 400 };
  }

  applySessionStart(searchParams, parsed.params);

  try {
    return { result: await buildStats(parsed.params) };
  } catch (error) {
    if (error instanceof ChessApiError) {
      return { error: error.message, status: error.status };
    }

    return {
      error:
        error instanceof Error ? error.message : "Erro inesperado ao buscar estatísticas.",
      status: 500,
    };
  }
}
