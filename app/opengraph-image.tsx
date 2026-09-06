import { ImageResponse } from "next/og";

/**
 * The site shipped og:title and og:description but no image, so every link shared on WhatsApp,
 * LinkedIn or X rendered as bare text. Generated here rather than committed as a file so it stays
 * in step with the brand and is always the right dimensions.
 */

export const runtime = "nodejs";
export const alt = "ICUBE Media Studio — Premium media production in Dubai";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #1f1f1f 0%, #242424 55%, #14140f 100%)",
          padding: 80,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 14, height: 14, borderRadius: 999, background: "#D4AF37" }} />
          <div
            style={{
              fontSize: 26,
              letterSpacing: 8,
              textTransform: "uppercase",
              color: "#D4AF37",
              fontWeight: 700,
            }}
          >
            ICUBE Media Studio
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 78, fontWeight: 800, color: "#ffffff", lineHeight: 1.05 }}>
            Premium media production
          </div>
          <div style={{ fontSize: 40, color: "#D4AF37", fontWeight: 600 }}>Dubai, UAE</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 28, color: "rgba(255,255,255,0.55)" }}>
            Podcasts · Brand films · Studio rental
          </div>
          <div style={{ fontSize: 26, color: "rgba(255,255,255,0.4)" }}>icubeproduction.com</div>
        </div>

        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 10,
            background: "linear-gradient(90deg, #B8860B 0%, #D4AF37 50%, #E8C547 100%)",
          }}
        />
      </div>
    ),
    size
  );
}
