import Link from "next/link";

export default function HofFooter() {
  return (
    <footer style={{ textAlign: "center", padding: "48px 16px 0" }}>
      <div style={{ width: "100%", height: 1, marginBottom: 20, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)" }} />
      <p style={{
        fontFamily: "var(--font-share-tech)", fontSize: 10,
        color: "var(--text-muted)", letterSpacing: "0.3em", textTransform: "uppercase",
      }}>
        Neon Court System &copy; 2026 &mdash; All judgments are AI-generated
      </p>
      <div style={{
        display: "flex", justifyContent: "center", gap: 16, marginTop: 12,
        fontFamily: "var(--font-share-tech)", fontSize: 9, color: "var(--text-muted)", letterSpacing: "0.15em",
      }}>
        <Link href="/terms" style={{ color: "inherit" }}>이용약관</Link>
        <span>|</span>
        <Link href="/privacy" style={{ color: "inherit" }}>개인정보처리방침</Link>
        <span>|</span>
        <Link href="/legal" style={{ color: "inherit" }}>법적 고지</Link>
      </div>
    </footer>
  );
}
