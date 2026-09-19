import { NextRequest, NextResponse } from "next/server";
import { loadStats, resolveOverlayByToken } from "@/lib/providers/load-stats";
import { resolveEntitlements } from "@/lib/providers/types";
import { isChessProviderId } from "@/lib/providers/registry";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = new URLSearchParams(request.nextUrl.searchParams);
  const token = searchParams.get("token");

  let entitlements = resolveEntitlements(false);

  if (token) {
    const overlay = await resolveOverlayByToken(token);
    if (!overlay) {
      return NextResponse.json({ error: "Token OBS inválido." }, { status: 404 });
    }

    entitlements = resolveEntitlements(overlay.is_pro, {
      show_delta_elo: overlay.config.show_delta_elo,
      show_winrate: overlay.config.show_winrate,
      show_streak: overlay.config.show_streak,
      active_theme_id: overlay.config.active_theme_id,
      custom_sponsor_logo_url: overlay.config.custom_sponsor_logo_url,
    });

    const providerParam = searchParams.get("provider");
    if (!isChessProviderId(providerParam)) {
      searchParams.set("provider", overlay.config.primary_provider);
    } else if (
      providerParam !== overlay.config.primary_provider &&
      !entitlements.allowDualProvider
    ) {
      searchParams.set("provider", overlay.config.primary_provider);
    }

    if (!searchParams.get("username")) {
      const provider = isChessProviderId(searchParams.get("provider"))
        ? searchParams.get("provider")!
        : overlay.config.primary_provider;
      const account = overlay.accounts.find((item) => item.provider === provider);
      if (account) {
        searchParams.set("username", account.username);
      }
    }

    if (!searchParams.get("type")) {
      searchParams.set("type", overlay.config.game_type);
    }
    if (!searchParams.get("period") && !searchParams.get("from")) {
      searchParams.set("period", overlay.config.period_mode);
    }
    if (overlay.config.time_control && !searchParams.get("timeControl")) {
      searchParams.set("timeControl", overlay.config.time_control);
    }
  } else {
    searchParams.delete("show_delta");
    searchParams.delete("show_winrate");
    searchParams.delete("show_streak");
  }

  const loaded = await loadStats(searchParams, { entitlements });

  if ("error" in loaded) {
    return NextResponse.json({ error: loaded.error }, { status: loaded.status });
  }

  return NextResponse.json(
    {
      ...loaded.result,
      entitlements: {
        isPro: entitlements.isPro,
        showDeltaElo: entitlements.showDeltaElo,
        showWinRate: entitlements.showWinRate,
        showStreak: entitlements.showStreak,
        showCurrentRating: entitlements.showCurrentRating,
      },
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
