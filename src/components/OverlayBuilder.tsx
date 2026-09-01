"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  buildAbsoluteUrl,
  buildApiPath,
  buildIframeSnippet,
  buildOverlayPath,
  GAME_TYPE_OPTIONS,
  PERIOD_OPTIONS,
  validateOverlayConfig,
  type OverlayConfig,
} from "@/lib/chess-com/build-url";

const DEFAULT_CONFIG: OverlayConfig = {
  username: "",
  type: "blitz",
  periodMode: "session",
  from: "",
  to: "",
  refresh: 30,
  timeControl: "600+0",
  initialRating: "",
};

type OutputTab = "url" | "iframe" | "api";

function CopyButton({ value, label, disabled }: { value: string; label: string; disabled?: boolean }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!value || disabled) return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      disabled={disabled || !value}
      className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {copied ? "Copiado!" : label}
    </button>
  );
}

export function OverlayBuilder() {
  const [config, setConfig] = useState<OverlayConfig>(DEFAULT_CONFIG);
  const [outputTab, setOutputTab] = useState<OutputTab>("url");
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const errors = useMemo(() => validateOverlayConfig(config), [config]);
  const isValid = errors.length === 0;

  const overlayPath = buildOverlayPath(config);
  const apiPath = buildApiPath(config);
  const overlayUrl = origin ? buildAbsoluteUrl(origin, overlayPath) : overlayPath;
  const apiUrl = origin ? buildAbsoluteUrl(origin, apiPath) : apiPath;
  const iframeSnippet = buildIframeSnippet(overlayUrl);

  const outputValue =
    outputTab === "url" ? overlayUrl : outputTab === "iframe" ? iframeSnippet : apiUrl;

  function update<K extends keyof OverlayConfig>(key: K, value: OverlayConfig[K]) {
    setConfig((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <section className="space-y-5 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
        <div>
          <h2 className="text-xl font-semibold text-white">Monte seu overlay</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Configure conta, modalidade e período. A página gerada se atualiza sozinha enquanto
            estiver aberta.
          </p>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-zinc-200">Usuário Chess.com</span>
          <input
            type="text"
            value={config.username}
            onChange={(event) => update("username", event.target.value)}
            placeholder="ex: hikaru"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white outline-none ring-emerald-500/40 focus:ring-2"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-zinc-200">Modalidade</span>
          <select
            value={config.type}
            onChange={(event) => update("type", event.target.value as OverlayConfig["type"])}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white outline-none ring-emerald-500/40 focus:ring-2"
          >
            {GAME_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-zinc-500">
            {GAME_TYPE_OPTIONS.find((option) => option.value === config.type)?.hint}
          </p>
        </label>

        {config.type === "manual" ? (
          <label className="block space-y-2">
            <span className="text-sm font-medium text-zinc-200">Time control</span>
            <input
              type="text"
              value={config.timeControl ?? ""}
              onChange={(event) => update("timeControl", event.target.value)}
              placeholder="600+0 ou 3+2"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white outline-none ring-emerald-500/40 focus:ring-2"
            />
          </label>
        ) : null}

        {config.type === "puzzles" ? (
          <label className="block space-y-2">
            <span className="text-sm font-medium text-zinc-200">Rating inicial</span>
            <input
              type="number"
              value={config.initialRating ?? ""}
              onChange={(event) => update("initialRating", event.target.value)}
              placeholder="ex: 2500"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white outline-none ring-emerald-500/40 focus:ring-2"
            />
            <p className="text-xs text-zinc-500">
              Informe seu rating de problemas no início da transmissão para acompanhar a variação.
            </p>
          </label>
        ) : null}

        <label className="block space-y-2">
          <span className="text-sm font-medium text-zinc-200">Período</span>
          <select
            value={config.periodMode}
            onChange={(event) =>
              update("periodMode", event.target.value as OverlayConfig["periodMode"])
            }
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white outline-none ring-emerald-500/40 focus:ring-2"
          >
            {PERIOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-zinc-500">
            {PERIOD_OPTIONS.find((option) => option.value === config.periodMode)?.hint}
          </p>
        </label>

        {config.periodMode === "custom" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-zinc-200">De</span>
              <input
                type="date"
                value={config.from ?? ""}
                onChange={(event) => update("from", event.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white outline-none ring-emerald-500/40 focus:ring-2"
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-zinc-200">Até</span>
              <input
                type="date"
                value={config.to ?? ""}
                onChange={(event) => update("to", event.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white outline-none ring-emerald-500/40 focus:ring-2"
              />
            </label>
          </div>
        ) : null}

        <label className="block space-y-2">
          <span className="text-sm font-medium text-zinc-200">
            Atualizar a cada {config.refresh}s
          </span>
          <input
            type="range"
            min={15}
            max={120}
            step={5}
            value={config.refresh}
            onChange={(event) => update("refresh", Number(event.target.value))}
            className="w-full accent-emerald-500"
          />
        </label>

        {errors.length > 0 ? (
          <ul className="space-y-1 rounded-lg border border-red-500/30 bg-red-950/30 px-3 py-2 text-sm text-red-300">
            {errors.map((error) => (
              <li key={error}>• {error}</li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="space-y-5">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-white">Pré-visualização</h2>
            {isValid ? (
              <Link
                href={overlayPath}
                target="_blank"
                className="rounded-lg border border-zinc-600 px-3 py-1.5 text-sm text-zinc-200 transition hover:border-zinc-400 hover:text-white"
              >
                Abrir overlay ↗
              </Link>
            ) : null}
          </div>

          <div className="overflow-hidden rounded-xl border border-dashed border-zinc-700 bg-[#1a1a1a] p-4">
            {isValid ? (
              <iframe
                src={overlayPath}
                title="Pré-visualização do overlay"
                width="100%"
                height="220"
                className="border-0 bg-transparent"
                style={{ background: "transparent" }}
              />
            ) : (
              <div className="flex h-[220px] items-center justify-center text-sm text-zinc-500">
                Preencha os campos obrigatórios para ver a pré-visualização.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
          <h2 className="text-xl font-semibold text-white">Use no destino</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Copie a URL para OBS Browser Source ou o snippet HTML para embutir em sites e ferramentas
            de overlay.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {(
              [
                ["url", "URL do overlay"],
                ["iframe", "Snippet HTML"],
                ["api", "URL da API JSON"],
              ] as const
            ).map(([tab, label]) => (
              <button
                key={tab}
                type="button"
                onClick={() => setOutputTab(tab)}
                className={`rounded-lg px-3 py-1.5 text-sm transition ${
                  outputTab === tab
                    ? "bg-emerald-600 text-white"
                    : "border border-zinc-700 text-zinc-300 hover:border-zinc-500"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <pre className="mt-4 max-h-48 overflow-auto rounded-lg bg-zinc-950 p-3 text-xs leading-relaxed text-zinc-300">
            {isValid ? outputValue : "Complete a configuração para gerar o código."}
          </pre>

          <div className="mt-4 flex flex-wrap gap-3">
            <CopyButton
              value={isValid ? outputValue : ""}
              disabled={!isValid}
              label={
                outputTab === "url"
                  ? "Copiar URL"
                  : outputTab === "iframe"
                    ? "Copiar snippet"
                    : "Copiar URL da API"
              }
            />
            {isValid ? (
              <Link
                href={overlayPath}
                target="_blank"
                className="rounded-lg border border-zinc-600 px-4 py-2 text-sm text-zinc-200 transition hover:border-zinc-400 hover:text-white"
              >
                Ir para o overlay
              </Link>
            ) : null}
          </div>

          {outputTab === "url" && isValid ? (
            <p className="mt-4 text-xs text-zinc-500">
              No OBS: Fonte → Browser → cole a URL → largura ~420px, altura ~220px, fundo
              transparente ativado.
            </p>
          ) : null}

          {outputTab === "iframe" && isValid ? (
            <p className="mt-4 text-xs text-zinc-500">
              Cole o snippet em páginas HTML, widgets de stream ou ferramentas que aceitem embed via
              iframe.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
