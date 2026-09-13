import { NextRequest, NextResponse } from "next/server";
import { normalizeOverlayName } from "@/lib/chess-com/build-url";
import { formatStatsText } from "@/lib/chess-com/format-text";
import { loadStats } from "@/lib/chess-com/load-stats";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const loaded = await loadStats(request.nextUrl.searchParams);

  if ("error" in loaded) {
    return new NextResponse(loaded.error, {
      status: loaded.status,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store, max-age=0",
      },
    });
  }

  const displayName = normalizeOverlayName(request.nextUrl.searchParams.get("name"));

  return new NextResponse(formatStatsText(loaded.result, displayName), {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
