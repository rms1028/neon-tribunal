"use client";

import { useState, useEffect, useRef } from "react";
import type { VerdictComment } from "@/lib/types";

const PAGE_SIZE = 20;
const MAX_CHARS = 200;
const LIKED_COMMENTS_KEY = "neon-court-liked-comment-ids";
const COMMENT_AUTHORS_KEY = "neon-court-comment-authors";

const COMMENT_MODIFIERS = ["재판관", "시민", "배심원", "방청객", "목격자", "변호인", "증인"];
const COMMENT_ICONS = ["😎", "🦊", "🐱", "🎭", "🌙", "⚡", "🔥", "🎪", "🎯", "🎲"];

function getOrCreateCommentAuthor(verdictId: string): { nickname: string; icon: string } {
  if (typeof window === "undefined") return { nickname: "익명의 시민", icon: "😎" };
  try {
    const raw = localStorage.getItem(COMMENT_AUTHORS_KEY);
    const authors: Record<string, { nickname: string; icon: string }> = raw ? JSON.parse(raw) : {};
    if (authors[verdictId]) return authors[verdictId];

    const mod = COMMENT_MODIFIERS[Math.floor(Math.random() * COMMENT_MODIFIERS.length)];
    const num = String(Math.floor(1000 + Math.random() * 9000));
    const icon = COMMENT_ICONS[Math.floor(Math.random() * COMMENT_ICONS.length)];
    const newAuthor = { nickname: `익명의 ${mod} #${num}`, icon };
    authors[verdictId] = newAuthor;
    localStorage.setItem(COMMENT_AUTHORS_KEY, JSON.stringify(authors));
    return newAuthor;
  } catch {
    return { nickname: "익명의 시민", icon: "😎" };
  }
}

function getLikedCommentIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(LIKED_COMMENTS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveLikedCommentIds(ids: Set<string>) {
  localStorage.setItem(LIKED_COMMENTS_KEY, JSON.stringify([...ids]));
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

interface VerdictCommentsProps {
  verdictId: string;
  accentColor: string;
  glowRgb: string;
}

type SortMode = "newest" | "popular";
type VoteStance = "agree" | "disagree" | null;

export default function VerdictComments({
  verdictId,
  accentColor,
  glowRgb,
}: VerdictCommentsProps) {
  const [comments, setComments] = useState<VerdictComment[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [sortBy, setSortBy] = useState<SortMode>("newest");
  const [voteStance, setVoteStance] = useState<VoteStance>(null);
  const [replyTo, setReplyTo] = useState<{ id: string; nickname: string } | null>(null);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [heartAnimId, setHeartAnimId] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setLikedIds(getLikedCommentIds());
  }, []);

  useEffect(() => {
    fetchComments(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verdictId, sortBy]);

  const fetchComments = async (offset: number) => {
    try {
      const res = await fetch(
        `/api/verdict/${verdictId}/comments?limit=${PAGE_SIZE}&offset=${offset}&sort=${sortBy}`
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (offset === 0) {
        setComments(data.comments);
      } else {
        setComments((prev) => [...prev, ...data.comments]);
      }
      setTotal(data.total);
      setHasMore(data.hasMore);
    } catch {
      // silent fail
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    setLoadingMore(true);
    fetchComments(comments.length);
  };

  const handleSubmit = async () => {
    const trimContent = content.trim();
    if (!trimContent) {
      setError("내용을 입력해주세요.");
      return;
    }
    if (trimContent.length > MAX_CHARS) {
      setError(`댓글은 ${MAX_CHARS}자 이내로 입력해주세요.`);
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const author = getOrCreateCommentAuthor(verdictId);
      const bodyData: Record<string, unknown> = {
        content: trimContent,
        nickname: author.nickname,
      };
      if (voteStance) bodyData.vote_stance = voteStance;
      if (replyTo) bodyData.parent_id = replyTo.id;

      const res = await fetch(`/api/verdict/${verdictId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "댓글 등록에 실패했습니다.");
        return;
      }

      const data = await res.json();
      setComments((prev) => [data.comment, ...prev]);
      setTotal((prev) => prev + 1);
      setContent("");
      setVoteStance(null);
      setReplyTo(null);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCommentLike = async (commentId: string) => {
    const wasLiked = likedIds.has(commentId);
    const method = wasLiked ? "DELETE" : "POST";

    const newLikedIds = new Set(likedIds);
    if (wasLiked) {
      newLikedIds.delete(commentId);
    } else {
      newLikedIds.add(commentId);
      setHeartAnimId(commentId);
      setTimeout(() => setHeartAnimId(null), 300);
    }
    setLikedIds(newLikedIds);
    saveLikedCommentIds(newLikedIds);

    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? { ...c, likes: c.likes + (wasLiked ? -1 : 1) }
          : c
      )
    );

    try {
      const res = await fetch(
        `/api/verdict/${verdictId}/comments/${commentId}/like`,
        { method }
      );
      if (!res.ok) throw new Error();
    } catch {
      const rollback = new Set(likedIds);
      if (wasLiked) rollback.add(commentId);
      else rollback.delete(commentId);
      setLikedIds(rollback);
      saveLikedCommentIds(rollback);
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? { ...c, likes: c.likes + (wasLiked ? 1 : -1) }
            : c
        )
      );
    }
  };

  const handleReply = (comment: VerdictComment) => {
    setReplyTo({ id: comment.id, nickname: comment.nickname });
    inputRef.current?.focus();
  };

  // Group: top-level + replies
  const topLevelComments = comments.filter((c) => !c.parent_id);
  const repliesByParent = new Map<string, VerdictComment[]>();
  comments.forEach((c) => {
    if (c.parent_id) {
      const existing = repliesByParent.get(c.parent_id) || [];
      existing.push(c);
      repliesByParent.set(c.parent_id, existing);
    }
  });

  const stanceBadge = (stance?: string | null) => {
    if (stance === "agree")
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "3px",
            padding: "2px 8px",
            borderRadius: "8px",
            fontSize: "11px",
            fontWeight: 700,
            fontFamily: "var(--font-share-tech)",
            background: "rgba(57,255,20,0.12)",
            color: "#39ff14",
            border: "1px solid rgba(57,255,20,0.25)",
          }}
        >
          👍 동의
        </span>
      );
    if (stance === "disagree")
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "3px",
            padding: "2px 8px",
            borderRadius: "8px",
            fontSize: "11px",
            fontWeight: 700,
            fontFamily: "var(--font-share-tech)",
            background: "rgba(255,45,149,0.12)",
            color: "#ff2d95",
            border: "1px solid rgba(255,45,149,0.25)",
          }}
        >
          👎 반대
        </span>
      );
    return null;
  };

  const renderComment = (c: VerdictComment, isReply = false) => (
    <div
      key={c.id}
      style={{
        padding: isReply ? "10px 12px" : "12px 14px",
        marginBottom: "8px",
        marginLeft: isReply ? "28px" : "0",
        background: isReply
          ? "var(--comment-reply-bg)"
          : "var(--comment-bg)",
        borderRadius: "12px",
        border: `1px solid rgba(${glowRgb}, ${isReply ? "0.08" : "0.12"})`,
        transition: "background 0.2s",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "8px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <span
            style={{
              fontFamily: "var(--font-orbitron)",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.05em",
              color: accentColor,
            }}
          >
            {c.nickname}
          </span>
          {stanceBadge(c.vote_stance)}
          {isReply && (
            <span
              style={{
                fontSize: "10px",
                color: "#666",
                fontFamily: "var(--font-share-tech)",
              }}
            >
              ↩ 답글
            </span>
          )}
        </div>
        <span
          style={{
            fontFamily: "var(--font-share-tech)",
            fontSize: "10px",
            color: "#555",
            flexShrink: 0,
          }}
        >
          {timeAgo(c.created_at)}
        </span>
      </div>

      {/* Content */}
      <p
        style={{
          fontFamily: "var(--font-share-tech)",
          fontSize: "13px",
          lineHeight: "1.7",
          color: "var(--text-primary)",
          wordBreak: "keep-all",
          overflowWrap: "break-word",
          whiteSpace: "pre-wrap",
          marginBottom: "8px",
        }}
      >
        {c.content}
      </p>

      {/* Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        <button
          onClick={() => handleCommentLike(c.id)}
          className={heartAnimId === c.id ? "heart-pop" : ""}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            fontFamily: "var(--font-share-tech)",
            fontSize: "12px",
            color: likedIds.has(c.id) ? "#ff2d95" : "#666",
            background: "none",
            border: "none",
            padding: "2px 4px",
            cursor: "pointer",
            transition: "color 0.2s",
          }}
        >
          <span>{likedIds.has(c.id) ? "❤" : "♡"}</span>
          {c.likes > 0 && <span>{c.likes}</span>}
        </button>
        {!isReply && (
          <button
            onClick={() => handleReply(c)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontFamily: "var(--font-share-tech)",
              fontSize: "12px",
              color: "#666",
              background: "none",
              border: "none",
              padding: "2px 4px",
              cursor: "pointer",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = accentColor;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--text-muted)";
            }}
          >
            💬 답글
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div
      className="glass-card cyber-clip relative p-5 md:p-6"
      style={{
        boxShadow: `0 0 30px rgba(${glowRgb}, 0.08), inset 0 0 30px rgba(${glowRgb}, 0.02)`,
      }}
    >
      {/* Corner decorations */}
      <div
        className="absolute top-2 right-3 w-2.5 h-2.5 border-t border-r"
        style={{ borderColor: `rgba(${glowRgb}, 0.3)` }}
      />
      <div
        className="absolute bottom-2 left-3 w-2.5 h-2.5 border-b border-l"
        style={{ borderColor: `rgba(${glowRgb}, 0.3)` }}
      />

      {/* Header + Sort */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "18px" }}>💬</span>
          <h3
            style={{
              fontFamily: "var(--font-orbitron)",
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "var(--text-primary)",
            }}
          >
            배심원 의견
          </h3>
          {total > 0 && (
            <span
              style={{
                fontFamily: "var(--font-share-tech)",
                fontSize: "10px",
                color: "#666",
              }}
            >
              {total}건
            </span>
          )}
        </div>
        {total > 1 && (
          <div style={{ display: "flex", gap: "4px" }}>
            {(["newest", "popular"] as SortMode[]).map((mode) => {
              const isActive = sortBy === mode;
              const label = mode === "newest" ? "최신순" : "인기순";
              return (
                <button
                  key={mode}
                  onClick={() => setSortBy(mode)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "12px",
                    fontFamily: "var(--font-share-tech)",
                    fontSize: "11px",
                    fontWeight: isActive ? 700 : 400,
                    color: isActive ? accentColor : "#666",
                    background: isActive ? `rgba(${glowRgb}, 0.1)` : "transparent",
                    border: isActive ? `1px solid rgba(${glowRgb}, 0.3)` : "1px solid transparent",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Reply indicator */}
      {replyTo && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 12px",
            marginBottom: "8px",
            borderRadius: "10px",
            background: `rgba(${glowRgb}, 0.06)`,
            border: `1px solid rgba(${glowRgb}, 0.15)`,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-share-tech)",
              fontSize: "12px",
              color: "var(--text-muted)",
            }}
          >
            ↩ <span style={{ color: accentColor, fontWeight: 700 }}>{replyTo.nickname}</span>에게 답글
          </span>
          <button
            onClick={() => setReplyTo(null)}
            style={{
              marginLeft: "auto",
              background: "none",
              border: "none",
              color: "#666",
              fontSize: "14px",
              cursor: "pointer",
              padding: "0 4px",
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Vote stance + Write comment */}
      <div style={{ marginBottom: "20px" }}>
        {/* Stance buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
          <span
            style={{
              fontFamily: "var(--font-share-tech)",
              fontSize: "11px",
              color: "#666",
            }}
          >
            입장:
          </span>
          {([
            { key: "agree" as const, label: "👍 동의", color: "#39ff14", rgb: "57,255,20" },
            { key: "disagree" as const, label: "👎 반대", color: "#ff2d95", rgb: "255,45,149" },
          ]).map(({ key, label, color, rgb }) => {
            const isActive = voteStance === key;
            return (
              <button
                key={key}
                onClick={() => setVoteStance(isActive ? null : key)}
                style={{
                  padding: "4px 12px",
                  borderRadius: "10px",
                  fontFamily: "var(--font-share-tech)",
                  fontSize: "12px",
                  fontWeight: isActive ? 700 : 400,
                  color: isActive ? color : "#888",
                  background: isActive ? `rgba(${rgb}, 0.12)` : "rgba(255,255,255,0.03)",
                  border: `1px solid ${isActive ? `rgba(${rgb}, 0.4)` : "rgba(255,255,255,0.08)"}`,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Textarea */}
        <div style={{ position: "relative" }}>
          <textarea
            ref={inputRef}
            value={content}
            onChange={(e) => {
              if (e.target.value.length <= MAX_CHARS) {
                setContent(e.target.value);
              }
            }}
            placeholder={replyTo ? `${replyTo.nickname}에게 답글 작성...` : "배심원 의견을 남겨주세요"}
            maxLength={MAX_CHARS}
            rows={3}
            style={{
              width: "100%",
              padding: "12px 14px",
              paddingBottom: "32px",
              fontFamily: "var(--font-share-tech)",
              fontSize: "13px",
              lineHeight: "1.5",
              letterSpacing: "0.03em",
              background: "rgba(255,255,255,0.03)",
              border: `1px solid rgba(${glowRgb}, 0.2)`,
              borderRadius: "12px",
              color: "var(--text-primary)",
              outline: "none",
              resize: "none",
              boxSizing: "border-box",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = accentColor;
              e.currentTarget.style.background = "var(--comment-bg)";
              e.currentTarget.style.boxShadow = `0 0 12px rgba(${glowRgb}, 0.12)`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = `rgba(${glowRgb}, 0.2)`;
              e.currentTarget.style.background = "var(--comment-reply-bg)";
              e.currentTarget.style.boxShadow = "none";
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          {/* Bottom bar */}
          <div
            style={{
              position: "absolute",
              bottom: "8px",
              left: "12px",
              right: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-share-tech)",
                fontSize: "10px",
                color: content.length >= MAX_CHARS * 0.9 ? "#ff2d95" : "#555",
                transition: "color 0.2s",
              }}
            >
              {content.length}/{MAX_CHARS}
            </span>
            <button
              onClick={handleSubmit}
              disabled={submitting || content.trim().length === 0}
              style={{
                padding: "4px 14px",
                borderRadius: "8px",
                fontFamily: "var(--font-orbitron)",
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                border: `1px solid rgba(${glowRgb}, 0.3)`,
                color: submitting || !content.trim() ? "#555" : accentColor,
                background: `rgba(${glowRgb}, 0.05)`,
                cursor: submitting || !content.trim() ? "not-allowed" : "pointer",
                opacity: submitting ? 0.5 : 1,
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                if (!submitting && content.trim())
                  e.currentTarget.style.background = `rgba(${glowRgb}, 0.15)`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = `rgba(${glowRgb}, 0.05)`;
              }}
            >
              {submitting ? "..." : "Ctrl+Enter"}
            </button>
          </div>
        </div>
        {error && (
          <p
            style={{
              fontFamily: "var(--font-share-tech)",
              fontSize: "11px",
              color: "#ff2d95",
              marginTop: "4px",
            }}
          >
            {error}
          </p>
        )}
      </div>

      {/* Divider */}
      <div
        style={{
          height: "1px",
          background: `linear-gradient(90deg, transparent, rgba(${glowRgb}, 0.2), transparent)`,
          marginBottom: "16px",
        }}
      />

      {/* Comment list */}
      {loading ? (
        <div style={{ padding: "20px 0", textAlign: "center" }}>
          <span
            style={{
              fontFamily: "var(--font-share-tech)",
              fontSize: "12px",
              color: "#666",
            }}
          >
            로딩 중...
          </span>
        </div>
      ) : comments.length === 0 ? (
        <p
          style={{
            textAlign: "center",
            fontFamily: "var(--font-share-tech)",
            fontSize: "13px",
            color: "#555",
            padding: "24px 0 12px",
            letterSpacing: "0.05em",
          }}
        >
          아직 의견이 없습니다. 첫 배심원 의견을 남겨보세요!
        </p>
      ) : (
        <div style={{ maxHeight: "500px", overflowY: "auto", paddingRight: "4px" }}>
          {topLevelComments.map((c) => (
            <div key={c.id}>
              {renderComment(c)}
              {(repliesByParent.get(c.id) || []).map((reply) =>
                renderComment(reply, true)
              )}
            </div>
          ))}

          {hasMore && (
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "10px",
                fontFamily: "var(--font-share-tech)",
                fontSize: "11px",
                letterSpacing: "0.05em",
                color: accentColor,
                background: `rgba(${glowRgb}, 0.03)`,
                border: `1px solid rgba(${glowRgb}, 0.15)`,
                cursor: loadingMore ? "not-allowed" : "pointer",
                opacity: loadingMore ? 0.5 : 1,
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `rgba(${glowRgb}, 0.08)`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = `rgba(${glowRgb}, 0.03)`;
              }}
            >
              {loadingMore ? "불러오는 중..." : "더보기"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
