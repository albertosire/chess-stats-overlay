import { ChessApiError } from "@/lib/errors";

const DEFAULT_USER_AGENT =
  "ChessStatsOverlay/1.0 (Alberto Horta; https://github.com/albertosire)";

type CachedBody = {
  etag?: string;
  lastModified?: string;
  body: unknown;
};

const responseCache = new Map<string, CachedBody>();

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function getUserAgent(): string {
  return process.env.CHESS_COM_USER_AGENT?.trim() || DEFAULT_USER_AGENT;
}

export type ChessFetchOptions<T> = {
  retries?: number;
  notFound?: T;
};

export async function chessFetch<T>(
  url: string,
  options: ChessFetchOptions<T> = {},
): Promise<T> {
  const retries = options.retries ?? 3;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < retries; attempt++) {
    if (attempt > 0) {
      await delay(1000 * 2 ** attempt);
    }

    try {
      const cached = responseCache.get(url);
      const headers: Record<string, string> = {
        "User-Agent": getUserAgent(),
        Accept: "application/json",
      };

      if (cached?.etag) {
        headers["If-None-Match"] = cached.etag;
      }
      if (cached?.lastModified) {
        headers["If-Modified-Since"] = cached.lastModified;
      }

      const response = await fetch(url, {
        headers,
        cache: "no-store",
        signal: AbortSignal.timeout(12_000),
      });

      if (response.status === 304) {
        if (cached) {
          return cached.body as T;
        }

        responseCache.delete(url);
        continue;
      }

      if (response.status === 404) {
        if (options.notFound !== undefined) {
          return options.notFound;
        }
        throw new ChessApiError("not_found", 404);
      }

      if (response.status === 429 || response.status === 403) {
        lastError = new ChessApiError("rate_limited", 429);
        continue;
      }

      if (!response.ok) {
        throw new ChessApiError("unavailable", 503);
      }

      const body = (await response.json()) as T;
      responseCache.set(url, {
        etag: response.headers.get("etag") ?? undefined,
        lastModified: response.headers.get("last-modified") ?? undefined,
        body,
      });

      return body;
    } catch (error) {
      if (error instanceof ChessApiError) {
        if (error.code === "not_found") throw error;
        lastError = error;
        continue;
      }
      lastError =
        error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")
          ? new ChessApiError("timeout", 504)
          : new ChessApiError("unavailable", 503);
    }
  }

  throw lastError ?? new ChessApiError("unavailable", 503);
}

export { ChessApiError };

export async function fetchWithConcurrency<T>(
  urls: string[],
  fetcher: (url: string) => Promise<T>,
  concurrency = 2,
  gapMs = 500,
): Promise<T[]> {
  const results: T[] = [];
  let index = 0;

  async function worker() {
    while (index < urls.length) {
      const current = index++;
      results[current] = await fetcher(urls[current]);
      if (current < urls.length - 1) {
        await delay(gapMs);
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, urls.length) }, worker));
  return results;
}
