import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
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
          borderRadius: "14px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Glow background */}
        <div
          style={{
            position: "absolute",
            top: -10,
            left: -10,
            width: 84,
            height: 84,
            background:
              "radial-gradient(circle, rgba(57,255,20,0.2) 0%, transparent 70%)",
            display: "flex",
          }}
        />
        {/* Scale icon */}
        <span style={{ fontSize: 36, display: "flex" }}>&#9878;</span>
      </div>
    ),
    { ...size }
  );
}
