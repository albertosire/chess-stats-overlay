"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { StatsTable } from "@/components/StatsTable";
import {
  DEFAULT_REFRESH_SECONDS,
  MIN_REFRESH_SECONDS,
  normalizeOverlayName,
} from "@/lib/chess-com/build-url";
import type { NormalizedStatsResult, OverlayEntitlements } from "@/lib/providers/types";
import { resolveEntitlements } from "@/lib/providers/types";

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

export type OverlayClientProps = {
  token?: string;
  initialEntitlements?: OverlayEntitlements;
  themeId?: string;
  primaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
  sponsorLogoUrl?: string | null;
  displayName?: string | null;
  refreshSeconds?: number;
  dualProviders?: boolean;
  primaryProvider?: string;
  secondaryProvider?: string | null;
  forcedPeriod?: string;
  forcedType?: string;
};

export default function OverlayClient({
  token,
  initialEntitlements,
  themeId,
  primaryColor,
  accentColor,
  fontFamily,
  sponsorLogoUrl,
  displayName,
  refreshSeconds: refreshOverride,
  dualProviders,
  primaryProvider = "chesscom",
  secondaryProvider,
  forcedPeriod,
  forcedType,
}: OverlayClientProps = {}) {
  const searchParams = useSearchParams();
  const params = useMemo(() => {
    const next = new URLSearchParams(searchParams.toString());
    if (forcedPeriod && !next.get("period") && !next.get("from")) {
      next.set("period", forcedPeriod);
    }
    if (forcedType && !next.get("type")) {
      next.set("type", forcedType);
    }
    return next;
  }, [searchParams, forcedPeriod, forcedType]);

  const refreshSeconds = Math.max(
    MIN_REFRESH_SECONDS,
    refreshOverride ?? Number(params.get("refresh") ?? DEFAULT_REFRESH_SECONDS),
  );
  const useSession = isSessionPeriod(params);
  const gameType = params.get("type");
  const urlSessionStart = params.get("sessionStart");
  const urlInitialRating = params.get("initialRating");
  const overlayName = displayName || normalizeOverlayName(params.get("name"));
  const entitlements = initialEntitlements ?? resolveEntitlements(false);

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
    if (token) return null;
    if (!params.get("username") || !gameType) {
      return "Informe username e type na URL.";
    }
    if (gameType === "puzzles" && !initialRating && !urlInitialRating) {
      return "Para type=puzzles, informe initialRating na URL.";
    }
    return null;
  }, [params, gameType, initialRating, urlInitialRating, token]);

  const apiUrls = useMemo(() => {
    function build(provider: string) {
      const query = new URLSearchParams(params);
      if (token) query.set("token", token);
      query.set("provider", provider);
      if (useSession && sessionStart) {
        query.set("sessionStart", sessionStart);
        query.set("period", query.get("period") || "session");
      } else {
        query.delete("sessionStart");
      }
      if (initialRating) query.set("initialRating", initialRating);
      return `/api/stats?${query.toString()}`;
    }

    const primary = build(token ? primaryProvider : params.get("provider") || "chesscom");
    const secondary =
      token && dualProviders && secondaryProvider ? build(secondaryProvider) : null;
    return { primary, secondary };
  }, [
    params,
    token,
    primaryProvider,
    dualProviders,
    secondaryProvider,
    useSession,
    sessionStart,
    initialRating,
  ]);

  const [data, setData] = useState<NormalizedStatsResult | null>(null);
  const [secondaryData, setSecondaryData] = useState<NormalizedStatsResult | null>(null);
  const [previousData, setPreviousData] = useState<NormalizedStatsResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (configError || (useSession && !sessionStart)) return;

    let cancelled = false;

    async function load(isInitial: boolean) {
      if (!isInitial) setRefreshing(true);
      try {
        const [primaryRes, secondaryRes] = await Promise.all([
          fetch(apiUrls.primary, { cache: "no-store" }),
          apiUrls.secondary
            ? fetch(apiUrls.secondary, { cache: "no-store" })
            : Promise.resolve(null),
        ]);
        const primaryPayload = await primaryRes.json();
        if (cancelled) return;
        if (!primaryRes.ok) {
          throw new Error(primaryPayload.error ?? "Falha ao carregar estatísticas.");
        }

        setData((current) => {
          setPreviousData(current);
          return primaryPayload as NormalizedStatsResult;
        });

        if (secondaryRes) {
          const secondaryPayload = await secondaryRes.json();
          if (secondaryRes.ok) {
            setSecondaryData(secondaryPayload as NormalizedStatsResult);
          }
        }
        setError(null);
      } catch (fetchError) {
        if (cancelled) return;
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Erro ao atualizar estatísticas.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }

    const timeoutId = window.setTimeout(() => void load(true), 0);
    const intervalId = window.setInterval(() => void load(false), refreshSeconds * 1000);
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, [apiUrls, configError, refreshSeconds, sessionStart, useSession]);

  return (
    <main className="flex min-h-screen flex-wrap items-start justify-start gap-4 bg-transparent p-4">
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

      <AnimatePresence mode="popLayout">
        {data && !configError ? (
          <motion.div
            key="primary"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <StatsTable
              data={data}
              title={overlayName ?? undefined}
              loading={refreshing}
              entitlements={entitlements}
              themeId={themeId}
              primaryColor={primaryColor}
              accentColor={accentColor}
              fontFamily={fontFamily}
              sponsorLogoUrl={sponsorLogoUrl}
              showAlerts={entitlements.allowAlerts}
              previousData={previousData}
            />
          </motion.div>
        ) : null}

        {secondaryData && dualProviders ? (
          <motion.div
            key="secondary"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.05 }}
          >
            <StatsTable
              data={secondaryData}
              title={overlayName ?? undefined}
              loading={refreshing}
              entitlements={entitlements}
              themeId={themeId}
              primaryColor={primaryColor}
              accentColor={accentColor}
              fontFamily={fontFamily}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}
