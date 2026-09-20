import type {
  ChessProviderId,
  NormalizedStatsParams,
  NormalizedStatsResult,
  StatsProvider,
} from "./types";
import { chessComProvider } from "./chesscom";
import { lichessProvider } from "./lichess";

const providers: Record<ChessProviderId, StatsProvider> = {
  chesscom: chessComProvider,
  lichess: lichessProvider,
};

const cache = new Map<string, { expiresAt: number; value: NormalizedStatsResult }>();
const CACHE_TTL_MS = 20_000;

export function getProvider(id: ChessProviderId): StatsProvider {
  const provider = providers[id];
  if (!provider) {
    throw new Error(`Provider desconhecido: ${id}`);
  }
  return provider;
}

export function listProviders(): StatsProvider[] {
  return Object.values(providers);
}

export function isChessProviderId(value: string | null | undefined): value is ChessProviderId {
  return value === "chesscom" || value === "lichess";
}

function cacheKey(id: ChessProviderId, params: NormalizedStatsParams): string {
  return [
    id,
    params.username,
    params.type,
    params.from.toISOString(),
    params.to.toISOString(),
    params.timeControl ?? "",
    params.initialRating ?? "",
    params.overrideRating ?? "",
  ].join("|");
}

export async function fetchProviderStats(
  id: ChessProviderId,
  params: NormalizedStatsParams,
  options?: { bypassCache?: boolean },
): Promise<NormalizedStatsResult> {
  const key = cacheKey(id, params);
  const now = Date.now();

  if (!options?.bypassCache) {
    const hit = cache.get(key);
    if (hit && hit.expiresAt > now) {
      return hit.value;
    }
  }

  const value = await getProvider(id).fetchStats(params);
  cache.set(key, { expiresAt: now + CACHE_TTL_MS, value });
  return value;
}

export const PROVIDER_OPTIONS: { value: ChessProviderId; label: string }[] = [
  { value: "chesscom", label: "Chess.com" },
  { value: "lichess", label: "Lichess" },
];
