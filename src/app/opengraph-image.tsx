import { ImageResponse } from "next/og";

export const dynamic = "force-dynamic";
export const alt = "전국민 고민 재판소: 네온즈 | NEON COURT";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage() {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://neon-tribunal.vercel.app";

  let notoFont: ArrayBuffer, oFont: ArrayBuffer, stFont: ArrayBuffer;

  try {
    [notoFont, oFont, stFont] = await Promise.all([
      fetch(`${baseUrl}/fonts/NotoSansKR-Bold.woff`).then((r) => r.arrayBuffer()),
      fetch(`${baseUrl}/fonts/Orbitron-Bold.ttf`).then((r) => r.arrayBuffer()),
      fetch(`${baseUrl}/fonts/ShareTechMono-Regular.ttf`).then((r) => r.arrayBuffer()),
    ]);
  } catch {
    // Fallback: simple image without custom fonts
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
            color: "#00f0ff",
            fontSize: 48,
            fontWeight: 700,
          }}
        >
          NEON COURT
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }

  const fontConfig = [
    { name: "Orbitron", data: oFont, weight: 700 as const, style: "normal" as const },
    { name: "ShareTechMono", data: stFont, weight: 400 as const, style: "normal" as const },
    { name: "NotoSansKR", data: notoFont, weight: 700 as const, style: "normal" as const },
  ];

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
        <div style={{ position: "absolute", top: 30, left: 30, width: 60, height: 60, borderTop: "2px solid rgba(0,240,255,0.4)", borderLeft: "2px solid rgba(0,240,255,0.4)", display: "flex" }} />
        <div style={{ position: "absolute", top: 30, right: 30, width: 60, height: 60, borderTop: "2px solid rgba(0,240,255,0.4)", borderRight: "2px solid rgba(0,240,255,0.4)", display: "flex" }} />
        <div style={{ position: "absolute", bottom: 30, left: 30, width: 60, height: 60, borderBottom: "2px solid rgba(0,240,255,0.4)", borderLeft: "2px solid rgba(0,240,255,0.4)", display: "flex" }} />
        <div style={{ position: "absolute", bottom: 30, right: 30, width: 60, height: 60, borderBottom: "2px solid rgba(0,240,255,0.4)", borderRight: "2px solid rgba(0,240,255,0.4)", display: "flex" }} />

        {/* Gavel icon - using text instead of emoji */}
        <div
          style={{
            fontFamily: "Orbitron",
            fontSize: 64,
            fontWeight: 700,
            color: "#00f0ff",
            marginBottom: 8,
            textShadow: "0 0 20px rgba(0,240,255,0.6), 0 0 60px rgba(0,240,255,0.3)",
            display: "flex",
          }}
        >
          {"{ \u2696 }"}
        </div>

        {/* Title */}
        <div
          style={{
            fontFamily: "Orbitron",
            fontSize: 56,
            fontWeight: 700,
            color: "#ffffff",
            textAlign: "center",
            letterSpacing: "0.08em",
            textShadow:
              "0 0 10px rgba(0,240,255,1), 0 0 40px rgba(0,240,255,0.6), 0 0 80px rgba(0,240,255,0.3)",
            display: "flex",
            marginBottom: 12,
          }}
        >
          NEON COURT
        </div>

        {/* Korean title */}
        <div
          style={{
            fontFamily: "NotoSansKR",
            fontSize: 30,
            fontWeight: 700,
            color: "#e0e0f0",
            textAlign: "center",
            letterSpacing: "0.1em",
            marginBottom: 28,
            display: "flex",
          }}
        >
          {"\uC804\uAD6D\uBBFC \uACE0\uBBFC \uC7AC\uD310\uC18C: \uB124\uC628\uC988"}
        </div>

        {/* Horizontal line */}
        <div
          style={{
            width: 500,
            height: 2,
            background:
              "linear-gradient(90deg, transparent, rgba(0,240,255,0.6), rgba(180,74,255,0.6), transparent)",
            marginBottom: 28,
            display: "flex",
          }}
        />

        {/* Judge labels */}
        <div
          style={{
            display: "flex",
            gap: 40,
            marginBottom: 28,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(0,240,255,0.15)", border: "2px solid rgba(0,240,255,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Orbitron", fontSize: 16, color: "#00f0ff", fontWeight: 700 }}>JZ</div>
            <span style={{ fontFamily: "ShareTechMono", fontSize: 11, color: "#00f0ff", letterSpacing: "0.1em" }}>JUSTICE ZERO</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(255,45,149,0.15)", border: "2px solid rgba(255,45,149,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Orbitron", fontSize: 16, color: "#ff2d95", fontWeight: 700 }}>HB</div>
            <span style={{ fontFamily: "ShareTechMono", fontSize: 11, color: "#ff2d95", letterSpacing: "0.1em" }}>HEART BEAT</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(57,255,20,0.15)", border: "2px solid rgba(57,255,20,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Orbitron", fontSize: 16, color: "#39ff14", fontWeight: 700 }}>CR</div>
            <span style={{ fontFamily: "ShareTechMono", fontSize: 11, color: "#39ff14", letterSpacing: "0.1em" }}>CYBER REKKA</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(180,74,255,0.15)", border: "2px solid rgba(180,74,255,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Orbitron", fontSize: 16, color: "#b44aff", fontWeight: 700 }}>DN</div>
            <span style={{ fontFamily: "ShareTechMono", fontSize: 11, color: "#b44aff", letterSpacing: "0.1em" }}>DET. NEON</span>
          </div>
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontFamily: "NotoSansKR",
            fontSize: 20,
            color: "#999",
            letterSpacing: "0.1em",
            display: "flex",
          }}
        >
          {"4\uBA85\uC758 AI \uD310\uC0AC\uC5D0\uAC8C \uD310\uACB0\uC744 \uBC1B\uC544\uBCF4\uC138\uC694"}
        </div>
      </div>
    ),
    { ...size, fonts: fontConfig }
  );
}
