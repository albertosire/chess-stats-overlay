"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { StatsTable } from "@/components/StatsTable";
import {
  DEFAULT_REFRESH_SECONDS,
  MIN_REFRESH_SECONDS,
  normalizeOverlayName,
} from "@/lib/chess-com/build-url";
import type { StatsResult } from "@/lib/chess-com/types";

const SESSION_KEY = "chess-overlay-session-start";
const INITIAL_RATING_KEY = "chess-overlay-initial-rating";

function isSessionPeriod(params: URLSearchParams): boolean {
  const period = params.get("period");
  if (period === "session") return true;
  return !period && !params.get("from");
}

function readSessionStart(urlValue: string | null): string {
  if (urlValue) {
    sessionStorage.setItem(SESSION_KEY, urlValue);
    return urlValue;
  }

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

  const refreshSeconds = Math.max(
    MIN_REFRESH_SECONDS,
    Number(params.get("refresh") ?? DEFAULT_REFRESH_SECONDS),
  );
  const useSession = isSessionPeriod(params);
  const gameType = params.get("type");
  const urlSessionStart = params.get("sessionStart");
  const urlInitialRating = params.get("initialRating");
  const overlayName = normalizeOverlayName(params.get("name"));

  const sessionStart = useMemo(() => {
    if (!useSession) return null;
    if (typeof window === "undefined") return urlSessionStart;
    return readSessionStart(urlSessionStart);
  }, [useSession, urlSessionStart]);

  const initialRating = useMemo(() => {
    if (typeof window === "undefined") return urlInitialRating;
    return readInitialRating(urlInitialRating);
  }, [urlInitialRating]);

  const configError = useMemo(() => {
    if (!params.get("username") || !gameType) {
      return "Informe username e type na URL.";
    }
    if (gameType === "puzzles" && !initialRating && !urlInitialRating) {
      return "Para type=puzzles, informe initialRating na URL.";
    }
    return null;
  }, [params, gameType, initialRating, urlInitialRating]);

  const apiUrl = useMemo(() => {
    const query = new URLSearchParams(params);

    if (useSession && sessionStart) {
      query.set("sessionStart", sessionStart);
      query.set("period", "session");
    } else {
      query.delete("sessionStart");
    }

    if (initialRating) {
      query.set("initialRating", initialRating);
    }

    return `/api/stats?${query.toString()}`;
  }, [params, sessionStart, initialRating, useSession]);

  const [data, setData] = useState<StatsResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (configError || (useSession && !sessionStart)) {
      return;
    }

    let cancelled = false;

    async function load(isInitial: boolean) {
      if (!isInitial) {
        setRefreshing(true);
      }

      try {
        const response = await fetch(apiUrl, { cache: "no-store" });
        const payload = await response.json();

        if (cancelled) return;

        if (!response.ok) {
          throw new Error(payload.error ?? "Falha ao carregar estatísticas.");
        }

        setData(payload as StatsResult);
        setError(null);
      } catch (fetchError) {
        if (cancelled) return;
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Erro ao atualizar estatísticas.",
        );
      } finally {
        if (cancelled) return;
        setLoading(false);
        setRefreshing(false);
      }
    }

    const timeoutId = window.setTimeout(() => {
      void load(true);
    }, 0);

    const intervalId = window.setInterval(() => {
      void load(false);
    }, refreshSeconds * 1000);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, [apiUrl, configError, refreshSeconds, sessionStart, useSession]);

  return (
    <main className="flex min-h-screen items-start justify-start bg-transparent p-4">
      {configError ? (
        <div className="rounded-xl border border-red-500/40 bg-black/60 px-4 py-3 text-red-300">
          {configError}
        </div>
      ) : null}

      {loading && !data && !configError ? (
        <div className="rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-white">
          Carregando estatísticas…
        </div>
      ) : null}

      {error && !configError ? (
        <div className="rounded-xl border border-red-500/40 bg-black/60 px-4 py-3 text-red-300">
          {error}
        </div>
      ) : null}

      {data && !configError ? (
        <StatsTable data={data} title={overlayName} loading={refreshing} />
      ) : null}
    </main>
  );
}
