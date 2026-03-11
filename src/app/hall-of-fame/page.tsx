"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { judges } from "@/lib/judges";
import type { HallOfFameEntry, HallOfFameListResponse } from "@/lib/types";
import { trackEvent } from "@/lib/analytics";
import JudgeAvatar from "@/components/JudgeAvatar";
import InlineComments from "@/components/InlineComments";
import "./hall-of-fame.css";

const LIKED_KEY = "neon-court-liked-ids";
const MY_VERDICTS_KEY = "neon-court-my-verdicts";
const JURY_VOTES_KEY = "neon-court-jury-votes";
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

function getDeleteTokens(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem("neon-court-delete-tokens");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

type VoteType = "agree" | "disagree";

function getJuryVotes(): Record<string, VoteType> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(JURY_VOTES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveJuryVotes(votes: Record<string, VoteType>) {
  localStorage.setItem(JURY_VOTES_KEY, JSON.stringify(votes));
}

function removeJuryVote(verdictId: string) {
  const votes = getJuryVotes();
  delete votes[verdictId];
  localStorage.setItem(JURY_VOTES_KEY, JSON.stringify(votes));
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


  const [sort, setSort] = useState<SortMode>("newest");
  const [judgeFilter, setJudgeFilter] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [animatingId, setAnimatingId] = useState<string | null>(null);
  const [myVerdicts, setMyVerdicts] = useState<Set<string>>(new Set());
  const [juryVotes, setJuryVotes] = useState<Record<string, VoteType>>({});
  const [isVoting, setIsVoting] = useState(false);

  // New state for redesign
  const [commentsOpenId, setCommentsOpenId] = useState<string | null>(null);
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [expandedStoryId, setExpandedStoryId] = useState<string | null>(null);
  const [expandedVerdictId, setExpandedVerdictId] = useState<string | null>(null);
  const [voteAnimId, setVoteAnimId] = useState<string | null>(null);
  const [voteAnimType, setVoteAnimType] = useState<VoteType | null>(null);
  const [visibleEntries, setVisibleEntries] = useState<Set<string>>(new Set());
  const [deleteTokens, setDeleteTokens] = useState<Record<string, string>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [carouselIdx, setCarouselIdx] = useState(0);
  const touchStartX = useRef(0);

  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    setLikedIds(getLikedIds());
    setMyVerdicts(getMyVerdicts());
    setJuryVotes(getJuryVotes());
    setDeleteTokens(getDeleteTokens());
  }, []);

  /* scroll listener removed — hero collapse unused */

  // IntersectionObserver for staggered slide-up
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (obs) => {
        obs.forEach((e) => {
          if (e.isIntersecting) {
            setVisibleEntries((prev) => new Set([...prev, e.target.getAttribute("data-entry-id") || ""]));
            observerRef.current?.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    return () => observerRef.current?.disconnect();
  }, []);

  // Observe new cards
  useEffect(() => {
    const observer = observerRef.current;
    if (!observer) return;
    cardRefs.current.forEach((el, id) => {
      if (!visibleEntries.has(id)) {
        observer.observe(el);
      }
    });
  }, [entries, visibleEntries]);

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
        // Set comment counts from response
        const counts: Record<string, number> = {};
        data.entries.forEach((e) => {
          if (e.comment_count !== undefined) {
            counts[e.id] = e.comment_count;
          }
        });
        setCommentCounts((prev) => append ? { ...prev, ...counts } : counts);
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

  // 캐러셀 자동 슬라이드 (5초)
  useEffect(() => {
    if (highlightEntries.length <= 1) return;
    const timer = setInterval(() => {
      setCarouselIdx((prev) => (prev + 1) % highlightEntries.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [carouselIdx, highlightEntries.length]);

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

  const handleDelete = async (id: string) => {
    const token = deleteTokens[id] || "";
    if (!confirm("정말 이 사연을 삭제하시겠습니까? 삭제하면 복구할 수 없습니다.")) return;

    setDeletingId(id);
    try {
      const res = await fetch("/api/hall-of-fame", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, deleteToken: token }),
      });
      if (res.ok) {
        // Remove from entries list
        setEntries((prev) => prev.filter((e) => e.id !== id));
        // Remove from localStorage
        const myV = getMyVerdicts();
        myV.delete(id);
        localStorage.setItem(MY_VERDICTS_KEY, JSON.stringify([...myV]));
        setMyVerdicts(myV);
        // Remove delete token
        const tokens = { ...deleteTokens };
        delete tokens[id];
        localStorage.setItem("neon-court-delete-tokens", JSON.stringify(tokens));
        setDeleteTokens(tokens);
      } else {
        const data = await res.json();
        alert(data.error || "삭제에 실패했습니다.");
      }
    } catch {
      alert("네트워크 오류로 삭제에 실패했습니다.");
    } finally {
      setDeletingId(null);
    }
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

  const handleJuryVote = async (entryId: string, vote: VoteType) => {
    if (isVoting) return;
    trackEvent("jury_voted", { vote_type: vote, verdict_id: entryId });
    setIsVoting(true);

    // Trigger glow animation
    setVoteAnimId(entryId);
    setVoteAnimType(vote);
    setTimeout(() => {
      setVoteAnimId(null);
      setVoteAnimType(null);
    }, 600);

    const prevVote = juryVotes[entryId] || null;

    const updateEntryVotes = (
      list: HallOfFameEntry[],
      agreeDelta: number,
      disagreeDelta: number
    ) =>
      list.map((e) =>
        e.id === entryId
          ? {
              ...e,
              jury_agree: Math.max(0, (e.jury_agree ?? 0) + agreeDelta),
              jury_disagree: Math.max(0, (e.jury_disagree ?? 0) + disagreeDelta),
            }
          : e
      );

    try {
      if (prevVote === vote) {
        // Cancel vote
        const newVotes = { ...juryVotes };
        delete newVotes[entryId];
        setJuryVotes(newVotes);
        removeJuryVote(entryId);
        const ad = vote === "agree" ? -1 : 0;
        const dd = vote === "disagree" ? -1 : 0;
        setEntries((prev) => updateEntryVotes(prev, ad, dd));
        setHighlightEntries((prev) => updateEntryVotes(prev, ad, dd));

        const res = await fetch(`/api/hall-of-fame/${entryId}/jury-vote`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vote }),
        });
        if (!res.ok) throw new Error();
      } else if (prevVote && prevVote !== vote) {
        // Change vote
        const newVotes = { ...juryVotes, [entryId]: vote };
        setJuryVotes(newVotes);
        saveJuryVotes(newVotes);
        const ad = vote === "agree" ? 1 : -1;
        const dd = vote === "disagree" ? 1 : -1;
        setEntries((prev) => updateEntryVotes(prev, ad, dd));
        setHighlightEntries((prev) => updateEntryVotes(prev, ad, dd));

        const res = await fetch(`/api/hall-of-fame/${entryId}/jury-vote`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ from: prevVote, to: vote }),
        });
        if (!res.ok) throw new Error();
      } else {
        // New vote
        const newVotes = { ...juryVotes, [entryId]: vote };
        setJuryVotes(newVotes);
        saveJuryVotes(newVotes);
        const ad = vote === "agree" ? 1 : 0;
        const dd = vote === "disagree" ? 1 : 0;
        setEntries((prev) => updateEntryVotes(prev, ad, dd));
        setHighlightEntries((prev) => updateEntryVotes(prev, ad, dd));

        const res = await fetch(`/api/hall-of-fame/${entryId}/jury-vote`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vote }),
        });
        if (!res.ok) throw new Error();
      }
    } catch {
      // rollback
      if (prevVote) {
        const rollback = { ...juryVotes, [entryId]: prevVote };
        setJuryVotes(rollback);
        saveJuryVotes(rollback);
      } else {
        const rollback = { ...juryVotes };
        delete rollback[entryId];
        setJuryVotes(rollback);
        removeJuryVote(entryId);
      }
      fetchEntries(sort, 0, judgeFilter);
    } finally {
      setIsVoting(false);
    }
  };

  const getJudgeData = (judgeId: string) =>
    judges.find((j) => j.id === judgeId);

  /* ───────────────────────────────────────────────
   *  HIGHLIGHT CAROUSEL renderer (single-slide)
   * ─────────────────────────────────────────────── */
  const carouselGo = (idx: number) => {
    const total = highlightEntries.length;
    setCarouselIdx(((idx % total) + total) % total);
  };

  const renderHighlightCarousel = () => {
    if (highlightEntries.length === 0) return null;
    const entry = highlightEntries[carouselIdx] || highlightEntries[0];
    const judge = getJudgeData(entry.judge_id);
    const accentColor = judge?.accentColor || "#00f0ff";
    const glowRgb = judge?.glowRgb || "0,240,255";
    const isGold = carouselIdx === 0;

    return (
      <div className="hof-highlight-section" style={{ marginBottom: "16px" }}>
        {/* Carousel container */}
        <div
          style={{
            position: "relative",
            background: `linear-gradient(135deg, rgba(${glowRgb}, 0.06), rgba(${glowRgb}, 0.02), #0e0e18)`,
            border: isGold ? "1.5px solid rgba(255,215,0,0.4)" : `1px solid rgba(${glowRgb}, 0.2)`,
            borderRadius: 16,
            padding: "20px 52px",
            overflow: "hidden",
            minHeight: "150px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
          onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
          onTouchEnd={(e) => {
            const diff = touchStartX.current - e.changedTouches[0].clientX;
            if (Math.abs(diff) > 40) carouselGo(carouselIdx + (diff > 0 ? 1 : -1));
          }}
        >
          {/* Gold glow for #1 */}
          {isGold && (
            <div style={{
              position: "absolute", inset: 0, pointerEvents: "none",
              boxShadow: "inset 0 0 40px rgba(255,215,0,0.06), 0 0 20px rgba(255,215,0,0.08)",
              borderRadius: 16,
            }} />
          )}

          {/* Left arrow */}
          {highlightEntries.length > 1 && (
            <button
              onClick={() => carouselGo(carouselIdx - 1)}
              style={{
                position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)",
                width: 36, height: 36, borderRadius: "50%",
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                color: "#888", fontSize: "18px", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.2s", zIndex: 2,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#888"; }}
            >
              {"\u25C0"}
            </button>
          )}

          {/* Right arrow */}
          {highlightEntries.length > 1 && (
            <button
              onClick={() => carouselGo(carouselIdx + 1)}
              style={{
                position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                width: 36, height: 36, borderRadius: "50%",
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                color: "#888", fontSize: "18px", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.2s", zIndex: 2,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#888"; }}
            >
              {"\u25B6"}
            </button>
          )}

          {/* Slide content — key forces re-mount for animation */}
          <div
            key={entry.id}
            style={{ animation: "fadeIn 0.4s ease" }}
          >
            {/* Top row: rank + author + judge badge + likes */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
              <span style={{
                fontFamily: "var(--font-orbitron)", fontSize: "10px", fontWeight: 800,
                padding: "2px 10px", borderRadius: 4,
                background: isGold ? "linear-gradient(135deg, #FFD700, #ff8c00)" : `rgba(${glowRgb}, 0.15)`,
                color: isGold ? "#000" : accentColor,
                letterSpacing: "0.08em",
              }}>
                {"\uD83C\uDFC6"} #{carouselIdx + 1}
              </span>
              <span style={{ fontSize: "16px", lineHeight: 1 }}>{entry.author_icon || "😎"}</span>
              <span style={{
                fontFamily: "var(--font-share-tech)", fontSize: "13px", fontWeight: 700, color: "#ddd",
              }}>
                {entry.author_nickname || "익명의 시민"}
              </span>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: "3px",
                padding: "1px 6px", borderRadius: 99,
                background: `rgba(${glowRgb}, 0.08)`,
                border: `1px solid rgba(${glowRgb}, 0.15)`,
              }}>
                {judge && <JudgeAvatar avatarUrl={judge.avatarUrl} name={judge.name} size={12} />}
                <span style={{
                  fontFamily: "var(--font-share-tech)", fontSize: "9px", color: "#888",
                }}>
                  {entry.judge_name}
                </span>
              </div>
              <span style={{
                marginLeft: "auto", fontFamily: "var(--font-share-tech)",
                fontSize: "13px", color: "#ff2d95", fontWeight: 600,
              }}>
                {"\u2764"} {entry.likes}
              </span>
            </div>

            {/* Story title */}
            <div style={{
              fontWeight: 800, fontSize: "18px", color: "#fff",
              lineHeight: 1.4, marginBottom: "8px",
              wordBreak: "keep-all", overflowWrap: "break-word",
              display: "-webkit-box", WebkitBoxOrient: "vertical" as const,
              WebkitLineClamp: 2, overflow: "hidden",
            }}>
              &ldquo;{entry.story}&rdquo;
            </div>

            {/* TLDR pill + verdict 1-line */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              {entry.tldr && (
                <span style={{
                  display: "inline-block",
                  background: `rgba(${glowRgb}, 0.12)`,
                  border: `1px solid rgba(${glowRgb}, 0.3)`,
                  borderRadius: 99, padding: "3px 14px",
                  fontWeight: 900, fontSize: "12px", color: accentColor,
                  flexShrink: 0,
                }}>
                  {entry.tldr}
                </span>
              )}
              {entry.viral_quote && (
                <span style={{
                  fontFamily: "var(--font-share-tech)", fontSize: "13px",
                  color: "#888", fontStyle: "italic",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  flex: 1, minWidth: 0,
                }}>
                  &ldquo;{entry.viral_quote}&rdquo;
                </span>
              )}
            </div>
          </div>

          {/* Dot indicators */}
          {highlightEntries.length > 1 && (
            <div style={{
              display: "flex", justifyContent: "center", gap: "6px",
              marginTop: "14px",
            }}>
              {highlightEntries.map((_, i) => (
                <button
                  key={i}
                  onClick={() => carouselGo(i)}
                  style={{
                    width: i === carouselIdx ? 20 : 8,
                    height: 8, borderRadius: 99, border: "none",
                    background: i === carouselIdx ? "#ffaa00" : "rgba(255,255,255,0.15)",
                    cursor: "pointer", padding: 0,
                    transition: "all 0.3s ease",
                    boxShadow: i === carouselIdx ? "0 0 8px rgba(255,170,0,0.5)" : "none",
                  }}
                />
              ))}
            </div>
          )}
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

      {/* SINGLE COLUMN FEED CONTAINER */}
      <div
        className="relative z-10 mx-auto hof-container px-4"
        style={{ maxWidth: "none", paddingTop: "16px", paddingBottom: "80px", paddingLeft: "clamp(16px, 3vw, 40px)", paddingRight: "clamp(16px, 3vw, 40px)" }}
      >
        {/* ===== HEADER ===== */}
        <div className="hof-header" style={{ textAlign: "center", marginBottom: "20px", paddingTop: "8px" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "10px",
            marginBottom: "6px",
          }}>
            <div style={{
              width: 36, height: 2,
              background: "linear-gradient(90deg, transparent, #39ff14)",
              borderRadius: 99,
            }} />
            <span style={{
              fontFamily: "var(--font-share-tech)", fontSize: "10px",
              color: "#39ff14", letterSpacing: "0.25em", textTransform: "uppercase",
            }}>
              NEON COURT
            </span>
            <div style={{
              width: 36, height: 2,
              background: "linear-gradient(90deg, #39ff14, transparent)",
              borderRadius: 99,
            }} />
          </div>
          <h1
            className="hof-title"
            style={{
              fontFamily: "var(--font-orbitron)",
              fontSize: "32px",
              fontWeight: 900,
              color: "#fff",
              margin: "0 0 8px",
              letterSpacing: "-0.5px",
              textShadow: "0 0 30px rgba(57,255,20,0.15), 0 0 60px rgba(57,255,20,0.05)",
            }}
          >
            공개 재판소
          </h1>
          <p
            className="hof-subtitle"
            style={{
              fontFamily: "var(--font-share-tech)",
              fontSize: "14px",
              color: "#888",
              margin: 0,
              letterSpacing: "0.06em",
            }}
          >
            AI 판결에 투표하고, 배심원으로 참여하세요
          </p>
          <div style={{
            width: 48, height: 2, margin: "12px auto 0",
            background: "linear-gradient(90deg, #ff2d95, #39ff14)",
            borderRadius: 99,
          }} />
        </div>

        {/* ===== FILTER + SORT ===== */}
        <div
          className="hof-filter-row"
          style={{ display: "flex", gap: "6px", marginBottom: "14px", overflowX: "auto", paddingBottom: "4px" }}
        >
          <button
            onClick={() => handleJudgeFilter(null)}
            className="shrink-0 cursor-pointer transition-all duration-200 hof-filter-btn"
            style={{
              fontFamily: "var(--font-share-tech)",
              fontSize: "13px",
              fontWeight: 500,
              padding: "8px 18px",
              borderRadius: 99,
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              border: judgeFilter === null
                ? "1px solid rgba(57,255,20,0.4)"
                : "1px solid rgba(255,255,255,0.06)",
              color: judgeFilter === null ? "#39ff14" : "#777",
              background: judgeFilter === null
                ? "rgba(57,255,20,0.1)"
                : "rgba(255,255,255,0.03)",
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
                className="shrink-0 cursor-pointer transition-all duration-200 hof-filter-btn"
                style={{
                  fontFamily: "var(--font-share-tech)",
                  fontSize: "13px",
                  fontWeight: 500,
                  padding: "8px 18px",
                  borderRadius: 99,
                  whiteSpace: "nowrap",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  border: isActive
                    ? `1px solid ${j.accentColor}40`
                    : "1px solid rgba(255,255,255,0.06)",
                  color: isActive ? j.accentColor : "#777",
                  background: isActive
                    ? `rgba(${j.glowRgb},0.1)`
                    : "rgba(255,255,255,0.03)",
                }}
              >
                <JudgeAvatar
                  avatarUrl={j.avatarUrl}
                  name={j.name}
                  size={16}
                />
                {j.name}
              </button>
            );
          })}
        </div>

        {/* ===== HIGHLIGHT CAROUSEL ===== */}
        {renderHighlightCarousel()}

        {/* ===== SORT BUTTONS ===== */}
        <div style={{ display: "flex", gap: "6px", marginBottom: "14px" }}>
          <button
            onClick={() => handleSortChange("newest")}
            className="shrink-0 cursor-pointer transition-all duration-200"
            style={{
              fontFamily: "var(--font-share-tech)",
              fontSize: "13px",
              fontWeight: 600,
              padding: "7px 16px",
              borderRadius: 99,
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              border: sort === "newest" ? "1px solid rgba(0,229,255,0.4)" : "1px solid rgba(255,255,255,0.06)",
              color: sort === "newest" ? "#00E5FF" : "#666",
              background: sort === "newest" ? "rgba(0,229,255,0.08)" : "rgba(255,255,255,0.03)",
            }}
          >
            {"\u23F0"} 최신순
          </button>
          <button
            onClick={() => handleSortChange("popular")}
            className="shrink-0 cursor-pointer transition-all duration-200"
            style={{
              fontFamily: "var(--font-share-tech)",
              fontSize: "13px",
              fontWeight: 600,
              padding: "7px 16px",
              borderRadius: 99,
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              border: sort === "popular" ? "1px solid rgba(255,45,149,0.4)" : "1px solid rgba(255,255,255,0.06)",
              color: sort === "popular" ? "#ff2d95" : "#666",
              background: sort === "popular" ? "rgba(255,45,149,0.08)" : "rgba(255,255,255,0.03)",
            }}
          >
            {"\u2764"} 공감순
          </button>
        </div>

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

        {/* ===== SINGLE COLUMN FEED ===== */}
        {!isLoading && entries.length > 0 && (
          <div className="hof-grid" style={{ display: "grid", gap: "16px" }}>
            {entries.map((entry, idx) => {
              const judge = getJudgeData(entry.judge_id);
              const isLiked = likedIds.has(entry.id);
              const accentColor = judge?.accentColor || "#00f0ff";
              const glowRgb = judge?.glowRgb || "0,240,255";
              const isAuthor = myVerdicts.has(entry.id);
              const isCommentsOpen = commentsOpenId === entry.id;
              const isStoryExpanded = expandedStoryId === entry.id;
              const isVerdictExpanded = expandedVerdictId === entry.id;
              const total =
                (entry.jury_agree ?? 0) + (entry.jury_disagree ?? 0);
              const agreePercent =
                total > 0
                  ? Math.round(((entry.jury_agree ?? 0) / total) * 100)
                  : 0;
              const disagreePercent = total > 0 ? 100 - agreePercent : 0;
              const isVisible = visibleEntries.has(entry.id);
              const isVoteGlow = voteAnimId === entry.id;
              const cCount = commentCounts[entry.id] || 0;
              const isHot = entry.likes >= 10;

              return (
                <div
                  key={entry.id}
                  ref={(el) => {
                    if (el) cardRefs.current.set(entry.id, el);
                  }}
                  data-entry-id={entry.id}
                  className={`verdict-card relative hof-card ${
                    isVoteGlow && voteAnimType === "agree" ? "vote-glow-green" : ""
                  } ${isVoteGlow && voteAnimType === "disagree" ? "vote-glow-pink" : ""}`}
                  style={{
                    background: "#13131f",
                    border: "1px solid #1e1e35",
                    borderRadius: "16px",
                    padding: "0",
                    overflow: "hidden",
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? "translateY(0)" : "translateY(24px)",
                    transition: "opacity 0.5s ease, transform 0.5s ease, border-color 0.3s",
                    transitionDelay: `${(idx % PAGE_SIZE) * 0.08}s`,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${accentColor}44`; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#1e1e35"; }}
                >
                  {/* ── Card content ── */}
                  <div className="hof-card-content" style={{ padding: "18px 20px 0" }}>

                  {/* 1. Author + HOT + time (한 줄) */}
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
                    <span style={{ fontSize: "18px", lineHeight: 1, flexShrink: 0 }}>
                      {entry.author_icon || "😎"}
                    </span>
                    <span style={{
                      fontFamily: "var(--font-share-tech)",
                      fontWeight: 700, fontSize: "13px",
                      color: "#ddd", letterSpacing: "0.03em",
                    }}>
                      {entry.author_nickname || "익명의 시민"}
                    </span>
                    {isHot && (
                      <span className="hot-badge" style={{
                        background: "rgba(255,46,151,0.15)", color: "#ff2d95",
                        padding: "2px 7px", borderRadius: 99, fontSize: "9px",
                        fontFamily: "var(--font-share-tech)", fontWeight: 700,
                        border: "1px solid rgba(255,46,151,0.2)",
                      }}>{"\uD83D\uDD25"} HOT</span>
                    )}
                    {isAuthor && (
                      <span style={{
                        fontFamily: "var(--font-orbitron)", fontSize: "8px", fontWeight: 700,
                        padding: "2px 6px", borderRadius: 99,
                        border: `1px solid rgba(${glowRgb},0.3)`,
                        color: accentColor, background: `rgba(${glowRgb},0.08)`,
                      }}>MY</span>
                    )}
                    <span style={{
                      marginLeft: "auto", fontFamily: "var(--font-share-tech)",
                      fontSize: "11px", color: "#555", flexShrink: 0,
                    }}>
                      {timeAgo(entry.created_at)}
                    </span>
                    {isAuthor && (
                      <button
                        onClick={() => handleDelete(entry.id)}
                        disabled={deletingId === entry.id}
                        style={{
                          background: "none", border: "none", cursor: "pointer",
                          padding: "2px 4px", fontSize: "14px", color: "#555",
                          opacity: deletingId === entry.id ? 0.4 : 0.7,
                          transition: "opacity 0.2s, color 0.2s",
                          flexShrink: 0,
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = "#ff4444"; e.currentTarget.style.opacity = "1"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = "#555"; e.currentTarget.style.opacity = "0.7"; }}
                        title="사연 삭제"
                      >
                        {deletingId === entry.id ? "..." : "\uD83D\uDDD1"}
                      </button>
                    )}
                  </div>

                  {/* 2. 사연 제목 — 가장 크고 밝게 */}
                  <div style={{
                    fontWeight: 800,
                    fontSize: "18px", color: "#ffffff",
                    lineHeight: 1.45, marginBottom: "12px",
                    wordBreak: "keep-all", overflowWrap: "break-word",
                    display: "-webkit-box", WebkitBoxOrient: "vertical" as const,
                    WebkitLineClamp: isStoryExpanded ? 9999 : 2,
                    overflow: isStoryExpanded ? "visible" : "hidden",
                  }}>
                    &ldquo;{entry.story}&rdquo;
                  </div>
                  {entry.story.length > 40 && (
                    <button
                      onClick={() => setExpandedStoryId(isStoryExpanded ? null : entry.id)}
                      style={{
                        fontFamily: "var(--font-share-tech)", fontSize: "11px",
                        color: "#666", background: "none", border: "none",
                        cursor: "pointer", padding: 0, marginBottom: "10px", marginTop: "-8px",
                      }}
                    >{isStoryExpanded ? "접기 ▲" : "더보기.."}</button>
                  )}

                  {/* 4. VERDICT 영역 */}
                  <div style={{
                    background: `rgba(${glowRgb}, 0.03)`,
                    border: `1px solid rgba(${glowRgb}, 0.1)`,
                    borderRadius: 12, padding: "14px 16px",
                    marginBottom: "12px",
                  }}>
                    {/* Judge label */}
                    <div style={{
                      display: "flex", alignItems: "center", gap: "6px",
                      marginBottom: entry.tldr ? "8px" : "8px",
                    }}>
                      <span style={{
                        fontFamily: "var(--font-orbitron)",
                        fontSize: "9px", fontWeight: 700,
                        letterSpacing: "0.15em", textTransform: "uppercase" as const,
                        color: accentColor, opacity: 0.8,
                      }}>VERDICT</span>
                      <div style={{
                        display: "inline-flex", alignItems: "center", gap: "4px",
                        padding: "2px 8px", borderRadius: 99,
                        background: `rgba(${glowRgb}, 0.08)`,
                        border: `1px solid rgba(${glowRgb}, 0.15)`,
                      }}>
                        <div style={{
                          width: 14, height: 14, borderRadius: 4, overflow: "hidden",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0,
                        }}>
                          {judge ? (
                            <JudgeAvatar avatarUrl={judge.avatarUrl} name={judge.name} size={14} />
                          ) : (
                            <span style={{ fontSize: "9px" }}>{"\u2696"}</span>
                          )}
                        </div>
                        <span style={{
                          fontFamily: "var(--font-share-tech)",
                          fontSize: "10px", color: "#999",
                        }}>
                          {entry.judge_name}
                        </span>
                      </div>
                    </div>
                    {entry.tldr && (
                      <div style={{ marginBottom: "8px" }}>
                        <span style={{
                          display: "inline-block",
                          background: `rgba(${glowRgb}, 0.12)`,
                          border: `1px solid rgba(${glowRgb}, 0.3)`,
                          borderRadius: 99, padding: "4px 14px",
                          fontWeight: 900, fontSize: "13px", color: accentColor,
                        }}>
                          {entry.tldr}
                        </span>
                      </div>
                    )}
                    <div style={{
                      fontFamily: "var(--font-share-tech)", fontSize: "14px",
                      color: "#ccc", lineHeight: 1.6,
                      display: "-webkit-box", WebkitBoxOrient: "vertical" as const,
                      WebkitLineClamp: isVerdictExpanded ? 9999 : 2,
                      overflow: isVerdictExpanded ? "visible" : "hidden",
                      whiteSpace: "pre-wrap",
                    }}>
                      {entry.verdict}
                    </div>
                    {entry.verdict.length > 60 && (
                      <button
                        onClick={() => setExpandedVerdictId(isVerdictExpanded ? null : entry.id)}
                        style={{
                          fontFamily: "var(--font-share-tech)", fontSize: "11px",
                          color: accentColor, background: "none", border: "none",
                          cursor: "pointer", padding: 0, marginTop: "6px",
                        }}
                      >{isVerdictExpanded ? "접기 ▲" : "더보기.."}</button>
                    )}
                  </div>

                  {/* 5. 투표 비율 바 */}
                  <div style={{ marginBottom: "10px" }}>
                    <div style={{
                      display: "flex", justifyContent: "space-between",
                      marginBottom: "5px", fontFamily: "var(--font-share-tech)", fontSize: "12px",
                    }}>
                      <span style={{ color: "#39ff14" }}>{"\uD83D\uDC4D"} 동의 {agreePercent}%</span>
                      <span style={{ color: "#ff2d95" }}>반대 {disagreePercent}% {"\uD83D\uDC4E"}</span>
                    </div>
                    <div style={{
                      width: "100%", height: "5px",
                      background: "rgba(255,46,151,0.25)", borderRadius: 99, overflow: "hidden",
                    }}>
                      <div className="vote-bar-animate" style={{
                        width: total > 0 ? `${agreePercent}%` : "0%",
                        height: "100%", borderRadius: 99,
                        background: "linear-gradient(90deg, #39ff14, #00ff88)",
                        transition: "width 0.5s ease",
                      }} />
                    </div>
                    {total > 0 && (
                      <div style={{
                        textAlign: "center", marginTop: "4px",
                        fontFamily: "var(--font-share-tech)", fontSize: "11px", color: "#555",
                      }}>
                        총 {total.toLocaleString()}명 참여
                      </div>
                    )}
                  </div>

                  {/* 6. 동의 / 반대 버튼 (한 줄) — 본인 사연이면 숨김 */}
                  {!isAuthor && (
                    <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
                      <button
                        onClick={() => handleJuryVote(entry.id, "agree")}
                        disabled={isVoting}
                        className="vote-btn"
                        style={{
                          flex: 1, borderRadius: 8,
                          cursor: isVoting ? "not-allowed" : "pointer",
                          fontFamily: "var(--font-share-tech)", fontWeight: 700, fontSize: "13px",
                          padding: "8px 0",
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                          transition: "all 0.2s",
                          background: juryVotes[entry.id] === "agree"
                            ? "linear-gradient(135deg, #39ff14, #00cc44)" : "rgba(57,255,20,0.08)",
                          color: juryVotes[entry.id] === "agree" ? "#000" : "#39ff14",
                          border: `1.5px solid ${juryVotes[entry.id] === "agree" ? "#39ff14" : "rgba(57,255,20,0.2)"}`,
                        }}
                      >
                        {"\uD83D\uDC4D"} {juryVotes[entry.id] === "agree" ? "동의함 ✓" : "동의"}
                      </button>
                      <button
                        onClick={() => handleJuryVote(entry.id, "disagree")}
                        disabled={isVoting}
                        className="vote-btn"
                        style={{
                          flex: 1, borderRadius: 8,
                          cursor: isVoting ? "not-allowed" : "pointer",
                          fontFamily: "var(--font-share-tech)", fontWeight: 700, fontSize: "13px",
                          padding: "8px 0",
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                          transition: "all 0.2s",
                          background: juryVotes[entry.id] === "disagree"
                            ? "linear-gradient(135deg, #ff2d95, #cc0044)" : "rgba(255,46,151,0.08)",
                          color: juryVotes[entry.id] === "disagree" ? "#fff" : "#ff2d95",
                          border: `1.5px solid ${juryVotes[entry.id] === "disagree" ? "#ff2d95" : "rgba(255,46,151,0.2)"}`,
                        }}
                      >
                        {"\uD83D\uDC4E"} {juryVotes[entry.id] === "disagree" ? "반대함 ✓" : "반대"}
                      </button>
                    </div>
                  )}

                  </div>{/* close hof-card-content */}

                  {/* 7. 하단: ♡ 좋아요 | 💬 댓글 */}
                  <div
                    className="hof-card-footer"
                    style={{
                      display: "flex", alignItems: "center",
                      background: "rgba(255,255,255,0.02)",
                      borderTop: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <button
                      onClick={() => handleLike(entry.id)}
                      style={{
                        flex: 1, background: "none", border: "none", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                        color: isLiked ? "#ff2d95" : "#aaa",
                        fontSize: "14px", fontFamily: "var(--font-share-tech)", fontWeight: 600,
                        padding: "12px 0",
                        transition: "color 0.2s, background 0.2s",
                      }}
                      onMouseEnter={(e) => { if (!isLiked) e.currentTarget.style.color = "#ff2d95"; }}
                      onMouseLeave={(e) => { if (!isLiked) e.currentTarget.style.color = "#aaa"; }}
                    >
                      <span className={animatingId === entry.id ? "like-animate" : ""} style={{ fontSize: "18px" }}>
                        {isLiked ? "\u2764" : "\u2661"}
                      </span>
                      좋아요 {entry.likes}
                    </button>

                    {/* 세로 구분선 */}
                    <div style={{ width: "1px", height: "20px", background: "rgba(255,255,255,0.08)" }} />

                    <button
                      onClick={() => setCommentsOpenId(isCommentsOpen ? null : entry.id)}
                      style={{
                        flex: 1, background: "none", border: "none", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                        color: isCommentsOpen ? accentColor : "#aaa",
                        fontSize: "14px", fontFamily: "var(--font-share-tech)", fontWeight: 600,
                        padding: "12px 0",
                        transition: "color 0.2s, background 0.2s",
                      }}
                      onMouseEnter={(e) => { if (!isCommentsOpen) e.currentTarget.style.color = accentColor; }}
                      onMouseLeave={(e) => { if (!isCommentsOpen) e.currentTarget.style.color = "#aaa"; }}
                    >
                      <span style={{ fontSize: "18px" }}>{"\uD83D\uDCAC"}</span>
                      댓글 {cCount}
                    </button>
                  </div>

                  {/* 댓글 인라인 토글 */}
                  {isCommentsOpen && (
                    <div style={{ padding: "0 16px 14px", animation: "fadeIn 0.3s ease" }}>
                      <InlineComments
                        verdictId={entry.id}
                        accentColor={accentColor}
                        glowRgb={glowRgb}
                        initialCount={cCount}
                        onCountChange={(n) =>
                          setCommentCounts((prev) => ({ ...prev, [entry.id]: n }))
                        }
                      />
                    </div>
                  )}
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
                borderRadius: 12,
                border: "1px solid rgba(0,229,255,0.3)",
                color: "#00E5FF",
                background: "rgba(0,229,255,0.05)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(0,229,255,0.1)";
                e.currentTarget.style.boxShadow =
                  "0 0 12px rgba(0,229,255,0.15)";
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
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "16px",
              marginTop: "12px",
              fontFamily: "var(--font-share-tech)",
              fontSize: "9px",
              color: "#374151",
              letterSpacing: "0.15em",
            }}
          >
            <Link
              href="/terms"
              style={{ transition: "color 0.2s" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "#22d3ee")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "#374151")
              }
            >
              이용약관
            </Link>
            <span>|</span>
            <Link
              href="/privacy"
              style={{ transition: "color 0.2s" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "#22d3ee")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "#374151")
              }
            >
              개인정보처리방침
            </Link>
            <span>|</span>
            <Link
              href="/legal"
              style={{ transition: "color 0.2s" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "#f87171")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "#374151")
              }
            >
              저작권 보호 및 법적 고지
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
