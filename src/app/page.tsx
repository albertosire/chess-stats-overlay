import Link from "next/link";
import { OverlayBuilder } from "@/components/OverlayBuilder";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-12 text-zinc-100">
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-bold">Chess Stats Overlay</h1>
          <div className="flex gap-2">
            <Link
              href="/login"
              className="rounded-lg border border-zinc-700 px-4 py-2 text-sm hover:border-zinc-500"
            >
              Entrar
            </Link>
            <Link
              href="/dashboard"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
            >
              Dashboard / Pro
            </Link>
          </div>
        </div>
        <p className="max-w-3xl text-zinc-400">
          Overlay freemium para OBS: plano Free com ELO + W/L/D; Pro com Δ ELO, win rate, streaks,
          dual Chess.com/Lichess, temas e alertas.
        </p>
        <p className="rounded-lg border border-amber-500/30 bg-amber-950/30 px-3 py-2 text-sm text-amber-200">
          URLs query-string (`/overlay?username=…`) são sempre Free — sem Δ rating. Para recursos Pro,
          crie uma conta e use o link tokenizado do dashboard.
        </p>
        <p className="text-sm text-zinc-500">
          Projeto open source de{" "}
          <a
            href="https://github.com/albertosire"
            className="text-emerald-400 hover:text-emerald-300"
            target="_blank"
            rel="noreferrer"
          >
            Alberto Horta
          </a>
          .
        </p>
      </section>

      <section className="grid gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 sm:grid-cols-3">
        <div>
          <h2 className="font-semibold text-white">Free</h2>
          <p className="mt-1 text-sm text-zinc-400">ELO atual, W/D/L, tema Dark Minimalist, 1 site.</p>
        </div>
        <div>
          <h2 className="font-semibold text-white">Pro · R$ 14,90/mês</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Δ ELO, WR%, streaks, dual site, cores, alertas, logo sponsor.
          </p>
        </div>
        <div>
          <h2 className="font-semibold text-white">Brand Kits</h2>
          <p className="mt-1 text-sm text-zinc-400">Temas avulsos a partir de R$ 24,90 ou Mega Bundle.</p>
        </div>
      </section>

      <OverlayBuilder />
    </main>
  );
}
