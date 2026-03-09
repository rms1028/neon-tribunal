import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "전국민 고민 재판소: 네온즈 | NEON COURT";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function TwitterImage() {
  return new ImageResponse(
    (
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

        {/* Glows */}
        <div
          style={{
            position: "absolute",
            top: -80,
            left: 100,
            width: 350,
            height: 350,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(180,74,255,0.15) 0%, transparent 70%)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -80,
            right: 100,
            width: 350,
            height: 350,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(0,240,255,0.12) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Gavel */}
        <div style={{ fontSize: 72, marginBottom: 12, display: "flex" }}>
          &#9878;
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 48,
            fontWeight: 900,
            color: "#ffffff",
            textAlign: "center",
            letterSpacing: "0.05em",
            textShadow:
              "0 0 10px rgba(0,240,255,1), 0 0 40px rgba(0,240,255,0.6)",
            display: "flex",
            marginBottom: 8,
          }}
        >
          NEON COURT
        </div>

        <div
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: "#e0e0f0",
            letterSpacing: "0.1em",
            marginBottom: 20,
            display: "flex",
          }}
        >
          전국민 고민 재판소: 네온즈
        </div>

        {/* Divider */}
        <div
          style={{
            width: 300,
            height: 1,
            background:
              "linear-gradient(90deg, transparent, rgba(0,240,255,0.5), rgba(180,74,255,0.5), transparent)",
            marginBottom: 20,
            display: "flex",
          }}
        />

        {/* Judge emojis row */}
        <div style={{ display: "flex", gap: 24, marginBottom: 20 }}>
          <span style={{ fontSize: 32 }}>🤖</span>
          <span style={{ fontSize: 32 }}>💗</span>
          <span style={{ fontSize: 32 }}>🔥</span>
          <span style={{ fontSize: 32 }}>🕵️</span>
        </div>

        <div
          style={{
            fontSize: 16,
            color: "#888",
            letterSpacing: "0.15em",
            display: "flex",
          }}
        >
          4명의 AI 판사에게 판결을 받아보세요
        </div>
      </div>
    ),
    { ...size }
  );
}
