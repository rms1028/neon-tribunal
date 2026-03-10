import { ImageResponse } from "next/og";

export const dynamic = "force-dynamic";
export const alt = "전국민 고민 재판소: 네온즈 | NEON COURT";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function TwitterImage() {
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
        <div
          style={{
            fontFamily: "Orbitron",
            fontSize: 56,
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
            fontSize: 52,
            fontWeight: 700,
            color: "#ffffff",
            textAlign: "center",
            letterSpacing: "0.06em",
            textShadow:
              "0 0 10px rgba(0,240,255,1), 0 0 40px rgba(0,240,255,0.6)",
            display: "flex",
            marginBottom: 10,
          }}
        >
          NEON COURT
        </div>

        <div
          style={{
            fontFamily: "NotoSansKR",
            fontSize: 28,
            fontWeight: 700,
            color: "#e0e0f0",
            letterSpacing: "0.1em",
            marginBottom: 24,
            display: "flex",
          }}
        >
          {"\uC804\uAD6D\uBBFC \uACE0\uBBFC \uC7AC\uD310\uC18C: \uB124\uC628\uC988"}
        </div>

        {/* Divider */}
        <div
          style={{
            width: 400,
            height: 2,
            background:
              "linear-gradient(90deg, transparent, rgba(0,240,255,0.6), rgba(180,74,255,0.6), transparent)",
            marginBottom: 24,
            display: "flex",
          }}
        />

        {/* Judge icons row */}
        <div style={{ display: "flex", gap: 32, marginBottom: 24 }}>
          <div style={{ width: 42, height: 42, borderRadius: "50%", background: "rgba(0,240,255,0.15)", border: "2px solid rgba(0,240,255,0.5)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Orbitron", fontSize: 14, color: "#00f0ff", fontWeight: 700 }}>JZ</div>
          <div style={{ width: 42, height: 42, borderRadius: "50%", background: "rgba(255,45,149,0.15)", border: "2px solid rgba(255,45,149,0.5)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Orbitron", fontSize: 14, color: "#ff2d95", fontWeight: 700 }}>HB</div>
          <div style={{ width: 42, height: 42, borderRadius: "50%", background: "rgba(57,255,20,0.15)", border: "2px solid rgba(57,255,20,0.5)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Orbitron", fontSize: 14, color: "#39ff14", fontWeight: 700 }}>CR</div>
          <div style={{ width: 42, height: 42, borderRadius: "50%", background: "rgba(180,74,255,0.15)", border: "2px solid rgba(180,74,255,0.5)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Orbitron", fontSize: 14, color: "#b44aff", fontWeight: 700 }}>DN</div>
        </div>

        <div
          style={{
            fontFamily: "NotoSansKR",
            fontSize: 18,
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
