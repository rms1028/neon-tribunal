"use client";

import React from "react";
import { judges } from "@/lib/judges";
import type { FullCourtJudgeResult } from "@/lib/types";
import JudgeAvatar from "@/components/JudgeAvatar";
import { stripMetaTags } from "@/lib/verdict-utils";

interface FullCourtResultsSectionProps {
  verdictRef: React.RefObject<HTMLDivElement | null>;
  actionButtonsRef: React.RefObject<HTMLDivElement | null>;
  fullCourtResults: Record<string, FullCourtJudgeResult>;
  fullCourtAllDone: boolean;
  fullCourtCompletedCount: number;
  isLoading: boolean;
  isAppealTrial: boolean;
  selectedFavoriteJudge: string | null;
  onSelectFavoriteJudge: (judgeId: string | null) => void;
  onRetrySingleJudge: (judgeId: string) => void;
  onShare: () => void;
  onSubmitToHoF: () => void;
  isSubmittingToHof: boolean;
  hofSubmitted: boolean;
  onAppealClick: () => void;
  onNewStory: () => void;
}

export default function FullCourtResultsSection({
  verdictRef,
  actionButtonsRef,
  fullCourtResults,
  fullCourtAllDone,
  fullCourtCompletedCount,
  isLoading,
  isAppealTrial,
  selectedFavoriteJudge,
  onSelectFavoriteJudge,
  onRetrySingleJudge,
  onShare,
  onSubmitToHoF,
  isSubmittingToHof,
  hofSubmitted,
  onAppealClick,
  onNewStory,
}: FullCourtResultsSectionProps) {
  return (
    <section ref={verdictRef} className="pb-12 verdict-reveal" style={{ scrollMarginTop: '80px' }}>
      <div className="holo-line mb-8" />

      <h2 className="font-[family-name:var(--font-orbitron)] text-sm md:text-base font-bold mb-6 text-white flex items-center gap-3 uppercase tracking-wider">
        <span className="accent-bar bg-neon-purple" />
        <span className="text-neon-purple text-xs mr-1">03</span>
        {isAppealTrial ? "2심 전원 판결 결과" : "전원 판결 결과"}
        <span className="ml-auto font-[family-name:var(--font-share-tech)] text-[10px] text-gray-500 tracking-widest">
          {fullCourtCompletedCount}/{judges.length} {isAppealTrial ? "APPEAL_RENDERED" : "RENDERED"}
        </span>
      </h2>

      {/* Progress bar */}
      <div className="w-full h-1 bg-dark-border mb-6 overflow-hidden">
        <div
          className="h-full transition-all duration-500 ease-out"
          style={{
            width: `${(fullCourtCompletedCount / judges.length) * 100}%`,
            background: "linear-gradient(90deg, #00f0ff, #b44aff, #ff2d95)",
            boxShadow: "0 0 10px rgba(0,240,255,0.3), 0 0 20px rgba(180,74,255,0.2)",
          }}
        />
      </div>

      {/* Side-by-Side Layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* LEFT: 2x2 Grid */}
        <div className="flex-1 min-w-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            {judges.map(judge => {
              const result = fullCourtResults[judge.id];
              if (!result) return null;
              const isSuccess = result.status === "success";
              const isError = result.status === "error";
              const isCardLoading = result.status === "loading";
              const isFavorite = selectedFavoriteJudge === judge.id;

              return (
                <div
                  key={judge.id}
                  className={`cyber-clip glass-card relative p-5 md:p-6 transition-all duration-500 ${
                    isSuccess ? "verdict-card-reveal" : ""
                  }`}
                  style={{
                    ["--card-glow-color" as string]: judge.accentColor,
                    boxShadow: isSuccess
                      ? isFavorite
                        ? `0 0 20px rgba(${judge.glowRgb}, 0.2), 0 0 0 2px rgba(240,225,48,0.4)`
                        : `0 0 20px rgba(${judge.glowRgb}, 0.15)`
                      : undefined,
                    opacity: isCardLoading && !result.verdict ? 0.7 : 1,
                  }}
                >
                  {/* Judge header */}
                  <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/5">
                    <JudgeAvatar avatarUrl={judge.avatarUrl} name={judge.name} size={36} glowRgb={judge.glowRgb} />
                    <div className="flex-1 min-w-0">
                      <h3
                        className="font-[family-name:var(--font-orbitron)] font-bold text-xs uppercase tracking-wide"
                        style={{ color: judge.accentColor }}
                      >
                        {judge.name}
                      </h3>
                      <p className="font-[family-name:var(--font-share-tech)] text-[9px] text-gray-500 tracking-[0.2em]">
                        {isCardLoading ? "ANALYZING..." : isSuccess ? "VERDICT_RENDERED" : "ERROR"}
                      </p>
                    </div>
                    <div
                      className={`w-2.5 h-2.5 flex-shrink-0 ${isCardLoading ? "animate-neon-pulse" : ""}`}
                      style={{
                        backgroundColor: isCardLoading ? judge.accentColor : isSuccess ? "#39ff14" : "#ff4444",
                        clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
                      }}
                    />
                  </div>

                  {/* Content */}
                  {isCardLoading && !result.verdict && (
                    <div className="space-y-2.5">
                      <div className="h-3 skeleton-line w-full" />
                      <div className="h-3 skeleton-line w-4/5" />
                      <div className="h-3 skeleton-line w-3/5" />
                      <div className="h-3 skeleton-line w-5/6" />
                    </div>
                  )}

                  {(isCardLoading && result.verdict) && (
                    <div className="text-xs md:text-sm text-gray-200 leading-relaxed whitespace-pre-wrap font-[family-name:var(--font-share-tech)] max-h-[250px] overflow-y-auto">
                      {stripMetaTags(result.verdict)}
                      <span
                        className="inline-block w-[2px] h-[1em] ml-[2px] align-middle animate-neon-pulse"
                        style={{ backgroundColor: judge.accentColor }}
                      />
                    </div>
                  )}

                  {isSuccess && (
                    <div className="text-xs md:text-sm text-gray-200 leading-relaxed whitespace-pre-wrap font-[family-name:var(--font-share-tech)] max-h-[250px] overflow-y-auto">
                      {result.verdict}
                    </div>
                  )}

                  {isError && (
                    <div>
                      <p className="text-xs text-red-400 font-[family-name:var(--font-share-tech)] mb-3">
                        {result.error}
                      </p>
                      <button
                        onClick={() => onRetrySingleJudge(judge.id)}
                        className="cyber-clip-btn w-full py-2 text-[10px] font-[family-name:var(--font-share-tech)] tracking-widest uppercase border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                      >
                        &#x21BB; 재시도
                      </button>
                    </div>
                  )}

                  {/* Favorite selector for HoF */}
                  {isSuccess && fullCourtAllDone && (
                    <button
                      onClick={() => onSelectFavoriteJudge(isFavorite ? null : judge.id)}
                      className={`mt-3 w-full py-2 text-[10px] font-[family-name:var(--font-share-tech)] tracking-widest uppercase border transition-all cursor-pointer ${
                        isFavorite
                          ? "border-neon-yellow/50 text-neon-yellow bg-neon-yellow/10"
                          : "border-dark-border text-gray-600 hover:text-gray-400 hover:border-gray-500"
                      }`}
                    >
                      {isFavorite ? "\u2605 대표 판결 선택됨" : "\u2606 대표 판결로 선택"}
                    </button>
                  )}

                  {/* Corner decorations */}
                  <div className="absolute top-2 right-3 w-2.5 h-2.5 border-t border-r" style={{ borderColor: `rgba(${judge.glowRgb}, 0.3)` }} />
                  <div className="absolute bottom-2 left-3 w-2.5 h-2.5 border-b border-l" style={{ borderColor: `rgba(${judge.glowRgb}, 0.3)` }} />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Action buttons grid */}
      {fullCourtAllDone && !isLoading && (
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
              disabled={isSubmittingToHof || !selectedFavoriteJudge}
              className="cyber-clip-btn w-full py-4 px-5 font-[family-name:var(--font-orbitron)] font-bold text-xs md:text-sm tracking-[0.12em] uppercase border-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                borderColor: selectedFavoriteJudge ? "rgba(240,225,48,0.6)" : "rgba(255,255,255,0.1)",
                color: selectedFavoriteJudge ? "#f0e130" : "#4b5563",
                background: selectedFavoriteJudge ? "rgba(240,225,48,0.1)" : "rgba(255,255,255,0.02)",
                cursor: selectedFavoriteJudge ? "pointer" : "not-allowed",
                boxShadow: selectedFavoriteJudge ? "0 0 20px rgba(240,225,48,0.15), inset 0 0 20px rgba(240,225,48,0.04)" : "none",
              }}
              onMouseEnter={(e) => { if (selectedFavoriteJudge) { e.currentTarget.style.boxShadow = "0 0 35px rgba(240,225,48,0.3), inset 0 0 25px rgba(240,225,48,0.08)"; e.currentTarget.style.textShadow = "0 0 10px rgba(240,225,48,0.8), 0 0 25px rgba(240,225,48,0.4)"; e.currentTarget.style.borderColor = "#f0e130"; e.currentTarget.style.background = "rgba(240,225,48,0.2)"; } }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = selectedFavoriteJudge ? "0 0 20px rgba(240,225,48,0.15), inset 0 0 20px rgba(240,225,48,0.04)" : "none"; e.currentTarget.style.textShadow = "none"; e.currentTarget.style.borderColor = selectedFavoriteJudge ? "rgba(240,225,48,0.6)" : "rgba(255,255,255,0.1)"; e.currentTarget.style.background = selectedFavoriteJudge ? "rgba(240,225,48,0.1)" : "rgba(255,255,255,0.02)"; }}
            >
              {isSubmittingToHof
                ? "소집 중..."
                : !selectedFavoriteJudge
                  ? "\u2606 대표 판결 선택"
                  : "\uD83D\uDC68\u200D\u2696\uFE0F 국민 배심원 소집하기"}
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
