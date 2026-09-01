"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { StatsTable } from "@/components/StatsTable";
import type { StatsResult } from "@/lib/chess-com/types";

const SESSION_KEY = "chess-overlay-session-start";
const INITIAL_RATING_KEY = "chess-overlay-initial-rating";

function readSessionStart(): string {
  const existing = sessionStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  const now = new Date().toISOString();
  sessionStorage.setItem(SESSION_KEY, now);
  return now;
}

function readInitialRating(fallback?: string | null): string | null {
  if (fallback) {
    sessionStorage.setItem(INITIAL_RATING_KEY, fallback);
    return fallback;
  }
  return sessionStorage.getItem(INITIAL_RATING_KEY);
}

export default function OverlayClient() {
  const searchParams = useSearchParams();

  const params = useMemo(() => new URLSearchParams(searchParams.toString()), [searchParams]);

  const refreshSeconds = Math.max(15, Number(params.get("refresh") ?? 30));
  const useSession = params.get("period") === "session" || !params.get("from");
  const gameType = params.get("type");

  const [sessionStart, setSessionStart] = useState<string | null>(null);
  const [initialRating, setInitialRating] = useState<string | null>(null);
  const [data, setData] = useState<StatsResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const start = useSession ? readSessionStart() : null;
    const rating = readInitialRating(params.get("initialRating"));
    setSessionStart(start);
    setInitialRating(rating);
  }, [params, useSession]);

  const buildApiUrl = useCallback(() => {
    const query = new URLSearchParams(params);

    if (sessionStart) {
      query.set("sessionStart", sessionStart);
    }

    if (initialRating) {
      query.set("initialRating", initialRating);
    }

    if (useSession && !query.get("period")) {
      query.set("period", "session");
    }

    return `/api/stats?${query.toString()}`;
  }, [params, sessionStart, initialRating, useSession]);

  const fetchStats = useCallback(
    async (isInitial: boolean) => {
      if (!params.get("username") || !gameType) {
        setError("Informe username e type na URL.");
        setLoading(false);
        return;
      }

      if (gameType === "puzzles" && !initialRating && !params.get("initialRating")) {
        setError("Para type=puzzles, informe initialRating na URL.");
        setLoading(false);
        return;
      }

      if (useSession && !sessionStart) return;

      if (isInitial) setLoading(true);
      else setRefreshing(true);

      try {
        const response = await fetch(buildApiUrl(), { cache: "no-store" });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error ?? "Falha ao carregar estatísticas.");
        }

        setData(payload as StatsResult);
        setError(null);
      } catch (fetchError) {
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Erro ao atualizar estatísticas.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [buildApiUrl, sessionStart, useSession, params, gameType, initialRating],
  );

  useEffect(() => {
    void fetchStats(true);
  }, [fetchStats]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void fetchStats(false);
    }, refreshSeconds * 1000);

    return () => window.clearInterval(interval);
  }, [fetchStats, refreshSeconds]);

  return (
    <main className="flex min-h-screen items-start justify-start bg-transparent p-4">
      {loading && !data ? (
        <div className="rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-white">
          Carregando estatísticas…
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-500/40 bg-black/60 px-4 py-3 text-red-300">
          {error}
        </div>
      ) : null}

      {data ? <StatsTable data={data} loading={refreshing} /> : null}
    </main>
  );
}
