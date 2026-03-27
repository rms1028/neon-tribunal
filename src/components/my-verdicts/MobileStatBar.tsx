"use client";

import { judges } from "@/lib/judges";
import JudgeAvatar from "@/components/JudgeAvatar";

interface MobileStatBarProps {
  stats: { total: number; avgSpice: number; favoriteJudgeId?: string };
  rank: { label: string; color: string; icon: string };
}

export default function MobileStatBar({ stats, rank }: MobileStatBarProps) {
  const favJudge = stats.favoriteJudgeId ? judges.find((j) => j.id === stats.favoriteJudgeId) : null;

  return (
    <div
      className="lg:hidden mb-5"
      style={{ background: "var(--glass-bg)", border: "1px solid rgba(57,255,20,0.18)", borderRadius: "8px", padding: "12px 16px" }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span style={{ fontFamily: "var(--font-orbitron)", fontSize: "11px", fontWeight: 800, color: rank.color, border: `1px solid ${rank.color}50`, background: `${rank.color}15`, padding: "4px 10px", whiteSpace: "nowrap", textShadow: `0 0 6px ${rank.color}60` }}>
            {rank.icon} {rank.label}
          </span>
          <div className="flex items-baseline gap-1">
            <span style={{ fontFamily: "var(--font-orbitron)", fontSize: "22px", fontWeight: 900, color: "#39ff14", textShadow: "0 0 10px rgba(57,255,20,0.5)", lineHeight: 1 }}>{stats.total}</span>
            <span style={{ fontFamily: "var(--font-share-tech)", fontSize: "11px", color: "var(--text-secondary)" }}>회</span>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {favJudge && (
            <div className="flex items-center gap-1.5">
              <JudgeAvatar avatarUrl={favJudge.avatarUrl} name={favJudge.name} size={22} glowRgb={favJudge.glowRgb} />
              <span style={{ fontFamily: "var(--font-orbitron)", fontSize: "9px", fontWeight: 700, color: favJudge.accentColor }}>{favJudge.name}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span style={{ fontFamily: "var(--font-share-tech)", fontSize: "10px", color: "#ff2d95" }}>{"\uD83C\uDF36\uFE0F"}</span>
            <span style={{ fontFamily: "var(--font-orbitron)", fontSize: "12px", fontWeight: 800, color: "#ff2d95" }}>{stats.avgSpice}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
