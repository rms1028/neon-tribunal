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
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [isSliding, setIsSliding] = useState(false);
  const [showScanline, setShowScanline] = useState(false);
  const slideKey = useRef(0);

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

  /* ── Carousel navigation ── */
  const goToSlide = (newIndex: number) => {
    if (
      isSliding ||
      newIndex === highlightIndex ||
      highlightEntries.length === 0
    )
      return;
    setIsSliding(true);
    setShowScanline(true);

    setTimeout(() => {
      slideKey.current += 1;
      setHighlightIndex(newIndex);
      setTimeout(() => {
        setIsSliding(false);
        setShowScanline(false);
      }, 500);
    }, 250);
  };

  const goPrev = () => {
    const newIdx =
      highlightIndex === 0
        ? highlightEntries.length - 1
        : highlightIndex - 1;
    goToSlide(newIdx);
  };

  const goNext = () => {
    const newIdx =
      highlightIndex === highlightEntries.length - 1
        ? 0
        : highlightIndex + 1;
    goToSlide(newIdx);
  };

  /* ───────────────────────────────────────────────
   *  HIGHLIGHT CAROUSEL renderer
   * ─────────────────────────────────────────────── */
  const renderHighlightCarousel = () => {
    if (highlightEntries.length === 0) return null;
    const entry = highlightEntries[highlightIndex];
    if (!entry) return null;

    const judge = getJudgeData(entry.judge_id);
    const accentColor = judge?.accentColor || "#00f0ff";
    const glowRgb = judge?.glowRgb || "0,240,255";
    const isLiked = likedIds.has(entry.id);
    const total =
      (entry.jury_agree ?? 0) + (entry.jury_disagree ?? 0);
    const agreePercent =
      total > 0
        ? Math.round(((entry.jury_agree ?? 0) / total) * 100)
        : 0;
    const disagreePercent = total > 0 ? 100 - agreePercent : 0;

    return (
      <div className="mb-10">
        {/* Section label */}
        <div className="flex items-center gap-3 mb-4">
          <div
            style={{
              width: "4px",
              height: "24px",
              background:
                "linear-gradient(180deg, #ffaa00, #ff4444)",
              borderRadius: "2px",
              boxShadow: "0 0 8px rgba(255,170,0,0.5)",
            }}
          />
          <h2
            className="text-lg md:text-xl font-bold uppercase tracking-wider"
            style={{
              fontFamily: "var(--font-orbitron)",
              color: "#ffaa00",
              textShadow:
                "0 0 8px rgba(255,170,0,0.8), 0 0 30px rgba(255,170,0,0.4)",
            }}
          >
            {"\uD83D\uDD25"} 명예의 전당
          </h2>
          <span
            className="tracking-widest uppercase"
            style={{
              fontFamily: "var(--font-share-tech)",
              fontSize: "10px",
              color: "rgba(255,170,0,0.5)",
            }}
          >
            TOP {highlightEntries.length} LEGENDS
          </span>
          <span
            className="tracking-wider"
            style={{
              fontFamily: "var(--font-share-tech)",
              fontSize: "10px",
              color: "rgba(255,170,0,0.35)",
              marginLeft: "auto",
            }}
          >
            {highlightIndex + 1} / {highlightEntries.length}
          </span>
        </div>

        {/* Carousel wrapper */}
        <div className="relative">
          {/* Left arrow */}
          <button
            onClick={goPrev}
            disabled={isSliding}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 cursor-pointer transition-all duration-200 disabled:opacity-30 hidden sm:flex"
            style={{
              marginLeft: "-20px",
              width: "44px",
              height: "80px",
              background: "rgba(8,8,24,0.9)",
              border: "1px solid rgba(255,170,0,0.3)",
              color: "#ffaa00",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              clipPath:
                "polygon(30% 0, 100% 0, 100% 100%, 30% 100%, 0 50%)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background =
                "rgba(255,170,0,0.12)";
              e.currentTarget.style.boxShadow =
                "0 0 20px rgba(255,170,0,0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background =
                "rgba(8,8,24,0.9)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ width: "18px", height: "18px" }}
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          {/* Right arrow */}
          <button
            onClick={goNext}
            disabled={isSliding}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 cursor-pointer transition-all duration-200 disabled:opacity-30 hidden sm:flex"
            style={{
              marginRight: "-20px",
              width: "44px",
              height: "80px",
              background: "rgba(8,8,24,0.9)",
              border: "1px solid rgba(255,170,0,0.3)",
              color: "#ffaa00",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              clipPath:
                "polygon(0 0, 70% 0, 100% 50%, 70% 100%, 0 100%)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background =
                "rgba(255,170,0,0.12)";
              e.currentTarget.style.boxShadow =
                "0 0 20px rgba(255,170,0,0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background =
                "rgba(8,8,24,0.9)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ width: "18px", height: "18px" }}
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          {/* Card container */}
          <div
            className="relative overflow-hidden cyber-clip highlight-pulse"
            style={{
              background: "rgba(8,8,24,0.8)",
              backdropFilter: "blur(12px)",
              border: "2px solid rgba(255,170,0,0.5)",
            }}
          >
            {/* Scanline flash overlay */}
            {showScanline && <div className="carousel-scanline" />}

            {/* Badge */}
            <div
              className="absolute badge-flicker"
              style={{
                top: "-1px",
                left: "24px",
                padding: "6px 16px",
                background:
                  "linear-gradient(135deg, #ffaa00, #ff6600)",
                color: "#000",
                fontFamily: "var(--font-orbitron)",
                fontSize: "10px",
                fontWeight: 800,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                clipPath:
                  "polygon(0 0, calc(100% - 10px) 0, 100% 100%, 0 100%)",
                boxShadow:
                  "0 0 15px rgba(255,170,0,0.6), 0 4px 12px rgba(0,0,0,0.4)",
                zIndex: 10,
              }}
            >
              {"\uD83D\uDC51"} #{highlightIndex + 1} 명예의 전당
            </div>

            {/* Slide content with glitch transition */}
            <div
              key={slideKey.current}
              className="carousel-enter"
            >
              <div className="p-4 sm:p-6 md:p-8 pt-12 sm:pt-12 md:pt-10">
                {/* Judge header */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    {judge ? (
                      <JudgeAvatar
                        avatarUrl={judge.avatarUrl}
                        name={judge.name}
                        size={36}
                        glowRgb={glowRgb}
                      />
                    ) : (
                      <span className="text-3xl">
                        {"\u2696"}
                      </span>
                    )}
                    <div>
                      <span
                        className="font-bold text-sm uppercase tracking-wide"
                        style={{
                          fontFamily: "var(--font-orbitron)",
                          color: accentColor,
                        }}
                      >
                        {entry.judge_name}
                      </span>
                      <p
                        className="tracking-wider"
                        style={{
                          fontFamily: "var(--font-share-tech)",
                          fontSize: "10px",
                          color: "#6b7280",
                          marginTop: "2px",
                        }}
                      >
                        {timeAgo(entry.created_at)} &middot;{" "}
                        {"\u2764"} {entry.likes}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/verdict/${entry.id}`}
                    className="hidden sm:inline-block px-5 py-2.5 text-xs font-bold uppercase tracking-widest transition-all duration-200"
                    style={{
                      fontFamily: "var(--font-orbitron)",
                      border: "1px solid rgba(255,170,0,0.4)",
                      color: "#ffaa00",
                      background: "rgba(255,170,0,0.05)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        "rgba(255,170,0,0.15)";
                      e.currentTarget.style.boxShadow =
                        "0 0 20px rgba(255,170,0,0.3)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background =
                        "rgba(255,170,0,0.05)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    자세히 보기 &rarr;
                  </Link>
                </div>

                {/* Two-column: Story + Verdict */}
                <div
                  className="flex flex-col md:flex-row gap-5 mb-6"
                  style={{ minHeight: "120px" }}
                >
                  {/* Story */}
                  <div
                    className="flex-1"
                    style={{
                      padding: "16px 18px",
                      borderRadius: "8px",
                      background: "rgba(255,255,255,0.04)",
                      borderLeft:
                        "3px solid rgba(255,170,0,0.4)",
                    }}
                  >
                    <p
                      className="uppercase mb-2"
                      style={{
                        fontFamily: "var(--font-share-tech)",
                        fontSize: "9px",
                        color: "rgba(255,170,0,0.6)",
                        letterSpacing: "0.15em",
                      }}
                    >
                      {"\uD83D\uDCDD"} 사연
                    </p>
                    <p
                      className="leading-relaxed whitespace-pre-wrap"
                      style={{
                        fontFamily: "var(--font-share-tech)",
                        fontSize: "13px",
                        color: "#d1d5db",
                        fontStyle: "italic",
                      }}
                    >
                      &quot;{entry.story}&quot;
                    </p>
                  </div>

                  {/* Verdict */}
                  <div
                    className="flex-1"
                    style={{
                      padding: "16px 18px",
                      borderRadius: "8px",
                      background: "rgba(255,68,68,0.03)",
                      borderLeft:
                        "3px solid rgba(255,68,68,0.35)",
                    }}
                  >
                    <p
                      className="uppercase mb-2"
                      style={{
                        fontFamily: "var(--font-share-tech)",
                        fontSize: "9px",
                        color: "rgba(255,68,68,0.7)",
                        letterSpacing: "0.15em",
                      }}
                    >
                      {"\u2696\uFE0F"} AI 판결
                    </p>
                    <p
                      className="leading-relaxed whitespace-pre-wrap"
                      style={{
                        fontFamily: "var(--font-share-tech)",
                        fontSize: "13px",
                        color: "#e5e7eb",
                      }}
                    >
                      {entry.verdict}
                    </p>
                  </div>
                </div>

                {/* Vote gauge — 32px */}
                <div
                  className="p-4"
                  style={{
                    borderRadius: "6px",
                    border: "1px solid rgba(255,170,0,0.15)",
                    background: "rgba(255,170,0,0.02)",
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="uppercase"
                      style={{
                        fontFamily: "var(--font-share-tech)",
                        fontSize: "10px",
                        color: "rgba(255,170,0,0.6)",
                        letterSpacing: "0.15em",
                      }}
                    >
                      {"\uD83D\uDDF3\uFE0F"} 배심원단 투표 현황
                    </span>
                    <span
                      className="tracking-wider"
                      style={{
                        fontFamily: "var(--font-share-tech)",
                        fontSize: "10px",
                        color: "#6b7280",
                      }}
                    >
                      {total > 0
                        ? `${total}명 참여`
                        : "투표 대기 중"}
                    </span>
                  </div>
                  <div
                    className="flex overflow-hidden"
                    style={{
                      height: "32px",
                      borderRadius: "6px",
                      background: "rgba(255,255,255,0.06)",
                    }}
                  >
                    {total > 0 ? (
                      <>
                        <div
                          className="transition-all duration-700 ease-out flex items-center justify-center"
                          style={{
                            width: `${agreePercent}%`,
                            height: "100%",
                            background:
                              "linear-gradient(90deg, #39ff14, rgba(57,255,20,0.6))",
                            boxShadow:
                              "0 0 20px rgba(57,255,20,0.6), inset 0 0 12px rgba(57,255,20,0.3)",
                            fontFamily:
                              "var(--font-share-tech)",
                            fontSize: "11px",
                            fontWeight: 700,
                            color: "rgba(0,0,0,0.7)",
                          }}
                        >
                          {agreePercent >= 15
                            ? `${agreePercent}%`
                            : ""}
                        </div>
                        <div
                          className="transition-all duration-700 ease-out flex items-center justify-center"
                          style={{
                            width: `${disagreePercent}%`,
                            height: "100%",
                            background:
                              "linear-gradient(90deg, rgba(255,45,149,0.6), #ff2d95)",
                            boxShadow:
                              "0 0 20px rgba(255,45,149,0.6), inset 0 0 12px rgba(255,45,149,0.3)",
                            fontFamily:
                              "var(--font-share-tech)",
                            fontSize: "11px",
                            fontWeight: 700,
                            color: "rgba(255,255,255,0.9)",
                          }}
                        >
                          {disagreePercent >= 15
                            ? `${disagreePercent}%`
                            : ""}
                        </div>
                      </>
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          background: "rgba(255,255,255,0.03)",
                        }}
                      />
                    )}
                  </div>
                  {total > 0 && (
                    <div className="flex justify-between mt-2">
                      <span
                        style={{
                          fontFamily: "var(--font-share-tech)",
                          fontSize: "10px",
                          color: "rgba(57,255,20,0.8)",
                        }}
                      >
                        {"\uD83D\uDC4D"} 공감 {agreePercent}%
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--font-share-tech)",
                          fontSize: "10px",
                          color: "rgba(255,45,149,0.8)",
                        }}
                      >
                        반대 {disagreePercent}%{" "}
                        {"\uD83D\uDC4E"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Bottom actions */}
                <div
                  className="flex items-center justify-between mt-5 pt-4"
                  style={{
                    borderTop:
                      "1px solid rgba(255,170,0,0.1)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleLike(entry.id)}
                      className="flex items-center gap-2 px-4 py-2 text-xs tracking-wider transition-all duration-200 cursor-pointer"
                      style={{
                        fontFamily: "var(--font-share-tech)",
                        border: isLiked
                          ? "1px solid rgba(255,45,149,0.5)"
                          : "1px solid rgba(255,170,0,0.3)",
                        color: isLiked
                          ? "#ff2d95"
                          : "#ffaa00",
                        background: isLiked
                          ? "rgba(255,45,149,0.1)"
                          : "rgba(255,170,0,0.05)",
                        boxShadow: isLiked
                          ? "0 0 12px rgba(255,45,149,0.2)"
                          : "none",
                      }}
                      onMouseEnter={(e) => {
                        if (!isLiked) {
                          e.currentTarget.style.background =
                            "rgba(255,170,0,0.12)";
                          e.currentTarget.style.boxShadow =
                            "0 0 15px rgba(255,170,0,0.2)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isLiked) {
                          e.currentTarget.style.background =
                            "rgba(255,170,0,0.05)";
                          e.currentTarget.style.boxShadow =
                            "none";
                        }
                      }}
                    >
                      <span
                        className={
                          animatingId === entry.id
                            ? "like-animate"
                            : ""
                        }
                      >
                        {isLiked ? "\u2764" : "\u2661"}
                      </span>
                      <span>{entry.likes}</span>
                    </button>

                    <button
                      onClick={() =>
                        handleShareCopy(entry.id)
                      }
                      className="flex items-center gap-1 px-4 py-2 tracking-wider transition-all duration-200 cursor-pointer"
                      style={{
                        fontFamily: "var(--font-share-tech)",
                        fontSize: "11px",
                        border:
                          copiedId === entry.id
                            ? "1px solid rgba(57,255,20,0.5)"
                            : "1px solid rgba(255,170,0,0.3)",
                        color:
                          copiedId === entry.id
                            ? "#39ff14"
                            : "#ffaa00",
                        background:
                          copiedId === entry.id
                            ? "rgba(57,255,20,0.1)"
                            : "rgba(255,170,0,0.05)",
                      }}
                      onMouseEnter={(e) => {
                        if (copiedId !== entry.id) {
                          e.currentTarget.style.background =
                            "rgba(255,170,0,0.12)";
                          e.currentTarget.style.boxShadow =
                            "0 0 15px rgba(255,170,0,0.2)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (copiedId !== entry.id) {
                          e.currentTarget.style.background =
                            "rgba(255,170,0,0.05)";
                          e.currentTarget.style.boxShadow =
                            "none";
                        }
                      }}
                    >
                      {copiedId === entry.id
                        ? "\u2713 복사됨"
                        : "\uD83D\uDD17 공유"}
                    </button>
                  </div>

                  <Link
                    href={`/verdict/${entry.id}`}
                    className="px-4 py-2 tracking-widest transition-all duration-200"
                    style={{
                      fontFamily: "var(--font-share-tech)",
                      fontSize: "11px",
                      border:
                        "1px solid rgba(255,170,0,0.25)",
                      color: "#ffaa00",
                      background: "rgba(255,170,0,0.03)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        "rgba(255,170,0,0.12)";
                      e.currentTarget.style.boxShadow =
                        "0 0 15px rgba(255,170,0,0.25)";
                      e.currentTarget.style.textShadow =
                        "0 0 8px rgba(255,170,0,0.5)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background =
                        "rgba(255,170,0,0.03)";
                      e.currentTarget.style.boxShadow =
                        "none";
                      e.currentTarget.style.textShadow =
                        "none";
                    }}
                  >
                    {"\uD83D\uDC49"} 투표하러 가기
                  </Link>
                </div>
              </div>
            </div>

            {/* Corner decorations — gold */}
            <div
              className="absolute"
              style={{
                top: "6px",
                right: "8px",
                width: "12px",
                height: "12px",
                borderTop: "2px solid rgba(255,170,0,0.5)",
                borderRight: "2px solid rgba(255,170,0,0.5)",
              }}
            />
            <div
              className="absolute"
              style={{
                bottom: "6px",
                left: "8px",
                width: "12px",
                height: "12px",
                borderBottom:
                  "2px solid rgba(255,170,0,0.5)",
                borderLeft: "2px solid rgba(255,170,0,0.5)",
              }}
            />
          </div>

          {/* ── DOT INDICATORS ── */}
          <div className="flex items-center justify-center gap-4 mt-5">
            {highlightEntries.map((_, idx) => {
              const isActive = idx === highlightIndex;
              return (
                <button
                  key={idx}
                  onClick={() => goToSlide(idx)}
                  disabled={isSliding}
                  className={`transition-all duration-300 cursor-pointer ${
                    isActive ? "dot-active" : ""
                  }`}
                  style={{
                    width: isActive ? "28px" : "10px",
                    height: "10px",
                    borderRadius: isActive ? "5px" : "50%",
                    background: isActive
                      ? "linear-gradient(90deg, #ffaa00, #ff6600)"
                      : "rgba(255,170,0,0.2)",
                    border: "none",
                    padding: "8px 0",
                    boxSizing: "content-box",
                    boxShadow: isActive
                      ? "0 0 8px rgba(255,170,0,0.6)"
                      : "none",
                  }}
                  aria-label={`슬라이드 ${idx + 1}`}
                />
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  /* ───────────────────────────────────────────────
   *  RENDER
   * ─────────────────────────────────────────────── */
  return (
    <div className="min-h-screen cyber-grid crt-overlay relative overflow-hidden pt-14">
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
        className="relative z-10 w-full mx-auto px-4 md:px-8 lg:px-10 py-12"
        style={{ maxWidth: "95%" }}
      >
        {/* ===== HEADER ===== */}
        <div className="text-center mb-10">
          <h1
            className="text-2xl sm:text-4xl md:text-5xl font-black uppercase tracking-wider mb-4"
            style={{
              fontFamily: "var(--font-orbitron)",
              color: "#ffffff",
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
            className="text-sm md:text-base tracking-wider"
            style={{
              fontFamily: "var(--font-share-tech)",
              color: "#9ca3af",
              wordBreak: "keep-all",
            }}
          >
            국민 배심원단이 소집된 재판을 모아볼 수 있습니다
          </p>
        </div>

        <div className="holo-line mb-8" />

        {/* ===== SORT BUTTONS ===== */}
        <div className="flex gap-4 mb-8 justify-center flex-nowrap overflow-x-auto scrollbar-hide">
          {(
            [
              {
                key: "newest" as SortMode,
                label: "\u23F0 최신순",
                color: "240,225,48",
              },
              {
                key: "popular" as SortMode,
                label: "\u2764 공감순",
                color: "255,45,149",
              },
            ] as const
          ).map((tab) => {
            const isActive = sort === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => handleSortChange(tab.key)}
                className="cyber-clip-btn px-6 py-3 text-xs tracking-widest uppercase border transition-all duration-300 cursor-pointer whitespace-nowrap shrink-0"
                style={{
                  fontFamily: "var(--font-share-tech)",
                  borderColor: isActive
                    ? `rgb(${tab.color})`
                    : "rgba(255,255,255,0.18)",
                  color: isActive
                    ? `rgb(${tab.color})`
                    : "#9ca3af",
                  backgroundColor: isActive
                    ? `rgba(${tab.color},0.15)`
                    : "transparent",
                  boxShadow: isActive
                    ? `0 0 20px rgba(${tab.color},0.25), inset 0 0 15px rgba(${tab.color},0.06)`
                    : "none",
                  textShadow: isActive
                    ? `0 0 8px rgba(${tab.color},0.7)`
                    : "none",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ===== JUDGE FILTER ===== */}
        <div className="flex gap-2 mb-8 justify-start md:justify-center flex-nowrap overflow-x-auto scrollbar-hide pb-1">
          <button
            onClick={() => handleJudgeFilter(null)}
            className="px-4 py-2.5 tracking-widest border transition-all duration-300 cursor-pointer whitespace-nowrap shrink-0"
            style={{
              fontFamily: "var(--font-share-tech)",
              fontSize: "10px",
              borderColor:
                judgeFilter === null
                  ? "var(--color-neon-blue)"
                  : "rgba(255,255,255,0.18)",
              color:
                judgeFilter === null
                  ? "var(--color-neon-blue)"
                  : "#9ca3af",
              backgroundColor:
                judgeFilter === null
                  ? "rgba(0,240,255,0.15)"
                  : "transparent",
              boxShadow:
                judgeFilter === null
                  ? "0 0 15px rgba(0,240,255,0.2), inset 0 0 10px rgba(0,240,255,0.05)"
                  : "none",
              textShadow:
                judgeFilter === null
                  ? "0 0 8px rgba(0,240,255,0.6)"
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
                className="px-4 py-2.5 tracking-widest border transition-all duration-300 cursor-pointer whitespace-nowrap shrink-0"
                style={{
                  fontFamily: "var(--font-share-tech)",
                  fontSize: "10px",
                  borderColor: isActive
                    ? j.accentColor
                    : "rgba(255,255,255,0.18)",
                  color: isActive ? j.accentColor : "#9ca3af",
                  backgroundColor: isActive
                    ? `${j.accentColor}26`
                    : "transparent",
                  boxShadow: isActive
                    ? `0 0 15px ${j.accentColor}33, inset 0 0 10px ${j.accentColor}0d`
                    : "none",
                  textShadow: isActive
                    ? `0 0 8px ${j.accentColor}b3`
                    : "none",
                }}
              >
                <JudgeAvatar
                  avatarUrl={j.avatarUrl}
                  name={j.name}
                  size={18}
                  className="inline-block align-middle mr-1"
                />{" "}
                {j.name}
              </button>
            );
          })}
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
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
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
                  className={`verdict-card cyber-clip glass-card relative p-3 sm:p-6 cursor-pointer ${
                    isExpanded
                      ? "col-span-2 lg:col-span-3 xl:col-span-4"
                      : ""
                  }`}
                  style={{
                    ["--card-glow-color" as string]:
                      accentColor,
                    boxShadow: isExpanded
                      ? `0 0 30px rgba(${glowRgb},0.15), inset 0 0 30px rgba(${glowRgb},0.03)`
                      : undefined,
                  }}
                  onClick={() =>
                    setExpandedId(
                      isExpanded ? null : entry.id
                    )
                  }
                >
                  {/* Judge header */}
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                      {judge ? (
                        <JudgeAvatar
                          avatarUrl={judge.avatarUrl}
                          name={judge.name}
                          size={22}
                          glowRgb={glowRgb}
                          className="shrink-0 sm:[&]:w-7 sm:[&]:h-7"
                        />
                      ) : (
                        <span className="text-lg sm:text-2xl shrink-0">
                          {"\u2696"}
                        </span>
                      )}
                      <span
                        className="font-bold uppercase tracking-wide truncate"
                        style={{
                          fontFamily:
                            "var(--font-orbitron)",
                          fontSize: "clamp(9px, 2.5vw, 12px)",
                          color: accentColor,
                        }}
                      >
                        {entry.judge_name}
                      </span>
                    </div>
                    <span
                      className="tracking-wider shrink-0 hidden sm:inline"
                      style={{
                        fontFamily:
                          "var(--font-share-tech)",
                        fontSize: "9px",
                        color: "#4b5563",
                      }}
                    >
                      {timeAgo(entry.created_at)}
                    </span>
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
                    className="mb-2 sm:mb-3"
                    style={{
                      padding: "8px 10px",
                      borderRadius: "6px",
                      background:
                        "rgba(255,255,255,0.05)",
                      borderLeft: `2px solid rgba(${glowRgb},0.35)`,
                    }}
                  >
                    <p
                      className={`leading-relaxed whitespace-pre-wrap ${!isExpanded ? "line-clamp-2 sm:line-clamp-none" : ""}`}
                      style={{
                        fontFamily:
                          "var(--font-share-tech)",
                        fontSize: "clamp(10px, 2.5vw, 11px)",
                        color: "#9ca3af",
                        fontStyle: "italic",
                      }}
                    >
                      &quot;
                      {isExpanded || !storyTruncated
                        ? entry.story
                        : entry.story.slice(0, 100) +
                          "..."}
                      &quot;
                    </p>
                  </div>

                  {/* Verdict */}
                  <div className="mb-2 sm:mb-4">
                    <p
                      className="uppercase mb-1 sm:mb-1.5 hidden sm:block"
                      style={{
                        fontFamily:
                          "var(--font-share-tech)",
                        fontSize: "9px",
                        color: "#4b5563",
                        letterSpacing: "0.15em",
                      }}
                    >
                      AI 판결
                    </p>
                    <p
                      className={`leading-relaxed whitespace-pre-wrap ${
                        !isExpanded
                          ? "line-clamp-2 sm:line-clamp-3"
                          : ""
                      }`}
                      style={{
                        fontFamily:
                          "var(--font-share-tech)",
                        fontSize: "clamp(10px, 2.5vw, 12px)",
                        color: "#e5e7eb",
                      }}
                    >
                      {entry.verdict}
                    </p>
                  </div>

                  {/* Vote gauge */}
                  <div
                    className="mb-2 sm:mb-4 p-2 sm:p-3"
                    style={{
                      borderRadius: "4px",
                      border: `1px solid rgba(${glowRgb},0.15)`,
                      background: `rgba(${glowRgb},0.02)`,
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between mb-1 sm:mb-2">
                      <span
                        className="uppercase hidden sm:inline"
                        style={{
                          fontFamily:
                            "var(--font-share-tech)",
                          fontSize: "9px",
                          color: "#6b7280",
                          letterSpacing: "0.15em",
                        }}
                      >
                        배심원단 투표 현황
                      </span>
                      <span
                        className="tracking-wider"
                        style={{
                          fontFamily:
                            "var(--font-share-tech)",
                          fontSize: "9px",
                          color: "#4b5563",
                        }}
                      >
                        {total > 0
                          ? `${total}명 참여`
                          : "투표 대기 중"}
                      </span>
                    </div>
                    <div
                      className="flex overflow-hidden"
                      style={{
                        height: "16px",
                        borderRadius: "4px",
                        background:
                          "rgba(255,255,255,0.06)",
                      }}
                    >
                      {total > 0 ? (
                        <>
                          <div
                            className="transition-all duration-700 ease-out"
                            style={{
                              width: `${agreePercent}%`,
                              height: "100%",
                              background:
                                "linear-gradient(90deg, #39ff14, rgba(57,255,20,0.6))",
                              boxShadow:
                                "0 0 12px rgba(57,255,20,0.6), inset 0 0 8px rgba(57,255,20,0.3)",
                            }}
                          />
                          <div
                            className="transition-all duration-700 ease-out"
                            style={{
                              width: `${disagreePercent}%`,
                              height: "100%",
                              background:
                                "linear-gradient(90deg, rgba(255,45,149,0.6), #ff2d95)",
                              boxShadow:
                                "0 0 12px rgba(255,45,149,0.6), inset 0 0 8px rgba(255,45,149,0.3)",
                            }}
                          />
                        </>
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            background:
                              "rgba(255,255,255,0.03)",
                          }}
                        />
                      )}
                    </div>
                    {total > 0 && (
                      <div className="flex justify-between mt-1.5">
                        <span
                          style={{
                            fontFamily:
                              "var(--font-share-tech)",
                            fontSize: "9px",
                            color: "rgba(57,255,20,0.7)",
                          }}
                        >
                          {"\uD83D\uDC4D"} {agreePercent}%
                        </span>
                        <span
                          style={{
                            fontFamily:
                              "var(--font-share-tech)",
                            fontSize: "9px",
                            color:
                              "rgba(255,45,149,0.7)",
                          }}
                        >
                          {disagreePercent}%{" "}
                          {"\uD83D\uDC4E"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Vote CTA - hidden on mobile compact, visible on sm+ or expanded */}
                  <div
                    className={`${isExpanded ? "" : "hidden sm:block"}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {isAuthor ? (
                      <div
                        className="text-center py-2 sm:py-2.5 mb-2 sm:mb-4"
                        style={{
                          borderRadius: "4px",
                          border: `1px solid rgba(${glowRgb},0.2)`,
                          background: `rgba(${glowRgb},0.03)`,
                        }}
                      >
                        <p
                          className="tracking-wide"
                          style={{
                            fontFamily:
                              "var(--font-share-tech)",
                            fontSize: "10px",
                            color: accentColor,
                          }}
                        >
                          {"\u2696\uFE0F"} 내 사연
                        </p>
                      </div>
                    ) : (
                      <Link
                        href={`/verdict/${entry.id}`}
                        className="flex items-center justify-center gap-2 w-full py-2 sm:py-3 mb-2 sm:mb-4 tracking-wider transition-all duration-200"
                        style={{
                          fontFamily:
                            "var(--font-share-tech)",
                          fontSize: "11px",
                          border:
                            "1px solid rgba(0,240,255,0.25)",
                          color: "#00f0ff",
                          background:
                            "rgba(0,240,255,0.03)",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background =
                            "rgba(0,240,255,0.1)";
                          e.currentTarget.style.boxShadow =
                            "0 0 15px rgba(0,240,255,0.2)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background =
                            "rgba(0,240,255,0.03)";
                          e.currentTarget.style.boxShadow =
                            "none";
                        }}
                      >
                        {"\uD83D\uDC49"} 투표하기
                      </Link>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div
                    className="flex items-center justify-between pt-2 sm:pt-3"
                    style={{
                      borderTop:
                        "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLike(entry.id);
                        }}
                        className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-2.5 text-xs tracking-wider transition-all duration-200 cursor-pointer"
                        style={{
                          fontFamily:
                            "var(--font-share-tech)",
                          border: isLiked
                            ? "1px solid rgba(255,45,149,0.5)"
                            : "1px solid var(--color-dark-border)",
                          color: isLiked
                            ? "#ff2d95"
                            : "#6b7280",
                          background: isLiked
                            ? "rgba(255,45,149,0.1)"
                            : "transparent",
                          boxShadow: isLiked
                            ? "0 0 10px rgba(255,45,149,0.2)"
                            : "none",
                        }}
                        onMouseEnter={(e) => {
                          if (!isLiked) {
                            e.currentTarget.style.color =
                              "#ff2d95";
                            e.currentTarget.style.borderColor =
                              "rgba(255,45,149,0.4)";
                            e.currentTarget.style.background =
                              "rgba(255,45,149,0.05)";
                            e.currentTarget.style.boxShadow =
                              "0 0 12px rgba(255,45,149,0.2)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isLiked) {
                            e.currentTarget.style.color =
                              "#6b7280";
                            e.currentTarget.style.borderColor =
                              "var(--color-dark-border)";
                            e.currentTarget.style.background =
                              "transparent";
                            e.currentTarget.style.boxShadow =
                              "none";
                          }
                        }}
                      >
                        <span
                          className={
                            animatingId === entry.id
                              ? "like-animate"
                              : ""
                          }
                        >
                          {isLiked ? "\u2764" : "\u2661"}
                        </span>
                        <span>{entry.likes}</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShareCopy(entry.id);
                        }}
                        className="flex items-center gap-1 px-2 sm:px-4 py-2 sm:py-2.5 tracking-wider transition-all duration-200 cursor-pointer"
                        style={{
                          fontFamily:
                            "var(--font-share-tech)",
                          fontSize: "10px",
                          border:
                            copiedId === entry.id
                              ? "1px solid rgba(57,255,20,0.5)"
                              : "1px solid var(--color-dark-border)",
                          color:
                            copiedId === entry.id
                              ? "#39ff14"
                              : "#6b7280",
                          background:
                            copiedId === entry.id
                              ? "rgba(57,255,20,0.1)"
                              : "transparent",
                          boxShadow:
                            copiedId === entry.id
                              ? "0 0 10px rgba(57,255,20,0.2)"
                              : "none",
                        }}
                        onMouseEnter={(e) => {
                          if (copiedId !== entry.id) {
                            e.currentTarget.style.color =
                              "#00f0ff";
                            e.currentTarget.style.borderColor =
                              "rgba(0,240,255,0.4)";
                            e.currentTarget.style.background =
                              "rgba(0,240,255,0.05)";
                            e.currentTarget.style.boxShadow =
                              "0 0 12px rgba(0,240,255,0.2)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (copiedId !== entry.id) {
                            e.currentTarget.style.color =
                              "#6b7280";
                            e.currentTarget.style.borderColor =
                              "var(--color-dark-border)";
                            e.currentTarget.style.background =
                              "transparent";
                            e.currentTarget.style.boxShadow =
                              "none";
                          }
                        }}
                      >
                        {copiedId === entry.id
                          ? "\u2713"
                          : "\uD83D\uDD17"}
                      </button>
                    </div>

                    <Link
                      href={`/verdict/${entry.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="px-2 sm:px-4 py-2 sm:py-2.5 tracking-widest transition-all duration-200"
                      style={{
                        fontFamily:
                          "var(--font-share-tech)",
                        fontSize: "10px",
                        border: "1px solid transparent",
                        color: "#6b7280",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color =
                          "#00f0ff";
                        e.currentTarget.style.borderColor =
                          "rgba(0,240,255,0.3)";
                        e.currentTarget.style.background =
                          "rgba(0,240,255,0.05)";
                        e.currentTarget.style.boxShadow =
                          "0 0 12px rgba(0,240,255,0.15)";
                        e.currentTarget.style.textShadow =
                          "0 0 6px rgba(0,240,255,0.5)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color =
                          "#6b7280";
                        e.currentTarget.style.borderColor =
                          "transparent";
                        e.currentTarget.style.background =
                          "transparent";
                        e.currentTarget.style.boxShadow =
                          "none";
                        e.currentTarget.style.textShadow =
                          "none";
                      }}
                    >
                      보기 &rarr;
                    </Link>
                  </div>

                  {/* Corner decorations */}
                  <div
                    className="absolute"
                    style={{
                      top: "6px",
                      right: "8px",
                      width: "8px",
                      height: "8px",
                      borderTop: `1px solid rgba(${glowRgb},0.3)`,
                      borderRight: `1px solid rgba(${glowRgb},0.3)`,
                    }}
                  />
                  <div
                    className="absolute"
                    style={{
                      bottom: "6px",
                      left: "8px",
                      width: "8px",
                      height: "8px",
                      borderBottom: `1px solid rgba(${glowRgb},0.3)`,
                      borderLeft: `1px solid rgba(${glowRgb},0.3)`,
                    }}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* ===== LOAD MORE ===== */}
        {hasMore && !isLoading && (
          <div className="flex justify-center mt-10">
            <button
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="cyber-clip-btn px-10 py-4 text-xs font-bold uppercase tracking-widest transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                fontFamily: "var(--font-orbitron)",
                letterSpacing: "0.2em",
                border: "1px solid rgba(240,225,48,0.4)",
                color: "var(--color-neon-yellow)",
                background: "rgba(240,225,48,0.05)",
                boxShadow: "0 0 15px rgba(240,225,48,0.1)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background =
                  "rgba(240,225,48,0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background =
                  "rgba(240,225,48,0.05)";
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
        </footer>
      </div>
    </div>
  );
}
