"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  buildAbsoluteUrl,
  buildApiPath,
  buildIframeSnippet,
  buildOverlayPath,
  buildTextApiPath,
  DEFAULT_OVERLAY_CONFIG,
  FONT_OPTIONS,
  GAME_TYPE_OPTIONS,
  MAX_OVERLAY_NAME_LENGTH,
  MAX_REFRESH_SECONDS,
  MIN_REFRESH_SECONDS,
  PERIOD_OPTIONS,
  validateOverlayConfig,
  type ChessSite,
  type OverlayConfig,
} from "@/lib/chess-com/build-url";
import { PROVIDER_OPTIONS } from "@/lib/providers/registry";
import {
  exportOverlayConfigJson,
  importOverlayConfigJson,
  loadOverlayConfig,
  saveOverlayConfig,
} from "@/lib/overlay/storage";

type OutputTab = "url" | "iframe" | "api" | "text";

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

function formatSessionStart(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR");
}

const inputClass =
  "w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white outline-none ring-emerald-500/40 focus:ring-2";

export function OverlayBuilder() {
  const [config, setConfig] = useState<OverlayConfig>(DEFAULT_OVERLAY_CONFIG);
  const [hydrated, setHydrated] = useState(false);
  const [outputTab, setOutputTab] = useState<OutputTab>("url");
  const [origin, setOrigin] = useState("");
  const [storageMessage, setStorageMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
    setConfig(loadOverlayConfig());
    setHydrated(true);
  }, []);

  // Persist only after hydration; debounce so rapid edits / remounts don't wipe storage.
  useEffect(() => {
    if (!hydrated) return;
    const timer = window.setTimeout(() => {
      saveOverlayConfig(config);
    }, 200);
    return () => window.clearTimeout(timer);
  }, [config, hydrated]);

  const errors = useMemo(() => validateOverlayConfig(config), [config]);
  const isValid = errors.length === 0;

  const overlayPath = buildOverlayPath(config);
  const apiPath = buildApiPath(config);
  const textApiPath = buildTextApiPath(config);
  const overlayUrl = origin ? buildAbsoluteUrl(origin, overlayPath) : overlayPath;
  const apiUrl = origin ? buildAbsoluteUrl(origin, apiPath) : apiPath;
  const textApiUrl = origin ? buildAbsoluteUrl(origin, textApiPath) : textApiPath;
  const iframeSnippet = buildIframeSnippet(overlayUrl);

  const outputValue =
    outputTab === "url"
      ? overlayUrl
      : outputTab === "iframe"
        ? iframeSnippet
        : outputTab === "text"
          ? textApiUrl
          : apiUrl;

  function update<K extends keyof OverlayConfig>(key: K, value: OverlayConfig[K]) {
    setConfig((current) => ({ ...current, [key]: value }));
  }

  function startCounter() {
    update("sessionStart", new Date().toISOString());
  }

  function handleExport() {
    const blob = new Blob([exportOverlayConfigJson(config)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "chess-overlay-config.json";
    anchor.click();
    URL.revokeObjectURL(url);
    setStorageMessage("Configuração exportada.");
  }

  function handleImportFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result ?? "");
        const next = importOverlayConfigJson(text);
        setConfig(next);
        setStorageMessage("Configuração importada.");
      } catch {
        setStorageMessage("JSON inválido. Confira o arquivo e tente de novo.");
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <section className="space-y-5 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
        <div>
          <h2 className="text-xl font-semibold text-white">Monte seu overlay</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Configuração salva automaticamente neste navegador. Exporte o JSON para backup ou
            outro PC. A URL do OBS leva todos os parâmetros na query string.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExport}
            className="rounded-lg border border-zinc-600 px-3 py-1.5 text-sm text-zinc-200 hover:border-zinc-400"
          >
            Exportar JSON
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-lg border border-zinc-600 px-3 py-1.5 text-sm text-zinc-200 hover:border-zinc-400"
          >
            Importar JSON
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) handleImportFile(file);
              event.target.value = "";
            }}
          />
        </div>
        {storageMessage ? (
          <p className="text-xs text-emerald-400">{storageMessage}</p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-zinc-200">Site principal</span>
            <select
              value={config.provider ?? "chesscom"}
              onChange={(event) =>
                update("provider", event.target.value as ChessSite)
              }
              className={inputClass}
            >
              {PROVIDER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-zinc-200">
              Usuário principal
            </span>
            <input
              type="text"
              value={config.username}
              onChange={(event) => update("username", event.target.value)}
              placeholder="ex: hikaru"
              className={inputClass}
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-zinc-200">
              Site secundário (opcional)
            </span>
            <select
              value={config.provider2 ?? "lichess"}
              onChange={(event) =>
                update("provider2", event.target.value as ChessSite)
              }
              className={inputClass}
            >
              {PROVIDER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-zinc-200">
              Usuário secundário
            </span>
            <input
              type="text"
              value={config.username2 ?? ""}
              onChange={(event) => update("username2", event.target.value)}
              placeholder="deixe vazio para um só site"
              className={inputClass}
            />
          </label>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-zinc-200">Nome do overlay</span>
          <input
            type="text"
            value={config.name ?? ""}
            maxLength={MAX_OVERLAY_NAME_LENGTH}
            onChange={(event) => update("name", event.target.value)}
            placeholder="ex: Blitz da live"
            className={inputClass}
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-zinc-200">Modalidade</span>
          <select
            value={config.type}
            onChange={(event) => update("type", event.target.value as OverlayConfig["type"])}
            className={inputClass}
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
              className={inputClass}
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
              className={inputClass}
            />
          </label>
        ) : null}

        <label className="block space-y-2">
          <span className="text-sm font-medium text-zinc-200">Período</span>
          <select
            value={config.periodMode}
            onChange={(event) =>
              update("periodMode", event.target.value as OverlayConfig["periodMode"])
            }
            className={inputClass}
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

        {config.periodMode === "session" ? (
          <div className="space-y-3 rounded-lg border border-zinc-700 bg-zinc-950/70 px-3 py-3">
            <button
              type="button"
              onClick={startCounter}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
            >
              {config.sessionStart ? "Reiniciar Contador" : "Iniciar Contador"}
            </button>
            {config.sessionStart ? (
              <p className="text-xs text-zinc-400">
                Sessão desde {formatSessionStart(config.sessionStart)}. Esse marco vai na URL do
                overlay e não muda se o OBS recarregar a fonte.
              </p>
            ) : (
              <p className="text-xs text-zinc-500">
                O contador só considera partidas com fim depois deste clique.
              </p>
            )}
          </div>
        ) : null}

        {config.periodMode === "custom" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-zinc-200">De</span>
              <input
                type="date"
                value={config.from ?? ""}
                onChange={(event) => update("from", event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-zinc-200">Até</span>
              <input
                type="date"
                value={config.to ?? ""}
                onChange={(event) => update("to", event.target.value)}
                className={inputClass}
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
            min={MIN_REFRESH_SECONDS}
            max={MAX_REFRESH_SECONDS}
            step={5}
            value={config.refresh}
            onChange={(event) => update("refresh", Number(event.target.value))}
            className="w-full accent-emerald-500"
          />
        </label>

        <fieldset className="space-y-2 rounded-lg border border-zinc-700 p-3">
          <legend className="px-1 text-sm font-medium text-zinc-200">Colunas e alertas</legend>
          {(
            [
              ["showDelta", "Δ ELO"],
              ["showWinRate", "Win rate %"],
              ["showStreak", "Streak"],
              ["showAlerts", "Alertas de vitória / marco"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={config[key] !== false}
                onChange={(event) => update(key, event.target.checked)}
                className="accent-emerald-500"
              />
              {label}
            </label>
          ))}
        </fieldset>

        <fieldset className="space-y-3 rounded-lg border border-zinc-700 p-3">
          <legend className="px-1 text-sm font-medium text-zinc-200">Aparência</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm text-zinc-300">Cor primária</span>
              <input
                type="color"
                value={config.primaryColor ?? "#18181b"}
                onChange={(event) => update("primaryColor", event.target.value)}
                className="h-10 w-full cursor-pointer rounded border border-zinc-700 bg-zinc-950"
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm text-zinc-300">Cor accent</span>
              <input
                type="color"
                value={config.accentColor ?? "#22c55e"}
                onChange={(event) => update("accentColor", event.target.value)}
                className="h-10 w-full cursor-pointer rounded border border-zinc-700 bg-zinc-950"
              />
            </label>
          </div>
          <label className="block space-y-2">
            <span className="text-sm text-zinc-300">Fonte</span>
            <select
              value={config.fontFamily ?? "Inter"}
              onChange={(event) => update("fontFamily", event.target.value)}
              className={inputClass}
            >
              {FONT_OPTIONS.map((font) => (
                <option key={font} value={font}>
                  {font}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-2">
            <span className="text-sm text-zinc-300">URL da logo do patrocinador</span>
            <input
              type="url"
              value={config.logoUrl ?? ""}
              onChange={(event) => update("logoUrl", event.target.value)}
              placeholder="https://…"
              className={inputClass}
            />
            <p className="text-xs text-zinc-500">
              Use uma imagem hospedada publicamente.
            </p>
          </label>
        </fieldset>

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
                key={overlayPath}
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
          <h2 className="text-xl font-semibold text-white">Use no OBS</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Copie a URL HTML para Browser Source, o texto puro, ou o JSON da API.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {(
              [
                ["url", "URL do overlay"],
                ["iframe", "Snippet HTML"],
                ["text", "URL de texto"],
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
                    : outputTab === "text"
                      ? "Copiar URL de texto"
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
              No OBS: Fonte → Browser → cole a URL → largura ~420px (ou ~840px com dual), altura
              ~220px, fundo transparente ativado.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
