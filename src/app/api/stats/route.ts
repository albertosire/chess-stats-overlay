import { NextRequest, NextResponse } from "next/server";
import { parseStatsParams } from "@/lib/chess-com/params";
import { buildStats } from "@/lib/chess-com/stats";
import { ChessApiError } from "@/lib/chess-com/client";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const parsed = parseStatsParams(searchParams);

  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const sessionStartRaw = searchParams.get("sessionStart");
  if (sessionStartRaw) {
    const sessionStart = new Date(sessionStartRaw);
    if (!Number.isNaN(sessionStart.getTime())) {
      parsed.params.from = sessionStart;
      parsed.params.to = new Date();
    }
  }

  try {
    const result = await buildStats(parsed.params);
    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    if (error instanceof ChessApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const message =
      error instanceof Error ? error.message : "Erro inesperado ao buscar estatísticas.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
