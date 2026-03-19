"use client";

import { useState, useEffect, useCallback, useRef, memo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { judges } from "@/lib/judges";
import type { HallOfFameEntry, HallOfFameListResponse } from "@/lib/types";
import { trackEvent } from "@/lib/analytics";
import JudgeAvatar from "@/components/JudgeAvatar";
import "./hall-of-fame.css";

const InlineComments = dynamic(() => import("@/components/InlineComments"), {
  loading: () => <div style={{ padding: "16px", textAlign: "center", fontFamily: "var(--font-share-tech)", fontSize: 11, color: "rgba(255,255,255,0.3)" }}>댓글 로딩 중...</div>,
});

const LIKED_KEY = "neon-court-liked-ids";
const MY_VERDICTS_KEY = "neon-court-my-verdicts";
const JURY_VOTES_KEY = "neon-court-jury-votes";
const PAGE_SIZE = 12;

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

function renderVerdictHtml(text: string): string {
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong style="color:rgba(255,255,255,0.92)">$1</strong>');
  html = html.replace(/([^\n])\s*(\d+)\.\s/g, '$1\n\n$2. ');
  return html.trim();
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

const BOOKMARKS_KEY = "neon-court-bookmarks";

function getBookmarkedIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(BOOKMARKS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveBookmarkedIds(ids: Set<string>) {
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify([...ids]));
}

function SkeletonCard({ delay = 0 }: { delay?: number }) {
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

type SortMode = "newest" | "popular";

export default function HallOfFamePage() {
  const [entries, setEntries] = useState<HallOfFameEntry[]>([]);
  const [sort, setSort] = useState<SortMode>("newest");
  const [judgeFilter, setJudgeFilter] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [animatingId, setAnimatingId] = useState<string | null>(null);
  const [myVerdicts, setMyVerdicts] = useState<Set<string>>(new Set());
  const [juryVotes, setJuryVotes] = useState<Record<string, VoteType>>({});
  const [isVoting, setIsVoting] = useState(false);
  const [commentsOpenId, setCommentsOpenId] = useState<string | null>(null);
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [expandedStoryId, setExpandedStoryId] = useState<string | null>(null);
  const [deleteTokens, setDeleteTokens] = useState<Record<string, string>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Feed-specific state
  const [showVerdictId, setShowVerdictId] = useState<string | null>(null);
  const [doubleTapId, setDoubleTapId] = useState<string | null>(null);
  const [voteAnimId, setVoteAnimId] = useState<string | null>(null);
  const [voteAnimType, setVoteAnimType] = useState<VoteType | null>(null);
  const lastTapRef = useRef<Record<string, number>>({});

  // New feature state
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [bookmarkAnimId, setBookmarkAnimId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [filterKey, setFilterKey] = useState(0);
  const [storyData, setStoryData] = useState<{
    judgeId: string;
    entries: HallOfFameEntry[];
    index: number;
  } | null>(null);

  // Search & Category
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [trendingKeywords, setTrendingKeywords] = useState<string[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Pull to refresh
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Story pause
  const [storyPaused, setStoryPaused] = useState(false);

  // Refs
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<() => void>(() => {});

  useEffect(() => {
    setLikedIds(getLikedIds());
    setMyVerdicts(getMyVerdicts());
    setJuryVotes(getJuryVotes());
    setDeleteTokens(getDeleteTokens());
    setBookmarkedIds(getBookmarkedIds());
  }, []);

  const fetchEntries = useCallback(
    async (sortMode: SortMode, cursorOffset: number, judge: string | null, append = false, search?: string, cat?: string | null) => {
      if (append) setIsLoadingMore(true);
      else setIsLoading(true);
      setLoadError(false);
      try {
        let url = `/api/hall-of-fame?sort=${sortMode}&cursor=${cursorOffset}`;
        if (judge) url += `&judge=${judge}`;
        if (search && search.length >= 2) url += `&q=${encodeURIComponent(search)}`;
        if (cat) url += `&category=${encodeURIComponent(cat)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("API error");
        const data: HallOfFameListResponse = await res.json();
        setEntries((prev) => append ? [...prev, ...data.entries] : data.entries);
        setHasMore(data.hasMore);
        const counts: Record<string, number> = {};
        data.entries.forEach((e) => {
          if (e.comment_count !== undefined) counts[e.id] = e.comment_count;
        });
        setCommentCounts((prev) => append ? { ...prev, ...counts } : counts);
      } catch {
        if (!append) setLoadError(true);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchEntries(sort, 0, judgeFilter, false, debouncedQuery, selectedCategory);
  }, [sort, judgeFilter, debouncedQuery, selectedCategory, fetchEntries]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      if (searchQuery !== debouncedQuery) {
        setOffset(0);
        setEntries([]);
        setFilterKey((k) => k + 1);
      }
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // Log search keywords for trending
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      fetch("/api/hall-of-fame/search-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: debouncedQuery }),
      }).catch(() => {});
    }
  }, [debouncedQuery]);

  // Fetch trending keywords on mount
  useEffect(() => {
    fetch("/api/hall-of-fame/trending")
      .then((r) => r.json())
      .then((data) => {
        if (data.trendingKeywords?.length > 0) {
          setTrendingKeywords(data.trendingKeywords.map((k: { keyword: string }) => k.keyword));
        }
      })
      .catch(() => {});
  }, []);

  const handleCategoryChange = (cat: string | null) => {
    if (cat === selectedCategory) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(cat);
    }
    setOffset(0);
    setEntries([]);
    setFilterKey((k) => k + 1);
  };

  const handleSortChange = (newSort: SortMode) => {
    if (newSort === sort) return;
    setSort(newSort);
    setOffset(0);
    setEntries([]);
    setFilterKey((k) => k + 1);
  };

  const handleJudgeFilter = (judgeId: string | null) => {
    if (judgeId === judgeFilter) return;
    setJudgeFilter(judgeId);
    setOffset(0);
    setEntries([]);
    setFilterKey((k) => k + 1);
  };

  const handleLoadMore = () => {
    const newOffset = offset + PAGE_SIZE;
    setOffset(newOffset);
    fetchEntries(sort, newOffset, judgeFilter, true, debouncedQuery, selectedCategory);
  };

  // Keep loadMoreRef always current to avoid stale closures in IntersectionObserver
  loadMoreRef.current = handleLoadMore;

  // Callback ref for infinite scroll sentinel
  const sentinelCallback = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) observerRef.current.disconnect();
    if (!node || !hasMore || isLoading || isLoadingMore) return;
    observerRef.current = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMoreRef.current(); },
      { rootMargin: "600px" }
    );
    observerRef.current.observe(node);
  }, [hasMore, isLoading, isLoadingMore]);

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
        setEntries((prev) => prev.filter((e) => e.id !== id));
        const myV = getMyVerdicts();
        myV.delete(id);
        localStorage.setItem(MY_VERDICTS_KEY, JSON.stringify([...myV]));
        setMyVerdicts(myV);
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
    setEntries((prev) => prev.map((e) => e.id === id ? { ...e, likes: e.likes + delta } : e));

    if (!isLiked) {
      setAnimatingId(id);
      setTimeout(() => setAnimatingId(null), 300);
    }

    try {
      const res = await fetch(`/api/hall-of-fame/${id}/like`, { method });
      if (!res.ok) throw new Error();
    } catch {
      const rollbackIds = new Set(likedIds);
      setLikedIds(rollbackIds);
      saveLikedIds(rollbackIds);
      setEntries((prev) => prev.map((e) => e.id === id ? { ...e, likes: e.likes - delta } : e));
    }
  };

  const handleJuryVote = async (entryId: string, vote: VoteType) => {
    if (isVoting) return;
    trackEvent("jury_voted", { vote_type: vote, verdict_id: entryId });
    setIsVoting(true);

    setVoteAnimId(entryId);
    setVoteAnimType(vote);
    setTimeout(() => { setVoteAnimId(null); setVoteAnimType(null); }, 600);

    const prevVote = juryVotes[entryId] || null;
    const updateVotes = (list: HallOfFameEntry[], ad: number, dd: number) =>
      list.map((e) => e.id === entryId ? {
        ...e,
        jury_agree: Math.max(0, (e.jury_agree ?? 0) + ad),
        jury_disagree: Math.max(0, (e.jury_disagree ?? 0) + dd),
      } : e);

    try {
      if (prevVote === vote) {
        const newVotes = { ...juryVotes };
        delete newVotes[entryId];
        setJuryVotes(newVotes);
        removeJuryVote(entryId);
        const ad = vote === "agree" ? -1 : 0;
        const dd = vote === "disagree" ? -1 : 0;
        setEntries((prev) => updateVotes(prev, ad, dd));
        const res = await fetch(`/api/hall-of-fame/${entryId}/jury-vote`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vote }),
        });
        if (!res.ok) throw new Error();
      } else if (prevVote && prevVote !== vote) {
        const newVotes = { ...juryVotes, [entryId]: vote };
        setJuryVotes(newVotes);
        saveJuryVotes(newVotes);
        const ad = vote === "agree" ? 1 : -1;
        const dd = vote === "disagree" ? 1 : -1;
        setEntries((prev) => updateVotes(prev, ad, dd));
        const res = await fetch(`/api/hall-of-fame/${entryId}/jury-vote`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ from: prevVote, to: vote }),
        });
        if (!res.ok) throw new Error();
      } else {
        const newVotes = { ...juryVotes, [entryId]: vote };
        setJuryVotes(newVotes);
        saveJuryVotes(newVotes);
        const ad = vote === "agree" ? 1 : 0;
        const dd = vote === "disagree" ? 1 : 0;
        setEntries((prev) => updateVotes(prev, ad, dd));
        const res = await fetch(`/api/hall-of-fame/${entryId}/jury-vote`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vote }),
        });
        if (!res.ok) throw new Error();
      }
    } catch {
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

  const handleDoubleTap = (entryId: string) => {
    const now = Date.now();
    const lastTap = lastTapRef.current[entryId] || 0;
    if (now - lastTap < 300) {
      if (!likedIds.has(entryId)) handleLike(entryId);
      setDoubleTapId(entryId);
      setTimeout(() => setDoubleTapId(null), 800);
    }
    lastTapRef.current[entryId] = now;
  };

  // ── Bookmark ──
  const handleBookmark = (id: string) => {
    const newIds = new Set(bookmarkedIds);
    if (newIds.has(id)) {
      newIds.delete(id);
      setToastMsg("저장 취소됨");
    } else {
      newIds.add(id);
      setToastMsg("저장됨 ✨");
      setBookmarkAnimId(id);
      setTimeout(() => setBookmarkAnimId(null), 300);
    }
    setBookmarkedIds(newIds);
    saveBookmarkedIds(newIds);
    setTimeout(() => setToastMsg(null), 2000);
  };

  // ── Story Overlay ──
  const openStory = async (judgeId: string) => {
    try {
      const res = await fetch(`/api/hall-of-fame?sort=popular&cursor=0&judge=${judgeId}`);
      if (!res.ok) return;
      const data: HallOfFameListResponse = await res.json();
      if (data.entries.length === 0) return;
      setStoryData({ judgeId, entries: data.entries.slice(0, 5), index: 0 });
      document.body.style.overflow = "hidden";
    } catch { /* ignore */ }
  };

  const closeStory = () => {
    setStoryData(null);
    setStoryPaused(false);
    document.body.style.overflow = "";
  };

  const storyNext = () => {
    setStoryData((prev) => {
      if (!prev) return null;
      if (prev.index >= prev.entries.length - 1) {
        document.body.style.overflow = "";
        return null;
      }
      return { ...prev, index: prev.index + 1 };
    });
  };

  const storyPrev = () => {
    setStoryData((prev) => {
      if (!prev || prev.index === 0) return prev;
      return { ...prev, index: prev.index - 1 };
    });
  };

  // Story auto-advance timer (pauses on touch)
  useEffect(() => {
    if (!storyData || storyPaused) return;
    const timer = setTimeout(() => {
      setStoryData((prev) => {
        if (!prev) return null;
        if (prev.index >= prev.entries.length - 1) {
          document.body.style.overflow = "";
          return null;
        }
        return { ...prev, index: prev.index + 1 };
      });
    }, 5000);
    return () => clearTimeout(timer);
  }, [storyData?.index, storyData?.judgeId, storyPaused]);

  // Story keyboard navigation
  useEffect(() => {
    if (!storyData) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeStory();
      if (e.key === "ArrowRight") storyNext();
      if (e.key === "ArrowLeft") storyPrev();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [storyData]);

  // IntersectionObserver is now handled via sentinelCallback ref

  // ── Pull to Refresh ──
  useEffect(() => {
    let startY = 0;
    let pulling = false;
    const pullRef = { current: 0 };

    const onTouchStart = (e: TouchEvent) => {
      if (window.scrollY <= 0 && !isRefreshing) {
        startY = e.touches[0].clientY;
        pulling = true;
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!pulling) return;
      const diff = e.touches[0].clientY - startY;
      if (diff > 0 && window.scrollY <= 0) {
        const d = Math.min(diff * 0.4, 80);
        pullRef.current = d;
        setPullDistance(d);
      } else {
        pulling = false;
        setPullDistance(0);
      }
    };
    const onTouchEnd = () => {
      if (pullRef.current > 60 && !isRefreshing) {
        setIsRefreshing(true);
        setOffset(0);
        fetchEntries(sort, 0, judgeFilter, false, debouncedQuery, selectedCategory).then(() => setIsRefreshing(false));
      }
      setPullDistance(0);
      pulling = false;
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRefreshing, sort, judgeFilter]);

  const getJudgeData = (judgeId: string) => judges.find((j) => j.id === judgeId);

  /* ─── RENDER ─── */
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", position: "relative" }}>
      {/* Background Effects */}
      <div style={{ position: "fixed", top: -100, right: -100, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,255,204,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: -50, left: -50, width: 250, height: 250, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,45,120,0.05) 0%, transparent 70%)", pointerEvents: "none" }} />

      {/* Content Column */}
      <div style={{ maxWidth: 430, margin: "0 auto", paddingTop: 48, paddingBottom: 140, position: "relative", overflowX: "hidden" as const }}>

        {/* ===== STORIES ROW (위) ===== */}
        <div className="feed-stories scrollbar-hide">
          {judges.map((j) => {
            const isActive = judgeFilter === j.id;
            const shortName = ({ "저스티스 제로": "저스티스", "하트 비트": "하트빗", "사이버 벵카": "벵카", "형사 네온": "형사네온" } as Record<string, string>)[j.name] || j.name;
            return (
              <button
                key={j.id}
                className="story-circle"
                onClick={() => openStory(j.id)}
              >
                <div
                  className="story-ring"
                  style={{
                    background: `linear-gradient(135deg, ${j.accentColor}, ${j.accentColor}88)`,
                    boxShadow: isActive ? `0 0 12px ${j.accentColor}66` : "none",
                  }}
                >
                  <div className="story-inner">
                    <JudgeAvatar avatarUrl={j.avatarUrl} name={j.name} size={28} />
                  </div>
                </div>
                <span className="story-name" style={isActive ? { color: j.accentColor, fontWeight: 700 } : {}}>
                  {shortName}
                </span>
              </button>
            );
          })}
          <button
            className="story-circle"
            onClick={() => { if (sort !== "popular") handleSortChange("popular"); }}
          >
            <div className="story-ring" style={{ background: "linear-gradient(135deg, #FFD700, #ff8c00)" }}>
              <div className="story-inner">
                <span style={{ fontSize: 22 }}>🏆</span>
              </div>
            </div>
            <span className="story-name" style={sort === "popular" ? { color: "#FFD700", fontWeight: 700 } : {}}>
              명예전당
            </span>
          </button>
        </div>

        {/* ===== FILTER TABS (Sticky) ===== */}
        <div className="feed-tabs">
          <div className="feed-tabs-scroll scrollbar-hide">
            <button
              onClick={() => handleJudgeFilter(null)}
              className="feed-tab"
              style={judgeFilter === null ? {
                border: "1px solid rgba(0,255,204,0.4)",
                color: "#00ffcc",
                background: "rgba(0,255,204,0.08)",
              } : {}}
            >
              ⚡ 전체
            </button>
            {judges.map((j) => {
              const isActive = judgeFilter === j.id;
              return (
                <button
                  key={j.id}
                  onClick={() => handleJudgeFilter(j.id)}
                  className="feed-tab"
                  style={isActive ? {
                    borderColor: j.accentColor,
                    color: j.accentColor,
                    background: `rgba(${j.glowRgb},0.08)`,
                  } : {}}
                >
                  <JudgeAvatar avatarUrl={j.avatarUrl} name={j.name} size={16} />
                  {j.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* ===== SEARCH BAR ===== */}
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
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              placeholder="사연이나 판결을 검색하세요..."
              style={{
                flex: 1, background: "transparent", border: "none", outline: "none",
                color: "var(--text-primary)", fontFamily: "var(--font-share-tech)", fontSize: 13,
              }}
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(""); setDebouncedQuery(""); }}
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
                  onClick={() => { setSearchQuery(kw); }}
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

        {/* ===== CATEGORY CHIPS ===== */}
        <div className="feed-tabs-scroll scrollbar-hide" style={{ padding: "6px 12px" }}>
          {[
            { id: "연애", emoji: "💕" },
            { id: "직장", emoji: "💼" },
            { id: "가족", emoji: "👨‍👩‍👧" },
            { id: "친구", emoji: "🤝" },
            { id: "돈", emoji: "💰" },
            { id: "학교", emoji: "🎓" },
            { id: "이웃", emoji: "🏘️" },
            { id: "기타", emoji: "📌" },
          ].map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                className="feed-tab"
                style={isActive ? {
                  borderColor: "rgba(180,74,255,0.4)",
                  color: "#b44aff",
                  background: "rgba(180,74,255,0.08)",
                } : {}}
              >
                {cat.emoji} {cat.id}
              </button>
            );
          })}
        </div>

        {/* ===== SORT BAR ===== */}
        <div className="feed-sort">
          {(["newest", "popular"] as SortMode[]).map((s) => {
            const isActive = sort === s;
            const cfg = s === "newest"
              ? { label: "⏰ 최신순", color: "#00E5FF" }
              : { label: "🔥 인기순", color: "#ff2d78" };
            return (
              <button
                key={s}
                onClick={() => handleSortChange(s)}
                className="feed-tab"
                style={isActive ? {
                  borderColor: `${cfg.color}66`,
                  color: cfg.color,
                  background: `${cfg.color}14`,
                } : {}}
              >
                {cfg.label}
              </button>
            );
          })}
        </div>

        {/* ===== PULL REFRESH INDICATOR ===== */}
        {(pullDistance > 0 || isRefreshing) && (
          <div className="pull-indicator" style={{ height: isRefreshing ? 48 : pullDistance }}>
            <svg
              style={{
                width: 24, height: 24, color: "#00ffcc",
                animation: isRefreshing ? "spin 1s linear infinite" : "none",
                transform: `rotate(${Math.min(pullDistance * 4, 360)}deg)`,
                transition: isRefreshing ? "none" : "transform 0.1s",
                opacity: pullDistance > 20 || isRefreshing ? 1 : pullDistance / 20,
              }}
              viewBox="0 0 24 24" fill="none"
            >
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="31.4 31.4" strokeLinecap="round" />
            </svg>
            {isRefreshing && (
              <span style={{ fontFamily: "var(--font-share-tech)", fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 4, letterSpacing: "0.15em" }}>
                새로운 재판을 찾는 중...
              </span>
            )}
          </div>
        )}

        {/* ===== LOADING ===== */}
        {isLoading && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0" }}>
            <svg style={{ width: 40, height: 40, marginBottom: 16, color: "#00ffcc", animation: "spin 1s linear infinite" }} viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="31.4 31.4" strokeLinecap="round" />
            </svg>
            <p style={{ fontFamily: "var(--font-share-tech)", fontSize: 12, color: "rgba(255,255,255,0.4)", letterSpacing: "0.2em" }}>
              DATA_LOADING...
            </p>
          </div>
        )}

        {/* ===== ERROR ===== */}
        {!isLoading && loadError && entries.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: 48, opacity: 0.3, marginBottom: 16 }}>⚠️</div>
            <p style={{ fontFamily: "var(--font-share-tech)", fontSize: 13, color: "rgba(255,255,255,0.4)", letterSpacing: "0.15em" }}>
              데이터를 불러오지 못했습니다
            </p>
            <p style={{ fontFamily: "var(--font-share-tech)", fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 8 }}>
              네트워크 연결을 확인하고 다시 시도해주세요
            </p>
            <button
              onClick={() => { setOffset(0); fetchEntries(sort, 0, judgeFilter); }}
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
        )}

        {/* ===== EMPTY ===== */}
        {!isLoading && entries.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: 48, opacity: 0.3, marginBottom: 16 }}>
              {debouncedQuery || selectedCategory ? "🔍" : "⚖️"}
            </div>
            <p style={{ fontFamily: "var(--font-share-tech)", fontSize: 13, color: "rgba(255,255,255,0.4)", letterSpacing: "0.15em" }}>
              {debouncedQuery
                ? `"${debouncedQuery}" 검색 결과가 없습니다`
                : selectedCategory
                  ? `"${selectedCategory}" 카테고리에 판결이 없습니다`
                  : judgeFilter
                    ? "해당 판사의 재판이 아직 없어요"
                    : "아직 등록된 판결이 없습니다"}
            </p>
            <p style={{ fontFamily: "var(--font-share-tech)", fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 8 }}>
              {debouncedQuery || selectedCategory
                ? "다른 키워드나 카테고리로 검색해보세요!"
                : judgeFilter
                  ? "다른 판사를 선택하거나 새 재판을 열어보세요!"
                  : "판결을 받고 국민 배심원을 소집해보세요!"}
            </p>
            {(debouncedQuery || selectedCategory) && (
              <button
                onClick={() => { setSearchQuery(""); setDebouncedQuery(""); setSelectedCategory(null); }}
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
            {!debouncedQuery && !selectedCategory && (
              <button
                onClick={() => { setOffset(0); fetchEntries(sort, 0, judgeFilter); }}
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
        )}

        {/* ===== FEED ===== */}
        {!isLoading && entries.length > 0 && (
          <div key={filterKey} style={{ display: "flex", flexDirection: "column" }}>
            {entries.map((entry, _idx) => {
              const judge = getJudgeData(entry.judge_id);
              const isLiked = likedIds.has(entry.id);
              const accentColor = judge?.accentColor || "#00f0ff";
              const glowRgb = judge?.glowRgb || "0,240,255";
              const isAuthor = myVerdicts.has(entry.id);
              const isCommentsOpen = commentsOpenId === entry.id;
              const isStoryExpanded = expandedStoryId === entry.id;
              const isVerdictOpen = showVerdictId === entry.id;
              const total = (entry.jury_agree ?? 0) + (entry.jury_disagree ?? 0);
              const agreePercent = total > 0 ? Math.round(((entry.jury_agree ?? 0) / total) * 100) : 0;
              const disagreePercent = total > 0 ? 100 - agreePercent : 0;
              const cCount = commentCounts[entry.id] || 0;
              const isHot = entry.likes >= 10;
              const isDoubleTap = doubleTapId === entry.id;
              const isVoteGlow = voteAnimId === entry.id;

              return (
                <article
                  key={entry.id}
                  className={`feed-card ${isVoteGlow && voteAnimType === "agree" ? "vote-glow-green" : ""} ${isVoteGlow && voteAnimType === "disagree" ? "vote-glow-pink" : ""}`}
                  style={{ animationDelay: `${(_idx % PAGE_SIZE) * 40}ms` }}
                >
                  {/* ── Card Header ── */}
                  <div className="feed-card-header">
                    <div className="feed-header-left">
                      <div className="feed-avatar-ring" style={{ borderColor: accentColor }}>
                        <span style={{ fontSize: 20 }}>{entry.author_icon || "😎"}</span>
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div className="feed-username">{entry.author_nickname || "익명의 시민"}</div>
                        <div className="feed-meta-row">
                          <span className="feed-judge-badge" style={{ background: `${accentColor}22`, color: accentColor }}>
                            {judge && <JudgeAvatar avatarUrl={judge.avatarUrl} name={judge.name} size={12} />}
                            {" "}{entry.judge_name}
                          </span>
                          <span className="feed-time">{timeAgo(entry.created_at)}</span>
                          {entry.category && entry.category !== "기타" && (
                            <span style={{
                              fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 8,
                              background: "rgba(180,74,255,0.1)", color: "#b44aff",
                              border: "1px solid rgba(180,74,255,0.2)",
                              fontFamily: "var(--font-share-tech)", letterSpacing: "0.3px",
                            }}>
                              {entry.category}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                      {isHot && (
                        <span className="hot-badge" style={{
                          background: "rgba(255,46,151,0.15)", color: "#ff2d95",
                          padding: "2px 7px", borderRadius: 99, fontSize: 9,
                          fontFamily: "var(--font-share-tech)", fontWeight: 700,
                          border: "1px solid rgba(255,46,151,0.2)",
                        }}>🔥 HOT</span>
                      )}
                      {isAuthor && (
                        <span className="my-badge">MY</span>
                      )}
                      {isAuthor && (
                        <button
                          onClick={() => handleDelete(entry.id)}
                          disabled={deletingId === entry.id}
                          className="feed-more-btn"
                          style={{ fontSize: 14, padding: "4px 6px" }}
                        >
                          {deletingId === entry.id ? "..." : "🗑️"}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* ── Story Body ── */}
                  <div className="feed-story-body" onClick={() => handleDoubleTap(entry.id)}>
                    <p className="feed-story-text">
                      &ldquo;{isStoryExpanded || entry.story.length <= 80
                        ? entry.story
                        : entry.story.slice(0, 80) + "..."}&rdquo;
                      {entry.story.length > 80 && !isStoryExpanded && (
                        <button
                          className="feed-more-link"
                          onClick={(e) => { e.stopPropagation(); setExpandedStoryId(entry.id); }}
                        >
                          {" "}더보기
                        </button>
                      )}
                    </p>
                    {isStoryExpanded && (
                      <button
                        className="feed-more-link"
                        onClick={(e) => { e.stopPropagation(); setExpandedStoryId(null); }}
                        style={{ marginTop: 4 }}
                      >
                        접기 ▲
                      </button>
                    )}

                    {/* Double Tap Fire */}
                    {isDoubleTap && (
                      <div className="double-tap-overlay">
                        <span className="double-tap-emoji">🔥</span>
                      </div>
                    )}
                  </div>

                  {/* ── Verdict Section ── */}
                  <div className="feed-verdict-section">
                    <button
                      onClick={() => setShowVerdictId(isVerdictOpen ? null : entry.id)}
                      className="feed-verdict-toggle"
                      aria-expanded={isVerdictOpen}
                      style={{ borderColor: `rgba(${glowRgb},0.25)` }}
                    >
                      <div className="verdict-toggle-inner">
                        <span className="verdict-label">VERDICT</span>
                        {entry.tldr && (
                          <span className="verdict-status-badge" style={{
                            color: accentColor,
                            background: `rgba(${glowRgb},0.15)`,
                          }}>
                            {entry.tldr}
                          </span>
                        )}
                      </div>
                      {entry.viral_quote && (
                        <span className="verdict-summary" style={{ color: accentColor }}>
                          &ldquo;{entry.viral_quote}&rdquo;
                        </span>
                      )}
                      <span className="verdict-chevron" style={{ transform: isVerdictOpen ? "rotate(180deg)" : "rotate(0)" }}>
                        ▾
                      </span>
                    </button>

                    {/* Verdict Detail Accordion */}
                    <div className={`verdict-detail-accordion ${isVerdictOpen ? "expanded" : ""}`}>
                      <div className="verdict-detail-inner">
                        <div className="verdict-detail-content" style={{ borderColor: `rgba(${glowRgb},0.15)` }}>
                          {/* Judge badge inside detail */}
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                            <div style={{
                              display: "inline-flex", alignItems: "center", gap: 4,
                              padding: "2px 8px", borderRadius: 99,
                              background: `rgba(${glowRgb},0.08)`,
                              border: `1px solid rgba(${glowRgb},0.15)`,
                            }}>
                              {judge && <JudgeAvatar avatarUrl={judge.avatarUrl} name={judge.name} size={14} />}
                              <span style={{ fontFamily: "var(--font-share-tech)", fontSize: 10, color: "var(--text-muted)" }}>
                                {entry.judge_name}
                              </span>
                            </div>
                          </div>

                          <p className="verdict-detail-text" dangerouslySetInnerHTML={{ __html: renderVerdictHtml(entry.verdict) }} />

                          {/* Jury Vote */}
                          {!isAuthor && (
                            <div className="jury-vote-section">
                              <span className="jury-label">배심원 투표</span>
                              {total > 0 && (
                                <div style={{ marginTop: 8, marginBottom: 8 }}>
                                  <div style={{
                                    display: "flex", justifyContent: "space-between",
                                    fontFamily: "var(--font-share-tech)", fontSize: 12, marginBottom: 4,
                                  }}>
                                    <span style={{ color: "#00ffcc" }}>👍 동의 {agreePercent}%</span>
                                    <span style={{ color: "#ff2d78" }}>반대 {disagreePercent}% 👎</span>
                                  </div>
                                  <div style={{
                                    width: "100%", height: 4,
                                    background: "rgba(255,45,120,0.2)", borderRadius: 99, overflow: "hidden",
                                  }}>
                                    <div style={{
                                      width: `${agreePercent}%`, height: "100%", borderRadius: 99,
                                      background: "linear-gradient(90deg, #00ffcc, #00ff88)",
                                      transition: "width 0.5s ease",
                                    }} />
                                  </div>
                                  <div style={{
                                    textAlign: "center", marginTop: 4,
                                    fontFamily: "var(--font-share-tech)", fontSize: 11, color: "var(--text-muted)",
                                  }}>
                                    총 {total.toLocaleString()}명 참여
                                  </div>
                                </div>
                              )}
                              <div className="jury-vote-buttons">
                                <button
                                  className="jury-vote-btn"
                                  onClick={() => handleJuryVote(entry.id, "agree")}
                                  disabled={isVoting}
                                  style={juryVotes[entry.id] === "agree" ? {
                                    background: "rgba(0,255,204,0.15)",
                                    borderColor: "#00ffcc",
                                    color: "#00ffcc",
                                  } : {}}
                                >
                                  👍 {juryVotes[entry.id] === "agree" ? "동의함 ✓" : "동의"}
                                </button>
                                <button
                                  className="jury-vote-btn"
                                  onClick={() => handleJuryVote(entry.id, "disagree")}
                                  disabled={isVoting}
                                  style={juryVotes[entry.id] === "disagree" ? {
                                    background: "rgba(255,45,120,0.15)",
                                    borderColor: "#ff2d78",
                                    color: "#ff2d78",
                                  } : {}}
                                >
                                  👎 {juryVotes[entry.id] === "disagree" ? "반대함 ✓" : "반대"}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── Reaction Bar ── */}
                  <div className="feed-reaction-bar">
                    <div className="reaction-left">
                      <button
                        className={`reaction-btn ${animatingId === entry.id ? "reaction-pop" : ""}`}
                        onClick={() => handleLike(entry.id)}
                      >
                        <span className="reaction-emoji" style={{ filter: isLiked ? "none" : "grayscale(0.5) opacity(0.7)" }}>
                          🔥
                        </span>
                        {entry.likes > 0 && (
                          <span className="reaction-count" style={isLiked ? { color: "#ff6b35" } : {}}>
                            {entry.likes}
                          </span>
                        )}
                      </button>
                      <button
                        className="reaction-btn"
                        onClick={() => setCommentsOpenId(isCommentsOpen ? null : entry.id)}
                      >
                        <span className="reaction-emoji">💬</span>
                        {cCount > 0 && (
                          <span className="reaction-count" style={isCommentsOpen ? { color: accentColor } : {}}>
                            {cCount}
                          </span>
                        )}
                      </button>
                    </div>
                    <div className="reaction-right">
                      <Link href={`/verdict/${entry.id}`} className="icon-btn" style={{ textDecoration: "none" }}>
                        <span style={{ fontSize: 18, opacity: 0.5 }}>🔗</span>
                      </Link>
                      <button
                        className={`icon-btn ${bookmarkAnimId === entry.id ? "bookmark-bounce" : ""}`}
                        onClick={() => handleBookmark(entry.id)}
                      >
                        <span style={{ fontSize: 20, opacity: bookmarkedIds.has(entry.id) ? 1 : 0.4 }}>🔖</span>
                      </button>
                    </div>
                  </div>

                  {/* ── Comments ── */}
                  {isCommentsOpen && (
                    <div style={{ padding: "0 16px 14px", animation: "fadeIn 0.3s ease" }}>
                      <InlineComments
                        verdictId={entry.id}
                        accentColor={accentColor}
                        glowRgb={glowRgb}
                        initialCount={cCount}
                        onCountChange={(n) => setCommentCounts((prev) => ({ ...prev, [entry.id]: n }))}
                      />
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}

        {/* ===== INFINITE SCROLL SENTINEL ===== */}
        {hasMore && !isLoading && (
          <div ref={sentinelCallback}>
            {isLoadingMore && (
              <>
                <SkeletonCard delay={0} />
                <SkeletonCard delay={100} />
                <SkeletonCard delay={200} />
                <SkeletonCard delay={300} />
              </>
            )}
          </div>
        )}

        {/* ===== ALL DONE ===== */}
        {!hasMore && !isLoading && entries.length > 0 && (
          <div className="all-done-msg">
            모든 재판을 확인했어요 ⚡
          </div>
        )}

        {/* ===== FOOTER ===== */}
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
      </div>

      {/* ===== FAB ===== */}
      <Link href="/" className="feed-fab">
        <span style={{ fontSize: 16 }}>⚡</span>
        <span>새 재판</span>
      </Link>

      {/* ===== BOTTOM NAV ===== */}
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

      {/* ===== STORY OVERLAY ===== */}
      {storyData && (() => {
        const judge = judges.find((j) => j.id === storyData.judgeId);
        const entry = storyData.entries[storyData.index];
        const accentColor = judge?.accentColor || "#00f0ff";
        const glowRgb = judge?.glowRgb || "0,240,255";
        return (
          <div className="story-overlay">
            {/* Progress bars */}
            <div className="story-progress-container">
              {storyData.entries.map((_, i) => (
                <div key={i} className="story-progress-track">
                  <div
                    className="story-progress-fill"
                    style={{
                      width: i < storyData.index ? "100%" : i === storyData.index ? "0%" : "0%",
                      animation: i === storyData.index ? "storyProgress 5s linear forwards" : "none",
                      background: i <= storyData.index ? accentColor : "transparent",
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Header */}
            <div className="story-header">
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                border: `2px solid ${accentColor}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "rgba(255,255,255,0.04)",
              }}>
                {judge && <JudgeAvatar avatarUrl={judge.avatarUrl} name={judge.name} size={20} />}
              </div>
              <div>
                <div style={{ fontFamily: "var(--font-share-tech)", fontSize: 14, fontWeight: 700, color: "white" }}>
                  ⚖️ {judge?.name}
                </div>
                <div style={{ fontFamily: "var(--font-share-tech)", fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
                  {timeAgo(entry.created_at)}
                </div>
              </div>
            </div>

            {/* Close button */}
            <button className="story-close-btn" onClick={closeStory}>✕</button>

            {/* Body */}
            <div className="story-body">
              <p style={{
                fontSize: 17, lineHeight: 1.7, color: "rgba(255,255,255,0.92)",
                fontFamily: "var(--font-share-tech)", wordBreak: "keep-all" as const,
                marginBottom: 24, margin: "0 0 24px",
              }}>
                &ldquo;{entry.story.length > 200 ? entry.story.slice(0, 200) + "..." : entry.story}&rdquo;
              </p>

              {/* Verdict card */}
              <div style={{
                padding: "14px 16px", borderRadius: 12,
                background: `rgba(${glowRgb},0.08)`,
                border: `1px solid rgba(${glowRgb},0.2)`,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{
                    fontFamily: "var(--font-orbitron)", fontSize: 10, fontWeight: 800,
                    letterSpacing: 2, color: "rgba(255,255,255,0.4)",
                  }}>VERDICT</span>
                  {entry.tldr && (
                    <span style={{
                      fontSize: 11, fontWeight: 800, padding: "2px 10px", borderRadius: 8,
                      color: accentColor, background: `rgba(${glowRgb},0.15)`,
                      fontFamily: "var(--font-share-tech)",
                    }}>{entry.tldr}</span>
                  )}
                </div>
                {entry.viral_quote && (
                  <p style={{
                    fontSize: 14, fontWeight: 600, color: accentColor,
                    fontFamily: "var(--font-share-tech)", margin: 0,
                  }}>
                    &ldquo;{entry.viral_quote}&rdquo;
                  </p>
                )}
              </div>

              {/* Stats */}
              <div style={{
                display: "flex", gap: 16, marginTop: 20,
                fontFamily: "var(--font-share-tech)", fontSize: 14, color: "rgba(255,255,255,0.6)",
              }}>
                <span>🔥 {entry.likes}</span>
                <span>💬 {entry.comment_count || 0}</span>
              </div>
            </div>

            {/* Touch zones — hold to pause, release to resume */}
            <div
              className="story-touch-zone story-touch-left"
              onClick={storyPrev}
              onTouchStart={() => setStoryPaused(true)}
              onTouchEnd={() => setStoryPaused(false)}
              onMouseDown={() => setStoryPaused(true)}
              onMouseUp={() => setStoryPaused(false)}
            />
            <div
              className="story-touch-zone story-touch-right"
              onClick={storyNext}
              onTouchStart={() => setStoryPaused(true)}
              onTouchEnd={() => setStoryPaused(false)}
              onMouseDown={() => setStoryPaused(true)}
              onMouseUp={() => setStoryPaused(false)}
            />

            {/* Bottom hint */}
            <Link
              href={`/verdict/${entry.id}`}
              className="story-bottom-hint"
              onClick={closeStory}
            >
              ↑ 탭하여 상세 보기
            </Link>
          </div>
        );
      })()}

      {/* ===== TOAST ===== */}
      {toastMsg && <div className="feed-toast">{toastMsg}</div>}
    </div>
  );
}
