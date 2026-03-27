"use client";

import { useEffect } from "react";
import Link from "next/link";
import { judges } from "@/lib/judges";
import type { HallOfFameEntry } from "@/lib/types";
import { timeAgo } from "@/lib/format-utils";
import JudgeAvatar from "@/components/JudgeAvatar";

interface StoryOverlayProps {
  storyData: {
    judgeId: string;
    entries: HallOfFameEntry[];
    index: number;
  };
  storyPaused: boolean;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  onPauseToggle: (paused: boolean) => void;
}

export default function StoryOverlay({ storyData, storyPaused, onClose, onNext, onPrev, onPauseToggle }: StoryOverlayProps) {
  const judge = judges.find((j) => j.id === storyData.judgeId);
  const entry = storyData.entries[storyData.index];
  const accentColor = judge?.accentColor || "#00f0ff";
  const glowRgb = judge?.glowRgb || "0,240,255";

  // Auto-advance timer
  useEffect(() => {
    if (storyPaused) return;
    const timer = setTimeout(onNext, 5000);
    return () => clearTimeout(timer);
  }, [storyData.index, storyData.judgeId, storyPaused, onNext]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNext();
      if (e.key === "ArrowLeft") onPrev();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, onNext, onPrev]);

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
      <button className="story-close-btn" onClick={onClose}>✕</button>

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
          background: `rgba(${glowRgb},0.08)`, border: `1px solid rgba(${glowRgb},0.2)`,
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

      {/* Touch zones */}
      <div
        className="story-touch-zone story-touch-left"
        onClick={onPrev}
        onTouchStart={() => onPauseToggle(true)}
        onTouchEnd={() => onPauseToggle(false)}
        onMouseDown={() => onPauseToggle(true)}
        onMouseUp={() => onPauseToggle(false)}
      />
      <div
        className="story-touch-zone story-touch-right"
        onClick={onNext}
        onTouchStart={() => onPauseToggle(true)}
        onTouchEnd={() => onPauseToggle(false)}
        onMouseDown={() => onPauseToggle(true)}
        onMouseUp={() => onPauseToggle(false)}
      />

      {/* Bottom hint */}
      <Link href={`/verdict/${entry.id}`} className="story-bottom-hint" onClick={onClose}>
        ↑ 탭하여 상세 보기
      </Link>
    </div>
  );
}
