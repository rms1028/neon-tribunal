import { ImageResponse } from "next/og";
import { getSupabase } from "@/lib/supabase";
import { getJudgeById } from "@/lib/judges";

export const alt = "NEON COURT 판결문";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function stripViralTag(text: string): string {
  return text.replace(/\n*\[\[VIRAL:\s*.+?\]\]\s*$/, "").trim();
}

function fallbackImage(text: string) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#05050e",
          color: "#888",
          fontSize: 32,
        }}
      >
        {text}
      </div>
    ),
    { width: 1200, height: 630 }
  );
}

export default async function TwitterImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://neon-tribunal.vercel.app";

  let notoFont: ArrayBuffer, oFont: ArrayBuffer, stFont: ArrayBuffer;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let dbResult: { data: any };

  try {
    [notoFont, oFont, stFont, dbResult] = await Promise.all([
      fetch(`${baseUrl}/fonts/NotoSansKR-Bold.woff`).then((r) => r.arrayBuffer()),
      fetch(`${baseUrl}/fonts/Orbitron-Bold.ttf`).then((r) => r.arrayBuffer()),
      fetch(`${baseUrl}/fonts/ShareTechMono-Regular.ttf`).then((r) => r.arrayBuffer()),
      getSupabase().from("verdicts").select("*").eq("id", id).single(),
    ]);
  } catch {
    return fallbackImage("NEON COURT");
  }

  const fontConfig = [
    { name: "Orbitron", data: oFont, weight: 700 as const, style: "normal" as const },
    { name: "ShareTechMono", data: stFont, weight: 400 as const, style: "normal" as const },
    { name: "NotoSansKR", data: notoFont, weight: 700 as const, style: "normal" as const },
  ];

  const data = dbResult.data;

  if (!data) {
    return fallbackImage("판결을 찾을 수 없습니다");
  }

  const judge = getJudgeById(data.judge_id);
  const accentColor = judge?.accentColor || "#00f0ff";
  const glowRgb = judge?.glowRgb || "0,240,255";
  const emoji = judge?.emoji || "\u2696";

  const cleanVerdict = stripViralTag(data.verdict);
  const storySummary =
    data.story.length > 70 ? data.story.slice(0, 70) + "..." : data.story;
  const verdictSummary =
    cleanVerdict.length > 120 ? cleanVerdict.slice(0, 120) + "..." : cleanVerdict;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background:
            "linear-gradient(135deg, #05050e 0%, #0c0c1a 50%, #111125 100%)",
          position: "relative",
          overflow: "hidden",
          padding: "40px 50px",
          fontFamily: "NotoSansKR",
        }}
      >
        {/* Background grid */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(0,240,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,0.03) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
            display: "flex",
          }}
        />

        {/* Accent glow */}
        <div
          style={{
            position: "absolute",
            top: -80,
            right: -40,
            width: 350,
            height: 350,
            borderRadius: "50%",
            background: `radial-gradient(circle, rgba(${glowRgb}, 0.18) 0%, transparent 70%)`,
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -80,
            left: -40,
            width: 300,
            height: 300,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(180,74,255,0.1) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Corner brackets */}
        <div style={{ position: "absolute", top: 20, left: 20, width: 40, height: 40, borderTop: `2px solid rgba(${glowRgb}, 0.4)`, borderLeft: `2px solid rgba(${glowRgb}, 0.4)`, display: "flex" }} />
        <div style={{ position: "absolute", top: 20, right: 20, width: 40, height: 40, borderTop: `2px solid rgba(${glowRgb}, 0.4)`, borderRight: `2px solid rgba(${glowRgb}, 0.4)`, display: "flex" }} />
        <div style={{ position: "absolute", bottom: 20, left: 20, width: 40, height: 40, borderBottom: `2px solid rgba(${glowRgb}, 0.4)`, borderLeft: `2px solid rgba(${glowRgb}, 0.4)`, display: "flex" }} />
        <div style={{ position: "absolute", bottom: 20, right: 20, width: 40, height: 40, borderBottom: `2px solid rgba(${glowRgb}, 0.4)`, borderRight: `2px solid rgba(${glowRgb}, 0.4)`, display: "flex" }} />

        {/* Judge header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 20,
          }}
        >
          <span style={{ fontSize: 52 }}>{emoji}</span>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                fontFamily: "NotoSansKR",
                fontSize: 28,
                fontWeight: 700,
                color: accentColor,
                letterSpacing: "0.05em",
                textShadow: `0 0 20px rgba(${glowRgb}, 0.5)`,
              }}
            >
              {data.judge_name}
            </span>
            <span
              style={{
                fontFamily: "ShareTechMono",
                fontSize: 13,
                color: "#666",
                letterSpacing: "0.15em",
              }}
            >
              NEON COURT VERDICT
            </span>
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            width: "100%",
            height: 1,
            background: `linear-gradient(90deg, rgba(${glowRgb}, 0.5), transparent)`,
            marginBottom: 24,
            display: "flex",
          }}
        />

        {/* Story */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginBottom: 20,
          }}
        >
          <span
            style={{
              fontFamily: "ShareTechMono",
              fontSize: 11,
              color: "#555",
              letterSpacing: "0.2em",
              marginBottom: 8,
            }}
          >
            사연
          </span>
          <span
            style={{
              fontFamily: "NotoSansKR",
              fontSize: 18,
              color: "#999",
              lineHeight: 1.5,
            }}
          >
            &ldquo;{storySummary}&rdquo;
          </span>
        </div>

        {/* Verdict */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
          }}
        >
          <span
            style={{
              fontFamily: "ShareTechMono",
              fontSize: 11,
              color: accentColor,
              letterSpacing: "0.2em",
              marginBottom: 8,
            }}
          >
            판결문
          </span>
          <div
            style={{
              display: "flex",
              borderLeft: `3px solid rgba(${glowRgb}, 0.4)`,
              paddingLeft: 16,
            }}
          >
            <span
              style={{
                fontFamily: "NotoSansKR",
                fontSize: 20,
                color: "#ddd",
                lineHeight: 1.6,
              }}
            >
              {verdictSummary}
            </span>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16, color: "#ff2d95" }}>{"\u2764"}</span>
            <span style={{ fontFamily: "ShareTechMono", fontSize: 14, color: "#888" }}>
              {data.likes}
            </span>
          </div>
          <span
            style={{
              fontFamily: "Orbitron",
              fontSize: 20,
              fontWeight: 700,
              color: "#fff",
              letterSpacing: "0.1em",
              textShadow:
                "0 0 10px rgba(0,240,255,0.8), 0 0 30px rgba(0,240,255,0.4)",
            }}
          >
            NEON COURT
          </span>
        </div>
      </div>
    ),
    { ...size, fonts: fontConfig }
  );
}
