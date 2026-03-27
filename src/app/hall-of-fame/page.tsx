"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import type { HallOfFameEntry, HallOfFameListResponse, SortMode, VoteType } from "@/lib/types";
import { trackEvent } from "@/lib/analytics";
import {
  getLikedIds, saveLikedIds, getMyVerdicts, getDeleteTokens,
  getJuryVotes, saveJuryVotes, removeJuryVote,
  getBookmarkedIds, saveBookmarkedIds,
} from "@/lib/local-storage-utils";
import StoriesRow from "@/components/hall-of-fame/StoriesRow";
import FilterTabsBar from "@/components/hall-of-fame/FilterTabsBar";
import SearchBar from "@/components/hall-of-fame/SearchBar";
import CategoryChips from "@/components/hall-of-fame/CategoryChips";
import SortBar from "@/components/hall-of-fame/SortBar";
import FeedCard from "@/components/hall-of-fame/FeedCard";
import StoryOverlay from "@/components/hall-of-fame/StoryOverlay";
import { SkeletonCard, LoadingState, ErrorState, EmptyState } from "@/components/hall-of-fame/FeedStates";
import BottomNavigation from "@/components/hall-of-fame/BottomNavigation";
import HofFooter from "@/components/hall-of-fame/HofFooter";
import "./hall-of-fame.css";

const PAGE_SIZE = 12;

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
  const [showVerdictId, setShowVerdictId] = useState<string | null>(null);
  const [doubleTapId, setDoubleTapId] = useState<string | null>(null);
  const [voteAnimId, setVoteAnimId] = useState<string | null>(null);
  const [voteAnimType, setVoteAnimType] = useState<VoteType | null>(null);
  const lastTapRef = useRef<Record<string, number>>({});
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [bookmarkAnimId, setBookmarkAnimId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [filterKey, setFilterKey] = useState(0);
  const [storyData, setStoryData] = useState<{ judgeId: string; entries: HallOfFameEntry[]; index: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [trendingKeywords, setTrendingKeywords] = useState<string[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [storyPaused, setStoryPaused] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<() => void>(() => {});

  useEffect(() => {
    setLikedIds(getLikedIds());
    setMyVerdicts(getMyVerdicts());
    setJuryVotes(getJuryVotes());
    setDeleteTokens(getDeleteTokens());
    setBookmarkedIds(getBookmarkedIds());
  }, []);

  /* ── Data Fetching ── */
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
        data.entries.forEach((e) => { if (e.comment_count !== undefined) counts[e.id] = e.comment_count; });
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

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      if (searchQuery.length >= 2) {
        fetch("/api/hall-of-fame/search-log", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: searchQuery }),
        }).catch(() => {});
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Trending keywords
  useEffect(() => {
    fetch("/api/hall-of-fame/trending").then((r) => r.json()).then((d) => {
      if (d.keywords) setTrendingKeywords(d.keywords);
    }).catch(() => {});
  }, []);

  /* ── Handlers ── */
  const handleSortChange = useCallback((s: SortMode) => {
    setSort(s);
    setOffset(0);
    setEntries([]);
    setFilterKey((k) => k + 1);
  }, []);

  const handleJudgeFilter = useCallback((jid: string | null) => {
    setJudgeFilter((prev) => prev === jid ? null : jid);
    setOffset(0);
    setEntries([]);
    setFilterKey((k) => k + 1);
  }, []);

  const handleCategoryChange = useCallback((cat: string | null) => {
    setSelectedCategory((prev) => prev === cat ? null : cat);
    setOffset(0);
    setEntries([]);
  }, []);

  const handleLoadMore = useCallback(() => {
    const newOffset = offset + PAGE_SIZE;
    setOffset(newOffset);
    fetchEntries(sort, newOffset, judgeFilter, true, debouncedQuery, selectedCategory);
  }, [offset, sort, judgeFilter, debouncedQuery, selectedCategory, fetchEntries]);

  loadMoreRef.current = handleLoadMore;

  const sentinelCallback = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) observerRef.current.disconnect();
    if (!node) return;
    observerRef.current = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMoreRef.current(); },
      { rootMargin: "600px" }
    );
    observerRef.current.observe(node);
  }, []);

  /* ── Delete ── */
  const handleDelete = useCallback(async (id: string) => {
    const token = deleteTokens[id];
    if (!token) { alert("삭제 권한이 없습니다."); return; }
    if (!confirm("이 판결을 삭제하시겠습니까?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/hall-of-fame/${id}`, {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, deleteToken: token }),
      });
      if (res.ok) {
        setEntries((prev) => prev.filter((e) => e.id !== id));
        const myV = getMyVerdicts();
        myV.delete(id);
        localStorage.setItem("neon-court-my-verdicts", JSON.stringify([...myV]));
        setMyVerdicts(myV);
        const tokens = { ...deleteTokens };
        delete tokens[id];
        localStorage.setItem("neon-court-delete-tokens", JSON.stringify(tokens));
        setDeleteTokens(tokens);
      } else {
        const data = await res.json();
        alert(data.error || "삭제에 실패했습니다.");
      }
    } catch { alert("네트워크 오류로 삭제에 실패했습니다."); }
    finally { setDeletingId(null); }
  }, [deleteTokens]);

  /* ── Like ── */
  const handleLike = useCallback(async (id: string) => {
    const isLiked = likedIds.has(id);
    if (!isLiked) trackEvent("verdict_liked", { verdict_id: id });
    const method = isLiked ? "DELETE" : "POST";
    const newLikedIds = new Set(likedIds);
    if (isLiked) newLikedIds.delete(id); else newLikedIds.add(id);
    setLikedIds(newLikedIds);
    saveLikedIds(newLikedIds);
    const delta = isLiked ? -1 : 1;
    setEntries((prev) => prev.map((e) => e.id === id ? { ...e, likes: e.likes + delta } : e));
    if (!isLiked) { setAnimatingId(id); setTimeout(() => setAnimatingId(null), 300); }
    try {
      const res = await fetch(`/api/hall-of-fame/${id}/like`, { method });
      if (!res.ok) throw new Error();
    } catch {
      const rollbackIds = new Set(likedIds);
      setLikedIds(rollbackIds); saveLikedIds(rollbackIds);
      setEntries((prev) => prev.map((e) => e.id === id ? { ...e, likes: e.likes - delta } : e));
    }
  }, [likedIds]);

  /* ── Jury Vote ── */
  const handleJuryVote = useCallback(async (entryId: string, vote: VoteType) => {
    if (isVoting) return;
    trackEvent("jury_voted", { vote_type: vote, verdict_id: entryId });
    setIsVoting(true);
    setVoteAnimId(entryId); setVoteAnimType(vote);
    setTimeout(() => { setVoteAnimId(null); setVoteAnimType(null); }, 600);

    const prevVote = juryVotes[entryId] || null;
    const updateVotes = (list: HallOfFameEntry[], ad: number, dd: number) =>
      list.map((e) => e.id === entryId ? {
        ...e, jury_agree: Math.max(0, (e.jury_agree ?? 0) + ad),
        jury_disagree: Math.max(0, (e.jury_disagree ?? 0) + dd),
      } : e);

    try {
      if (prevVote === vote) {
        const newVotes = { ...juryVotes }; delete newVotes[entryId];
        setJuryVotes(newVotes); removeJuryVote(entryId);
        setEntries((prev) => updateVotes(prev, vote === "agree" ? -1 : 0, vote === "disagree" ? -1 : 0));
        const res = await fetch(`/api/hall-of-fame/${entryId}/jury-vote`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ vote }) });
        if (!res.ok) throw new Error();
      } else if (prevVote && prevVote !== vote) {
        const newVotes = { ...juryVotes, [entryId]: vote };
        setJuryVotes(newVotes); saveJuryVotes(newVotes);
        setEntries((prev) => updateVotes(prev, vote === "agree" ? 1 : -1, vote === "disagree" ? 1 : -1));
        const res = await fetch(`/api/hall-of-fame/${entryId}/jury-vote`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ from: prevVote, to: vote }) });
        if (!res.ok) throw new Error();
      } else {
        const newVotes = { ...juryVotes, [entryId]: vote };
        setJuryVotes(newVotes); saveJuryVotes(newVotes);
        setEntries((prev) => updateVotes(prev, vote === "agree" ? 1 : 0, vote === "disagree" ? 1 : 0));
        const res = await fetch(`/api/hall-of-fame/${entryId}/jury-vote`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ vote }) });
        if (!res.ok) throw new Error();
      }
    } catch {
      if (prevVote) { setJuryVotes({ ...juryVotes, [entryId]: prevVote }); saveJuryVotes({ ...juryVotes, [entryId]: prevVote }); }
      else { const rb = { ...juryVotes }; delete rb[entryId]; setJuryVotes(rb); removeJuryVote(entryId); }
      fetchEntries(sort, 0, judgeFilter);
    } finally { setIsVoting(false); }
  }, [isVoting, juryVotes, sort, judgeFilter, fetchEntries]);

  /* ── Double Tap ── */
  const handleDoubleTap = useCallback((entryId: string) => {
    const now = Date.now();
    const lastTap = lastTapRef.current[entryId] || 0;
    if (now - lastTap < 300) {
      if (!likedIds.has(entryId)) handleLike(entryId);
      setDoubleTapId(entryId);
      setTimeout(() => setDoubleTapId(null), 800);
    }
    lastTapRef.current[entryId] = now;
  }, [likedIds, handleLike]);

  /* ── Bookmark ── */
  const handleBookmark = useCallback((id: string) => {
    const newIds = new Set(bookmarkedIds);
    if (newIds.has(id)) { newIds.delete(id); setToastMsg("저장 취소됨"); }
    else { newIds.add(id); setToastMsg("저장됨 ✨"); setBookmarkAnimId(id); setTimeout(() => setBookmarkAnimId(null), 300); }
    setBookmarkedIds(newIds); saveBookmarkedIds(newIds);
    setTimeout(() => setToastMsg(null), 2000);
  }, [bookmarkedIds]);

  /* ── Story ── */
  const openStory = useCallback(async (judgeId: string) => {
    try {
      const res = await fetch(`/api/hall-of-fame?sort=popular&cursor=0&judge=${judgeId}`);
      if (!res.ok) return;
      const data: HallOfFameListResponse = await res.json();
      if (data.entries.length === 0) return;
      setStoryData({ judgeId, entries: data.entries.slice(0, 5), index: 0 });
      document.body.style.overflow = "hidden";
    } catch { /* ignore */ }
  }, []);

  const closeStory = useCallback(() => {
    setStoryData(null); setStoryPaused(false);
    document.body.style.overflow = "";
  }, []);

  const storyNext = useCallback(() => {
    setStoryData((prev) => {
      if (!prev) return null;
      if (prev.index >= prev.entries.length - 1) { document.body.style.overflow = ""; return null; }
      return { ...prev, index: prev.index + 1 };
    });
  }, []);

  const storyPrev = useCallback(() => {
    setStoryData((prev) => {
      if (!prev || prev.index === 0) return prev;
      return { ...prev, index: prev.index - 1 };
    });
  }, []);

  const handleCommentCountChange = useCallback((id: string, n: number) => {
    setCommentCounts((prev) => ({ ...prev, [id]: n }));
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery(""); setDebouncedQuery("");
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearchQuery(""); setDebouncedQuery(""); setSelectedCategory(null);
  }, []);

  const handleRetry = useCallback(() => {
    setOffset(0); fetchEntries(sort, 0, judgeFilter);
  }, [sort, judgeFilter, fetchEntries]);

  /* ── Pull to Refresh ── */
  useEffect(() => {
    let startY = 0;
    let pulling = false;
    const pullRef = { current: 0 };
    const onTouchStart = (e: TouchEvent) => {
      if (window.scrollY <= 0 && !isRefreshing) { startY = e.touches[0].clientY; pulling = true; }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!pulling) return;
      const diff = e.touches[0].clientY - startY;
      if (diff > 0 && window.scrollY <= 0) { pullRef.current = Math.min(diff * 0.4, 80); setPullDistance(pullRef.current); }
      else { pulling = false; setPullDistance(0); }
    };
    const onTouchEnd = () => {
      if (pullRef.current > 60 && !isRefreshing) {
        setIsRefreshing(true); setOffset(0);
        fetchEntries(sort, 0, judgeFilter, false, debouncedQuery, selectedCategory).then(() => setIsRefreshing(false));
      }
      setPullDistance(0); pulling = false;
    };
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    return () => { window.removeEventListener("touchstart", onTouchStart); window.removeEventListener("touchmove", onTouchMove); window.removeEventListener("touchend", onTouchEnd); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRefreshing, sort, judgeFilter]);

  /* ─── RENDER ─── */
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", position: "relative" }}>
      {/* Background Effects */}
      <div style={{ position: "fixed", top: -100, right: -100, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,255,204,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: -50, left: -50, width: 250, height: 250, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,45,120,0.05) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{ maxWidth: 430, margin: "0 auto", paddingTop: 48, paddingBottom: 140, position: "relative", overflowX: "hidden" as const }}>
        <StoriesRow judgeFilter={judgeFilter} sort={sort} onOpenStory={openStory} onSortChange={handleSortChange} />
        <FilterTabsBar judgeFilter={judgeFilter} onJudgeFilter={handleJudgeFilter} />
        <SearchBar
          searchQuery={searchQuery} onSearchChange={setSearchQuery}
          debouncedQuery={debouncedQuery} onClearSearch={handleClearSearch}
          trendingKeywords={trendingKeywords} isSearchFocused={isSearchFocused}
          onFocus={() => setIsSearchFocused(true)} onBlur={() => setIsSearchFocused(false)}
        />
        <CategoryChips selectedCategory={selectedCategory} onCategoryChange={handleCategoryChange} />
        <SortBar sort={sort} onSortChange={handleSortChange} />

        {/* Pull Refresh Indicator */}
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

        {isLoading && <LoadingState />}
        {!isLoading && loadError && entries.length === 0 && <ErrorState onRetry={handleRetry} />}
        {!isLoading && !loadError && entries.length === 0 && (
          <EmptyState
            searchQuery={debouncedQuery} selectedCategory={selectedCategory}
            judgeFilter={judgeFilter} onClearFilters={handleClearFilters} onRetry={handleRetry}
          />
        )}

        {/* Feed */}
        {!isLoading && entries.length > 0 && (
          <div key={filterKey} style={{ display: "flex", flexDirection: "column" }}>
            {entries.map((entry, idx) => (
              <FeedCard
                key={entry.id}
                entry={entry}
                isLiked={likedIds.has(entry.id)}
                isAuthor={myVerdicts.has(entry.id)}
                isCommentsOpen={commentsOpenId === entry.id}
                isStoryExpanded={expandedStoryId === entry.id}
                isVerdictOpen={showVerdictId === entry.id}
                isBookmarked={bookmarkedIds.has(entry.id)}
                juryVote={juryVotes[entry.id]}
                commentCount={commentCounts[entry.id] || 0}
                isDeleting={deletingId === entry.id}
                isVoting={isVoting}
                animatingLike={animatingId === entry.id}
                isDoubleTap={doubleTapId === entry.id}
                isVoteGlow={voteAnimId === entry.id}
                voteAnimType={voteAnimType}
                bookmarkBouncing={bookmarkAnimId === entry.id}
                onLike={handleLike}
                onDoubleTap={handleDoubleTap}
                onToggleComments={setCommentsOpenId}
                onToggleStory={setExpandedStoryId}
                onToggleVerdict={setShowVerdictId}
                onBookmark={handleBookmark}
                onDelete={handleDelete}
                onJuryVote={handleJuryVote}
                onCommentCountChange={handleCommentCountChange}
                index={idx}
              />
            ))}
          </div>
        )}

        {/* Infinite Scroll Sentinel */}
        {hasMore && !isLoading && (
          <div ref={sentinelCallback}>
            {isLoadingMore && (
              <>{[0,100,200,300].map((d) => <SkeletonCard key={d} delay={d} />)}</>
            )}
          </div>
        )}

        {!hasMore && !isLoading && entries.length > 0 && (
          <div className="all-done-msg">모든 재판을 확인했어요 ⚡</div>
        )}

        <HofFooter />
      </div>

      {/* FAB */}
      <Link href="/" className="feed-fab">
        <span style={{ fontSize: 16 }}>⚡</span>
        <span>새 재판</span>
      </Link>

      <BottomNavigation />

      {/* Story Overlay */}
      {storyData && (
        <StoryOverlay
          storyData={storyData} storyPaused={storyPaused}
          onClose={closeStory} onNext={storyNext} onPrev={storyPrev}
          onPauseToggle={setStoryPaused}
        />
      )}

      {/* Toast */}
      {toastMsg && <div className="feed-toast">{toastMsg}</div>}
    </div>
  );
}
