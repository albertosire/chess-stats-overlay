"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { HeroPreview } from "@/components/landing/HeroPreview";
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
import type { Dictionary, Locale } from "@/lib/i18n";

type BuilderCopy = Dictionary["builder"];
type OutputTab = "iframe" | "api" | "text";

const inputClass =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground outline-none ring-ring/40 focus:ring-2";
const outlineButtonClass =
  "rounded-lg border border-border px-3 py-1.5 text-sm text-foreground transition hover:border-foreground/40";
const primaryButtonClass =
  "rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40";

function CopyButton({
  value,
  label,
  copiedLabel,
  disabled,
  describedBy,
}: {
  value: string;
  label: string;
  copiedLabel: string;
  disabled?: boolean;
  describedBy?: string;
}) {
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
      aria-describedby={describedBy}
      className={primaryButtonClass}
    >
      {copied ? copiedLabel : label}
    </button>
  );
}

function formatSessionStart(iso: string, locale: Locale): string {
  return new Date(iso).toLocaleString(locale);
}

function Section({
  id,
  title,
  description,
  children,
}: {
  id?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-6 space-y-5 rounded-2xl border border-border bg-card p-6 shadow-[0_1px_0_rgba(26,20,16,0.04)]"
    >
      <div>
        <h2 className="font-serif text-2xl text-foreground">{title}</h2>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function OverlayBuilder({
  copy,
  locale,
  title,
  demo,
}: {
  copy: BuilderCopy;
  locale: Locale;
  title: string;
  demo: {
    labels: Dictionary["demo"]["labels"];
    title: string;
    caption: string;
  };
}) {
  const [config, setConfig] = useState<OverlayConfig>(DEFAULT_OVERLAY_CONFIG);
  const [hydrated, setHydrated] = useState(false);
  const [outputTab, setOutputTab] = useState<OutputTab>("iframe");
  const [origin, setOrigin] = useState("");
  const [storageMessage, setStorageMessage] = useState<string | null>(null);
  const [livePath, setLivePath] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editedRef = useRef(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setOrigin(window.location.origin);
      setConfig((current) => (editedRef.current ? current : loadOverlayConfig()));
      setHydrated(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const timer = window.setTimeout(() => {
      saveOverlayConfig(config);
    }, 200);
    return () => window.clearTimeout(timer);
  }, [config, hydrated]);

  const errors = useMemo(() => validateOverlayConfig(config), [config]);
  const fieldErrors = errors.filter((error) => error !== "missing_username");
  const canCopy = config.username.trim().length > 0;
  const activePalette = matchingOverlayPalette(config.primaryColor, config.accentColor);

  const overlayPath = buildOverlayPath(config);
  const apiPath = buildApiPath(config);
  const textApiPath = buildTextApiPath(config);
  const overlayUrl = origin ? buildAbsoluteUrl(origin, overlayPath) : overlayPath;
  const apiUrl = origin ? buildAbsoluteUrl(origin, apiPath) : apiPath;
  const textApiUrl = origin ? buildAbsoluteUrl(origin, textApiPath) : textApiPath;
  const iframeSnippet = buildIframeSnippet(overlayUrl);

  const outputValue =
    outputTab === "iframe" ? iframeSnippet : outputTab === "text" ? textApiUrl : apiUrl;

  useEffect(() => {
    if (!canCopy) return;
    const timer = window.setTimeout(() => setLivePath(overlayPath), 300);
    return () => window.clearTimeout(timer);
  }, [canCopy, overlayPath]);

  function update<K extends keyof OverlayConfig>(key: K, value: OverlayConfig[K]) {
    editedRef.current = true;
    setConfig((current) => ({ ...current, [key]: value }));
  }

  function startCounter() {
    update("sessionStart", new Date().toISOString());
  }

  function applyPalette(palette: (typeof OVERLAY_PALETTES)[number]) {
    editedRef.current = true;
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
    setStorageMessage(copy.exported);
  }

  function handleImportFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result ?? "");
        const next = importOverlayConfigJson(text);
        editedRef.current = true;
        setConfig(next);
        setStorageMessage(copy.imported);
      } catch {
        setStorageMessage(copy.importInvalid);
      }
    };
    reader.readAsText(file);
  }

  const showLive = canCopy && livePath.includes("username=");

  const previewPanel = (
    <aside id="preview" className="scroll-mt-6 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
      <div className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-[0_1px_0_rgba(26,20,16,0.04)]">
        <div>
          <h2 className="font-serif text-2xl text-foreground">{copy.previewTitle}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{copy.previewDescription}</p>
        </div>

        <div className="preview-checkered overflow-hidden rounded-xl border border-border p-4">
          {showLive ? (
            <iframe
              key={livePath}
              src={livePath}
              title={copy.previewFrameTitle}
              width="100%"
              height="220"
              className="border-0 bg-transparent"
              style={{ background: "transparent" }}
            />
          ) : (
            <div className="overflow-x-auto">
              <HeroPreview locale={locale} labels={demo.labels} title={demo.title} />
            </div>
          )}
        </div>

        {showLive ? null : <p className="text-sm text-muted-foreground">{demo.caption}</p>}

        {canCopy ? (
          <pre className="max-h-32 overflow-auto rounded-lg bg-primary p-3 text-xs leading-relaxed break-all whitespace-pre-wrap text-primary-foreground">
            {overlayUrl}
          </pre>
        ) : (
          <p id="copy-url-lock" className="text-sm text-foreground">
            {copy.previewEmpty}
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <CopyButton
            value={canCopy ? overlayUrl : ""}
            disabled={!canCopy}
            describedBy={canCopy ? undefined : "copy-url-lock"}
            copiedLabel={copy.copied}
            label={copy.copyUrl}
          />
          {canCopy ? (
            <Link href={overlayPath} target="_blank" className={outlineButtonClass}>
              {copy.openOverlay}
            </Link>
          ) : null}
        </div>

        {canCopy ? <p className="text-xs text-muted-foreground">{copy.obsHint}</p> : null}

        <details className="rounded-xl border border-border bg-background/70 px-3 py-2">
          <summary className="cursor-pointer py-1 text-sm font-medium text-foreground">
            {copy.moreFormats}
          </summary>
          <div className="space-y-4 pt-3">
            <label className="block space-y-2">
              <span className="text-sm">{copy.logoUrl}</span>
              <input
                type="url"
                value={config.logoUrl ?? ""}
                onChange={(event) => update("logoUrl", event.target.value)}
                placeholder="https://…"
                className={inputClass}
              />
              <p className="text-xs text-muted-foreground">{copy.logoHint}</p>
            </label>

            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["iframe", copy.tabIframe],
                  ["text", copy.tabText],
                  ["api", copy.tabApi],
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

            <pre className="max-h-48 overflow-auto rounded-lg bg-primary p-3 text-xs leading-relaxed break-all whitespace-pre-wrap text-primary-foreground">
              {canCopy ? outputValue : copy.outputEmpty}
            </pre>

            <CopyButton
              value={canCopy ? outputValue : ""}
              disabled={!canCopy}
              describedBy={canCopy ? undefined : "copy-url-lock"}
              copiedLabel={copy.copied}
              label={
                outputTab === "iframe"
                  ? copy.copySnippet
                  : outputTab === "text"
                    ? copy.copyText
                    : copy.copyApi
              }
            />
          </div>
        </details>
      </div>
    </aside>
  );

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-6 py-8 lg:grid-cols-[minmax(0,1fr)_24rem]">
      <div className="contents lg:block lg:min-w-0 lg:space-y-8">
        <div className="order-1 space-y-8">
          <h1 className="font-serif text-4xl text-foreground">{title}</h1>
          <Section id="accounts" title={copy.accountsTitle} description={copy.accountsDescription}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-medium">{copy.primaryUser}</span>
                <input
                  type="text"
                  value={config.username}
                  onChange={(event) => update("username", event.target.value)}
                  placeholder={copy.primaryUserPlaceholder}
                  className={inputClass}
                  autoComplete="off"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium">{copy.primarySite}</span>
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
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-medium">{copy.secondaryUser}</span>
                <input
                  type="text"
                  value={config.username2 ?? ""}
                  onChange={(event) => update("username2", event.target.value)}
                  placeholder={copy.secondaryUserPlaceholder}
                  className={inputClass}
                  autoComplete="off"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium">{copy.secondarySite}</span>
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
            </div>
          </Section>
        </div>

        <div className="order-3 space-y-8">
          <Section title={copy.matchTitle} description={copy.matchDescription}>
            <label className="block space-y-2">
              <span className="text-sm font-medium">{copy.mode}</span>
              <select
                value={config.type}
                onChange={(event) => update("type", event.target.value as OverlayConfig["type"])}
                className={inputClass}
              >
                {GAME_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {copy.gameTypes[option.value].label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">{copy.gameTypes[config.type].hint}</p>
            </label>

            {config.type === "manual" ? (
              <label className="block space-y-2">
                <span className="text-sm font-medium">{copy.timeControl}</span>
                <input
                  type="text"
                  value={config.timeControl ?? ""}
                  onChange={(event) => update("timeControl", event.target.value)}
                  placeholder={copy.timeControlPlaceholder}
                  className={inputClass}
                />
              </label>
            ) : null}

            {config.type === "puzzles" ? (
              <label className="block space-y-2">
                <span className="text-sm font-medium">{copy.initialRating}</span>
                <input
                  type="number"
                  value={config.initialRating ?? ""}
                  onChange={(event) => update("initialRating", event.target.value)}
                  placeholder={copy.initialRatingPlaceholder}
                  className={inputClass}
                />
              </label>
            ) : null}

            <label className="block space-y-2">
              <span className="text-sm font-medium">{copy.period}</span>
              <select
                value={config.periodMode}
                onChange={(event) =>
                  update("periodMode", event.target.value as OverlayConfig["periodMode"])
                }
                className={inputClass}
              >
                {PERIOD_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {copy.periods[option.value].label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">{copy.periods[config.periodMode].hint}</p>
            </label>

            {config.periodMode === "session" ? (
              <div className="space-y-3 rounded-lg border border-border bg-background/70 px-3 py-3">
                <button type="button" onClick={startCounter} className={primaryButtonClass}>
                  {config.sessionStart ? copy.restartCounter : copy.startCounter}
                </button>
                {config.sessionStart ? (
                  <p className="text-xs text-muted-foreground">
                    {copy.sessionSince.replace(
                      "{time}",
                      formatSessionStart(config.sessionStart, locale),
                    )}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">{copy.sessionHint}</p>
                )}
              </div>
            ) : null}

            {config.periodMode === "custom" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block space-y-2">
                  <span className="text-sm font-medium">{copy.from}</span>
                  <input
                    type="date"
                    value={config.from ?? ""}
                    onChange={(event) => update("from", event.target.value)}
                    className={inputClass}
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium">{copy.to}</span>
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
              <span className="text-sm font-medium">
                {copy.refreshEvery.replace("{seconds}", String(config.refresh))}
              </span>
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

            {fieldErrors.length > 0 ? (
              <ul className="space-y-1 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {fieldErrors.map((error) => (
                  <li key={error}>
                    • {copy.errors[error].replace("{seconds}", String(MIN_REFRESH_SECONDS))}
                  </li>
                ))}
              </ul>
            ) : null}
          </Section>

          <Section id="display" title={copy.displayTitle} description={copy.displayDescription}>
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">{copy.columnsLegend}</legend>
              {(
                [
                  ["showDelta", copy.showDelta],
                  ["showWinRate", copy.showWinRate],
                  ["showStreak", copy.showStreak],
                  ["showAlerts", copy.showAlerts],
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
              <p className="text-sm font-medium">{copy.palette}</p>
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
                      <span className="block text-sm font-medium">
                        {copy.palettes[palette.id].label}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {copy.palettes[palette.id].hint}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm">{copy.primaryColor}</span>
                <input
                  type="color"
                  value={config.primaryColor ?? DEFAULT_PRIMARY_COLOR}
                  onChange={(event) => update("primaryColor", event.target.value)}
                  className="h-10 w-full cursor-pointer rounded border border-input bg-background"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm">{copy.accentColor}</span>
                <input
                  type="color"
                  value={config.accentColor ?? DEFAULT_ACCENT_COLOR}
                  onChange={(event) => update("accentColor", event.target.value)}
                  className="h-10 w-full cursor-pointer rounded border border-input bg-background"
                />
              </label>
            </div>

            <label className="block space-y-2">
              <span className="text-sm">{copy.font}</span>
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
          </Section>

          <details className="rounded-2xl border border-border bg-card p-6 shadow-[0_1px_0_rgba(26,20,16,0.04)]">
            <summary className="cursor-pointer font-serif text-2xl text-foreground">
              {copy.advancedTitle}
            </summary>
            <div className="mt-4 space-y-4">
              <p className="text-sm text-muted-foreground">{copy.advancedDescription}</p>
              {storageMessage ? <p className="text-xs text-accent">{storageMessage}</p> : null}
              <label className="block space-y-2">
                <span className="text-sm font-medium">{copy.overlayName}</span>
                <input
                  type="text"
                  value={config.name ?? ""}
                  maxLength={MAX_OVERLAY_NAME_LENGTH}
                  onChange={(event) => update("name", event.target.value)}
                  placeholder={copy.overlayNamePlaceholder}
                  className={inputClass}
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={handleExport} className={outlineButtonClass}>
                  {copy.exportJson}
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={outlineButtonClass}
                >
                  {copy.importJson}
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
            </div>
          </details>
        </div>
      </div>

      <div className="order-2 min-w-0 lg:order-none">
        <div className="lg:sticky lg:top-4">{previewPanel}</div>
      </div>
    </div>
  );
}
