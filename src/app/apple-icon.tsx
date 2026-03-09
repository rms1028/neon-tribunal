import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0a0a1a 0%, #111125 100%)",
          borderRadius: "40px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Glow */}
        <div
          style={{
            position: "absolute",
            top: -20,
            left: -20,
            width: 220,
            height: 220,
            background:
              "radial-gradient(circle, rgba(57,255,20,0.2) 0%, transparent 70%)",
            display: "flex",
          }}
        />
        {/* Scale icon */}
        <span style={{ fontSize: 100, display: "flex" }}>&#9878;</span>
      </div>
    ),
    { ...size }
  );
}
