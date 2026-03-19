"use client";

import type { TrialMode } from "@/lib/types";

interface SubmitButtonProps {
  isReady: boolean;
  isLoading: boolean;
  trialMode: TrialMode;
  onSubmit: () => void;
  isAppealTrial: boolean;
  fullCourtCompletedCount: number;
  judgesCount: number;
  story: string;
  trimmedLength: number;
}

export default function SubmitButton({
  isReady,
  isLoading,
  trialMode,
  onSubmit,
  isAppealTrial,
  fullCourtCompletedCount,
  judgesCount,
  story,
  trimmedLength,
}: SubmitButtonProps) {
  return (
    <section className="pb-4 md:pb-10">
      <button
        onClick={onSubmit}
        disabled={!isReady || isLoading}
        className={`
          cyber-clip-btn w-full py-3 md:py-6 font-[family-name:var(--font-orbitron)] font-bold
          text-sm md:text-xl tracking-[0.15em] md:tracking-[0.2em] uppercase
          transition-all duration-300 relative overflow-hidden
          ${
            isReady && !isLoading
              ? trialMode === "full-court"
                ? "bg-gradient-to-r from-neon-purple/15 via-neon-pink/10 to-neon-purple/15 border border-neon-purple/40 text-neon-purple cursor-pointer hover:border-neon-purple/70 active:scale-[0.98]"
                : "bg-gradient-to-r from-neon-blue/15 via-neon-purple/10 to-neon-blue/15 border border-neon-blue/40 text-neon-blue cursor-pointer hover:border-neon-blue/70 active:scale-[0.98]"
              : "bg-dark-surface/50 border border-dark-border text-gray-600 cursor-not-allowed"
          }
        `}
        style={
          isReady && !isLoading
            ? trialMode === "full-court"
              ? { boxShadow: "0 0 40px rgba(180,74,255,0.2), inset 0 0 40px rgba(180,74,255,0.05)" }
              : { boxShadow: "0 0 40px rgba(0,240,255,0.2), inset 0 0 40px rgba(0,240,255,0.05)" }
            : undefined
        }
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-3">
            <svg className="animate-spin-slow w-6 h-6 text-neon-purple" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="31.4 31.4" strokeLinecap="round" />
            </svg>
            <span className="animate-neon-pulse tracking-[0.3em]">
              {isAppealTrial
                ? "항소심 재판이 진행 중입니다..."
                : trialMode === "full-court"
                  ? `전원 판결 중... (${fullCourtCompletedCount}/${judgesCount})`
                  : "판결을 내리는 중..."}
            </span>
          </span>
        ) : (
          <span className="flex items-center justify-center gap-3">
            <span className="text-2xl">&#9878;</span>
            <span>{trialMode === "full-court" ? "전원 판결 받기" : "판결 받기"}</span>
          </span>
        )}

        {isReady && !isLoading && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent animate-shimmer pointer-events-none" />
        )}
      </button>

      <div className="flex justify-between mt-2 px-1">
        <span className="font-[family-name:var(--font-share-tech)] text-[9px] text-gray-700 tracking-widest">
          &#x25B8; SYS.READY
        </span>
        <span className="font-[family-name:var(--font-share-tech)] text-[9px] text-gray-700 tracking-widest">
          {!isReady
            ? !story.trim()
              ? "AWAITING_INPUT"
              : trimmedLength < 10
                ? "MIN_10_CHARS"
                : trialMode === "full-court"
                  ? "ALL_READY"
                  : "SELECT_JUDGE"
            : "EXECUTE &#x25C0;"}
        </span>
      </div>
    </section>
  );
}
