"use client";

import { memo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { judges } from "@/lib/judges";
import type { HallOfFameEntry, VoteType } from "@/lib/types";
import { timeAgo, renderVerdictHtml } from "@/lib/format-utils";
import JudgeAvatar from "@/components/JudgeAvatar";

const InlineComments = dynamic(() => import("@/components/InlineComments"), {
  loading: () => <div style={{ padding: "16px", textAlign: "center", fontFamily: "var(--font-share-tech)", fontSize: 11, color: "rgba(255,255,255,0.3)" }}>댓글 로딩 중...</div>,
});

interface FeedCardProps {
  entry: HallOfFameEntry;
  isLiked: boolean;
  isAuthor: boolean;
  isCommentsOpen: boolean;
  isStoryExpanded: boolean;
  isVerdictOpen: boolean;
  isBookmarked: boolean;
  juryVote: VoteType | undefined;
  commentCount: number;
  isDeleting: boolean;
  isVoting: boolean;
  animatingLike: boolean;
  isDoubleTap: boolean;
  isVoteGlow: boolean;
  voteAnimType: VoteType | null;
  bookmarkBouncing: boolean;
  onLike: (id: string) => void;
  onDoubleTap: (id: string) => void;
  onToggleComments: (id: string | null) => void;
  onToggleStory: (id: string | null) => void;
  onToggleVerdict: (id: string | null) => void;
  onBookmark: (id: string) => void;
  onDelete: (id: string) => void;
  onJuryVote: (id: string, vote: VoteType) => void;
  onCommentCountChange: (id: string, count: number) => void;
  index: number;
}

const PAGE_SIZE = 12;

function FeedCardInner({
  entry, isLiked, isAuthor, isCommentsOpen, isStoryExpanded, isVerdictOpen,
  isBookmarked, juryVote, commentCount, isDeleting, isVoting,
  animatingLike, isDoubleTap, isVoteGlow, voteAnimType, bookmarkBouncing,
  onLike, onDoubleTap, onToggleComments, onToggleStory, onToggleVerdict,
  onBookmark, onDelete, onJuryVote, onCommentCountChange, index,
}: FeedCardProps) {
  const judge = judges.find((j) => j.id === entry.judge_id);
  const accentColor = judge?.accentColor || "#00f0ff";
  const glowRgb = judge?.glowRgb || "0,240,255";
  const total = (entry.jury_agree ?? 0) + (entry.jury_disagree ?? 0);
  const agreePercent = total > 0 ? Math.round(((entry.jury_agree ?? 0) / total) * 100) : 0;
  const disagreePercent = total > 0 ? 100 - agreePercent : 0;
  const isHot = entry.likes >= 10;

  return (
    <article
      className={`feed-card ${isVoteGlow && voteAnimType === "agree" ? "vote-glow-green" : ""} ${isVoteGlow && voteAnimType === "disagree" ? "vote-glow-pink" : ""}`}
      style={{ animationDelay: `${(index % PAGE_SIZE) * 40}ms` }}
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
          {isAuthor && <span className="my-badge">MY</span>}
          {isAuthor && (
            <button
              onClick={() => onDelete(entry.id)}
              disabled={isDeleting}
              className="feed-more-btn"
              style={{ fontSize: 14, padding: "4px 6px" }}
            >
              {isDeleting ? "..." : "🗑️"}
            </button>
          )}
        </div>
      </div>

      {/* ── Story Body ── */}
      <div className="feed-story-body" onClick={() => onDoubleTap(entry.id)}>
        <p className="feed-story-text">
          &ldquo;{isStoryExpanded || entry.story.length <= 80
            ? entry.story
            : entry.story.slice(0, 80) + "..."}&rdquo;
          {entry.story.length > 80 && !isStoryExpanded && (
            <button
              className="feed-more-link"
              onClick={(e) => { e.stopPropagation(); onToggleStory(entry.id); }}
            >
              {" "}더보기
            </button>
          )}
        </p>
        {isStoryExpanded && (
          <button
            className="feed-more-link"
            onClick={(e) => { e.stopPropagation(); onToggleStory(null); }}
            style={{ marginTop: 4 }}
          >
            접기 ▲
          </button>
        )}
        {isDoubleTap && (
          <div className="double-tap-overlay">
            <span className="double-tap-emoji">🔥</span>
          </div>
        )}
      </div>

      {/* ── Verdict Section ── */}
      <div className="feed-verdict-section">
        <button
          onClick={() => onToggleVerdict(isVerdictOpen ? null : entry.id)}
          className="feed-verdict-toggle"
          aria-expanded={isVerdictOpen}
          style={{ borderColor: `rgba(${glowRgb},0.25)` }}
        >
          <div className="verdict-toggle-inner">
            <span className="verdict-label">VERDICT</span>
            {entry.tldr && (
              <span className="verdict-status-badge" style={{ color: accentColor, background: `rgba(${glowRgb},0.15)` }}>
                {entry.tldr}
              </span>
            )}
          </div>
          {entry.viral_quote && (
            <span className="verdict-summary" style={{ color: accentColor }}>
              &ldquo;{entry.viral_quote}&rdquo;
            </span>
          )}
          <span className="verdict-chevron" style={{ transform: isVerdictOpen ? "rotate(180deg)" : "rotate(0)" }}>▾</span>
        </button>

        <div className={`verdict-detail-accordion ${isVerdictOpen ? "expanded" : ""}`}>
          <div className="verdict-detail-inner">
            <div className="verdict-detail-content" style={{ borderColor: `rgba(${glowRgb},0.15)` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  padding: "2px 8px", borderRadius: 99,
                  background: `rgba(${glowRgb},0.08)`, border: `1px solid rgba(${glowRgb},0.15)`,
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
                      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-share-tech)", fontSize: 12, marginBottom: 4 }}>
                        <span style={{ color: "#00ffcc" }}>👍 동의 {agreePercent}%</span>
                        <span style={{ color: "#ff2d78" }}>반대 {disagreePercent}% 👎</span>
                      </div>
                      <div style={{ width: "100%", height: 4, background: "rgba(255,45,120,0.2)", borderRadius: 99, overflow: "hidden" }}>
                        <div style={{ width: `${agreePercent}%`, height: "100%", borderRadius: 99, background: "linear-gradient(90deg, #00ffcc, #00ff88)", transition: "width 0.5s ease" }} />
                      </div>
                      <div style={{ textAlign: "center", marginTop: 4, fontFamily: "var(--font-share-tech)", fontSize: 11, color: "var(--text-muted)" }}>
                        총 {total.toLocaleString()}명 참여
                      </div>
                    </div>
                  )}
                  <div className="jury-vote-buttons">
                    <button
                      className="jury-vote-btn"
                      onClick={() => onJuryVote(entry.id, "agree")}
                      disabled={isVoting}
                      style={juryVote === "agree" ? { background: "rgba(0,255,204,0.15)", borderColor: "#00ffcc", color: "#00ffcc" } : {}}
                    >
                      👍 {juryVote === "agree" ? "동의함 ✓" : "동의"}
                    </button>
                    <button
                      className="jury-vote-btn"
                      onClick={() => onJuryVote(entry.id, "disagree")}
                      disabled={isVoting}
                      style={juryVote === "disagree" ? { background: "rgba(255,45,120,0.15)", borderColor: "#ff2d78", color: "#ff2d78" } : {}}
                    >
                      👎 {juryVote === "disagree" ? "반대함 ✓" : "반대"}
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
          <button className={`reaction-btn ${animatingLike ? "reaction-pop" : ""}`} onClick={() => onLike(entry.id)}>
            <span className="reaction-emoji" style={{ filter: isLiked ? "none" : "grayscale(0.5) opacity(0.7)" }}>🔥</span>
            {entry.likes > 0 && <span className="reaction-count" style={isLiked ? { color: "#ff6b35" } : {}}>{entry.likes}</span>}
          </button>
          <button className="reaction-btn" onClick={() => onToggleComments(isCommentsOpen ? null : entry.id)}>
            <span className="reaction-emoji">💬</span>
            {commentCount > 0 && <span className="reaction-count" style={isCommentsOpen ? { color: accentColor } : {}}>{commentCount}</span>}
          </button>
        </div>
        <div className="reaction-right">
          <Link href={`/verdict/${entry.id}`} className="icon-btn" style={{ textDecoration: "none" }}>
            <span style={{ fontSize: 18, opacity: 0.5 }}>🔗</span>
          </Link>
          <button className={`icon-btn ${bookmarkBouncing ? "bookmark-bounce" : ""}`} onClick={() => onBookmark(entry.id)}>
            <span style={{ fontSize: 20, opacity: isBookmarked ? 1 : 0.4 }}>🔖</span>
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
            initialCount={commentCount}
            onCountChange={(n) => onCommentCountChange(entry.id, n)}
          />
        </div>
      )}
    </article>
  );
}

const FeedCard = memo(FeedCardInner);
export default FeedCard;
