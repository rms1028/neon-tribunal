"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { judges } from "@/lib/judges";
import { getHistory, deleteVerdict, clearHistory } from "@/lib/history";
import type { VerdictRecord } from "@/lib/types";
import JudgeAvatar from "@/components/JudgeAvatar";
import ShareModal from "@/components/ShareModal";
import "./my-verdicts.css";

/* ── helpers ── */

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


function dateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

/* ── spiciness scoring per judge ── */
const SPICE_MAP: Record<string, number> = {
  "justice-zero": 65,
  "heart-beat": 30,
  "cyber-rekka": 95,
  "detective-neon": 80,
};

function getSpiceBadge(judgeId: string): {
  label: string;
  icon: string;
  color: string;
} {
  const spice = SPICE_MAP[judgeId] ?? 50;
  if (spice >= 90)
    return { label: "매운맛", icon: "\uD83D\uDD25", color: "#ef4444" };
  if (spice >= 70)
    return { label: "중간맛", icon: "\u26A1", color: "#f97316" };
  if (spice >= 50)
    return { label: "순한맛", icon: "\uD83D\uDCA5", color: "#eab308" };
  return { label: "마일드", icon: "\uD83D\uDEE1\uFE0F", color: "#22d3ee" };
}

/* ── user rank system ── */
function getUserRank(count: number) {
  if (count >= 30)
    return { label: "Lv.5 마스터", color: "#ffaa00", icon: "\uD83D\uDC51" };
  if (count >= 20)
    return { label: "Lv.4 베테랑", color: "#ff2d95", icon: "\u2B50" };
  if (count >= 10)
    return { label: "Lv.3 단골", color: "#b44aff", icon: "\u26A1" };
  if (count >= 5)
    return { label: "Lv.2 일반", color: "#00f0ff", icon: "\u2696\uFE0F" };
  return { label: "Lv.1 입문", color: "#39ff14", icon: "\uD83D\uDD30" };
}

/* ── donut chart component ── */
function DonutChart({
  segments,
}: {
  segments: { color: string; percent: number; label: string }[];
}) {
  const R = 40;
  const C = 2 * Math.PI * R;
  let offset = 0;

  return (
    <svg viewBox="0 0 100 100" style={{ width: "100%", height: "100%" }}>
      {/* background ring */}
      <circle
        cx="50"
        cy="50"
        r={R}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="14"
      />
      {segments.map((seg, i) => {
        const dash = (seg.percent / 100) * C;
        const gap = C - dash;
        const currentOffset = offset;
        offset += dash;
        return (
          <circle
            key={i}
            cx="50"
            cy="50"
            r={R}
            fill="none"
            stroke={seg.color}
            strokeWidth="14"
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-currentOffset}
            strokeLinecap="butt"
            className="donut-segment"
            style={{
              ["--circumference" as string]: `${C}`,
              transformOrigin: "50% 50%",
              transform: "rotate(-90deg)",
              filter: `drop-shadow(0 0 6px ${seg.color}80)`,
            }}
          />
        );
      })}
    </svg>
  );
}

export default function MyVerdictsPage() {
  const [records, setRecords] = useState<VerdictRecord[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [shareTarget, setShareTarget] = useState<VerdictRecord | null>(null);

  useEffect(() => {
    setRecords(getHistory());
  }, []);

  /* ── computed stats ── */
  const stats = useMemo(() => {
    const total = records.length;
    const avgSpice =
      total > 0
        ? Math.round(
            records.reduce((sum, r) => sum + (SPICE_MAP[r.judgeId] ?? 50), 0) /
              total
          )
        : 0;
    const judgeCount: Record<string, number> = {};
    records.forEach((r) => {
      judgeCount[r.judgeId] = (judgeCount[r.judgeId] || 0) + 1;
    });
    const favoriteJudgeId = Object.entries(judgeCount).sort(
      (a, b) => b[1] - a[1]
    )[0]?.[0];
    return { total, avgSpice, favoriteJudgeId, judgeCount };
  }, [records]);

  const rank = getUserRank(stats.total);

  /* donut chart data */
  const donutSegments = useMemo(() => {
    if (stats.total === 0) return [];
    return judges
      .filter((j) => (stats.judgeCount[j.id] || 0) > 0)
      .map((j) => ({
        color: j.accentColor,
        percent: Math.round(
          ((stats.judgeCount[j.id] || 0) / stats.total) * 100
        ),
        label: j.name,
      }));
  }, [stats]);

  /* group records by date */
  const groupedRecords = useMemo(() => {
    const map = new Map<string, VerdictRecord[]>();
    records.forEach((r) => {
      const key = dateLabel(r.createdAt);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    });
    return Array.from(map.entries()).map(([date, recs]) => ({ date, records: recs }));
  }, [records]);

  const handleDelete = (id: string) => {
    deleteVerdict(id);
    setRecords((prev) => prev.filter((r) => r.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const handleClearAll = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000);
      return;
    }
    clearHistory();
    setRecords([]);
    setConfirmClear(false);
  };

  const getJudgeData = (judgeId: string) => judges.find((j) => j.id === judgeId);

  const handleToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  /* ──────────────────────────────────────────
   *  SIDEBAR (sticky left panel)
   * ────────────────────────────────────────── */
  const renderSidebar = () => (
    <aside
      className="w-full lg:w-[320px] lg:flex-shrink-0"
    >
      <div
        className="lg:sticky cyber-clip"
        style={{
          top: "80px",
          background: "rgba(8,8,24,0.85)",
          backdropFilter: "blur(14px)",
          border: "1px solid rgba(57,255,20,0.18)",
          boxShadow: "0 0 40px rgba(57,255,20,0.06), inset 0 0 30px rgba(57,255,20,0.02)",
          padding: "20px 18px",
        }}
      >
        {/* Section title */}
        <p
          className="uppercase tracking-widest text-center"
          style={{
            fontFamily: "var(--font-orbitron)",
            fontSize: "14px",
            fontWeight: 800,
            color: "rgba(57,255,20,0.7)",
            letterSpacing: "0.15em",
            marginBottom: "20px",
            textShadow: "0 0 8px rgba(57,255,20,0.25)",
          }}
        >
          사용자 리포트
        </p>

        {/* Rank badge */}
        <div className="text-center" style={{ marginBottom: "24px" }}>
          <div
            className="inline-block rank-pulse"
            style={{
              fontFamily: "var(--font-orbitron)",
              fontSize: "18px",
              fontWeight: 900,
              color: rank.color,
              border: `2px solid ${rank.color}60`,
              background: `${rank.color}15`,
              letterSpacing: "0.12em",
              padding: "10px 22px",
              textShadow: `0 0 10px ${rank.color}80`,
              marginBottom: "10px",
            }}
          >
            {rank.icon} {rank.label}
          </div>
          <p
            className="uppercase tracking-widest"
            style={{
              fontFamily: "var(--font-share-tech)",
              fontSize: "11px",
              color: "#9ca3af",
              fontWeight: 500,
              letterSpacing: "0.25em",
            }}
          >
            USER LEVEL
          </p>
        </div>

        {/* Divider */}
        <div
          style={{
            height: "1px",
            background: "linear-gradient(90deg, transparent, rgba(57,255,20,0.25), transparent)",
            margin: "0 0 22px",
          }}
        />

        {/* Total */}
        <div style={{ marginBottom: "22px" }}>
          <p
            className="uppercase tracking-widest"
            style={{
              fontFamily: "var(--font-share-tech)",
              fontSize: "13px",
              color: "rgba(255,255,255,0.75)",
              fontWeight: 600,
              marginBottom: "6px",
              letterSpacing: "0.15em",
            }}
          >
            {"\u2696\uFE0F"} 총 판결 횟수
          </p>
          <p
            style={{
              fontFamily: "var(--font-orbitron)",
              fontSize: "clamp(30px, 6vw, 42px)",
              fontWeight: 900,
              color: "#39ff14",
              textShadow: "0 0 15px rgba(57,255,20,0.7), 0 0 40px rgba(57,255,20,0.3)",
              lineHeight: 1,
            }}
          >
            {stats.total}
            <span style={{ fontSize: "16px", color: "#9ca3af", marginLeft: "4px", fontWeight: 700 }}>회</span>
          </p>
        </div>

        {/* Spice gauge */}
        <div style={{ marginBottom: "22px" }}>
          <p
            className="uppercase tracking-widest"
            style={{
              fontFamily: "var(--font-share-tech)",
              fontSize: "13px",
              color: "rgba(255,255,255,0.75)",
              fontWeight: 600,
              marginBottom: "6px",
              letterSpacing: "0.15em",
            }}
          >
            {"\uD83C\uDF36\uFE0F"} 직설 지수
          </p>
          <div className="flex items-center" style={{ gap: "12px" }}>
            <span
              style={{
                fontFamily: "var(--font-orbitron)",
                fontSize: "clamp(22px, 4vw, 28px)",
                fontWeight: 900,
                color: "#ff2d95",
                textShadow: "0 0 12px rgba(255,45,149,0.6), 0 0 30px rgba(255,45,149,0.25)",
                minWidth: "60px",
              }}
            >
              {stats.avgSpice}%
            </span>
            <div
              style={{
                flex: 1,
                height: "12px",
                borderRadius: "6px",
                background: "rgba(255,255,255,0.08)",
                overflow: "hidden",
              }}
            >
              <div
                className="stat-fill"
                style={{
                  width: `${stats.avgSpice}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, #ff2d95, #ff6644)",
                  boxShadow: "0 0 10px rgba(255,45,149,0.5)",
                  borderRadius: "6px",
                }}
              />
            </div>
          </div>
        </div>

        {/* Favorite judge */}
        {stats.favoriteJudgeId && (() => {
          const fj = getJudgeData(stats.favoriteJudgeId);
          if (!fj) return null;
          return (
            <div style={{ marginBottom: "24px" }}>
              <p
                className="uppercase tracking-widest"
                style={{
                  fontFamily: "var(--font-share-tech)",
                  fontSize: "13px",
                  color: "rgba(255,255,255,0.75)",
                  fontWeight: 600,
                  marginBottom: "8px",
                  letterSpacing: "0.15em",
                }}
              >
                {"\uD83C\uDFAF"} 단골 판사
              </p>
              <div className="flex items-center" style={{ gap: "10px" }}>
                <JudgeAvatar avatarUrl={fj.avatarUrl} name={fj.name} size={32} glowRgb={fj.glowRgb} />
                <span
                  style={{
                    fontFamily: "var(--font-orbitron)",
                    fontSize: "15px",
                    fontWeight: 800,
                    color: fj.accentColor,
                    textShadow: `0 0 8px ${fj.accentColor}60`,
                  }}
                >
                  {fj.name}
                </span>
              </div>
            </div>
          );
        })()}

        {/* Divider */}
        <div
          style={{
            height: "1px",
            background: "linear-gradient(90deg, transparent, rgba(0,240,255,0.2), transparent)",
            margin: "0 0 22px",
          }}
        />

        {/* Donut chart: judge usage */}
        <div style={{ marginBottom: "20px" }}>
          <p
            className="uppercase tracking-widest"
            style={{
              fontFamily: "var(--font-share-tech)",
              fontSize: "13px",
              color: "rgba(255,255,255,0.65)",
              fontWeight: 600,
              marginBottom: "14px",
              letterSpacing: "0.12em",
            }}
          >
            판사별 이용 현황
          </p>
          {donutSegments.length > 0 ? (
            <div className="relative" style={{ width: "clamp(110px, 30vw, 140px)", height: "clamp(110px, 30vw, 140px)", margin: "0 auto" }}>
              <DonutChart segments={donutSegments} />
              {/* Center text */}
              <div
                className="absolute inset-0 flex flex-col items-center justify-center"
                style={{ pointerEvents: "none" }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-orbitron)",
                    fontSize: "24px",
                    fontWeight: 900,
                    color: "#f3f4f6",
                    textShadow: "0 0 8px rgba(255,255,255,0.2)",
                  }}
                >
                  {stats.total}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-share-tech)",
                    fontSize: "11px",
                    color: "#9ca3af",
                    fontWeight: 600,
                  }}
                >
                  TOTAL
                </span>
              </div>
            </div>
          ) : (
            <p style={{ fontFamily: "var(--font-share-tech)", fontSize: "14px", color: "#6b7280" }}>-</p>
          )}
          {/* Legend */}
          <div className="flex flex-col" style={{ marginTop: "16px", gap: "10px" }}>
            {judges.map((j) => {
              const cnt = stats.judgeCount[j.id] || 0;
              if (cnt === 0) return null;
              const pct = stats.total > 0 ? Math.round((cnt / stats.total) * 100) : 0;
              return (
                <div key={j.id} className="flex items-center" style={{ gap: "10px" }}>
                  <div style={{ width: "10px", height: "10px", borderRadius: "3px", background: j.accentColor, boxShadow: `0 0 6px ${j.accentColor}70`, flexShrink: 0 }} />
                  <span style={{ fontFamily: "var(--font-share-tech)", fontSize: "clamp(12px, 2.5vw, 14px)", color: "#d1d5db", flex: 1, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {j.name}
                  </span>
                  <span style={{ fontFamily: "var(--font-orbitron)", fontSize: "clamp(11px, 2.5vw, 13px)", color: j.accentColor, fontWeight: 800, textShadow: `0 0 6px ${j.accentColor}40`, whiteSpace: "nowrap", flexShrink: 0 }}>
                    {cnt} <span style={{ color: "#9ca3af", fontWeight: 500 }}>({pct}%)</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            height: "1px",
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)",
            margin: "0 0 16px",
          }}
        />

        {/* Actions */}
        <div className="flex flex-col" style={{ gap: "10px" }}>
          <Link
            href="/"
            className="flex items-center justify-center w-full transition-all duration-200"
            style={{
              fontFamily: "var(--font-share-tech)",
              fontSize: "15px",
              fontWeight: 600,
              letterSpacing: "0.08em",
              border: "1px solid rgba(57,255,20,0.3)",
              color: "#39ff14",
              background: "rgba(57,255,20,0.05)",
              padding: "14px 16px",
              minHeight: "48px",
              gap: "8px",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(57,255,20,0.12)"; e.currentTarget.style.boxShadow = "0 0 16px rgba(57,255,20,0.2)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(57,255,20,0.05)"; e.currentTarget.style.boxShadow = "none"; }}
          >
            {"\u2696\uFE0F"} 새 재판 받기
          </Link>
          {records.length > 0 && (
            <button
              onClick={handleClearAll}
              className="w-full transition-all duration-200 cursor-pointer"
              style={{
                fontFamily: "var(--font-share-tech)",
                fontSize: "14px",
                fontWeight: 500,
                letterSpacing: "0.06em",
                border: confirmClear ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(255,255,255,0.08)",
                color: confirmClear ? "#ef4444" : "#6b7280",
                background: confirmClear ? "rgba(239,68,68,0.08)" : "transparent",
                padding: "10px 16px",
              }}
            >
              {confirmClear ? "\u26A0 정말 삭제?" : "\u2715 전체 삭제"}
            </button>
          )}
        </div>

        {/* Corner decorations */}
        <div className="absolute" style={{ top: "6px", right: "8px", width: "10px", height: "10px", borderTop: "1px solid rgba(57,255,20,0.3)", borderRight: "1px solid rgba(57,255,20,0.3)" }} />
        <div className="absolute" style={{ bottom: "6px", left: "8px", width: "10px", height: "10px", borderBottom: "1px solid rgba(57,255,20,0.3)", borderLeft: "1px solid rgba(57,255,20,0.3)" }} />
      </div>
    </aside>
  );

  /* ──────────────────────────────────────────
   *  RENDER
   * ────────────────────────────────────────── */
  return (
    <div className="min-h-screen cyber-grid crt-overlay relative overflow-hidden pt-14">
      {/* Ambient glow */}
      <div className="fixed pointer-events-none rounded-full" style={{ top: "-200px", left: "33%", width: "500px", height: "500px", background: "rgba(57,255,20,0.05)", filter: "blur(200px)" }} />
      <div className="fixed pointer-events-none rounded-full" style={{ bottom: "-150px", right: "25%", width: "400px", height: "400px", background: "rgba(0,240,255,0.08)", filter: "blur(180px)" }} />

      <div className="relative z-10 w-full mx-auto py-8 md:py-12 px-4 sm:px-6 md:px-8" style={{ maxWidth: "95%" }}>
        {/* ===== HEADER ===== */}
        <div className="text-center" style={{ marginBottom: "24px" }}>
          <h1
            className="uppercase"
            style={{
              fontFamily: "var(--font-orbitron)",
              fontSize: "clamp(22px, 4vw, 42px)",
              fontWeight: 900,
              color: "#ffffff",
              letterSpacing: "0.1em",
              textShadow: "0 0 10px rgba(57,255,20,0.6), 0 0 30px rgba(57,255,20,0.25)",
              marginBottom: "8px",
            }}
          >
            나의 판결 로그
          </h1>
          <p
            className="tracking-wider"
            style={{
              fontFamily: "var(--font-share-tech)",
              fontSize: "14px",
              color: "#9ca3af",
              fontWeight: 500,
            }}
          >
            MY VERDICT LOG
          </p>
        </div>

        <div className="holo-line" style={{ marginBottom: "24px" }} />

        {/* Mobile stat bar (hidden since sidebar is now visible on all screens) */}

        {/* ===== 2-COLUMN LAYOUT (mobile: stacked, desktop: side-by-side) ===== */}
        <div className="flex flex-col lg:flex-row lg:items-start" style={{ gap: "24px" }}>
          {/* Left: Sidebar (sticky on desktop, stacked on mobile) */}
          {records.length > 0 && renderSidebar()}

          {/* Right: Timeline records */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* ===== EMPTY STATE ===== */}
            {records.length === 0 && (
              <div className="text-center" style={{ padding: "80px 0" }}>
                <div style={{ fontSize: "72px", opacity: 0.3, marginBottom: "16px" }}>{"\u2696"}</div>
                <p
                  className="tracking-widest"
                  style={{
                    fontFamily: "var(--font-share-tech)",
                    fontSize: "16px",
                    color: "#9ca3af",
                    fontWeight: 500,
                    marginBottom: "8px",
                  }}
                >
                  기록이 비어있습니다
                </p>
                <p
                  className="tracking-wider"
                  style={{
                    fontFamily: "var(--font-share-tech)",
                    fontSize: "14px",
                    color: "#6b7280",
                    fontWeight: 500,
                    marginBottom: "28px",
                  }}
                >
                  판결을 받으면 자동으로 저장됩니다
                </p>
                <Link
                  href="/"
                  className="uppercase tracking-widest transition-all duration-200"
                  style={{
                    fontFamily: "var(--font-orbitron)",
                    fontSize: "14px",
                    fontWeight: 700,
                    border: "1px solid rgba(57,255,20,0.4)",
                    color: "#39ff14",
                    background: "rgba(57,255,20,0.05)",
                    padding: "14px 28px",
                    display: "inline-block",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(57,255,20,0.12)"; e.currentTarget.style.boxShadow = "0 0 20px rgba(57,255,20,0.2)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(57,255,20,0.05)"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  {"\u2696\uFE0F"} 재판 받으러 가기
                </Link>
              </div>
            )}

            {/* ===== TIMELINE ===== */}
            {records.length > 0 && (
              <div className="relative">
                {/* Vertical timeline line */}
                <div
                  className="absolute timeline-line hidden md:block"
                  style={{ left: "13px", top: 0, bottom: 0, width: "2px", background: "linear-gradient(180deg, rgba(57,255,20,0.4), rgba(0,240,255,0.2), rgba(180,74,255,0.15), transparent)" }}
                />

                {groupedRecords.map((group) => (
                  <div key={group.date} style={{ marginBottom: "28px" }}>
                    {/* Date header */}
                    <div className="flex items-center mb-3 md:pl-10" style={{ gap: "12px" }}>
                      <div
                        className="hidden md:block absolute timeline-dot"
                        style={{ left: "4px", width: "20px", height: "20px", borderRadius: "50%", background: "rgba(57,255,20,0.2)", border: "2px solid rgba(57,255,20,0.5)", color: "rgba(57,255,20,0.5)" }}
                      />
                      <div
                        className="flex items-center"
                        style={{ background: "rgba(57,255,20,0.06)", border: "1px solid rgba(57,255,20,0.15)", padding: "6px 14px", borderRadius: "2px", gap: "8px" }}
                      >
                        <span className="uppercase tracking-widest" style={{ fontFamily: "var(--font-share-tech)", fontSize: "13px", color: "rgba(57,255,20,0.7)", textShadow: "0 0 8px rgba(57,255,20,0.3)", fontWeight: 600 }}>
                          {"\uD83D\uDCC5"} {group.date}
                        </span>
                      </div>
                    </div>

                    {/* Cards */}
                    <div className="flex flex-col md:pl-10" style={{ gap: "12px" }}>
                      {group.records.map((record) => {
                        const judge = getJudgeData(record.judgeId);
                        const isExpanded = expandedId === record.id;
                        const accentColor = judge?.accentColor || "#00f0ff";
                        const glowRgb = judge?.glowRgb || "0,240,255";
                        const spiceBadge = getSpiceBadge(record.judgeId);
                        const hasMore = record.story.length > 60 || record.verdict.length > 100;

                        return (
                          <div
                            key={record.id}
                            className="relative cyber-clip card-scanline cursor-pointer"
                            style={{
                              background: "rgba(8,8,24,0.8)",
                              backdropFilter: "blur(8px)",
                              border: `1px solid rgba(${glowRgb},${isExpanded ? "0.25" : "0.12"})`,
                              padding: "16px",
                              boxShadow: isExpanded ? `0 0 25px rgba(${glowRgb},0.12), inset 0 0 25px rgba(${glowRgb},0.03)` : "none",
                              transition: "box-shadow 0.3s ease, border-color 0.3s ease",
                            }}
                            onClick={() => setExpandedId(isExpanded ? null : record.id)}
                          >
                            {/* ── COLLAPSED HEADER (always visible) ── */}
                            <div className="relative z-10 flex items-center" style={{ gap: "10px" }}>
                              {/* Judge avatar */}
                              {judge ? (
                                <JudgeAvatar avatarUrl={judge.avatarUrl} name={judge.name} size={36} glowRgb={glowRgb} />
                              ) : (
                                <span style={{ fontSize: "28px" }}>{"\u2696"}</span>
                              )}

                              {/* Info */}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div className="flex items-center" style={{ gap: "10px", marginBottom: "4px" }}>
                                  <span
                                    className="uppercase tracking-wide"
                                    style={{
                                      fontFamily: "var(--font-orbitron)",
                                      fontSize: "clamp(11px, 2.5vw, 14px)",
                                      fontWeight: 800,
                                      color: accentColor,
                                      textShadow: `0 0 8px ${accentColor}50`,
                                    }}
                                  >
                                    {record.judgeName}
                                  </span>
                                  {/* Spice badge */}
                                  <span
                                    className="tracking-wider"
                                    style={{
                                      fontFamily: "var(--font-share-tech)",
                                      fontSize: "12px",
                                      fontWeight: 700,
                                      color: spiceBadge.color,
                                      background: `${spiceBadge.color}18`,
                                      border: `1px solid ${spiceBadge.color}35`,
                                      borderRadius: "3px",
                                      padding: "3px 8px",
                                    }}
                                  >
                                    {spiceBadge.icon} {spiceBadge.label}
                                  </span>
                                </div>
                                {/* Story summary (1 line) */}
                                <p
                                  style={{
                                    fontFamily: "var(--font-share-tech)",
                                    fontSize: "14px",
                                    color: "#d1d5db",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    fontStyle: "italic",
                                    fontWeight: 500,
                                  }}
                                >
                                  &quot;{record.story.slice(0, 70)}{record.story.length > 70 ? "..." : ""}&quot;
                                </p>
                              </div>

                              {/* Right side */}
                              <div className="flex items-center flex-shrink-0" style={{ gap: "10px" }}>
                                <span style={{ fontFamily: "var(--font-share-tech)", fontSize: "12px", color: "#9ca3af", fontWeight: 500 }}>
                                  {timeAgo(record.createdAt)}
                                </span>
                                {hasMore && (
                                  <span
                                    className="transition-transform duration-300"
                                    style={{
                                      display: "inline-block",
                                      fontFamily: "var(--font-share-tech)",
                                      fontSize: "13px",
                                      color: isExpanded ? accentColor : "#777",
                                      transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                                    }}
                                  >
                                    {"\u25BC"}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* One-liner verdict (always visible) */}
                            <div className="relative z-10" style={{ marginTop: "10px", paddingLeft: "0" }}>
                              <p
                                style={{
                                  fontFamily: "var(--font-share-tech)",
                                  fontSize: "14px",
                                  color: "#e5e7eb",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  fontWeight: 500,
                                }}
                              >
                                {record.viralQuote
                                  ? `"${record.viralQuote}"`
                                  : record.verdict.slice(0, 90) + (record.verdict.length > 90 ? "..." : "")}
                              </p>
                            </div>

                            {/* ── EXPANDED CONTENT (accordion) ── */}
                            <div className={`accordion-content ${isExpanded ? "expanded" : ""}`}>
                              <div className="accordion-inner">
                                <div className="relative z-10" style={{ marginTop: "20px" }}>
                                  {/* Full story */}
                                  <div
                                    style={{
                                      padding: "16px 20px",
                                      borderRadius: "6px",
                                      background: "rgba(255,255,255,0.06)",
                                      borderLeft: `3px solid rgba(${glowRgb},0.4)`,
                                      marginBottom: "16px",
                                    }}
                                  >
                                    <p
                                      className="uppercase tracking-widest"
                                      style={{
                                        fontFamily: "var(--font-share-tech)",
                                        fontSize: "11px",
                                        color: `rgba(${glowRgb},0.6)`,
                                        fontWeight: 600,
                                        marginBottom: "8px",
                                      }}
                                    >
                                      STORY
                                    </p>
                                    <p
                                      className="whitespace-pre-wrap"
                                      style={{
                                        fontFamily: "var(--font-share-tech)",
                                        fontSize: "16px",
                                        lineHeight: "1.75",
                                        color: "#d1d5db",
                                        fontStyle: "italic",
                                        fontWeight: 500,
                                      }}
                                    >
                                      &quot;{record.story}&quot;
                                    </p>
                                  </div>

                                  {/* Evidence image */}
                                  {record.imageUrl && (
                                    <div style={{ marginBottom: "16px" }}>
                                      <p
                                        className="uppercase tracking-widest"
                                        style={{
                                          fontFamily: "var(--font-share-tech)",
                                          fontSize: "11px",
                                          color: "#6b7280",
                                          fontWeight: 600,
                                          marginBottom: "6px",
                                        }}
                                      >
                                        EVIDENCE_FILE
                                      </p>
                                      <img
                                        src={record.imageUrl}
                                        alt="증거 사진"
                                        className="max-w-full max-h-[200px] object-contain"
                                        style={{ border: `1px solid rgba(${glowRgb},0.2)`, clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))" }}
                                      />
                                    </div>
                                  )}

                                  {/* Full verdict */}
                                  <div style={{ marginBottom: "16px" }}>
                                    <p
                                      className="uppercase tracking-widest"
                                      style={{
                                        fontFamily: "var(--font-share-tech)",
                                        fontSize: "11px",
                                        color: `rgba(${glowRgb},0.6)`,
                                        fontWeight: 600,
                                        marginBottom: "8px",
                                      }}
                                    >
                                      {"\u2696\uFE0F"} VERDICT
                                    </p>
                                    <p
                                      className="whitespace-pre-wrap"
                                      style={{
                                        fontFamily: "var(--font-share-tech)",
                                        fontSize: "16px",
                                        lineHeight: "1.75",
                                        color: "#f3f4f6",
                                        fontWeight: 500,
                                      }}
                                    >
                                      {record.verdict}
                                    </p>
                                  </div>

                                  {/* Viral quote highlight */}
                                  {record.viralQuote && (
                                    <div
                                      className="text-center"
                                      style={{
                                        padding: "14px 20px",
                                        background: `rgba(${glowRgb},0.07)`,
                                        border: `1px solid rgba(${glowRgb},0.2)`,
                                        borderRadius: "6px",
                                        marginBottom: "16px",
                                      }}
                                    >
                                      <p
                                        style={{
                                          fontFamily: "var(--font-share-tech)",
                                          fontSize: "17px",
                                          fontWeight: 700,
                                          color: accentColor,
                                          textShadow: `0 0 10px rgba(${glowRgb},0.5)`,
                                        }}
                                      >
                                        &ldquo;{record.viralQuote}&rdquo;
                                      </p>
                                    </div>
                                  )}

                                  {/* Action buttons */}
                                  <div
                                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
                                    style={{ borderTop: `1px solid rgba(${glowRgb},0.1)`, paddingTop: "16px", gap: "10px" }}
                                  >
                                    <div className="flex items-center flex-wrap" style={{ gap: "8px" }}>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); setShareTarget(record); }}
                                        className="flex items-center transition-all duration-200 cursor-pointer"
                                        style={{
                                          fontFamily: "var(--font-share-tech)",
                                          fontSize: "14px",
                                          fontWeight: 600,
                                          letterSpacing: "0.05em",
                                          border: `1px solid rgba(${glowRgb},0.3)`,
                                          color: accentColor,
                                          background: `rgba(${glowRgb},0.05)`,
                                          padding: "10px 16px",
                                          minHeight: "44px",
                                          gap: "6px",
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.background = `rgba(${glowRgb},0.14)`; e.currentTarget.style.boxShadow = `0 0 14px rgba(${glowRgb},0.25)`; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = `rgba(${glowRgb},0.05)`; e.currentTarget.style.boxShadow = "none"; }}
                                      >
                                        {"\uD83D\uDD17"} 공유
                                      </button>
                                      <Link
                                        href={`/?story=${encodeURIComponent(record.story)}`}
                                        onClick={(e) => e.stopPropagation()}
                                        className="flex items-center transition-all duration-200"
                                        style={{
                                          fontFamily: "var(--font-share-tech)",
                                          fontSize: "14px",
                                          fontWeight: 600,
                                          letterSpacing: "0.05em",
                                          border: "1px solid rgba(255,170,0,0.3)",
                                          color: "#ffaa00",
                                          background: "rgba(255,170,0,0.05)",
                                          padding: "10px 16px",
                                          minHeight: "44px",
                                          gap: "6px",
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,170,0,0.14)"; e.currentTarget.style.boxShadow = "0 0 14px rgba(255,170,0,0.25)"; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,170,0,0.05)"; e.currentTarget.style.boxShadow = "none"; }}
                                      >
                                        {"\u2696\uFE0F"} 항소
                                      </Link>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleDelete(record.id); }}
                                        className="flex items-center transition-all duration-200 cursor-pointer"
                                        style={{
                                          fontFamily: "var(--font-share-tech)",
                                          fontSize: "14px",
                                          fontWeight: 500,
                                          letterSpacing: "0.05em",
                                          border: "1px solid rgba(255,255,255,0.08)",
                                          color: "#9ca3af",
                                          background: "transparent",
                                          padding: "10px 16px",
                                          minHeight: "44px",
                                          gap: "5px",
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.35)"; e.currentTarget.style.background = "rgba(239,68,68,0.06)"; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.color = "#9ca3af"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.background = "transparent"; }}
                                      >
                                        {"\u2715"} 삭제
                                      </button>
                                    </div>
                                    <span className="tracking-widest uppercase hidden sm:inline" style={{ fontFamily: "var(--font-share-tech)", fontSize: "11px", color: "#6b7280", fontWeight: 500 }}>
                                      CASE_{record.id.slice(0, 6).toUpperCase()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Corner decorations */}
                            <div className="absolute" style={{ top: "6px", right: "8px", width: "10px", height: "10px", borderTop: `1px solid rgba(${glowRgb},0.25)`, borderRight: `1px solid rgba(${glowRgb},0.25)` }} />
                            <div className="absolute" style={{ bottom: "6px", left: "8px", width: "10px", height: "10px", borderBottom: `1px solid rgba(${glowRgb},0.25)`, borderLeft: `1px solid rgba(${glowRgb},0.25)` }} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Record count */}
                <div className="text-center" style={{ marginTop: "28px" }}>
                  <span className="tracking-widest" style={{ fontFamily: "var(--font-share-tech)", fontSize: "13px", color: "#6b7280", fontWeight: 500 }}>
                    TOTAL_RECORDS: {records.length} / 50
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ===== FOOTER ===== */}
        <footer className="text-center" style={{ paddingTop: "48px" }}>
          <div className="holo-line" style={{ marginBottom: "20px" }} />
          <p className="uppercase" style={{ fontFamily: "var(--font-share-tech)", fontSize: "12px", color: "#6b7280", letterSpacing: "0.25em", fontWeight: 500 }}>
            Neon Court System &copy; 2026 &mdash; All judgments are AI-generated
          </p>
        </footer>
      </div>

      {/* ===== SHARE MODAL ===== */}
      {shareTarget && (
        <ShareModal
          open={!!shareTarget}
          onClose={() => setShareTarget(null)}
          shareUrl={`${typeof window !== "undefined" ? window.location.origin : ""}/verdict/${shareTarget.id}`}
          onToast={handleToast}
          kakaoTitle={`[네온 코트] ${shareTarget.judgeName}의 판결`}
          kakaoDescription={shareTarget.viralQuote || shareTarget.verdict.slice(0, 80)}
          kakaoImageUrl=""
        />
      )}

      {/* ===== TOAST ===== */}
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-toast-in"
          style={{
            background: "rgba(8,8,24,0.95)",
            border: "1px solid rgba(57,255,20,0.35)",
            fontFamily: "var(--font-share-tech)",
            fontSize: "15px",
            fontWeight: 600,
            color: "#39ff14",
            boxShadow: "0 0 25px rgba(57,255,20,0.2)",
            padding: "14px 28px",
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
