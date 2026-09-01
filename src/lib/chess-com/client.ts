const USER_AGENT = "ChessStatsOverlay/1.0 (https://github.com/chess-stats-overlay)";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function chessFetch<T>(url: string, retries = 3): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < retries; attempt++) {
    if (attempt > 0) {
      await delay(1000 * 2 ** attempt);
    }

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "application/json",
        },
        cache: "no-store",
      });

      if (response.status === 404) {
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

      return (await response.json()) as T;
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
