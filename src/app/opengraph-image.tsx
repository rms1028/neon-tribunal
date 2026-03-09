import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "전국민 고민 재판소: 네온즈 | NEON COURT";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
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

        {/* Top-left glow */}
        <div
          style={{
            position: "absolute",
            top: -100,
            left: -50,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(180,74,255,0.15) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Bottom-right glow */}
        <div
          style={{
            position: "absolute",
            bottom: -100,
            right: -50,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(0,240,255,0.12) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Corner brackets */}
        <div
          style={{
            position: "absolute",
            top: 30,
            left: 30,
            width: 60,
            height: 60,
            borderTop: "2px solid rgba(0,240,255,0.4)",
            borderLeft: "2px solid rgba(0,240,255,0.4)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 30,
            right: 30,
            width: 60,
            height: 60,
            borderTop: "2px solid rgba(0,240,255,0.4)",
            borderRight: "2px solid rgba(0,240,255,0.4)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 30,
            left: 30,
            width: 60,
            height: 60,
            borderBottom: "2px solid rgba(0,240,255,0.4)",
            borderLeft: "2px solid rgba(0,240,255,0.4)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 30,
            right: 30,
            width: 60,
            height: 60,
            borderBottom: "2px solid rgba(0,240,255,0.4)",
            borderRight: "2px solid rgba(0,240,255,0.4)",
            display: "flex",
          }}
        />

        {/* Gavel icon */}
        <div
          style={{
            fontSize: 80,
            marginBottom: 16,
            display: "flex",
          }}
        >
          &#9878;
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 52,
            fontWeight: 900,
            color: "#ffffff",
            textAlign: "center",
            letterSpacing: "0.05em",
            textShadow:
              "0 0 10px rgba(0,240,255,1), 0 0 40px rgba(0,240,255,0.6), 0 0 80px rgba(0,240,255,0.3)",
            display: "flex",
            marginBottom: 8,
          }}
        >
          NEON COURT
        </div>

        {/* Korean title */}
        <div
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: "#e0e0f0",
            textAlign: "center",
            letterSpacing: "0.1em",
            marginBottom: 24,
            display: "flex",
          }}
        >
          전국민 고민 재판소: 네온즈
        </div>

        {/* Horizontal line */}
        <div
          style={{
            width: 400,
            height: 1,
            background:
              "linear-gradient(90deg, transparent, rgba(0,240,255,0.5), rgba(180,74,255,0.5), transparent)",
            marginBottom: 24,
            display: "flex",
          }}
        />

        {/* Judge emojis */}
        <div
          style={{
            display: "flex",
            gap: 32,
            marginBottom: 24,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 36 }}>🤖</span>
            <span style={{ fontSize: 11, color: "#00f0ff", letterSpacing: "0.1em" }}>JUSTICE ZERO</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 36 }}>💗</span>
            <span style={{ fontSize: 11, color: "#ff2d95", letterSpacing: "0.1em" }}>HEART BEAT</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 36 }}>🔥</span>
            <span style={{ fontSize: 11, color: "#39ff14", letterSpacing: "0.1em" }}>CYBER REKKA</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 36 }}>🕵️</span>
            <span style={{ fontSize: 11, color: "#b44aff", letterSpacing: "0.1em" }}>DET. NEON</span>
          </div>
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 18,
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
