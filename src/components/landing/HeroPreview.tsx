"use client";

import { motion, useReducedMotion } from "framer-motion";
import { StatsTable } from "@/components/StatsTable";
import type { Dictionary, Locale } from "@/lib/i18n";
import type { NormalizedStatsResult } from "@/lib/providers/types";

const DEMO_STATS: NormalizedStatsResult = {
  provider: "chesscom",
  username: "blitz",
  type: "blitz",
  period: { from: "2026-09-29", to: "2026-09-29" },
  stats: {
    wins: 8,
    draws: 1,
    losses: 2,
    games: 11,
    ratingDelta: 37,
    currentRating: 1854,
    winRate: 72.7,
    streak: 4,
  },
  meta: {
    ratedGames: 11,
    fetchedAt: "2026-09-29T18:00:00.000Z",
    mode: "games",
  },
};

export function HeroPreview({
  locale,
  labels,
  title,
}: {
  locale: Locale;
  labels: Dictionary["demo"]["labels"];
  title: string;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45 }}
    >
      <StatsTable
        data={DEMO_STATS}
        title={title}
        labels={labels}
        locale={locale}
        showAlerts={false}
      />
    </motion.div>
  );
}
