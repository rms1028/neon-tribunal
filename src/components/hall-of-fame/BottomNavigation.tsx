import Link from "next/link";

export default function BottomNavigation() {
  return (
    <nav className="feed-bottom-nav">
      <Link href="/" className="nav-item">
        <span className="nav-icon">🏠</span>
        <span className="nav-label">홈</span>
      </Link>
      <Link href="/hall-of-fame" className="nav-item">
        <span className="nav-icon">🔍</span>
        <span className="nav-label" style={{ color: "#00ffcc" }}>탐색</span>
      </Link>
      <Link href="/my-verdicts" className="nav-item">
        <span className="nav-icon">📊</span>
        <span className="nav-label">기록실</span>
      </Link>
      <Link href="/legal" className="nav-item">
        <span className="nav-icon">⚙️</span>
        <span className="nav-label">더보기</span>
      </Link>
    </nav>
  );
}
