import { statsParamMessage, toLoadStatsFailure } from "@/lib/errors";
import { parseStatsParams } from "@/lib/chess-com/params";
import type { StatsParams } from "@/lib/chess-com/types";
import type {
  ChessProviderId,
  NormalizedStatsResult,
} from "@/lib/providers/types";
import { fetchProviderStats, isChessProviderId } from "@/lib/providers/registry";

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
  options?: { provider?: ChessProviderId },
): Promise<{ result: NormalizedStatsResult } | { error: string; status: number }> {
  const parsed = parseStatsParams(searchParams);
  if ("error" in parsed) {
    return { error: statsParamMessage(parsed.error), status: 400 };
  }

  applySessionStart(searchParams, parsed.params);

  const providerParam = searchParams.get("provider");
  const provider: ChessProviderId = options?.provider
    ? options.provider
    : isChessProviderId(providerParam)
      ? providerParam
      : "chesscom";

  try {
    const result = await fetchProviderStats(provider, parsed.params);
    return { result };
  } catch (error) {
    return toLoadStatsFailure(error);
  }
}
