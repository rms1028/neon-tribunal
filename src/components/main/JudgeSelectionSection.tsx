"use client";

import { judges } from "@/lib/judges";
import type { TrialMode } from "@/lib/types";
import JudgeAvatar from "@/components/JudgeAvatar";
import { trackEvent } from "@/lib/analytics";

interface JudgeSelectionSectionProps {
  trialMode: TrialMode;
  selectedJudge: string | null;
  onJudgeSelect: (judgeId: string) => void;
}

export default function JudgeSelectionSection({ trialMode, selectedJudge, onJudgeSelect }: JudgeSelectionSectionProps) {
  return (
    <section className="flex flex-col">
      <h2 className="font-[family-name:var(--font-orbitron)] text-sm md:text-base font-bold mb-2 md:mb-4 text-white flex items-center gap-3 uppercase tracking-wider">
        <span className="accent-bar bg-neon-purple" />
        <span className="text-neon-purple text-xs mr-1">02</span>
        {trialMode === "full-court" ? "전원 출석" : "판사를 선택하세요"}
      </h2>

      <div className="grid grid-cols-2 gap-2 sm:gap-3 flex-1 relative">
        {judges.map((judge) => {
          const isSelected = trialMode === "full-court" || selectedJudge === judge.id;
          return (
            <button
              key={judge.id}
              onClick={() => { if (trialMode === "single") { onJudgeSelect(judge.id); trackEvent("judge_selected", { judge_id: judge.id, judge_name: judge.name }); } }}
              style={{
                ["--card-glow-color" as string]: judge.accentColor,
              }}
              className={`
                cyber-clip
                relative p-2.5 md:p-5 text-left transition-all duration-300
                glass-card
                ${trialMode === "full-court" ? "cursor-default" : "cursor-pointer"}
                ${isSelected ? "glass-card-active" : ""}
              `}
            >
              {isSelected && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    boxShadow: `0 0 25px rgba(${judge.glowRgb}, 0.25), inset 0 0 25px rgba(${judge.glowRgb}, 0.05)`,
                  }}
                />
              )}

              <div className="absolute top-2.5 right-4 flex items-center gap-1.5">
                <span className="font-[family-name:var(--font-share-tech)] text-[8px] md:text-[9px] tracking-wider" style={{ color: isSelected ? judge.accentColor : 'var(--text-muted)' }}>
                  {isSelected ? "ACTIVE" : "STANDBY"}
                </span>
                <div
                  className={`w-2 h-2 ${isSelected ? "animate-neon-pulse" : ""}`}
                  style={{
                    backgroundColor: isSelected ? judge.accentColor : "var(--bg-border)",
                    clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
                  }}
                />
              </div>

              <JudgeAvatar avatarUrl={judge.avatarUrl} name={judge.name} size={36} glowRgb={isSelected ? judge.glowRgb : undefined} className="mb-1 md:mb-2" />

              <h3
                className="font-[family-name:var(--font-orbitron)] font-bold text-[10px] md:text-sm mb-0.5 md:mb-1 transition-colors uppercase tracking-wide"
                style={{ color: isSelected ? judge.accentColor : "var(--text-primary)" }}
              >
                {judge.name}
              </h3>

              <p className="font-[family-name:var(--font-share-tech)] text-[8px] md:text-[10px] text-gray-500 tracking-[0.15em] mb-0.5 md:mb-1.5">
                &gt; {judge.subtitle}
              </p>

              <p className="text-[10px] md:text-xs text-gray-400 leading-relaxed" style={{ wordBreak: "keep-all", overflowWrap: "break-word" }}>
                {judge.description}
              </p>

              <div
                className="absolute bottom-0 left-0 h-[2px] transition-all duration-500"
                style={{
                  width: isSelected ? "100%" : "0%",
                  backgroundColor: judge.accentColor,
                  boxShadow: isSelected ? `0 0 10px rgba(${judge.glowRgb}, 0.6)` : "none",
                }}
              />
            </button>
          );
        })}

        {/* Full court overlay badge */}
        {trialMode === "full-court" && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-black/70 backdrop-blur-sm border border-neon-purple/50 px-4 py-2" style={{ boxShadow: "0 0 30px rgba(180,74,255,0.2)" }}>
              <span className="font-[family-name:var(--font-orbitron)] text-[10px] md:text-xs text-neon-purple tracking-[0.2em] uppercase">
                All Judges Active
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
