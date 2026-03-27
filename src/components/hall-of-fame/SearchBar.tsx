"use client";

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  debouncedQuery: string;
  onClearSearch: () => void;
  trendingKeywords: string[];
  isSearchFocused: boolean;
  onFocus: () => void;
  onBlur: () => void;
}

export default function SearchBar({
  searchQuery, onSearchChange, debouncedQuery, onClearSearch,
  trendingKeywords, isSearchFocused, onFocus, onBlur,
}: SearchBarProps) {
  return (
    <div style={{ padding: "10px 12px 4px" }}>
      <div
        className="search-bar-container"
        style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "var(--glass-bg)", border: isSearchFocused ? "1px solid rgba(0,229,255,0.4)" : "1px solid var(--glass-border)",
          borderRadius: 12, padding: "8px 14px",
          transition: "border-color 0.2s, box-shadow 0.2s",
          boxShadow: isSearchFocused ? "0 0 12px rgba(0,229,255,0.15)" : "none",
        }}
      >
        <span style={{ fontSize: 15, opacity: 0.5 }}>🔍</span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder="사연이나 판결을 검색하세요..."
          style={{
            flex: 1, background: "transparent", border: "none", outline: "none",
            color: "var(--text-primary)", fontFamily: "var(--font-share-tech)", fontSize: 13,
          }}
        />
        {searchQuery && (
          <button
            onClick={onClearSearch}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 14, padding: "2px 4px" }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Trending Keywords */}
      {trendingKeywords.length > 0 && !searchQuery && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8, paddingLeft: 2 }}>
          <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-share-tech)", letterSpacing: "0.05em", alignSelf: "center" }}>
            인기
          </span>
          {trendingKeywords.slice(0, 5).map((kw) => (
            <button
              key={kw}
              onClick={() => onSearchChange(kw)}
              style={{
                padding: "3px 10px", borderRadius: 16,
                border: "1px solid rgba(255,45,149,0.25)", background: "rgba(255,45,149,0.06)",
                color: "#ff2d95", fontSize: 11, fontWeight: 600,
                fontFamily: "var(--font-share-tech)", cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {kw}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
