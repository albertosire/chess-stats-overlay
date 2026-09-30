import { ImageResponse } from "next/og";

export const alt = "ChesStats — live chess statistics overlay for OBS";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const title =
    locale === "pt-BR"
      ? "Estatísticas de xadrez ao vivo para o OBS"
      : "Live chess stats for OBS";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#1a1410",
          color: "#f4ede3",
          padding: "64px",
        }}
      >
        <div style={{ display: "flex", fontSize: 28, letterSpacing: 6, color: "#c4a574" }}>
          CHESSTATS
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 64, lineHeight: 1.1, maxWidth: 900 }}>{title}</div>
          <div style={{ display: "flex", marginTop: 28, fontSize: 28, color: "#c4a574" }}>
            Chess.com · Lichess · Free
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
