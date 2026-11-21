import { ImageResponse } from "next/og";
import { parseShare, slashedText } from "@/lib/share";

/** The share card: "Octavia is defeated", with the numbers. Same input always gives the same image. */
export function GET(request: Request) {
  const card = parseShare(new URL(request.url).searchParams);
  const facts = [slashedText(card.slashed), ...(card.streak > 0 ? [`${card.streak}-day streak`] : [])];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          color: "#f3eefc",
          background: "linear-gradient(135deg, #031322 0%, #0a2540 60%, #3a0d3d 100%)",
        }}
      >
        <div style={{ display: "flex", fontSize: 40, letterSpacing: 8, color: "#ff00c2" }}>TODOCTOPUS</div>

        <div style={{ display: "flex", alignItems: "center", gap: 48 }}>
          <div style={{ display: "flex", fontSize: 220 }}>🐙</div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 84, lineHeight: 1.05, fontWeight: 700 }}>{card.name}</div>
            <div style={{ display: "flex", fontSize: 64, color: "#ff4d00", marginTop: 8 }}>is defeated</div>
            <div style={{ display: "flex", fontSize: 36, marginTop: 28, color: "#c9bfe0" }}>{facts.join("  ·  ")}</div>
          </div>
        </div>

        <div style={{ display: "flex", fontSize: 30, color: "#a99fc4" }}>
          Every task is a tentacle. Slash them all.
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      // The image depends only on the query, so it can be cached for good.
      headers: { "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable" },
    },
  );
}
