"use client";

import type { NormalizedStatsResult, OverlayEntitlements } from "@/lib/providers/types";
import { getTheme } from "@/lib/themes";
import { typeLabel } from "@/lib/chess-com/params";
import type { GameType } from "@/lib/providers/types";

interface StatsTableProps {
  data: NormalizedStatsResult;
  title?: string;
  loading?: boolean;
  entitlements?: OverlayEntitlements;
  themeId?: string;
  primaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
  sponsorLogoUrl?: string | null;
  showAlerts?: boolean;
  previousData?: NormalizedStatsResult | null;
}

function formatDelta(value: number | null): string {
  if (value == null) return "—";
  if (value > 0) return `+${value}`;
  return String(value);
}

export function StatsTable({
  data,
  title,
  loading,
  entitlements,
  themeId,
  primaryColor,
  accentColor,
  fontFamily,
  sponsorLogoUrl,
  showAlerts,
  previousData,
}: StatsTableProps) {
  const isPuzzles = data.meta.mode === "puzzles";
  const displayName = title?.trim() || data.username;
  const theme = getTheme(themeId ?? entitlements?.activeThemeId ?? "default-dark");
  const showDelta = entitlements?.showDeltaElo ?? false;
  const showWinRate = entitlements?.showWinRate ?? false;
  const showStreak = entitlements?.showStreak ?? false;
  const showRating = entitlements?.showCurrentRating ?? true;

  const delta = data.stats.ratingDelta ?? 0;
  const justWon =
    showAlerts &&
    previousData &&
    data.stats.wins > previousData.stats.wins;
  const milestone =
    showAlerts &&
    data.stats.currentRating != null &&
    [1500, 2000, 2500].includes(data.stats.currentRating) &&
    previousData?.stats.currentRating !== data.stats.currentRating;

  return (
    <div
      className="inline-block rounded-xl px-5 py-4 backdrop-blur-sm"
      style={{
        fontFamily: fontFamily || "system-ui, sans-serif",
        background: primaryColor ? `${primaryColor}cc` : theme.styles.background,
        border: `1px solid ${accentColor || theme.styles.border}`,
        color: theme.styles.text,
      }}
    >
      {justWon || milestone ? (
        <div
          className="mb-2 animate-pulse rounded-md px-2 py-1 text-center text-xs font-semibold"
          style={{ background: accentColor || theme.styles.accent, color: "#04110a" }}
        >
          {justWon ? "🔥 Vitória!" : `⭐ Marco ${data.stats.currentRating} ELO!`}
        </div>
      ) : null}

      <div className="mb-3 flex items-center justify-between gap-4 text-sm" style={{ color: theme.styles.muted }}>
        <span className="font-semibold" style={{ color: theme.styles.text }}>
          {displayName}
          <span className="ml-2 text-xs opacity-70">{data.provider === "lichess" ? "Lichess" : "Chess.com"}</span>
        </span>
        <span>
          {typeLabel(data.type as GameType)} · {data.period.from} → {data.period.to}
        </span>
        {loading ? <span className="text-xs opacity-70">Atualizando…</span> : null}
      </div>

      <table className="w-full min-w-[320px] border-collapse text-center text-lg">
        <thead>
          <tr className="text-sm uppercase tracking-wide" style={{ color: theme.styles.muted }}>
            {showRating ? <th className="px-3 py-2 font-medium">ELO</th> : null}
            {!isPuzzles ? (
              <>
                <th className="px-3 py-2 font-medium">Vitórias</th>
                <th className="px-3 py-2 font-medium">Empates</th>
                <th className="px-3 py-2 font-medium">Derrotas</th>
              </>
            ) : null}
            {showDelta ? <th className="px-3 py-2 font-medium">Δ Rating</th> : null}
            {showWinRate ? <th className="px-3 py-2 font-medium">WR%</th> : null}
            {showStreak ? <th className="px-3 py-2 font-medium">Streak</th> : null}
          </tr>
        </thead>
        <tbody>
          <tr className="font-bold">
            {showRating ? (
              <td className="px-3 py-2">{data.stats.currentRating ?? "—"}</td>
            ) : null}
            {!isPuzzles ? (
              <>
                <td className="px-3 py-2" style={{ color: theme.styles.win }}>
                  {data.stats.wins}
                </td>
                <td className="px-3 py-2">{data.stats.draws}</td>
                <td className="px-3 py-2" style={{ color: theme.styles.loss }}>
                  {data.stats.losses}
                </td>
              </>
            ) : null}
            {showDelta ? (
              <td
                className="px-3 py-2"
                style={{
                  color:
                    delta > 0 ? theme.styles.win : delta < 0 ? theme.styles.loss : theme.styles.text,
                }}
              >
                {formatDelta(data.stats.ratingDelta)}
              </td>
            ) : null}
            {showWinRate ? (
              <td className="px-3 py-2">
                {data.stats.winRate != null ? `${data.stats.winRate}%` : "—"}
              </td>
            ) : null}
            {showStreak ? (
              <td className="px-3 py-2">
                {data.stats.streak > 0 ? `🔥 ${data.stats.streak}` : "0"}
              </td>
            ) : null}
          </tr>
        </tbody>
      </table>

      {!isPuzzles ? (
        <p className="mt-2 text-center text-xs" style={{ color: theme.styles.muted }}>
          {data.stats.games} partidas · {data.meta.ratedGames} rated
        </p>
      ) : null}

      {sponsorLogoUrl && entitlements?.allowSponsorLogo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={sponsorLogoUrl}
          alt="Patrocinador"
          className="mx-auto mt-3 max-h-10 object-contain opacity-90"
        />
      ) : null}

      <p className="mt-1 text-center text-[10px]" style={{ color: theme.styles.muted }}>
        Atualizado: {new Date(data.meta.fetchedAt).toLocaleTimeString("pt-BR")}
      </p>

      {data.meta.note ? (
        <p className="mt-2 max-w-md text-center text-xs" style={{ color: theme.styles.muted }}>
          {data.meta.note}
        </p>
      ) : null}
    </div>
  );
}
