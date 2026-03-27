"use client";

import Link from "next/link";
import { judges } from "@/lib/judges";
import JudgeAvatar from "@/components/JudgeAvatar";
import DonutChart from "./DonutChart";

interface UserStatsPanelProps {
  stats: { total: number; avgSpice: number; favoriteJudgeId?: string; judgeCount: Record<string, number> };
  rank: { label: string; color: string; icon: string };
  donutSegments: { color: string; percent: number; label: string }[];
  recordCount: number;
  confirmClear: boolean;
  onClearAll: () => void;
}

export default function UserStatsPanel({ stats, rank, donutSegments, recordCount, confirmClear, onClearAll }: UserStatsPanelProps) {
  const favJudge = stats.favoriteJudgeId ? judges.find((j) => j.id === stats.favoriteJudgeId) : null;

  return (
    <aside className="w-full lg:w-[320px] lg:flex-shrink-0">
      <div
        className="lg:sticky cyber-clip"
        style={{
          top: "80px", background: "var(--glass-bg)", backdropFilter: "blur(14px)",
          border: "1px solid rgba(57,255,20,0.18)",
          boxShadow: "0 0 40px rgba(57,255,20,0.06), inset 0 0 30px rgba(57,255,20,0.02)",
          padding: "20px 18px",
        }}
      >
        <p className="uppercase tracking-widest text-center" style={{ fontFamily: "var(--font-orbitron)", fontSize: "14px", fontWeight: 800, color: "rgba(57,255,20,0.7)", letterSpacing: "0.15em", marginBottom: "20px", textShadow: "0 0 8px rgba(57,255,20,0.25)" }}>
          사용자 리포트
        </p>

        {/* Rank badge */}
        <div className="text-center" style={{ marginBottom: "24px" }}>
          <div className="inline-block rank-pulse" style={{ fontFamily: "var(--font-orbitron)", fontSize: "18px", fontWeight: 900, color: rank.color, border: `2px solid ${rank.color}60`, background: `${rank.color}15`, letterSpacing: "0.12em", padding: "10px 22px", textShadow: `0 0 10px ${rank.color}80`, marginBottom: "10px" }}>
            {rank.icon} {rank.label}
          </div>
          <p className="uppercase tracking-widest" style={{ fontFamily: "var(--font-share-tech)", fontSize: "11px", color: "var(--text-secondary)", fontWeight: 500, letterSpacing: "0.25em" }}>USER LEVEL</p>
        </div>

        <div style={{ height: "1px", background: "linear-gradient(90deg, transparent, rgba(57,255,20,0.25), transparent)", margin: "0 0 22px" }} />

        {/* Total */}
        <div style={{ marginBottom: "22px" }}>
          <p className="uppercase tracking-widest" style={{ fontFamily: "var(--font-share-tech)", fontSize: "13px", color: "rgba(255,255,255,0.75)", fontWeight: 600, marginBottom: "6px", letterSpacing: "0.15em" }}>
            {"\u2696\uFE0F"} 총 판결 횟수
          </p>
          <p style={{ fontFamily: "var(--font-orbitron)", fontSize: "clamp(30px, 6vw, 42px)", fontWeight: 900, color: "#39ff14", textShadow: "0 0 15px rgba(57,255,20,0.7), 0 0 40px rgba(57,255,20,0.3)", lineHeight: 1 }}>
            {stats.total}<span style={{ fontSize: "16px", color: "var(--text-secondary)", marginLeft: "4px", fontWeight: 700 }}>회</span>
          </p>
        </div>

        {/* Spice gauge */}
        <div style={{ marginBottom: "22px" }}>
          <p className="uppercase tracking-widest" style={{ fontFamily: "var(--font-share-tech)", fontSize: "13px", color: "rgba(255,255,255,0.75)", fontWeight: 600, marginBottom: "6px", letterSpacing: "0.15em" }}>
            {"\uD83C\uDF36\uFE0F"} 직설 지수
          </p>
          <div className="flex items-center" style={{ gap: "12px" }}>
            <span style={{ fontFamily: "var(--font-orbitron)", fontSize: "clamp(22px, 4vw, 28px)", fontWeight: 900, color: "#ff2d95", textShadow: "0 0 12px rgba(255,45,149,0.6), 0 0 30px rgba(255,45,149,0.25)", minWidth: "60px" }}>{stats.avgSpice}%</span>
            <div style={{ flex: 1, height: "12px", borderRadius: "6px", background: "var(--comment-bg)", overflow: "hidden" }}>
              <div className="stat-fill" style={{ width: `${stats.avgSpice}%`, height: "100%", background: "linear-gradient(90deg, #ff2d95, #ff6644)", boxShadow: "0 0 10px rgba(255,45,149,0.5)", borderRadius: "6px" }} />
            </div>
          </div>
        </div>

        {/* Favorite judge */}
        {favJudge && (
          <div style={{ marginBottom: "24px" }}>
            <p className="uppercase tracking-widest" style={{ fontFamily: "var(--font-share-tech)", fontSize: "13px", color: "rgba(255,255,255,0.75)", fontWeight: 600, marginBottom: "8px", letterSpacing: "0.15em" }}>
              {"\uD83C\uDFAF"} 단골 판사
            </p>
            <div className="flex items-center" style={{ gap: "10px" }}>
              <JudgeAvatar avatarUrl={favJudge.avatarUrl} name={favJudge.name} size={32} glowRgb={favJudge.glowRgb} />
              <span style={{ fontFamily: "var(--font-orbitron)", fontSize: "15px", fontWeight: 800, color: favJudge.accentColor, textShadow: `0 0 8px ${favJudge.accentColor}60` }}>{favJudge.name}</span>
            </div>
          </div>
        )}

        <div style={{ height: "1px", background: "linear-gradient(90deg, transparent, rgba(0,240,255,0.2), transparent)", margin: "0 0 22px" }} />

        {/* Donut chart */}
        <div style={{ marginBottom: "20px" }}>
          <p className="uppercase tracking-widest" style={{ fontFamily: "var(--font-share-tech)", fontSize: "13px", color: "rgba(255,255,255,0.65)", fontWeight: 600, marginBottom: "14px", letterSpacing: "0.12em" }}>판사별 이용 현황</p>
          {donutSegments.length > 0 ? (
            <div className="relative" style={{ width: "clamp(110px, 30vw, 140px)", height: "clamp(110px, 30vw, 140px)", margin: "0 auto" }}>
              <DonutChart segments={donutSegments} />
              <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ pointerEvents: "none" }}>
                <span style={{ fontFamily: "var(--font-orbitron)", fontSize: "24px", fontWeight: 900, color: "var(--text-primary)", textShadow: "0 0 8px rgba(255,255,255,0.2)" }}>{stats.total}</span>
                <span style={{ fontFamily: "var(--font-share-tech)", fontSize: "11px", color: "var(--text-secondary)", fontWeight: 600 }}>TOTAL</span>
              </div>
            </div>
          ) : (
            <p style={{ fontFamily: "var(--font-share-tech)", fontSize: "14px", color: "var(--text-muted)" }}>-</p>
          )}
          <div className="flex flex-col" style={{ marginTop: "16px", gap: "10px" }}>
            {judges.map((j) => {
              const cnt = stats.judgeCount[j.id] || 0;
              if (cnt === 0) return null;
              const pct = stats.total > 0 ? Math.round((cnt / stats.total) * 100) : 0;
              return (
                <div key={j.id} className="flex items-center" style={{ gap: "10px" }}>
                  <div style={{ width: "10px", height: "10px", borderRadius: "3px", background: j.accentColor, boxShadow: `0 0 6px ${j.accentColor}70`, flexShrink: 0 }} />
                  <span style={{ fontFamily: "var(--font-share-tech)", fontSize: "clamp(12px, 2.5vw, 14px)", color: "var(--text-primary)", flex: 1, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{j.name}</span>
                  <span style={{ fontFamily: "var(--font-orbitron)", fontSize: "clamp(11px, 2.5vw, 13px)", color: j.accentColor, fontWeight: 800, textShadow: `0 0 6px ${j.accentColor}40`, whiteSpace: "nowrap", flexShrink: 0 }}>
                    {cnt} <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>({pct}%)</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ height: "1px", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)", margin: "0 0 16px" }} />

        {/* Actions */}
        <div className="flex flex-col" style={{ gap: "10px" }}>
          <Link
            href="/"
            className="flex items-center justify-center w-full transition-all duration-200"
            style={{ fontFamily: "var(--font-share-tech)", fontSize: "15px", fontWeight: 600, letterSpacing: "0.08em", border: "1px solid rgba(57,255,20,0.3)", color: "#39ff14", background: "rgba(57,255,20,0.05)", padding: "14px 16px", minHeight: "48px", gap: "8px" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(57,255,20,0.12)"; e.currentTarget.style.boxShadow = "0 0 16px rgba(57,255,20,0.2)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(57,255,20,0.05)"; e.currentTarget.style.boxShadow = "none"; }}
          >
            {"\u2696\uFE0F"} 새 재판 받기
          </Link>
          {recordCount > 0 && (
            <button
              onClick={onClearAll}
              className="w-full transition-all duration-200 cursor-pointer"
              style={{ fontFamily: "var(--font-share-tech)", fontSize: "14px", fontWeight: 500, letterSpacing: "0.06em", border: confirmClear ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(255,255,255,0.08)", color: confirmClear ? "#ef4444" : "#6b7280", background: confirmClear ? "rgba(239,68,68,0.08)" : "transparent", padding: "10px 16px" }}
            >
              {confirmClear ? "\u26A0 정말 삭제?" : "\u2715 전체 삭제"}
            </button>
          )}
        </div>

        <div className="absolute" style={{ top: "6px", right: "8px", width: "10px", height: "10px", borderTop: "1px solid rgba(57,255,20,0.3)", borderRight: "1px solid rgba(57,255,20,0.3)" }} />
        <div className="absolute" style={{ bottom: "6px", left: "8px", width: "10px", height: "10px", borderBottom: "1px solid rgba(57,255,20,0.3)", borderLeft: "1px solid rgba(57,255,20,0.3)" }} />
      </div>
    </aside>
  );
}
