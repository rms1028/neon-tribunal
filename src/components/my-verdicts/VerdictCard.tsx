"use client";

import Link from "next/link";
import { judges } from "@/lib/judges";
import type { VerdictRecord } from "@/lib/types";
import { timeAgo } from "@/lib/format-utils";
import { getSpiceBadge } from "@/lib/my-verdicts-utils";
import JudgeAvatar from "@/components/JudgeAvatar";
import EvidenceImage from "@/components/EvidenceImage";

interface VerdictCardProps {
  record: VerdictRecord;
  isExpanded: boolean;
  onToggle: (id: string | null) => void;
  onDelete: (id: string) => void;
  onShare: (record: VerdictRecord) => void;
}

export default function VerdictCard({ record, isExpanded, onToggle, onDelete, onShare }: VerdictCardProps) {
  const judge = judges.find((j) => j.id === record.judgeId);
  const accentColor = judge?.accentColor || "#00f0ff";
  const glowRgb = judge?.glowRgb || "0,240,255";
  const spiceBadge = getSpiceBadge(record.judgeId);
  const hasMore = record.story.length > 60 || record.verdict.length > 100;

  return (
    <div
      className="relative cyber-clip card-scanline cursor-pointer"
      style={{
        background: "rgba(8,8,24,0.8)", backdropFilter: "blur(8px)",
        border: `1px solid rgba(${glowRgb},${isExpanded ? "0.25" : "0.12"})`,
        padding: "12px",
        boxShadow: isExpanded ? `0 0 25px rgba(${glowRgb},0.12), inset 0 0 25px rgba(${glowRgb},0.03)` : "none",
        transition: "box-shadow 0.3s ease, border-color 0.3s ease",
      }}
      onClick={() => onToggle(isExpanded ? null : record.id)}
    >
      {/* Collapsed Header */}
      <div className="relative z-10 flex items-center" style={{ gap: "8px" }}>
        {judge ? (
          <JudgeAvatar avatarUrl={judge.avatarUrl} name={judge.name} size={28} glowRgb={glowRgb} className="shrink-0 sm:[&]:w-9 sm:[&]:h-9" />
        ) : (
          <span className="shrink-0" style={{ fontSize: "22px" }}>{"\u2696"}</span>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="flex items-center flex-wrap" style={{ gap: "6px", marginBottom: "3px" }}>
            <span className="uppercase tracking-wide" style={{ fontFamily: "var(--font-orbitron)", fontSize: "clamp(10px, 2.5vw, 14px)", fontWeight: 800, color: accentColor, textShadow: `0 0 8px ${accentColor}50` }}>
              {record.judgeName}
            </span>
            <span className="tracking-wider hidden sm:inline" style={{ fontFamily: "var(--font-share-tech)", fontSize: "11px", fontWeight: 700, color: spiceBadge.color, background: `${spiceBadge.color}18`, border: `1px solid ${spiceBadge.color}35`, borderRadius: "3px", padding: "2px 6px" }}>
              {spiceBadge.icon} {spiceBadge.label}
            </span>
            <span className="sm:hidden" style={{ fontFamily: "var(--font-share-tech)", fontSize: "10px", color: "var(--text-secondary)" }}>
              {timeAgo(record.createdAt)}
            </span>
          </div>
          <p style={{ fontFamily: "var(--font-share-tech)", fontSize: "clamp(11px, 3vw, 14px)", color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontStyle: "italic", fontWeight: 500 }}>
            &quot;{record.story.slice(0, 70)}{record.story.length > 70 ? "..." : ""}&quot;
          </p>
        </div>
        <div className="flex items-center flex-shrink-0" style={{ gap: "8px" }}>
          <span className="hidden sm:inline" style={{ fontFamily: "var(--font-share-tech)", fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500 }}>{timeAgo(record.createdAt)}</span>
          {hasMore && (
            <span className="transition-transform duration-300" style={{ display: "inline-block", fontFamily: "var(--font-share-tech)", fontSize: "12px", color: isExpanded ? accentColor : "#777", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}>
              {"\u25BC"}
            </span>
          )}
        </div>
      </div>

      {/* One-liner verdict */}
      <div className="relative z-10" style={{ marginTop: "8px" }}>
        <p style={{ fontFamily: "var(--font-share-tech)", fontSize: "clamp(11px, 3vw, 14px)", color: "#e5e7eb", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}>
          {record.viralQuote ? `"${record.viralQuote}"` : record.verdict.slice(0, 90) + (record.verdict.length > 90 ? "..." : "")}
        </p>
      </div>

      {/* Expanded Content (accordion) */}
      <div className={`accordion-content ${isExpanded ? "expanded" : ""}`}>
        <div className="accordion-inner">
          <div className="relative z-10" style={{ marginTop: "20px" }}>
            {/* Full story */}
            <div style={{ padding: "16px 20px", borderRadius: "6px", background: "rgba(255,255,255,0.06)", borderLeft: `3px solid rgba(${glowRgb},0.4)`, marginBottom: "16px" }}>
              <p className="uppercase tracking-widest" style={{ fontFamily: "var(--font-share-tech)", fontSize: "11px", color: `rgba(${glowRgb},0.6)`, fontWeight: 600, marginBottom: "8px" }}>STORY</p>
              <p className="whitespace-pre-wrap" style={{ fontFamily: "var(--font-share-tech)", fontSize: "16px", lineHeight: "1.75", color: "var(--text-primary)", fontStyle: "italic", fontWeight: 500 }}>
                &quot;{record.story}&quot;
              </p>
            </div>

            {/* Evidence image */}
            {record.imageUrl && (
              <div style={{ marginBottom: "16px" }}>
                <p className="uppercase tracking-widest" style={{ fontFamily: "var(--font-share-tech)", fontSize: "11px", color: "var(--text-muted)", fontWeight: 600, marginBottom: "6px" }}>EVIDENCE_FILE</p>
                <EvidenceImage
                  src={record.imageUrl}
                  maxHeight={200}
                  style={{ border: `1px solid rgba(${glowRgb},0.2)`, clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))" }}
                />
              </div>
            )}

            {/* Full verdict */}
            <div style={{ marginBottom: "16px" }}>
              <p className="uppercase tracking-widest" style={{ fontFamily: "var(--font-share-tech)", fontSize: "11px", color: `rgba(${glowRgb},0.6)`, fontWeight: 600, marginBottom: "8px" }}>{"\u2696\uFE0F"} VERDICT</p>
              <p className="whitespace-pre-wrap" style={{ fontFamily: "var(--font-share-tech)", fontSize: "16px", lineHeight: "1.75", color: "var(--text-primary)", fontWeight: 500 }}>{record.verdict}</p>
            </div>

            {/* Viral quote */}
            {record.viralQuote && (
              <div className="text-center" style={{ padding: "14px 20px", background: `rgba(${glowRgb},0.07)`, border: `1px solid rgba(${glowRgb},0.2)`, borderRadius: "6px", marginBottom: "16px" }}>
                <p style={{ fontFamily: "var(--font-share-tech)", fontSize: "17px", fontWeight: 700, color: accentColor, textShadow: `0 0 10px rgba(${glowRgb},0.5)` }}>
                  &ldquo;{record.viralQuote}&rdquo;
                </p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between" style={{ borderTop: `1px solid rgba(${glowRgb},0.1)`, paddingTop: "16px", gap: "10px" }}>
              <div className="flex items-center flex-wrap" style={{ gap: "8px" }}>
                <button
                  onClick={(e) => { e.stopPropagation(); onShare(record); }}
                  className="flex items-center transition-all duration-200 cursor-pointer"
                  style={{ fontFamily: "var(--font-share-tech)", fontSize: "14px", fontWeight: 600, letterSpacing: "0.05em", border: `1px solid rgba(${glowRgb},0.3)`, color: accentColor, background: `rgba(${glowRgb},0.05)`, padding: "10px 16px", minHeight: "44px", gap: "6px" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = `rgba(${glowRgb},0.14)`; e.currentTarget.style.boxShadow = `0 0 14px rgba(${glowRgb},0.25)`; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = `rgba(${glowRgb},0.05)`; e.currentTarget.style.boxShadow = "none"; }}
                >
                  {"\uD83D\uDD17"} 공유
                </button>
                <Link
                  href={`/?story=${encodeURIComponent(record.story)}`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center transition-all duration-200"
                  style={{ fontFamily: "var(--font-share-tech)", fontSize: "14px", fontWeight: 600, letterSpacing: "0.05em", border: "1px solid rgba(255,170,0,0.3)", color: "#ffaa00", background: "rgba(255,170,0,0.05)", padding: "10px 16px", minHeight: "44px", gap: "6px" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,170,0,0.14)"; e.currentTarget.style.boxShadow = "0 0 14px rgba(255,170,0,0.25)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,170,0,0.05)"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  {"\u2696\uFE0F"} 항소
                </Link>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(record.id); }}
                  className="flex items-center transition-all duration-200 cursor-pointer"
                  style={{ fontFamily: "var(--font-share-tech)", fontSize: "14px", fontWeight: 500, letterSpacing: "0.05em", border: "1px solid rgba(255,255,255,0.08)", color: "var(--text-secondary)", background: "transparent", padding: "10px 16px", minHeight: "44px", gap: "5px" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.35)"; e.currentTarget.style.background = "rgba(239,68,68,0.06)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "#9ca3af"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.background = "transparent"; }}
                >
                  {"\u2715"} 삭제
                </button>
              </div>
              <span className="tracking-widest uppercase hidden sm:inline" style={{ fontFamily: "var(--font-share-tech)", fontSize: "11px", color: "var(--text-muted)", fontWeight: 500 }}>
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
}
