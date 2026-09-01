"use client";

import type { StatsResult } from "@/lib/chess-com/types";
import { typeLabel } from "@/lib/chess-com/params";

interface StatsTableProps {
  data: StatsResult;
  loading?: boolean;
}

function formatDelta(value: number | null): string {
  if (value == null) return "—";
  if (value > 0) return `+${value}`;
  return String(value);
}

export function StatsTable({ data, loading }: StatsTableProps) {
  const isPuzzles = data.meta.mode === "puzzles";
  const delta = data.stats.ratingDelta ?? 0;
  const deltaClass =
    delta > 0 ? "text-emerald-400" : delta < 0 ? "text-red-400" : "text-zinc-200";

  return (
    <div
      className="inline-block rounded-xl border border-white/15 bg-black/55 px-5 py-4 text-white backdrop-blur-sm"
      style={{ fontFamily: "system-ui, sans-serif" }}
    >
      <div className="mb-3 flex items-center justify-between gap-4 text-sm text-zinc-300">
        <span className="font-semibold text-white">{data.username}</span>
        <span>
          {typeLabel(data.type)} · {data.period.from} → {data.period.to}
        </span>
        {loading ? <span className="text-xs text-zinc-400">Atualizando…</span> : null}
      </div>

      <table className="w-full min-w-[320px] border-collapse text-center text-lg">
        <thead>
          <tr className="text-sm uppercase tracking-wide text-zinc-400">
            {!isPuzzles ? (
              <>
                <th className="px-4 py-2 font-medium">Vitórias</th>
                <th className="px-4 py-2 font-medium">Empates</th>
                <th className="px-4 py-2 font-medium">Derrotas</th>
              </>
            ) : null}
            <th className="px-4 py-2 font-medium">Δ Rating</th>
          </tr>
        </thead>
        <tbody>
          <tr className="font-bold">
            {!isPuzzles ? (
              <>
                <td className="px-4 py-2 text-emerald-400">{data.stats.wins}</td>
                <td className="px-4 py-2 text-zinc-200">{data.stats.draws}</td>
                <td className="px-4 py-2 text-red-400">{data.stats.losses}</td>
              </>
            ) : null}
            <td className={`px-4 py-2 ${deltaClass}`}>{formatDelta(data.stats.ratingDelta)}</td>
          </tr>
        </tbody>
      </table>

      {!isPuzzles ? (
        <p className="mt-2 text-center text-xs text-zinc-400">
          {data.stats.games} partidas · {data.meta.ratedGames} rated
        </p>
      ) : null}

      <p className="mt-1 text-center text-[10px] text-zinc-500">
        Atualizado: {new Date(data.meta.fetchedAt).toLocaleTimeString("pt-BR")}
      </p>

      {data.meta.note ? (
        <p className="mt-2 max-w-md text-center text-xs text-zinc-500">{data.meta.note}</p>
      ) : null}
    </div>
  );
}
