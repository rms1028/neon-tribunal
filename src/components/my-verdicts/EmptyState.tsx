import Link from "next/link";

export default function EmptyState() {
  return (
    <div className="text-center" style={{ padding: "80px 0" }}>
      <div style={{ fontSize: "72px", opacity: 0.3, marginBottom: "16px" }}>{"\u2696"}</div>
      <p className="tracking-widest" style={{ fontFamily: "var(--font-share-tech)", fontSize: "16px", color: "var(--text-secondary)", fontWeight: 500, marginBottom: "8px" }}>
        기록이 비어있습니다
      </p>
      <p className="tracking-wider" style={{ fontFamily: "var(--font-share-tech)", fontSize: "14px", color: "var(--text-muted)", fontWeight: 500, marginBottom: "28px" }}>
        판결을 받으면 자동으로 저장됩니다
      </p>
      <Link
        href="/"
        className="uppercase tracking-widest transition-all duration-200"
        style={{ fontFamily: "var(--font-orbitron)", fontSize: "14px", fontWeight: 700, border: "1px solid rgba(57,255,20,0.4)", color: "#39ff14", background: "rgba(57,255,20,0.05)", padding: "14px 28px", display: "inline-block" }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(57,255,20,0.12)"; e.currentTarget.style.boxShadow = "0 0 20px rgba(57,255,20,0.2)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(57,255,20,0.05)"; e.currentTarget.style.boxShadow = "none"; }}
      >
        {"\u2696\uFE0F"} 재판 받으러 가기
      </Link>
    </div>
  );
}
