"use client";

import React from "react";
import type { JudgeResponse } from "@/lib/types";
import JudgeAvatar from "@/components/JudgeAvatar";
import { stripMetaTags } from "@/lib/verdict-utils";

interface JudgeData {
  id: string;
  name: string;
  accentColor: string;
  glowRgb: string;
  avatarUrl: string;
}

interface SingleVerdictSectionProps {
  verdictRef: React.RefObject<HTMLDivElement | null>;
  actionButtonsRef: React.RefObject<HTMLDivElement | null>;
  verdict: JudgeResponse | null;
  isStreaming: boolean;
  streamingText: string;
  selectedJudgeData: JudgeData;
  isAppealTrial: boolean;
  onShare: () => void;
  onSubmitToHoF: () => void;
  isSubmittingToHof: boolean;
  hofSubmitted: boolean;
  onAppealClick: () => void;
  onNewStory: () => void;
}

export default function SingleVerdictSection({
  verdictRef,
  actionButtonsRef,
  verdict,
  isStreaming,
  streamingText,
  selectedJudgeData,
  isAppealTrial,
  onShare,
  onSubmitToHoF,
  isSubmittingToHof,
  hofSubmitted,
  onAppealClick,
  onNewStory,
}: SingleVerdictSectionProps) {
  return (
    <section ref={verdictRef} className="pb-12 verdict-reveal" style={{ scrollMarginTop: '80px' }}>
      <div className="holo-line mb-8" />

      <h2 className="font-[family-name:var(--font-orbitron)] text-sm md:text-base font-bold mb-6 text-white flex items-center gap-3 uppercase tracking-wider">
        <span className="accent-bar" style={{ backgroundColor: selectedJudgeData.accentColor }} />
        <span className="text-xs mr-1" style={{ color: selectedJudgeData.accentColor }}>03</span>
        {isAppealTrial ? "2심 판결 결과" : "판결 결과"}
      </h2>

      {/* Full-Width Verdict Card */}
      <div
        className="cyber-clip glass-card relative p-6 md:p-8"
        style={{
          ["--card-glow-color" as string]: selectedJudgeData.accentColor,
          boxShadow: `0 0 30px rgba(${selectedJudgeData.glowRgb}, 0.15), inset 0 0 30px rgba(${selectedJudgeData.glowRgb}, 0.03)`,
        }}
      >
        {/* Judge header */}
        <div className="flex items-center gap-4 mb-6 pb-4 border-b border-white/5">
          <JudgeAvatar avatarUrl={selectedJudgeData.avatarUrl} name={selectedJudgeData.name} size={56} glowRgb={selectedJudgeData.glowRgb} />
          <div>
            <h3
              className="font-[family-name:var(--font-orbitron)] font-bold text-sm md:text-base uppercase tracking-wide"
              style={{ color: selectedJudgeData.accentColor }}
            >
              {verdict?.judgeName ?? selectedJudgeData.name}
            </h3>
            <p className="font-[family-name:var(--font-share-tech)] text-[10px] text-gray-500 tracking-[0.2em]">
              {isStreaming
                ? (isAppealTrial ? "RENDERING_APPEAL..." : "RENDERING_VERDICT...")
                : (isAppealTrial ? "APPEAL_VERDICT_RENDERED" : "VERDICT_RENDERED")}
            </p>
          </div>
        </div>

        {/* Evidence image */}
        {verdict?.imageUrl && (
          <div className="mb-4">
            <p className="font-[family-name:var(--font-share-tech)] text-[9px] text-gray-600 tracking-widest uppercase mb-2">
              EVIDENCE_FILE
            </p>
            <img
              src={verdict.imageUrl}
              alt="증거 사진"
              className="max-w-full max-h-[300px] object-contain border border-dark-border"
              style={{ clipPath: "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))" }}
            />
          </div>
        )}

        {/* Verdict text */}
        <div className="text-sm md:text-base text-gray-200 leading-relaxed whitespace-pre-wrap font-[family-name:var(--font-share-tech)]">
          {verdict ? verdict.verdict : stripMetaTags(streamingText)}
          {isStreaming && (
            <span
              className="inline-block w-[2px] h-[1em] ml-[2px] align-middle animate-neon-pulse"
              style={{ backgroundColor: selectedJudgeData.accentColor }}
            />
          )}
        </div>

        {/* Corner decorations */}
        <div className="absolute top-2 right-3 w-3 h-3 border-t border-r" style={{ borderColor: `rgba(${selectedJudgeData.glowRgb}, 0.4)` }} />
        <div className="absolute bottom-2 left-3 w-3 h-3 border-b border-l" style={{ borderColor: `rgba(${selectedJudgeData.glowRgb}, 0.4)` }} />
      </div>

      {/* Action buttons grid */}
      {verdict && !isStreaming && (
        <div ref={actionButtonsRef} className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
          <button
            onClick={onShare}
            className="cyber-clip-btn w-full py-4 px-5 font-[family-name:var(--font-orbitron)] font-bold text-xs md:text-sm tracking-[0.12em] uppercase border-2 cursor-pointer transition-all duration-300"
            style={{ borderColor: "rgba(0,240,255,0.6)", color: "#00f0ff", background: "rgba(0,240,255,0.1)", boxShadow: "0 0 20px rgba(0,240,255,0.15), inset 0 0 20px rgba(0,240,255,0.04)" }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 0 35px rgba(0,240,255,0.3), inset 0 0 25px rgba(0,240,255,0.08)"; e.currentTarget.style.textShadow = "0 0 10px rgba(0,240,255,0.8), 0 0 25px rgba(0,240,255,0.4)"; e.currentTarget.style.borderColor = "#00f0ff"; e.currentTarget.style.background = "rgba(0,240,255,0.2)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 0 20px rgba(0,240,255,0.15), inset 0 0 20px rgba(0,240,255,0.04)"; e.currentTarget.style.textShadow = "none"; e.currentTarget.style.borderColor = "rgba(0,240,255,0.6)"; e.currentTarget.style.background = "rgba(0,240,255,0.1)"; }}
          >
            {"\uD83D\uDD17"} 공유하기
          </button>

          {!hofSubmitted ? (
            <button
              onClick={onSubmitToHoF}
              disabled={isSubmittingToHof}
              className="cyber-clip-btn w-full py-4 px-5 font-[family-name:var(--font-orbitron)] font-bold text-xs md:text-sm tracking-[0.12em] uppercase border-2 cursor-pointer transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ borderColor: "rgba(240,225,48,0.6)", color: "#f0e130", background: "rgba(240,225,48,0.1)", boxShadow: "0 0 20px rgba(240,225,48,0.15), inset 0 0 20px rgba(240,225,48,0.04)" }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 0 35px rgba(240,225,48,0.3), inset 0 0 25px rgba(240,225,48,0.08)"; e.currentTarget.style.textShadow = "0 0 10px rgba(240,225,48,0.8), 0 0 25px rgba(240,225,48,0.4)"; e.currentTarget.style.borderColor = "#f0e130"; e.currentTarget.style.background = "rgba(240,225,48,0.2)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 0 20px rgba(240,225,48,0.15), inset 0 0 20px rgba(240,225,48,0.04)"; e.currentTarget.style.textShadow = "none"; e.currentTarget.style.borderColor = "rgba(240,225,48,0.6)"; e.currentTarget.style.background = "rgba(240,225,48,0.1)"; }}
            >
              {isSubmittingToHof ? "소집 중..." : "\uD83D\uDC68\u200D\u2696\uFE0F 국민 배심원 소집하기"}
            </button>
          ) : <div />}

          <div className="flex gap-3 md:col-span-2 btn-row-wrap" style={{ flexWrap: "wrap" }}>
            {!isAppealTrial ? (
              <button
                onClick={onAppealClick}
                className="cyber-clip-btn flex-1 py-4 px-5 font-[family-name:var(--font-orbitron)] font-bold text-xs md:text-sm tracking-[0.12em] uppercase border-2 cursor-pointer transition-all duration-300"
                style={{ borderColor: "rgba(191,90,242,0.6)", color: "#bf5af2", background: "rgba(191,90,242,0.1)", boxShadow: "0 0 20px rgba(191,90,242,0.15), inset 0 0 20px rgba(191,90,242,0.04)", minWidth: "0" }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 0 35px rgba(191,90,242,0.3), inset 0 0 25px rgba(191,90,242,0.08)"; e.currentTarget.style.textShadow = "0 0 10px rgba(191,90,242,0.8), 0 0 25px rgba(191,90,242,0.4)"; e.currentTarget.style.borderColor = "#bf5af2"; e.currentTarget.style.background = "rgba(191,90,242,0.2)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 0 20px rgba(191,90,242,0.15), inset 0 0 20px rgba(191,90,242,0.04)"; e.currentTarget.style.textShadow = "none"; e.currentTarget.style.borderColor = "rgba(191,90,242,0.6)"; e.currentTarget.style.background = "rgba(191,90,242,0.1)"; }}
              >
                &#x2696;&#xFE0F; 항소하기
              </button>
            ) : <div className="flex-1" />}
            <button
              onClick={onNewStory}
              className="cyber-clip-btn flex-1 py-4 px-5 font-[family-name:var(--font-orbitron)] font-bold text-xs md:text-sm tracking-[0.12em] uppercase border-2 cursor-pointer transition-all duration-300"
              style={{ borderColor: "rgba(48,209,88,0.6)", color: "#30d158", background: "rgba(48,209,88,0.1)", boxShadow: "0 0 20px rgba(48,209,88,0.15), inset 0 0 20px rgba(48,209,88,0.04)", minWidth: "0" }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 0 35px rgba(48,209,88,0.3), inset 0 0 25px rgba(48,209,88,0.08)"; e.currentTarget.style.textShadow = "0 0 10px rgba(48,209,88,0.8), 0 0 25px rgba(48,209,88,0.4)"; e.currentTarget.style.borderColor = "#30d158"; e.currentTarget.style.background = "rgba(48,209,88,0.2)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 0 20px rgba(48,209,88,0.15), inset 0 0 20px rgba(48,209,88,0.04)"; e.currentTarget.style.textShadow = "none"; e.currentTarget.style.borderColor = "rgba(48,209,88,0.6)"; e.currentTarget.style.background = "rgba(48,209,88,0.1)"; }}
            >
              &#x270E;&#xFE0F; 새 재판 받기
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
