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
        throw new ChessApiError("Usuário ou recurso não encontrado.", 404);
      }

      if (response.status === 429 || response.status === 403) {
        lastError = new ChessApiError(
          response.status === 403
            ? "Limite de requisições da API Chess.com atingido. Tente novamente em instantes."
            : "Muitas requisições. Aguarde e tente novamente.",
          response.status,
        );
        continue;
      }

      if (!response.ok) {
        throw new ChessApiError(`Erro na API Chess.com (${response.status}).`, response.status);
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
        if (error.status === 404) throw error;
        lastError = error;
        continue;
      }
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  throw lastError ?? new Error("Falha ao consultar a API Chess.com.");
}

export class ChessApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ChessApiError";
  }
}

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
