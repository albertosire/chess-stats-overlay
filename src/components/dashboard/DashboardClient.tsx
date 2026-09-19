"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  regenerateObsToken,
  saveLinkedAccount,
  saveOverlayConfig,
  removeLinkedAccount,
} from "@/app/dashboard/actions";
import type { LinkedAccountRow, OverlayConfigRow } from "@/lib/supabase/database.types";
import { PROVIDER_OPTIONS } from "@/lib/providers/registry";
import type { ChessProviderId } from "@/lib/providers/types";
import {
  THEMES,
  THEME_BUNDLE_ID,
  THEME_BUNDLE_PRICE_BRL,
  THEME_BUNDLE_PRICE_USD,
  PAID_THEME_IDS,
  canUseTheme,
} from "@/lib/themes";
import { GAME_TYPE_OPTIONS, PERIOD_OPTIONS } from "@/lib/chess-com/build-url";
import { Coffee, Copy, ExternalLink, Sparkles } from "lucide-react";

type Props = {
  config: OverlayConfigRow;
  accounts: LinkedAccountRow[];
  isPro: boolean;
  ownedThemes: string[];
  kofiUrl: string;
};

export function DashboardClient({ config, accounts, isPro, ownedThemes, kofiUrl }: Props) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [obsToken, setObsToken] = useState(config.obs_token);
  const [copied, setCopied] = useState(false);
  const [currency, setCurrency] = useState<"usd" | "brl">("brl");

  const [chesscom, setChesscom] = useState(
    accounts.find((a) => a.provider === "chesscom")?.username ?? "",
  );
  const [lichess, setLichess] = useState(
    accounts.find((a) => a.provider === "lichess")?.username ?? "",
  );

  const [form, setForm] = useState({
    display_name: config.display_name ?? "",
    game_type: config.game_type,
    period_mode: config.period_mode,
    refresh_seconds: config.refresh_seconds,
    time_control: config.time_control ?? "600+0",
    primary_provider: config.primary_provider,
    secondary_provider: config.secondary_provider ?? "",
    primary_color: config.primary_color,
    accent_color: config.accent_color,
    font_family: config.font_family,
    show_delta_elo: config.show_delta_elo,
    show_winrate: config.show_winrate,
    show_streak: config.show_streak,
    active_theme_id: config.active_theme_id,
    custom_sponsor_logo_url: config.custom_sponsor_logo_url ?? "",
  });

  const origin = useMemo(
    () => (typeof window === "undefined" ? "" : window.location.origin),
    [],
  );
  const obsUrl = origin ? `${origin}/overlay/${obsToken}` : `/overlay/${obsToken}`;

  async function copyObs() {
    await navigator.clipboard.writeText(obsUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  function saveAccounts() {
    startTransition(async () => {
      try {
        if (chesscom.trim()) await saveLinkedAccount("chesscom", chesscom);
        else if (accounts.some((a) => a.provider === "chesscom")) {
          await removeLinkedAccount("chesscom");
        }
        if (lichess.trim()) await saveLinkedAccount("lichess", lichess);
        else if (accounts.some((a) => a.provider === "lichess")) {
          await removeLinkedAccount("lichess");
        }
        setMessage("Contas salvas.");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Erro ao salvar contas.");
      }
    });
  }

  function saveConfig() {
    startTransition(async () => {
      try {
        await saveOverlayConfig({
          display_name: form.display_name || null,
          game_type: form.game_type,
          period_mode: form.period_mode,
          refresh_seconds: form.refresh_seconds,
          time_control: form.game_type === "manual" ? form.time_control : null,
          primary_provider: form.primary_provider,
          secondary_provider: form.secondary_provider || null,
          primary_color: form.primary_color,
          accent_color: form.accent_color,
          font_family: form.font_family,
          show_delta_elo: form.show_delta_elo,
          show_winrate: form.show_winrate,
          show_streak: form.show_streak,
          active_theme_id: form.active_theme_id,
          custom_sponsor_logo_url: form.custom_sponsor_logo_url || null,
        });
        setMessage("Configuração salva.");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Erro ao salvar config.");
      }
    });
  }

  function rotateToken() {
    startTransition(async () => {
      try {
        const token = await regenerateObsToken();
        setObsToken(token);
        setMessage("Novo token OBS gerado. Atualize a Browser Source no OBS.");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Erro ao regenerar token.");
      }
    });
  }

  async function startCheckout(kind: "pro" | "theme" | "bundle", themeId?: string) {
    setMessage(null);
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, currency, themeId }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setMessage(payload.error ?? "Falha no checkout.");
      return;
    }
    window.location.href = payload.url;
  }

  async function openPortal() {
    const response = await fetch("/api/billing-portal", { method: "POST" });
    const payload = await response.json();
    if (!response.ok) {
      setMessage(payload.error ?? "Portal indisponível.");
      return;
    }
    window.location.href = payload.url;
  }

  async function uploadSponsor(file: File) {
    const formData = new FormData();
    formData.set("file", file);
    const response = await fetch("/api/sponsor-upload", { method: "POST", body: formData });
    const payload = await response.json();
    if (!response.ok) {
      setMessage(payload.error ?? "Upload falhou.");
      return;
    }
    setForm((current) => ({ ...current, custom_sponsor_logo_url: payload.url }));
    setMessage("Logo enviada. Salve a configuração.");
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Link OBS (tokenizado)</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Use esta URL no Browser Source. Features Pro só funcionam com assinatura ativa.
            </p>
            <pre className="mt-3 max-w-xl overflow-auto rounded-lg bg-zinc-950 p-3 text-xs text-zinc-300">
              {obsUrl}
            </pre>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void copyObs()}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium"
            >
              <Copy className="h-4 w-4" />
              {copied ? "Copiado!" : "Copiar link OBS"}
            </button>
            <Link
              href={`/overlay/${obsToken}`}
              target="_blank"
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-600 px-4 py-2 text-sm"
            >
              <ExternalLink className="h-4 w-4" />
              Abrir
            </Link>
            <button
              type="button"
              onClick={rotateToken}
              disabled={pending}
              className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300"
            >
              Regenerar token
            </button>
          </div>
        </div>
        <div className="mt-4 overflow-hidden rounded-xl border border-dashed border-zinc-700 bg-[#1a1a1a]">
          <iframe
            title="Preview OBS"
            src={`/overlay/${obsToken}`}
            className="h-[240px] w-full border-0 bg-transparent"
          />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
          <h2 className="text-lg font-semibold">Contas de xadrez</h2>
          <label className="block space-y-2 text-sm">
            <span>Chess.com</span>
            <input
              value={chesscom}
              onChange={(e) => setChesscom(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2"
              placeholder="username"
            />
          </label>
          <label className="block space-y-2 text-sm">
            <span>Lichess</span>
            <input
              value={lichess}
              onChange={(e) => setLichess(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2"
              placeholder="username"
            />
          </label>
          <button
            type="button"
            onClick={saveAccounts}
            disabled={pending}
            className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900"
          >
            Salvar contas
          </button>
        </section>

        <section className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
          <h2 className="text-lg font-semibold">Plano & cobrança</h2>
          <p className="text-sm text-zinc-400">
            Pro: R$ 14,90/mês ou $2.99 USD — Δ ELO, win rate, streak, dual site, temas custom,
            alertas e logo de patrocinador.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setCurrency("brl")}
              className={`rounded-lg px-3 py-1.5 text-sm ${currency === "brl" ? "bg-emerald-600" : "border border-zinc-700"}`}
            >
              BRL
            </button>
            <button
              type="button"
              onClick={() => setCurrency("usd")}
              className={`rounded-lg px-3 py-1.5 text-sm ${currency === "usd" ? "bg-emerald-600" : "border border-zinc-700"}`}
            >
              USD
            </button>
          </div>
          {!isPro ? (
            <button
              type="button"
              onClick={() => void startCheckout("pro")}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium"
            >
              <Sparkles className="h-4 w-4" />
              Assinar Pro
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void openPortal()}
              className="rounded-lg border border-zinc-600 px-4 py-2 text-sm"
            >
              Gerenciar assinatura
            </button>
          )}
          <a
            href={kofiUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm text-amber-300 hover:text-amber-200"
          >
            <Coffee className="h-4 w-4" />
            Apoie o projeto (Ko-fi)
          </a>
          <div className="rounded-lg border border-zinc-700/80 bg-zinc-950/50 p-3 text-xs text-zinc-400">
            <p className="font-medium text-zinc-300">Afiliados</p>
            <a
              href="https://www.chessable.com/"
              target="_blank"
              rel="noreferrer"
              className="mt-1 block text-emerald-400 hover:underline"
            >
              Cursos Chessable →
            </a>
            <a
              href="https://www.chess.com/"
              target="_blank"
              rel="noreferrer"
              className="mt-1 block text-emerald-400 hover:underline"
            >
              Chess.com Premium →
            </a>
          </div>
        </section>
      </div>

      <section className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
        <h2 className="text-lg font-semibold">Configuração do overlay</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-2 text-sm">
            <span>Nome de exibição</span>
            <input
              value={form.display_name}
              onChange={(e) => setForm({ ...form, display_name: e.target.value })}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2"
            />
          </label>
          <label className="block space-y-2 text-sm">
            <span>Modalidade</span>
            <select
              value={form.game_type}
              onChange={(e) => setForm({ ...form, game_type: e.target.value })}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2"
            >
              {GAME_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-2 text-sm">
            <span>Período</span>
            <select
              value={form.period_mode}
              onChange={(e) => setForm({ ...form, period_mode: e.target.value })}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2"
            >
              {PERIOD_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-2 text-sm">
            <span>Provider principal</span>
            <select
              value={form.primary_provider}
              onChange={(e) =>
                setForm({ ...form, primary_provider: e.target.value as ChessProviderId })
              }
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2"
            >
              {PROVIDER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-2 text-sm">
            <span>Provider secundário {!isPro ? "(Pro)" : ""}</span>
            <select
              value={form.secondary_provider}
              disabled={!isPro}
              onChange={(e) => setForm({ ...form, secondary_provider: e.target.value })}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 disabled:opacity-40"
            >
              <option value="">Nenhum</option>
              {PROVIDER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-2 text-sm">
            <span>Refresh ({form.refresh_seconds}s)</span>
            <input
              type="range"
              min={20}
              max={120}
              step={5}
              value={form.refresh_seconds}
              onChange={(e) =>
                setForm({ ...form, refresh_seconds: Number(e.target.value) })
              }
              className="w-full accent-emerald-500"
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {(
            [
              ["show_delta_elo", "Δ ELO"],
              ["show_winrate", "Win Rate %"],
              ["show_streak", "Win Streak"],
            ] as const
          ).map(([key, label]) => (
            <label
              key={key}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                isPro ? "border-zinc-700" : "border-zinc-800 opacity-50"
              }`}
            >
              <input
                type="checkbox"
                disabled={!isPro}
                checked={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
              />
              {label} {!isPro ? "(Pro)" : ""}
            </label>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block space-y-2 text-sm">
            <span>Cor primária {!isPro ? "(Pro)" : ""}</span>
            <input
              type="color"
              disabled={!isPro}
              value={form.primary_color}
              onChange={(e) => setForm({ ...form, primary_color: e.target.value })}
              className="h-10 w-full disabled:opacity-40"
            />
          </label>
          <label className="block space-y-2 text-sm">
            <span>Cor accent {!isPro ? "(Pro)" : ""}</span>
            <input
              type="color"
              disabled={!isPro}
              value={form.accent_color}
              onChange={(e) => setForm({ ...form, accent_color: e.target.value })}
              className="h-10 w-full disabled:opacity-40"
            />
          </label>
          <label className="block space-y-2 text-sm">
            <span>Fonte {!isPro ? "(Pro)" : ""}</span>
            <select
              disabled={!isPro}
              value={form.font_family}
              onChange={(e) => setForm({ ...form, font_family: e.target.value })}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 disabled:opacity-40"
            >
              {["Inter", "system-ui", "Geist", "Roboto Mono", "Georgia"].map((font) => (
                <option key={font} value={font}>
                  {font}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Logo do patrocinador {!isPro ? "(Pro)" : ""}</p>
          <input
            type="file"
            accept="image/*"
            disabled={!isPro}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void uploadSponsor(file);
            }}
            className="block w-full text-sm disabled:opacity-40"
          />
          {form.custom_sponsor_logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={form.custom_sponsor_logo_url}
              alt="Sponsor"
              className="mt-2 max-h-12 rounded border border-zinc-700"
            />
          ) : null}
        </div>

        <button
          type="button"
          onClick={saveConfig}
          disabled={pending}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          Salvar configuração
        </button>
      </section>

      <section className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Brand Kits & Temas</h2>
          <button
            type="button"
            onClick={() => void startCheckout("bundle")}
            className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-sm text-amber-200"
          >
            Mega Bundle ({currency === "brl" ? `R$ ${THEME_BUNDLE_PRICE_BRL}` : `$${THEME_BUNDLE_PRICE_USD}`})
          </button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Object.values(THEMES).map((theme) => {
            const owned = canUseTheme(theme.id, ownedThemes, isPro);
            const selected = form.active_theme_id === theme.id;
            return (
              <div
                key={theme.id}
                className={`rounded-xl border p-4 ${selected ? "border-emerald-500" : "border-zinc-700"}`}
                style={{ background: theme.styles.background }}
              >
                <h3 className="font-semibold" style={{ color: theme.styles.text }}>
                  {theme.name}
                </h3>
                <p className="mt-1 text-xs" style={{ color: theme.styles.muted }}>
                  {theme.description}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {owned || theme.isFree ? (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, active_theme_id: theme.id })}
                      className="rounded-lg bg-white/10 px-3 py-1 text-xs"
                      style={{ color: theme.styles.text }}
                    >
                      {selected ? "Ativo" : "Usar"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void startCheckout("theme", theme.id)}
                      className="rounded-lg bg-emerald-600 px-3 py-1 text-xs text-white"
                    >
                      Comprar {currency === "brl" ? `R$ ${theme.priceBrl}` : `$${theme.priceUsd}`}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-zinc-500">
          Temas avulsos: {PAID_THEME_IDS.join(", ")}. Bundle libera todos ({THEME_BUNDLE_ID}).
        </p>
      </section>

      {message ? (
        <p className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-200">
          {message}
        </p>
      ) : null}
    </div>
  );
}
