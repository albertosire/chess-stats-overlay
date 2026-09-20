"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  buildAbsoluteUrl,
  buildApiPath,
  buildIframeSnippet,
  buildOverlayPath,
  buildTextApiPath,
  DEFAULT_ACCENT_COLOR,
  DEFAULT_OVERLAY_CONFIG,
  DEFAULT_PRIMARY_COLOR,
  FONT_OPTIONS,
  GAME_TYPE_OPTIONS,
  matchingOverlayPalette,
  MAX_OVERLAY_NAME_LENGTH,
  MAX_REFRESH_SECONDS,
  MIN_REFRESH_SECONDS,
  OVERLAY_PALETTES,
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
import { cn } from "@/lib/utils";

type OutputTab = "url" | "iframe" | "api" | "text";

const inputClass =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground outline-none ring-ring/40 focus:ring-2";
const outlineButtonClass =
  "rounded-lg border border-border px-3 py-1.5 text-sm text-foreground transition hover:border-foreground/40";
const primaryButtonClass =
  "rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40";

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
      className={primaryButtonClass}
    >
      {copied ? "Copiado!" : label}
    </button>
  );
}

function formatSessionStart(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR");
}

function Section({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-[0_1px_0_rgba(26,20,16,0.04)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl text-foreground">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

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

  useEffect(() => {
    if (!hydrated) return;
    const timer = window.setTimeout(() => {
      saveOverlayConfig(config);
    }, 200);
    return () => window.clearTimeout(timer);
  }, [config, hydrated]);

  const errors = useMemo(() => validateOverlayConfig(config), [config]);
  const isValid = errors.length === 0;
  const activePalette = matchingOverlayPalette(config.primaryColor, config.accentColor);

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

  function applyPalette(palette: (typeof OVERLAY_PALETTES)[number]) {
    setConfig((current) => ({
      ...current,
      primaryColor: palette.primary,
      accentColor: palette.accent,
      fontFamily: palette.fontFamily,
    }));
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
    <div className="flex flex-col gap-8">
      <Section
        title="Contas"
        description="A configuração fica neste navegador. Exporte o JSON para backup ou outro PC."
        action={
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={handleExport} className={outlineButtonClass}>
              Exportar JSON
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={outlineButtonClass}
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
        }
      >
        {storageMessage ? (
          <p className="text-xs text-accent">{storageMessage}</p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm font-medium">Site principal</span>
            <select
              value={config.provider ?? "chesscom"}
              onChange={(event) => update("provider", event.target.value as ChessSite)}
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
            <span className="text-sm font-medium">Usuário principal</span>
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
            <span className="text-sm font-medium">Site secundário (opcional)</span>
            <select
              value={config.provider2 ?? "lichess"}
              onChange={(event) => update("provider2", event.target.value as ChessSite)}
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
            <span className="text-sm font-medium">Usuário secundário</span>
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
          <span className="text-sm font-medium">Nome do overlay</span>
          <input
            type="text"
            value={config.name ?? ""}
            maxLength={MAX_OVERLAY_NAME_LENGTH}
            onChange={(event) => update("name", event.target.value)}
            placeholder="ex: Blitz da live"
            className={inputClass}
          />
        </label>
      </Section>

      <Section
        title="Partida"
        description="Modalidade, período da sessão e intervalo de atualização."
      >
        <label className="block space-y-2">
          <span className="text-sm font-medium">Modalidade</span>
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
          <p className="text-xs text-muted-foreground">
            {GAME_TYPE_OPTIONS.find((option) => option.value === config.type)?.hint}
          </p>
        </label>

        {config.type === "manual" ? (
          <label className="block space-y-2">
            <span className="text-sm font-medium">Time control</span>
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
            <span className="text-sm font-medium">Rating inicial</span>
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
          <span className="text-sm font-medium">Período</span>
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
          <p className="text-xs text-muted-foreground">
            {PERIOD_OPTIONS.find((option) => option.value === config.periodMode)?.hint}
          </p>
        </label>

        {config.periodMode === "session" ? (
          <div className="space-y-3 rounded-lg border border-border bg-background/70 px-3 py-3">
            <button type="button" onClick={startCounter} className={primaryButtonClass}>
              {config.sessionStart ? "Reiniciar Contador" : "Iniciar Contador"}
            </button>
            {config.sessionStart ? (
              <p className="text-xs text-muted-foreground">
                Sessão desde {formatSessionStart(config.sessionStart)}. Esse marco vai na URL do
                overlay e não muda se o OBS recarregar a fonte.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                O contador só considera partidas com fim depois deste clique.
              </p>
            )}
          </div>
        ) : null}

        {config.periodMode === "custom" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-medium">De</span>
              <input
                type="date"
                value={config.from ?? ""}
                onChange={(event) => update("from", event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium">Até</span>
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
          <span className="text-sm font-medium">Atualizar a cada {config.refresh}s</span>
          <input
            type="range"
            min={MIN_REFRESH_SECONDS}
            max={MAX_REFRESH_SECONDS}
            step={5}
            value={config.refresh}
            onChange={(event) => update("refresh", Number(event.target.value))}
            className="w-full accent-accent"
          />
        </label>

        {errors.length > 0 ? (
          <ul className="space-y-1 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {errors.map((error) => (
              <li key={error}>• {error}</li>
            ))}
          </ul>
        ) : null}
      </Section>

      <Section
        title="Pré-visualização"
        description="O tabuleiro ao fundo ajuda a ver paletas claras e escuras."
        action={
          isValid ? (
            <Link href={overlayPath} target="_blank" className={outlineButtonClass}>
              Abrir overlay ↗
            </Link>
          ) : null
        }
      >
        <div className="preview-checkered overflow-hidden rounded-xl border border-border p-4">
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
            <div className="flex h-[220px] items-center justify-center rounded-lg bg-primary/55 text-sm text-primary-foreground">
              Preencha os campos obrigatórios para ver a pré-visualização.
            </div>
          )}
        </div>
      </Section>

      <Section title="Exibição" description="Colunas no overlay, alertas e paleta.">
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Colunas e alertas</legend>
          {(
            [
              ["showDelta", "Δ ELO"],
              ["showWinRate", "Win rate %"],
              ["showStreak", "Streak"],
              ["showAlerts", "Alertas de vitória / marco"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={config[key] !== false}
                onChange={(event) => update(key, event.target.checked)}
                className="accent-accent"
              />
              {label}
            </label>
          ))}
        </fieldset>

        <div className="space-y-3">
          <p className="text-sm font-medium">Paleta do overlay</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {OVERLAY_PALETTES.map((palette) => {
              const selected = activePalette?.id === palette.id;
              return (
                <button
                  key={palette.id}
                  type="button"
                  onClick={() => applyPalette(palette)}
                  className={cn(
                    "rounded-xl border px-3 py-3 text-left transition",
                    selected
                      ? "border-foreground ring-2 ring-ring/40"
                      : "border-border hover:border-foreground/40",
                  )}
                >
                  <span
                    className="mb-2 flex h-10 overflow-hidden rounded-md border border-border"
                    aria-hidden="true"
                  >
                    <span className="w-2/3" style={{ background: palette.primary }} />
                    <span className="w-1/3" style={{ background: palette.accent }} />
                  </span>
                  <span className="block text-sm font-medium">{palette.label}</span>
                  <span className="block text-xs text-muted-foreground">{palette.hint}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm">Cor primária</span>
            <input
              type="color"
              value={config.primaryColor ?? DEFAULT_PRIMARY_COLOR}
              onChange={(event) => update("primaryColor", event.target.value)}
              className="h-10 w-full cursor-pointer rounded border border-input bg-background"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm">Cor accent</span>
            <input
              type="color"
              value={config.accentColor ?? DEFAULT_ACCENT_COLOR}
              onChange={(event) => update("accentColor", event.target.value)}
              className="h-10 w-full cursor-pointer rounded border border-input bg-background"
            />
          </label>
        </div>

        <label className="block space-y-2">
          <span className="text-sm">Fonte</span>
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
          <span className="text-sm">URL da logo do patrocinador</span>
          <input
            type="url"
            value={config.logoUrl ?? ""}
            onChange={(event) => update("logoUrl", event.target.value)}
            placeholder="https://…"
            className={inputClass}
          />
          <p className="text-xs text-muted-foreground">Use uma imagem hospedada publicamente.</p>
        </label>
      </Section>

      <Section
        title="Use no OBS"
        description="Copie a URL HTML para Browser Source, o texto puro, ou o JSON da API."
      >
        <div className="flex flex-wrap gap-2">
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
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm transition",
                outputTab === tab
                  ? "bg-primary text-primary-foreground"
                  : "border border-border text-foreground hover:border-foreground/40",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <pre className="max-h-48 overflow-auto rounded-lg bg-primary p-3 text-xs leading-relaxed text-primary-foreground">
          {isValid ? outputValue : "Complete a configuração para gerar o código."}
        </pre>

        <div className="flex flex-wrap gap-3">
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
            <Link href={overlayPath} target="_blank" className={outlineButtonClass}>
              Ir para o overlay
            </Link>
          ) : null}
        </div>

        {outputTab === "url" && isValid ? (
          <p className="text-xs text-muted-foreground">
            No OBS: Fonte → Browser → cole a URL → largura ~420px (ou ~840px com dual), altura
            ~220px, fundo transparente ativado.
          </p>
        ) : null}
      </Section>
    </div>
  );
}
