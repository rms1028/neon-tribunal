import { ImageResponse } from "next/og";
import { getJudgeById } from "@/lib/judges";

function stripViralTag(text: string): string {
  return text.replace(/\n*\[\[VIRAL:\s*.+?\]\]\s*$/, "").trim();
}

interface OgImageParams {
  judgeId: string;
  judgeName: string;
  story: string;
  verdict: string;
  likes: number;
}

export async function generateOgImageBuffer(
  params: OgImageParams
): Promise<Buffer> {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://neon-tribunal.vercel.app";

  const [notoFont, oFont, stFont] = await Promise.all([
    fetch(`${baseUrl}/fonts/NotoSansKR-Bold.woff`).then((r) => r.arrayBuffer()),
    fetch(`${baseUrl}/fonts/Orbitron-Bold.ttf`).then((r) => r.arrayBuffer()),
    fetch(`${baseUrl}/fonts/ShareTechMono-Regular.ttf`).then((r) =>
      r.arrayBuffer()
    ),
  ]);

  const fontConfig = [
    {
      name: "Orbitron",
      data: oFont,
      weight: 700 as const,
      style: "normal" as const,
    },
    {
      name: "ShareTechMono",
      data: stFont,
      weight: 400 as const,
      style: "normal" as const,
    },
    {
      name: "NotoSansKR",
      data: notoFont,
      weight: 700 as const,
      style: "normal" as const,
    },
  ];

  const judge = getJudgeById(params.judgeId);
  const accentColor = judge?.accentColor || "#00f0ff";
  const glowRgb = judge?.glowRgb || "0,240,255";
  const emoji = judge?.emoji || "\u2696";

  const cleanVerdict = stripViralTag(params.verdict);
  const storySummary =
    params.story.length > 70
      ? params.story.slice(0, 70) + "..."
      : params.story;
  const verdictSummary =
    cleanVerdict.length > 120
      ? cleanVerdict.slice(0, 120) + "..."
      : cleanVerdict;

  const size = { width: 1200, height: 630 };

  const response = new ImageResponse(
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
        <div
          style={{
            position: "absolute",
            top: 20,
            left: 20,
            width: 40,
            height: 40,
            borderTop: `2px solid rgba(${glowRgb}, 0.4)`,
            borderLeft: `2px solid rgba(${glowRgb}, 0.4)`,
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 20,
            right: 20,
            width: 40,
            height: 40,
            borderTop: `2px solid rgba(${glowRgb}, 0.4)`,
            borderRight: `2px solid rgba(${glowRgb}, 0.4)`,
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 20,
            left: 20,
            width: 40,
            height: 40,
            borderBottom: `2px solid rgba(${glowRgb}, 0.4)`,
            borderLeft: `2px solid rgba(${glowRgb}, 0.4)`,
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 20,
            right: 20,
            width: 40,
            height: 40,
            borderBottom: `2px solid rgba(${glowRgb}, 0.4)`,
            borderRight: `2px solid rgba(${glowRgb}, 0.4)`,
            display: "flex",
          }}
        />

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
              {params.judgeName}
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

        <div
          style={{
            width: "100%",
            height: 1,
            background: `linear-gradient(90deg, rgba(${glowRgb}, 0.5), transparent)`,
            marginBottom: 24,
            display: "flex",
          }}
        />

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
            <span
              style={{
                fontFamily: "ShareTechMono",
                fontSize: 14,
                color: "#888",
              }}
            >
              {params.likes}
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

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
