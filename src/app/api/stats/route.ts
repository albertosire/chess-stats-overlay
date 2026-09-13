import { NextRequest, NextResponse } from "next/server";
import { loadStats } from "@/lib/chess-com/load-stats";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const loaded = await loadStats(request.nextUrl.searchParams);

  if ("error" in loaded) {
    return NextResponse.json({ error: loaded.error }, { status: loaded.status });
  }

  return NextResponse.json(loaded.result, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
