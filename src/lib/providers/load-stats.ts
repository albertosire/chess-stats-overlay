import { ChessApiError } from "@/lib/chess-com/client";
import { parseStatsParams } from "@/lib/chess-com/params";
import type { StatsParams } from "@/lib/chess-com/types";
import {
  applyFreeCap,
  resolveEntitlements,
  type ChessProviderId,
  type NormalizedStatsResult,
  type OverlayEntitlements,
} from "@/lib/providers/types";
import { fetchProviderStats, isChessProviderId } from "@/lib/providers/registry";
import { createAdminClient } from "@/lib/supabase/admin";

function applySessionStart(searchParams: URLSearchParams, params: StatsParams): void {
  const period = searchParams.get("period");
  const sessionStartRaw = searchParams.get("sessionStart");
  if (!sessionStartRaw) return;
  if (period && period !== "session") return;

  const sessionStart = new Date(sessionStartRaw);
  if (Number.isNaN(sessionStart.getTime())) return;

  params.from = sessionStart;
  params.to = new Date();
}

export type OverlayTokenPayload = {
  user_id: string;
  is_pro: boolean;
  config: {
    active_theme_id: string;
    primary_color: string;
    accent_color: string;
    font_family: string;
    show_delta_elo: boolean;
    show_winrate: boolean;
    show_streak: boolean;
    custom_sponsor_logo_url: string | null;
    game_type: string;
    period_mode: string;
    refresh_seconds: number;
    time_control: string | null;
    display_name: string | null;
    primary_provider: ChessProviderId;
    secondary_provider: ChessProviderId | null;
    obs_token: string;
  };
  accounts: Array<{ provider: ChessProviderId; username: string }>;
  owned_themes: string[];
};

export async function resolveOverlayByToken(
  token: string,
): Promise<OverlayTokenPayload | null> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("get_overlay_by_token", {
      p_token: token,
    });
    if (error || !data) return null;
    return data as unknown as OverlayTokenPayload;
  } catch {
    return null;
  }
}

export async function loadStats(
  searchParams: URLSearchParams,
  options?: { entitlements?: OverlayEntitlements; provider?: ChessProviderId },
): Promise<{ result: NormalizedStatsResult } | { error: string; status: number }> {
  const parsed = parseStatsParams(searchParams);
  if ("error" in parsed) {
    return { error: parsed.error, status: 400 };
  }

  applySessionStart(searchParams, parsed.params);

  const providerParam = searchParams.get("provider");
  const provider: ChessProviderId = options?.provider
    ? options.provider
    : isChessProviderId(providerParam)
      ? providerParam
      : "chesscom";

  const entitlements =
    options?.entitlements ??
    resolveEntitlements(false);

  try {
    const raw = await fetchProviderStats(provider, parsed.params);
    return { result: applyFreeCap(raw, entitlements) };
  } catch (error) {
    if (error instanceof ChessApiError) {
      return { error: error.message, status: error.status };
    }

    return {
      error:
        error instanceof Error ? error.message : "Erro inesperado ao buscar estatísticas.",
      status: 500,
    };
  }
}
