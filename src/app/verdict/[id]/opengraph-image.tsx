import { ImageResponse } from "next/og";
import { getSupabase } from "@/lib/supabase";
import { getJudgeById } from "@/lib/judges";

export const runtime = "edge";
export const alt = "NEON COURT 판결문";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data } = await getSupabase()
    .from("verdicts")
    .select("*")
    .eq("id", id)
    .single();

  if (!data) {
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
          판결을 찾을 수 없습니다
        </div>
      ),
      { ...size }
    );
  }

  const judge = getJudgeById(data.judge_id);
  const accentColor = judge?.accentColor || "#00f0ff";
  const glowRgb = judge?.glowRgb || "0,240,255";
  const emoji = judge?.emoji || "\u2696";

  const storySummary =
    data.story.length > 80 ? data.story.slice(0, 80) + "..." : data.story;
  const verdictSummary =
    data.verdict.length > 120
      ? data.verdict.slice(0, 120) + "..."
      : data.verdict;

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
            background: `radial-gradient(circle, rgba(${glowRgb}, 0.15) 0%, transparent 70%)`,
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
                fontSize: 28,
                fontWeight: 900,
                color: accentColor,
                letterSpacing: "0.05em",
                textShadow: `0 0 20px rgba(${glowRgb}, 0.5)`,
              }}
            >
              {data.judge_name}
            </span>
            <span
              style={{
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
            <span style={{ fontSize: 14, color: "#888" }}>{data.likes}</span>
          </div>
          <span
            style={{
              fontSize: 20,
              fontWeight: 900,
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
    { ...size }
  );
}
