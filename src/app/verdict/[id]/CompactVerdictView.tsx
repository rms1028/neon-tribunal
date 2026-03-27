"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { judges } from "@/lib/judges";
import type { HallOfFameEntry } from "@/lib/types";
import JudgeAvatar from "@/components/JudgeAvatar";
import JuryVoteSection from "@/components/JuryVoteSection";
import VerdictComments from "@/components/VerdictComments";
import EvidenceImage from "@/components/EvidenceImage";
import Toast from "@/components/Toast";

const LIKED_KEY = "neon-court-liked-ids";

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

function extractViralQuote(text: string): string | undefined {
  const match = text.match(/\[\[VIRAL:\s*(.+?)\]\]/);
  return match ? match[1].trim() : undefined;
}

function stripViralTag(text: string): string {
  return text
    .replace(/\n*\[\[TLDR:\s*.+?\]\]\s*/g, "")
    .replace(/\n*\[\[VIRAL:\s*.+?\]\]\s*/g, "")
    .replace(/\n*\[\[STORY:\s*.+?\]\]\s*/g, "")
    .trim();
}

export default function CompactVerdictView({
  entry,
}: {
  entry: HallOfFameEntry;
}) {
  const judge = judges.find((j) => j.id === entry.judge_id);
  const accentColor = judge?.accentColor || "#00f0ff";
  const glowRgb = judge?.glowRgb || "0,240,255";

  const viralQuote = entry.viral_quote || extractViralQuote(entry.verdict);
  const cleanVerdict = stripViralTag(entry.verdict);
  const displayQuote = viralQuote || cleanVerdict.split(/[.!?。]\s/)[0] + ".";

  const [likes, setLikes] = useState(entry.likes);
  const [isLiked, setIsLiked] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [toast, setToast] = useState({ message: "", visible: false });

  useEffect(() => {
    setIsLiked(getLikedIds().has(entry.id));
  }, [entry.id]);

  const handleLike = async () => {
    const wasLiked = isLiked;
    const method = wasLiked ? "DELETE" : "POST";

    setIsLiked(!wasLiked);
    setLikes((prev) => prev + (wasLiked ? -1 : 1));

    const newLikedIds = getLikedIds();
    if (wasLiked) {
      newLikedIds.delete(entry.id);
    } else {
      newLikedIds.add(entry.id);
      setAnimating(true);
      setTimeout(() => setAnimating(false), 300);
    }
    saveLikedIds(newLikedIds);

    try {
      const res = await fetch(`/api/hall-of-fame/${entry.id}/like`, { method });
      if (!res.ok) throw new Error();
    } catch {
      setIsLiked(wasLiked);
      setLikes((prev) => prev + (wasLiked ? 1 : -1));
      const rollback = getLikedIds();
      if (wasLiked) rollback.add(entry.id);
      else rollback.delete(entry.id);
      saveLikedIds(rollback);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-primary)",
        color: "var(--text-primary)",
      }}
    >
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "32px 16px 80px" }}>
        {/* Back button */}
        <button
          onClick={() => window.history.back()}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            color: "var(--text-muted)",
            fontSize: "14px",
            padding: "0 0 20px",
            fontFamily: "var(--font-share-tech)",
          }}
        >
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          재판소로 돌아가기
        </button>

        {/* Judge info */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "24px" }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: `rgba(${glowRgb}, 0.08)`,
            border: `1.5px solid rgba(${glowRgb}, 0.25)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            overflow: "hidden",
          }}>
            {judge ? (
              <JudgeAvatar
                avatarUrl={judge.avatarUrl}
                name={judge.name}
                size={44}
              />
            ) : (
              <span style={{ fontSize: "26px" }}>&#9878;</span>
            )}
          </div>
          <div>
            <div style={{
              fontFamily: "var(--font-orbitron)",
              fontWeight: 900,
              fontSize: "20px",
              color: accentColor,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}>
              {entry.judge_name}
            </div>
            <div style={{
              fontFamily: "var(--font-share-tech)",
              fontSize: "12px",
              color: "var(--text-muted)",
            }}>
              {timeAgo(entry.created_at)} · VERDICT_{entry.id.slice(0, 6).toUpperCase()}
            </div>
          </div>
        </div>

        {/* Story card */}
        <div style={{
          background: "#111118",
          border: "1px solid #1a1a2e",
          borderRadius: 16,
          padding: 24,
          marginBottom: 20,
        }}>
          <div style={{
            fontFamily: "var(--font-share-tech)",
            fontSize: "11px",
            color: "var(--text-muted)",
            letterSpacing: "1.5px",
            marginBottom: "10px",
          }}>
            CASE
          </div>
          <h2 style={{
            fontFamily: "var(--font-orbitron)",
            fontWeight: 800,
            fontSize: "22px",
            color: "var(--text-primary)",
            margin: "0 0 14px",
            lineHeight: 1.3,
          }}>
            &ldquo;{entry.story.length > 60 ? entry.story.slice(0, 60) : entry.story}&rdquo;
          </h2>
          <p style={{
            fontFamily: "var(--font-share-tech)",
            fontSize: "15px",
            color: "var(--text-secondary)",
            lineHeight: 1.8,
            margin: 0,
            whiteSpace: "pre-wrap",
            wordBreak: "keep-all",
            overflowWrap: "break-word",
          }}>
            {entry.story}
          </p>
        </div>

        {/* Evidence image */}
        {entry.image_url && (
          <div style={{ marginBottom: 20 }}>
            <EvidenceImage
              src={entry.image_url}
              maxHeight={300}
              style={{
                borderRadius: 16,
                border: "1px solid #1a1a2e",
              }}
            />
          </div>
        )}

        {/* Verdict card */}
        <div style={{
          background: `rgba(${glowRgb}, 0.04)`,
          border: `1.5px solid rgba(${glowRgb}, 0.2)`,
          borderRadius: 16,
          padding: 28,
          marginBottom: 20,
          position: "relative",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#FFE600" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m14 13-7.5 7.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L11 10"/>
              <path d="m16 16 6-6"/><path d="m8 8 6-6"/><path d="m9 7 8 8"/><path d="m21 11-8-8"/>
            </svg>
            <span style={{
              fontFamily: "var(--font-share-tech)",
              fontSize: "12px",
              color: "#FFE600",
              letterSpacing: "1.5px",
              fontWeight: 700,
            }}>
              AI 판결
            </span>
          </div>
          {entry.tldr && (
            <div style={{ marginBottom: "14px" }}>
              <span style={{
                display: "inline-block",
                background: `rgba(${glowRgb}, 0.12)`,
                border: `1px solid rgba(${glowRgb}, 0.3)`,
                borderRadius: 99,
                padding: "6px 18px",
                fontWeight: 900,
                fontSize: "16px",
                color: accentColor,
              }}>
                {entry.tldr}
              </span>
            </div>
          )}
          <p style={{
            fontFamily: "var(--font-share-tech)",
            fontWeight: 900,
            fontSize: "20px",
            color: "var(--text-primary)",
            margin: 0,
            lineHeight: 1.5,
            whiteSpace: "pre-wrap",
          }}>
            &ldquo;{cleanVerdict}&rdquo;
          </p>
        </div>

        {/* Jury Vote Section */}
        <div style={{
          background: "#111118",
          border: "1px solid #1a1a2e",
          borderRadius: 16,
          padding: 24,
          marginBottom: 20,
        }}>
          <div style={{
            fontFamily: "var(--font-share-tech)",
            fontSize: "11px",
            color: "var(--text-muted)",
            letterSpacing: "1.5px",
            marginBottom: "16px",
          }}>
            JURY VOTE · 이 판결에 동의하시나요?
          </div>
          <JuryVoteSection
            verdictId={entry.id}
            initialAgree={entry.jury_agree}
            initialDisagree={entry.jury_disagree}
            judgeName={entry.judge_name}
            judgeEmoji={judge?.emoji || "⚖"}
            judgeAvatarUrl={judge?.avatarUrl}
            glowRgb={glowRgb}
            accentColor={accentColor}
          />
        </div>

        {/* Like button */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
          <button
            onClick={handleLike}
            style={{
              background: isLiked ? "rgba(255,46,151,0.1)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${isLiked ? "rgba(255,46,151,0.3)" : "rgba(255,255,255,0.06)"}`,
              borderRadius: 99,
              padding: "10px 24px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: isLiked ? "#ff2d95" : "#666",
              fontSize: "14px",
              fontFamily: "var(--font-share-tech)",
              fontWeight: 500,
              transition: "all 0.2s",
            }}
          >
            <span className={animating ? "like-animate" : ""} style={{ fontSize: "18px" }}>
              {isLiked ? "\u2764" : "\u2661"}
            </span>
            공감 {likes}
          </button>
        </div>

        {/* Comments */}
        <div style={{
          background: "#111118",
          border: "1px solid #1a1a2e",
          borderRadius: 16,
          padding: 24,
        }}>
          <VerdictComments
            verdictId={entry.id}
            accentColor={accentColor}
            glowRgb={glowRgb}
          />
        </div>
      </div>

      <Toast message={toast.message} visible={toast.visible} />
    </div>
  );
}
