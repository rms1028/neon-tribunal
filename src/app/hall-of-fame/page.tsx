"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { judges } from "@/lib/judges";
import type { HallOfFameEntry, HallOfFameListResponse } from "@/lib/types";
import { trackEvent } from "@/lib/analytics";
import JudgeAvatar from "@/components/JudgeAvatar";
import "./hall-of-fame.css";

const LIKED_KEY = "neon-court-liked-ids";
const MY_VERDICTS_KEY = "neon-court-my-verdicts";
const PAGE_SIZE = 12;
const HIGHLIGHT_COUNT = 5;

function getLikedIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(LIKED_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveLikedIds(ids: Set<string>) {
  localStorage.setItem(LIKED_KEY, JSON.stringify([...ids]));
}

function getMyVerdicts(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(MY_VERDICTS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}일 전`;
  return new Date(dateStr).toLocaleDateString("ko-KR");
}

type SortMode = "newest" | "popular";

export default function HallOfFamePage() {
  const [entries, setEntries] = useState<HallOfFameEntry[]>([]);
  const [highlightEntries, setHighlightEntries] = useState<
    HallOfFameEntry[]
  >([]);
  const [isHeroCollapsed, setIsHeroCollapsed] = useState(false);

  const [sort, setSort] = useState<SortMode>("newest");
  const [judgeFilter, setJudgeFilter] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [animatingId, setAnimatingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [myVerdicts, setMyVerdicts] = useState<Set<string>>(new Set());

  useEffect(() => {
    setLikedIds(getLikedIds());
    setMyVerdicts(getMyVerdicts());
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsHeroCollapsed(window.scrollY > 80);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /* ── fetch highlight top entries ── */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(
          `/api/hall-of-fame?sort=popular&cursor=0`
        );
        if (!res.ok) return;
        const data: HallOfFameListResponse = await res.json();
        if (data.entries.length > 0) {
          setHighlightEntries(
            data.entries.slice(0, HIGHLIGHT_COUNT)
          );
        }
      } catch {
        // ignore
      }
    })();
  }, []);

  const fetchEntries = useCallback(
    async (
      sortMode: SortMode,
      cursorOffset: number,
      judge: string | null,
      append = false
    ) => {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      try {
        let url = `/api/hall-of-fame?sort=${sortMode}&cursor=${cursorOffset}`;
        if (judge) url += `&judge=${judge}`;
        const res = await fetch(url);
        if (!res.ok) return;
        const data: HallOfFameListResponse = await res.json();
        setEntries((prev) =>
          append ? [...prev, ...data.entries] : data.entries
        );
        setHasMore(data.hasMore);
      } catch {
        // network error
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchEntries(sort, 0, judgeFilter);
  }, [sort, judgeFilter, fetchEntries]);

  const handleSortChange = (newSort: SortMode) => {
    if (newSort === sort) return;
    setSort(newSort);
    setOffset(0);
    setEntries([]);
  };

  const handleJudgeFilter = (judgeId: string | null) => {
    if (judgeId === judgeFilter) return;
    setJudgeFilter(judgeId);
    setOffset(0);
    setEntries([]);
  };

  const handleLoadMore = () => {
    const newOffset = offset + PAGE_SIZE;
    setOffset(newOffset);
    fetchEntries(sort, newOffset, judgeFilter, true);
  };

  const handleLike = async (id: string) => {
    const isLiked = likedIds.has(id);
    if (!isLiked) trackEvent("verdict_liked", { verdict_id: id });
    const method = isLiked ? "DELETE" : "POST";

    const newLikedIds = new Set(likedIds);
    if (isLiked) newLikedIds.delete(id);
    else newLikedIds.add(id);
    setLikedIds(newLikedIds);
    saveLikedIds(newLikedIds);

    const delta = isLiked ? -1 : 1;
    setEntries((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, likes: e.likes + delta } : e
      )
    );
    setHighlightEntries((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, likes: e.likes + delta } : e
      )
    );

    if (!isLiked) {
      setAnimatingId(id);
      setTimeout(() => setAnimatingId(null), 300);
    }

    try {
      const res = await fetch(`/api/hall-of-fame/${id}/like`, {
        method,
      });
      if (!res.ok) throw new Error();
    } catch {
      const rollbackIds = new Set(likedIds);
      setLikedIds(rollbackIds);
      saveLikedIds(rollbackIds);
      setEntries((prev) =>
        prev.map((e) =>
          e.id === id ? { ...e, likes: e.likes - delta } : e
        )
      );
      setHighlightEntries((prev) =>
        prev.map((e) =>
          e.id === id ? { ...e, likes: e.likes - delta } : e
        )
      );
    }
  };

  const handleShareCopy = async (id: string) => {
    const url = `${window.location.origin}/verdict/${id}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getJudgeData = (judgeId: string) =>
    judges.find((j) => j.id === judgeId);

  /* ───────────────────────────────────────────────
   *  HIGHLIGHT CAROUSEL renderer (horizontal scroll)
   * ─────────────────────────────────────────────── */
  const renderHighlightCarousel = () => {
    if (highlightEntries.length === 0) return null;

    return (
      <div style={{ marginBottom: "24px" }}>
        {/* Section header */}
        <div
          className="flex items-center justify-between"
          style={{ marginBottom: "12px" }}
        >
          <div className="flex items-center gap-2">
            <div
              style={{
                width: "3px",
                height: "20px",
                background: "linear-gradient(180deg, #ffaa00, #ff4444)",
                borderRadius: "2px",
                boxShadow: "0 0 6px rgba(255,170,0,0.4)",
              }}
            />
            <h2
              style={{
                fontFamily: "var(--font-orbitron)",
                fontSize: "14px",
                fontWeight: 700,
                color: "#ffaa00",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                textShadow: "0 0 8px rgba(255,170,0,0.6)",
              }}
            >
              {"\uD83D\uDD25"} 명예의 전당
            </h2>
          </div>
          <span
            style={{
              fontFamily: "var(--font-share-tech)",
              fontSize: "11px",
              color: "rgba(255,170,0,0.5)",
              letterSpacing: "0.06em",
            }}
          >
            TOP {highlightEntries.length}
          </span>
        </div>

        {/* Horizontal scroll container */}
        <div
          className="scrollbar-hide"
          style={{
            display: "flex",
            gap: "12px",
            overflowX: "auto",
            scrollSnapType: "x mandatory",
            WebkitOverflowScrolling: "touch",
            paddingBottom: "4px",
            marginLeft: "-16px",
            marginRight: "-16px",
            paddingLeft: "16px",
            paddingRight: "16px",
          }}
        >
          {highlightEntries.map((entry, idx) => {
            const judge = getJudgeData(entry.judge_id);
            const accentColor = judge?.accentColor || "#00f0ff";

            return (
              <Link
                key={entry.id}
                href={`/verdict/${entry.id}`}
                className="shrink-0 block"
                style={{
                  width: "80vw",
                  maxWidth: "340px",
                  scrollSnapAlign: "start",
                  background: "rgba(8,8,24,0.85)",
                  border: "1px solid rgba(255,170,0,0.25)",
                  padding: "16px",
                  position: "relative",
                  textDecoration: "none",
                }}
              >
                {/* Rank badge */}
                <div
                  style={{
                    position: "absolute",
                    top: "0",
                    left: "12px",
                    padding: "3px 10px",
                    background: "linear-gradient(135deg, #ffaa00, #ff6600)",
                    color: "#000",
                    fontFamily: "var(--font-orbitron)",
                    fontSize: "9px",
                    fontWeight: 800,
                    letterSpacing: "0.1em",
                  }}
                >
                  {"\uD83D\uDC51"} #{idx + 1}
                </div>

                {/* Judge row */}
                <div
                  className="flex items-center"
                  style={{ marginTop: "20px", marginBottom: "8px", gap: "8px" }}
                >
                  {judge && (
                    <JudgeAvatar
                      avatarUrl={judge.avatarUrl}
                      name={judge.name}
                      size={28}
                      glowRgb={judge.glowRgb}
                    />
                  )}
                  <span
                    style={{
                      fontFamily: "var(--font-orbitron)",
                      fontSize: "10px",
                      fontWeight: 700,
                      color: accentColor,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                    }}
                  >
                    {entry.judge_name}
                  </span>
                  <span
                    style={{
                      marginLeft: "auto",
                      fontFamily: "var(--font-share-tech)",
                      fontSize: "10px",
                      color: "#888",
                    }}
                  >
                    {"\u2764"} {entry.likes}
                  </span>
                </div>

                {/* Story preview - 2 lines */}
                <p
                  className="line-clamp-2"
                  style={{
                    fontFamily: "var(--font-share-tech)",
                    fontSize: "12px",
                    color: "#E0E0E0",
                    fontStyle: "italic",
                    lineHeight: "1.5",
                    marginBottom: "8px",
                  }}
                >
                  &quot;{entry.story}&quot;
                </p>

                {/* Viral quote if available */}
                {entry.viral_quote && (
                  <p
                    className="line-clamp-1"
                    style={{
                      fontFamily: "var(--font-share-tech)",
                      fontSize: "11px",
                      color: "#ffaa00",
                      opacity: 0.7,
                    }}
                  >
                    &ldquo;{entry.viral_quote}&rdquo;
                  </p>
                )}

                {/* Corner decorations */}
                <div
                  className="absolute"
                  style={{
                    top: "6px",
                    right: "8px",
                    width: "8px",
                    height: "8px",
                    borderTop: "1px solid rgba(255,170,0,0.3)",
                    borderRight: "1px solid rgba(255,170,0,0.3)",
                  }}
                />
                <div
                  className="absolute"
                  style={{
                    bottom: "6px",
                    left: "8px",
                    width: "8px",
                    height: "8px",
                    borderBottom: "1px solid rgba(255,170,0,0.3)",
                    borderLeft: "1px solid rgba(255,170,0,0.3)",
                  }}
                />
              </Link>
            );
          })}
        </div>
      </div>
    );
  };

  /* ───────────────────────────────────────────────
   *  RENDER
   * ─────────────────────────────────────────────── */
  return (
    <div className="min-h-screen cyber-grid crt-overlay relative overflow-hidden pt-14">
      {/* Sticky collapsed hero bar */}
      {isHeroCollapsed && (
        <div
          className="fixed left-0 right-0 z-40"
          style={{
            top: "53px",
            height: "40px",
            background: "rgba(5,5,14,0.95)",
            backdropFilter: "blur(12px)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-orbitron)",
              fontSize: "13px",
              fontWeight: 700,
              color: "#ffffff",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              textShadow: "0 0 6px rgba(240,225,48,0.4)",
            }}
          >
            공개 재판소
          </h2>
        </div>
      )}

      {/* Ambient glow */}
      <div
        className="fixed pointer-events-none rounded-full"
        style={{
          top: "-200px",
          right: "25%",
          width: "500px",
          height: "500px",
          background: "rgba(240,225,48,0.05)",
          filter: "blur(200px)",
        }}
      />
      <div
        className="fixed pointer-events-none rounded-full"
        style={{
          bottom: "-150px",
          left: "25%",
          width: "400px",
          height: "400px",
          background: "rgba(180,74,255,0.1)",
          filter: "blur(180px)",
        }}
      />

      <div
        className="relative z-10 w-full mx-auto px-4 md:px-8 lg:px-10"
        style={{ maxWidth: "95%", paddingTop: "16px", paddingBottom: "16px" }}
      >
        {/* ===== HEADER ===== */}
        <div className="text-center" style={{ marginBottom: "12px" }}>
          <h1
            className="text-2xl sm:text-4xl md:text-5xl font-black uppercase tracking-wider"
            style={{
              fontFamily: "var(--font-orbitron)",
              color: "#ffffff",
              marginBottom: "6px",
              textShadow: [
                "0 0 6px rgba(240,225,48,0.5)",
                "0 0 15px rgba(240,225,48,0.3)",
                "0 0 40px rgba(240,225,48,0.15)",
              ].join(", "),
            }}
          >
            공개 재판소
          </h1>
          <p
            className="tracking-wider"
            style={{
              fontFamily: "var(--font-share-tech)",
              fontSize: "11px",
              color: "#888",
              wordBreak: "keep-all",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            국민 배심원단이 소집된 재판을 모아볼 수 있습니다
          </p>
        </div>

        <div className="holo-line" style={{ marginBottom: "12px" }} />

        {/* ===== FILTER + SORT (1 ROW) ===== */}
        <div
          className="flex items-center"
          style={{ gap: "8px", marginBottom: "16px" }}
        >
          {/* Judge filter tabs - scrollable */}
          <div
            className="flex-1 flex scrollbar-hide"
            style={{ gap: "6px", overflowX: "auto", paddingBottom: "2px" }}
          >
            <button
              onClick={() => handleJudgeFilter(null)}
              className="shrink-0 cursor-pointer transition-all duration-200"
              style={{
                fontFamily: "var(--font-share-tech)",
                fontSize: "11px",
                letterSpacing: "0.06em",
                padding: "7px 14px",
                border: judgeFilter === null
                  ? "1px solid #00E5FF"
                  : "1px solid rgba(255,255,255,0.08)",
                color: judgeFilter === null ? "#00E5FF" : "#888",
                background: judgeFilter === null
                  ? "rgba(0,229,255,0.1)"
                  : "transparent",
                boxShadow: judgeFilter === null
                  ? "0 0 10px rgba(0,229,255,0.2)"
                  : "none",
              }}
            >
              전체
            </button>
            {judges.map((j) => {
              const isActive = judgeFilter === j.id;
              return (
                <button
                  key={j.id}
                  onClick={() => handleJudgeFilter(j.id)}
                  className="shrink-0 cursor-pointer transition-all duration-200 flex items-center"
                  style={{
                    fontFamily: "var(--font-share-tech)",
                    fontSize: "11px",
                    letterSpacing: "0.04em",
                    padding: "7px 10px",
                    gap: "5px",
                    border: isActive
                      ? "1px solid #00E5FF"
                      : "1px solid rgba(255,255,255,0.08)",
                    color: isActive ? "#00E5FF" : "#888",
                    background: isActive
                      ? "rgba(0,229,255,0.1)"
                      : "transparent",
                    boxShadow: isActive
                      ? "0 0 10px rgba(0,229,255,0.2)"
                      : "none",
                  }}
                >
                  <JudgeAvatar
                    avatarUrl={j.avatarUrl}
                    name={j.name}
                    size={16}
                  />
                  <span>{j.name}</span>
                </button>
              );
            })}
          </div>

          {/* Sort toggle - compact right side */}
          <button
            onClick={() => handleSortChange(sort === "newest" ? "popular" : "newest")}
            className="shrink-0 cursor-pointer transition-all duration-200 flex items-center"
            style={{
              fontFamily: "var(--font-share-tech)",
              fontSize: "10px",
              letterSpacing: "0.04em",
              padding: "7px 10px",
              gap: "4px",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#888",
              background: "transparent",
            }}
          >
            <span>{sort === "newest" ? "\u23F0" : "\u2764"}</span>
            <span>{sort === "newest" ? "최신" : "공감"}</span>
          </button>
        </div>

        {/* ===== HIGHLIGHT CAROUSEL ===== */}
        {renderHighlightCarousel()}

        {/* ===== LOADING ===== */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <svg
              className="animate-spin-slow w-10 h-10 mb-4"
              style={{ color: "var(--color-neon-yellow)" }}
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray="31.4 31.4"
                strokeLinecap="round"
              />
            </svg>
            <p
              className="text-sm tracking-widest animate-neon-pulse"
              style={{
                fontFamily: "var(--font-share-tech)",
                color: "#6b7280",
              }}
            >
              DATA_LOADING...
            </p>
          </div>
        )}

        {/* ===== EMPTY STATE ===== */}
        {!isLoading && entries.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4" style={{ opacity: 0.3 }}>
              {"\u2696"}
            </div>
            <p
              className="text-sm tracking-widest"
              style={{
                fontFamily: "var(--font-share-tech)",
                color: "#6b7280",
              }}
            >
              아직 등록된 판결이 없습니다
            </p>
            <p
              className="text-xs tracking-wider mt-2"
              style={{
                fontFamily: "var(--font-share-tech)",
                color: "#4b5563",
              }}
            >
              판결을 받고 국민 배심원을 소집해보세요!
            </p>
          </div>
        )}

        {/* ===== CARD GRID ===== */}
        {!isLoading && entries.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" style={{ gap: "12px" }}>
            {entries.map((entry) => {
              const judge = getJudgeData(entry.judge_id);
              const isLiked = likedIds.has(entry.id);
              const isExpanded = expandedId === entry.id;
              const accentColor =
                judge?.accentColor || "#00f0ff";
              const glowRgb =
                judge?.glowRgb || "0,240,255";
              const isAuthor = myVerdicts.has(entry.id);
              const storyTruncated =
                entry.story.length > 100;
              const verdictTruncated =
                entry.verdict.length > 150;
              const total =
                (entry.jury_agree ?? 0) +
                (entry.jury_disagree ?? 0);
              const agreePercent =
                total > 0
                  ? Math.round(
                      ((entry.jury_agree ?? 0) / total) *
                        100
                    )
                  : 0;
              const disagreePercent =
                total > 0 ? 100 - agreePercent : 0;

              return (
                <div
                  key={entry.id}
                  className={`verdict-card glass-card relative cursor-pointer ${
                    isExpanded
                      ? "sm:col-span-2 lg:col-span-3 xl:col-span-4"
                      : ""
                  }`}
                  style={{
                    padding: "16px",
                    border: "1px solid rgba(255,255,255,0.08)",
                    boxShadow: isExpanded
                      ? `0 0 20px rgba(${glowRgb},0.12)`
                      : undefined,
                  }}
                  onClick={() =>
                    setExpandedId(
                      isExpanded ? null : entry.id
                    )
                  }
                >
                  {/* Judge header - compact single row */}
                  <div className="flex items-center" style={{ gap: "8px", marginBottom: "8px" }}>
                    {judge ? (
                      <JudgeAvatar
                        avatarUrl={judge.avatarUrl}
                        name={judge.name}
                        size={36}
                        glowRgb={glowRgb}
                      />
                    ) : (
                      <span style={{ fontSize: "24px" }}>
                        {"\u2696"}
                      </span>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span
                        className="truncate"
                        style={{
                          fontFamily: "var(--font-orbitron)",
                          fontSize: "11px",
                          fontWeight: 700,
                          color: accentColor,
                          letterSpacing: "0.04em",
                          textTransform: "uppercase",
                          display: "block",
                        }}
                      >
                        {entry.judge_name}
                      </span>
                      <div className="flex items-center" style={{ gap: "8px" }}>
                        <span
                          style={{
                            fontFamily: "var(--font-share-tech)",
                            fontSize: "10px",
                            color: "#888",
                          }}
                        >
                          {timeAgo(entry.created_at)}
                        </span>
                        <span
                          style={{
                            fontFamily: "var(--font-share-tech)",
                            fontSize: "10px",
                            color: "#888",
                          }}
                        >
                          {"\u2764"} {entry.likes}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Evidence image - hidden on mobile compact */}
                  {entry.image_url && (
                    <div className={`mb-2 ${isExpanded ? "" : "hidden sm:block"}`}>
                      <img
                        src={entry.image_url}
                        alt="증거 사진"
                        className={`w-full ${
                          isExpanded
                            ? "max-h-[300px] object-contain"
                            : "h-28 object-cover"
                        }`}
                        style={{
                          border:
                            "1px solid var(--color-dark-border)",
                          clipPath:
                            "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))",
                        }}
                      />
                    </div>
                  )}

                  {/* Story */}
                  <div
                    style={{
                      padding: "8px",
                      borderRadius: "4px",
                      background: "rgba(255,255,255,0.04)",
                      borderLeft: `2px solid rgba(${glowRgb},0.3)`,
                      marginBottom: "8px",
                    }}
                  >
                    <p
                      className={`whitespace-pre-wrap ${!isExpanded ? "line-clamp-2" : ""}`}
                      style={{
                        fontFamily: "var(--font-share-tech)",
                        fontSize: "12px",
                        lineHeight: "1.5",
                        color: "#E0E0E0",
                        fontStyle: "italic",
                      }}
                    >
                      &quot;{entry.story}&quot;
                    </p>
                  </div>

                  {/* Verdict */}
                  <div style={{ marginBottom: "8px" }}>
                    <p
                      className={`whitespace-pre-wrap ${!isExpanded ? "line-clamp-2" : ""}`}
                      style={{
                        fontFamily: "var(--font-share-tech)",
                        fontSize: "12px",
                        lineHeight: "1.5",
                        color: "#E0E0E0",
                      }}
                    >
                      {entry.verdict}
                    </p>
                  </div>

                  {/* Vote gauge */}
                  <div
                    style={{ marginBottom: "8px" }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between" style={{ marginBottom: "4px" }}>
                      <span
                        style={{
                          fontFamily: "var(--font-share-tech)",
                          fontSize: "9px",
                          color: "#888",
                        }}
                      >
                        {total > 0 ? `${total}명 참여` : "투표 대기 중"}
                      </span>
                    </div>
                    <div
                      className="flex overflow-hidden"
                      style={{
                        height: "14px",
                        borderRadius: "3px",
                        background: "rgba(255,255,255,0.06)",
                      }}
                    >
                      {total > 0 ? (
                        <>
                          <div
                            className="transition-all duration-700 ease-out"
                            style={{
                              width: `${agreePercent}%`,
                              height: "100%",
                              background: "linear-gradient(90deg, #39ff14, rgba(57,255,20,0.6))",
                              boxShadow: "0 0 8px rgba(57,255,20,0.4)",
                            }}
                          />
                          <div
                            className="transition-all duration-700 ease-out"
                            style={{
                              width: `${disagreePercent}%`,
                              height: "100%",
                              background: "linear-gradient(90deg, rgba(255,45,149,0.6), #ff2d95)",
                              boxShadow: "0 0 8px rgba(255,45,149,0.4)",
                            }}
                          />
                        </>
                      ) : (
                        <div style={{ width: "100%", height: "100%", background: "rgba(255,255,255,0.03)" }} />
                      )}
                    </div>
                    {total > 0 && (
                      <div className="flex justify-between" style={{ marginTop: "3px" }}>
                        <span style={{ fontFamily: "var(--font-share-tech)", fontSize: "9px", color: "rgba(57,255,20,0.7)" }}>
                          {"\uD83D\uDC4D"} {agreePercent}%
                        </span>
                        <span style={{ fontFamily: "var(--font-share-tech)", fontSize: "9px", color: "rgba(255,45,149,0.7)" }}>
                          {disagreePercent}% {"\uD83D\uDC4E"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Vote CTA - always visible */}
                  <div
                    onClick={(e) => e.stopPropagation()}
                    style={{ marginBottom: "8px" }}
                  >
                    {isAuthor ? (
                      <div
                        className="text-center"
                        style={{
                          padding: "6px",
                          border: `1px solid rgba(${glowRgb},0.15)`,
                          background: `rgba(${glowRgb},0.03)`,
                        }}
                      >
                        <p style={{ fontFamily: "var(--font-share-tech)", fontSize: "10px", color: accentColor }}>
                          {"\u2696\uFE0F"} 내 사연
                        </p>
                      </div>
                    ) : (
                      <Link
                        href={`/verdict/${entry.id}`}
                        className="flex items-center justify-center w-full transition-all duration-200"
                        style={{
                          fontFamily: "var(--font-share-tech)",
                          fontSize: "11px",
                          padding: "6px",
                          border: "1px solid rgba(0,229,255,0.2)",
                          color: "#00E5FF",
                          background: "rgba(0,229,255,0.03)",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "rgba(0,229,255,0.1)";
                          e.currentTarget.style.boxShadow = "0 0 10px rgba(0,229,255,0.2)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "rgba(0,229,255,0.03)";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      >
                        투표하기
                      </Link>
                    )}
                  </div>

                  {/* Action buttons - compact */}
                  <div
                    className="flex items-center justify-between"
                    style={{ paddingTop: "8px", borderTop: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <div className="flex items-center" style={{ gap: "6px" }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleLike(entry.id); }}
                        className="flex items-center cursor-pointer transition-all duration-200"
                        style={{
                          fontFamily: "var(--font-share-tech)",
                          fontSize: "10px",
                          gap: "4px",
                          padding: "4px 8px",
                          border: isLiked ? "1px solid rgba(255,45,149,0.4)" : "1px solid rgba(255,255,255,0.08)",
                          color: isLiked ? "#ff2d95" : "#888",
                          background: isLiked ? "rgba(255,45,149,0.08)" : "transparent",
                        }}
                      >
                        <span className={animatingId === entry.id ? "like-animate" : ""}>
                          {isLiked ? "\u2764" : "\u2661"}
                        </span>
                        <span>{entry.likes}</span>
                      </button>

                      <button
                        onClick={(e) => { e.stopPropagation(); handleShareCopy(entry.id); }}
                        className="flex items-center cursor-pointer transition-all duration-200"
                        style={{
                          fontFamily: "var(--font-share-tech)",
                          fontSize: "10px",
                          padding: "4px 8px",
                          border: copiedId === entry.id ? "1px solid rgba(57,255,20,0.4)" : "1px solid rgba(255,255,255,0.08)",
                          color: copiedId === entry.id ? "#39ff14" : "#888",
                          background: copiedId === entry.id ? "rgba(57,255,20,0.08)" : "transparent",
                        }}
                      >
                        {copiedId === entry.id ? "\u2713" : "\uD83D\uDD17"}
                      </button>
                    </div>

                    <Link
                      href={`/verdict/${entry.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="transition-all duration-200"
                      style={{
                        fontFamily: "var(--font-share-tech)",
                        fontSize: "10px",
                        padding: "4px 8px",
                        border: "1px solid transparent",
                        color: "#888",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "#00E5FF";
                        e.currentTarget.style.borderColor = "rgba(0,229,255,0.2)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "#888";
                        e.currentTarget.style.borderColor = "transparent";
                      }}
                    >
                      보기 &rarr;
                    </Link>
                  </div>

                  {/* Corner decorations */}
                  <div
                    className="absolute"
                    style={{
                      top: "4px",
                      right: "6px",
                      width: "6px",
                      height: "6px",
                      borderTop: "1px solid rgba(255,255,255,0.1)",
                      borderRight: "1px solid rgba(255,255,255,0.1)",
                    }}
                  />
                  <div
                    className="absolute"
                    style={{
                      bottom: "4px",
                      left: "6px",
                      width: "6px",
                      height: "6px",
                      borderBottom: "1px solid rgba(255,255,255,0.1)",
                      borderLeft: "1px solid rgba(255,255,255,0.1)",
                    }}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* ===== LOAD MORE ===== */}
        {hasMore && !isLoading && (
          <div className="flex justify-center" style={{ marginTop: "24px" }}>
            <button
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              style={{
                fontFamily: "var(--font-orbitron)",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                padding: "12px 32px",
                border: "1px solid rgba(0,229,255,0.3)",
                color: "#00E5FF",
                background: "rgba(0,229,255,0.05)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(0,229,255,0.1)";
                e.currentTarget.style.boxShadow = "0 0 12px rgba(0,229,255,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(0,229,255,0.05)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {isLoadingMore ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin-slow w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeDasharray="31.4 31.4"
                      strokeLinecap="round"
                    />
                  </svg>
                  로딩 중...
                </span>
              ) : (
                "더 보기"
              )}
            </button>
          </div>
        )}

        {/* ===== FOOTER ===== */}
        <footer className="text-center pt-12">
          <div className="holo-line mb-5" />
          <p
            className="uppercase"
            style={{
              fontFamily: "var(--font-share-tech)",
              fontSize: "10px",
              color: "#4b5563",
              letterSpacing: "0.3em",
            }}
          >
            Neon Court System &copy; 2026 &mdash; All judgments
            are AI-generated
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "16px", marginTop: "12px", fontFamily: "var(--font-share-tech)", fontSize: "9px", color: "#374151", letterSpacing: "0.15em" }}>
            <Link href="/terms" style={{ transition: "color 0.2s" }} onMouseEnter={e => (e.currentTarget.style.color = "#22d3ee")} onMouseLeave={e => (e.currentTarget.style.color = "#374151")}>이용약관</Link>
            <span>|</span>
            <Link href="/privacy" style={{ transition: "color 0.2s" }} onMouseEnter={e => (e.currentTarget.style.color = "#22d3ee")} onMouseLeave={e => (e.currentTarget.style.color = "#374151")}>개인정보처리방침</Link>
            <span>|</span>
            <Link href="/legal" style={{ transition: "color 0.2s" }} onMouseEnter={e => (e.currentTarget.style.color = "#f87171")} onMouseLeave={e => (e.currentTarget.style.color = "#374151")}>저작권 보호 및 법적 고지</Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
