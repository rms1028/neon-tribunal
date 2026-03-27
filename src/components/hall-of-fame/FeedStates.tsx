"use client";

export function SkeletonCard({ delay = 0 }: { delay?: number }) {
  return (
    <div className="feed-card" style={{ animation: "none", opacity: 1 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px 8px" }}>
        <div className="skeleton-shimmer" style={{ width: 40, height: 40, borderRadius: "50%", flexShrink: 0, animationDelay: `${delay}ms` }} />
        <div style={{ flex: 1 }}>
          <div className="skeleton-shimmer" style={{ width: "60%", height: 14, marginBottom: 6, animationDelay: `${delay + 100}ms` }} />
          <div className="skeleton-shimmer" style={{ width: "40%", height: 10, animationDelay: `${delay + 200}ms` }} />
        </div>
      </div>
      <div style={{ padding: "0 16px 12px" }}>
        <div className="skeleton-shimmer" style={{ width: "100%", height: 14, marginBottom: 8, animationDelay: `${delay + 100}ms` }} />
        <div className="skeleton-shimmer" style={{ width: "90%", height: 14, marginBottom: 8, animationDelay: `${delay + 200}ms` }} />
        <div className="skeleton-shimmer" style={{ width: "70%", height: 14, animationDelay: `${delay + 300}ms` }} />
      </div>
    </div>
  );
}

export function LoadingState() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0" }}>
      <svg style={{ width: 40, height: 40, marginBottom: 16, color: "#00ffcc", animation: "spin 1s linear infinite" }} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="31.4 31.4" strokeLinecap="round" />
      </svg>
      <p style={{ fontFamily: "var(--font-share-tech)", fontSize: 12, color: "rgba(255,255,255,0.4)", letterSpacing: "0.2em" }}>
        DATA_LOADING...
      </p>
    </div>
  );
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div style={{ textAlign: "center", padding: "80px 0" }}>
      <div style={{ fontSize: 48, opacity: 0.3, marginBottom: 16 }}>⚠️</div>
      <p style={{ fontFamily: "var(--font-share-tech)", fontSize: 13, color: "rgba(255,255,255,0.4)", letterSpacing: "0.15em" }}>
        데이터를 불러오지 못했습니다
      </p>
      <p style={{ fontFamily: "var(--font-share-tech)", fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 8 }}>
        네트워크 연결을 확인하고 다시 시도해주세요
      </p>
      <button
        onClick={onRetry}
        style={{
          marginTop: 16, padding: "10px 24px", borderRadius: 20,
          border: "1px solid rgba(0,229,255,0.3)", background: "rgba(0,229,255,0.06)",
          color: "#00E5FF", fontSize: 13, fontWeight: 700, cursor: "pointer",
          fontFamily: "var(--font-share-tech)", letterSpacing: "0.1em",
        }}
      >
        ↻ 다시 시도
      </button>
    </div>
  );
}

interface EmptyStateProps {
  searchQuery: string;
  selectedCategory: string | null;
  judgeFilter: string | null;
  onClearFilters: () => void;
  onRetry: () => void;
}

export function EmptyState({ searchQuery, selectedCategory, judgeFilter, onClearFilters, onRetry }: EmptyStateProps) {
  return (
    <div style={{ textAlign: "center", padding: "80px 0" }}>
      <div style={{ fontSize: 48, opacity: 0.3, marginBottom: 16 }}>
        {searchQuery || selectedCategory ? "🔍" : "⚖️"}
      </div>
      <p style={{ fontFamily: "var(--font-share-tech)", fontSize: 13, color: "rgba(255,255,255,0.4)", letterSpacing: "0.15em" }}>
        {searchQuery
          ? `"${searchQuery}" 검색 결과가 없습니다`
          : selectedCategory
            ? `"${selectedCategory}" 카테고리에 판결이 없습니다`
            : judgeFilter
              ? "해당 판사의 재판이 아직 없어요"
              : "아직 등록된 판결이 없습니다"}
      </p>
      <p style={{ fontFamily: "var(--font-share-tech)", fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 8 }}>
        {searchQuery || selectedCategory
          ? "다른 키워드나 카테고리로 검색해보세요!"
          : judgeFilter
            ? "다른 판사를 선택하거나 새 재판을 열어보세요!"
            : "판결을 받고 국민 배심원을 소집해보세요!"}
      </p>
      {(searchQuery || selectedCategory) && (
        <button
          onClick={onClearFilters}
          style={{
            marginTop: 16, padding: "8px 20px", borderRadius: 20,
            border: "1px solid rgba(180,74,255,0.3)", background: "rgba(180,74,255,0.06)",
            color: "#b44aff", fontSize: 12, fontWeight: 700, cursor: "pointer",
            fontFamily: "var(--font-share-tech)", letterSpacing: "0.1em",
          }}
        >
          ✕ 필터 초기화
        </button>
      )}
      {!searchQuery && !selectedCategory && (
        <button
          onClick={onRetry}
          style={{
            marginTop: 16, padding: "8px 20px", borderRadius: 20,
            border: "1px solid rgba(0,229,255,0.3)", background: "rgba(0,229,255,0.06)",
            color: "#00E5FF", fontSize: 12, fontWeight: 700, cursor: "pointer",
            fontFamily: "var(--font-share-tech)", letterSpacing: "0.1em",
          }}
        >
          ↻ 다시 시도
        </button>
      )}
    </div>
  );
}
