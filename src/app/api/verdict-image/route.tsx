/* eslint-disable react-hooks/error-boundaries */
import { ImageResponse } from "next/og";
import { NextRequest, NextResponse } from "next/server";
import { judges } from "@/lib/judges";

export const runtime = "edge";

interface SingleRequest {
  mode: "single";
  judgeId: string;
  judgeName: string;
  verdict: string;
}

interface FullCourtRequest {
  mode: "full-court";
  results: Array<{
    judgeId: string;
    judgeName: string;
    verdict: string;
  }>;
}

type VerdictImageRequest = SingleRequest | FullCourtRequest;

const MAX_VERDICT_SINGLE = 400;
const MAX_VERDICT_FULLCOURT = 120;

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max) + "...";
}

// Corner bracket component reused across layouts
function CornerBrackets({ color, size = 50, inset = 30 }: { color: string; size?: number; inset?: number }) {
  const s = { width: size, height: size, display: "flex" as const, position: "absolute" as const };
  const b = `2px solid ${color}`;
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex" }}>
      <div style={{ ...s, top: inset, left: inset, borderTop: b, borderLeft: b }} />
      <div style={{ ...s, top: inset, right: inset, borderTop: b, borderRight: b }} />
      <div style={{ ...s, bottom: inset, left: inset, borderBottom: b, borderLeft: b }} />
      <div style={{ ...s, bottom: inset, right: inset, borderBottom: b, borderRight: b }} />
    </div>
  );
}

function SingleVerdictCard({ judgeId, judgeName, verdict }: { judgeId: string; judgeName: string; verdict: string }) {
  const judge = judges.find((j) => j.id === judgeId);
  if (!judge) return null;

  const text = truncate(verdict, MAX_VERDICT_SINGLE);
  const c = judge.accentColor;
  const rgb = judge.glowRgb;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #05050e 0%, #0c0c1a 50%, #111125 100%)",
        position: "relative",
        overflow: "hidden",
        padding: 60,
      }}
    >
      {/* Grid overlay */}
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

      {/* Glow orbs */}
      <div
        style={{
          position: "absolute",
          top: -120,
          right: -60,
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(${rgb},0.15) 0%, transparent 70%)`,
          display: "flex",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -120,
          left: -60,
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(${rgb},0.08) 0%, transparent 70%)`,
          display: "flex",
        }}
      />

      {/* Corner brackets */}
      <CornerBrackets color={`rgba(${rgb},0.4)`} />

      {/* App title */}
      <div
        style={{
          fontSize: 36,
          fontWeight: 900,
          fontFamily: "Orbitron",
          color: "#ffffff",
          letterSpacing: "0.1em",
          display: "flex",
          marginBottom: 6,
          textShadow: `0 0 10px rgba(${rgb},0.8), 0 0 40px rgba(${rgb},0.4)`,
        }}
      >
        NEON COURT
      </div>
      <div
        style={{
          fontSize: 20,
          fontWeight: 700,
          fontFamily: "NotoSansKR",
          color: "#e0e0f0",
          letterSpacing: "0.08em",
          display: "flex",
          marginBottom: 28,
        }}
      >
        전국민 고민 재판소
      </div>

      {/* Divider */}
      <div
        style={{
          width: 500,
          height: 1,
          display: "flex",
          marginBottom: 36,
          background: `linear-gradient(90deg, transparent, rgba(${rgb},0.5), transparent)`,
        }}
      />

      {/* Verdict card panel */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          background: "rgba(8,8,24,0.85)",
          border: `1px solid rgba(${rgb},0.3)`,
          borderRadius: 4,
          padding: "36px 40px",
          boxShadow: `0 0 30px rgba(${rgb},0.15), inset 0 0 30px rgba(${rgb},0.03)`,
        }}
      >
        {/* Judge header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 24,
            paddingBottom: 20,
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <span style={{ fontSize: 52 }}>{judge.emoji}</span>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                fontFamily: "NotoSansKR",
                fontSize: 24,
                fontWeight: 700,
                color: c,
                letterSpacing: "0.05em",
                textShadow: `0 0 10px rgba(${rgb},0.5)`,
              }}
            >
              {judgeName}
            </span>
            <span
              style={{
                fontFamily: "ShareTechMono",
                fontSize: 13,
                color: "#555",
                letterSpacing: "0.15em",
              }}
            >
              {">"} {judge.subtitle} // VERDICT_RENDERED
            </span>
          </div>
        </div>

        {/* Verdict text */}
        <div
          style={{
            fontFamily: "NotoSansKR",
            fontSize: 22,
            color: "#d0d0e8",
            lineHeight: 1.75,
            display: "flex",
            overflowWrap: "break-word",
          }}
        >
          {text}
        </div>
      </div>

      {/* Bottom branding */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginTop: 36,
        }}
      >
        <span style={{ fontSize: 20 }}>&#9878;</span>
        <span
          style={{
            fontFamily: "ShareTechMono",
            fontSize: 13,
            color: "#444",
            letterSpacing: "0.2em",
          }}
        >
          NEON COURT SYSTEM © 2026
        </span>
      </div>
    </div>
  );
}

function FullCourtCard({
  results,
}: {
  results: Array<{ judgeId: string; judgeName: string; verdict: string }>;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        background: "linear-gradient(135deg, #05050e 0%, #0c0c1a 50%, #111125 100%)",
        position: "relative",
        overflow: "hidden",
        padding: "50px 50px 40px",
      }}
    >
      {/* Grid overlay */}
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

      {/* Multi-color glow orbs */}
      <div
        style={{
          position: "absolute",
          top: -100,
          left: -50,
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,240,255,0.1) 0%, transparent 70%)",
          display: "flex",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -100,
          right: -50,
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(180,74,255,0.1) 0%, transparent 70%)",
          display: "flex",
        }}
      />

      {/* Corner brackets */}
      <CornerBrackets color="rgba(0,240,255,0.3)" size={40} inset={24} />

      {/* Header */}
      <div
        style={{
          fontSize: 32,
          fontWeight: 900,
          fontFamily: "Orbitron",
          color: "#ffffff",
          letterSpacing: "0.1em",
          display: "flex",
          marginBottom: 4,
          textShadow: "0 0 10px rgba(0,240,255,0.8), 0 0 40px rgba(0,240,255,0.4)",
        }}
      >
        NEON COURT
      </div>
      <div
        style={{
          fontSize: 16,
          fontFamily: "NotoSansKR",
          fontWeight: 700,
          color: "#e0e0f0",
          letterSpacing: "0.08em",
          display: "flex",
          marginBottom: 20,
        }}
      >
        전원 재판 결과
      </div>

      {/* Divider */}
      <div
        style={{
          width: 400,
          height: 1,
          display: "flex",
          marginBottom: 24,
          background:
            "linear-gradient(90deg, transparent, rgba(0,240,255,0.5), rgba(180,74,255,0.5), transparent)",
        }}
      />

      {/* 2x2 Grid */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 16,
          width: "100%",
          flex: 1,
        }}
      >
        {results.slice(0, 4).map((r) => {
          const judge = judges.find((j) => j.id === r.judgeId);
          if (!judge) return null;
          const rgb = judge.glowRgb;
          const text = truncate(r.verdict, MAX_VERDICT_FULLCOURT);

          return (
            <div
              key={r.judgeId}
              style={{
                display: "flex",
                flexDirection: "column",
                width: "calc(50% - 8px)",
                background: "rgba(8,8,24,0.85)",
                border: `1px solid rgba(${rgb},0.3)`,
                borderRadius: 4,
                padding: "20px 22px",
                boxShadow: `0 0 20px rgba(${rgb},0.1)`,
                position: "relative",
              }}
            >
              {/* Judge header */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <span style={{ fontSize: 32 }}>{judge.emoji}</span>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span
                    style={{
                      fontFamily: "NotoSansKR",
                      fontSize: 16,
                      fontWeight: 700,
                      color: judge.accentColor,
                      textShadow: `0 0 8px rgba(${rgb},0.4)`,
                    }}
                  >
                    {r.judgeName}
                  </span>
                  <span
                    style={{
                      fontFamily: "ShareTechMono",
                      fontSize: 10,
                      color: "#555",
                      letterSpacing: "0.15em",
                    }}
                  >
                    {judge.subtitle}
                  </span>
                </div>
              </div>

              {/* Verdict excerpt */}
              <div
                style={{
                  fontFamily: "NotoSansKR",
                  fontSize: 15,
                  color: "#c0c0d8",
                  lineHeight: 1.65,
                  display: "flex",
                  overflowWrap: "break-word",
                }}
              >
                {text}
              </div>

              {/* Mini corner accents */}
              <div
                style={{
                  position: "absolute",
                  top: 8,
                  right: 10,
                  width: 12,
                  height: 12,
                  borderTop: `1px solid rgba(${rgb},0.3)`,
                  borderRight: `1px solid rgba(${rgb},0.3)`,
                  display: "flex",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: 8,
                  left: 10,
                  width: 12,
                  height: 12,
                  borderBottom: `1px solid rgba(${rgb},0.3)`,
                  borderLeft: `1px solid rgba(${rgb},0.3)`,
                  display: "flex",
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Bottom branding */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginTop: 20,
        }}
      >
        <span style={{ fontSize: 18 }}>&#9878;</span>
        <span
          style={{
            fontFamily: "ShareTechMono",
            fontSize: 12,
            color: "#444",
            letterSpacing: "0.2em",
          }}
        >
          NEON COURT SYSTEM © 2026
        </span>
      </div>
    </div>
  );
}

// Edge-compatible in-memory rate limiter
const imageRateLimitStore = new Map<string, number[]>();
const IMAGE_RATE_LIMIT = { windowMs: 60_000, max: 15 };

function checkImageRateLimit(req: NextRequest): Response | null {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const now = Date.now();
  const timestamps = (imageRateLimitStore.get(ip) || []).filter(
    (t) => now - t < IMAGE_RATE_LIMIT.windowMs
  );

  if (timestamps.length >= IMAGE_RATE_LIMIT.max) {
    const retryAfter = Math.ceil(
      (IMAGE_RATE_LIMIT.windowMs - (now - timestamps[0])) / 1000
    );
    return new Response(
      JSON.stringify({ error: `요청이 너무 많습니다. ${retryAfter}초 후에 다시 시도해주세요.` }),
      { status: 429, headers: { "Content-Type": "application/json", "Retry-After": String(retryAfter) } }
    );
  }

  timestamps.push(now);
  imageRateLimitStore.set(ip, timestamps);
  return null;
}

export async function POST(req: NextRequest) {
  // Rate limiting
  const rateLimitResponse = checkImageRateLimit(req);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = (await req.json()) as VerdictImageRequest;

    // Validate
    if (!body.mode || (body.mode !== "single" && body.mode !== "full-court")) {
      return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
    }

    if (body.mode === "single") {
      if (!body.judgeId || !body.verdict) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }
      if (!judges.find((j) => j.id === body.judgeId)) {
        return NextResponse.json({ error: "Invalid judge" }, { status: 400 });
      }
    } else {
      if (!body.results || body.results.length === 0) {
        return NextResponse.json({ error: "No results provided" }, { status: 400 });
      }
    }

    // Load fonts
    const baseUrl = new URL(req.url).origin;
    const [orbitronFont, shareTechFont, notoSansFont] = await Promise.all([
      fetch(`${baseUrl}/fonts/Orbitron-Bold.ttf`).then((r) => r.arrayBuffer()),
      fetch(`${baseUrl}/fonts/ShareTechMono-Regular.ttf`).then((r) => r.arrayBuffer()),
      fetch(`${baseUrl}/fonts/NotoSansKR-Bold.woff`).then((r) => r.arrayBuffer()),
    ]);

    const size = { width: 1080, height: 1350 };

    const element =
      body.mode === "single" ? (
        <SingleVerdictCard judgeId={body.judgeId} judgeName={body.judgeName} verdict={body.verdict} />
      ) : (
        <FullCourtCard results={body.results} />
      );

    return new ImageResponse(element, {
      ...size,
      fonts: [
        { name: "Orbitron", data: orbitronFont, weight: 700 as const, style: "normal" as const },
        { name: "ShareTechMono", data: shareTechFont, weight: 400 as const, style: "normal" as const },
        { name: "NotoSansKR", data: notoSansFont, weight: 700 as const, style: "normal" as const },
      ],
    });
  } catch (err) {
    console.error("Verdict image generation error:", err);
    return NextResponse.json({ error: "Image generation failed" }, { status: 500 });
  }
}
