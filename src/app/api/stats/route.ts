import { NextRequest, NextResponse } from "next/server";
import { loadStats } from "@/lib/providers/load-stats";
import { entitlementsFromSearchParams } from "@/lib/overlay/display";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = new URLSearchParams(request.nextUrl.searchParams);
  const entitlements = entitlementsFromSearchParams(searchParams);

  const loaded = await loadStats(searchParams);

  if ("error" in loaded) {
    return NextResponse.json({ error: loaded.error }, { status: loaded.status });
  }

  return NextResponse.json(
    {
      ...loaded.result,
      entitlements: {
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
