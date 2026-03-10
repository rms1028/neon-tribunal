export default function OfflinePage() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#05050e",
        color: "#c8c8e0",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>{"\u2696"}</div>
      <h1
        style={{
          fontFamily: "var(--font-orbitron)",
          fontSize: "1.5rem",
          color: "#00f0ff",
          textShadow: "0 0 10px rgba(0,240,255,0.6)",
          marginBottom: "1rem",
        }}
      >
        OFFLINE
      </h1>
      <p style={{ fontSize: "1rem", color: "#888", maxWidth: "400px" }}>
        네트워크 연결이 없습니다. 인터넷에 연결된 후 다시 시도해주세요.
      </p>
    </div>
  );
}
