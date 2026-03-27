"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { judges } from "@/lib/judges";
import { getHistory, deleteVerdict, clearHistory } from "@/lib/history";
import type { VerdictRecord } from "@/lib/types";
import { dateLabel } from "@/lib/format-utils";
import { SPICE_MAP, getUserRank } from "@/lib/my-verdicts-utils";
import ShareModal from "@/components/ShareModal";
import UserStatsPanel from "@/components/my-verdicts/UserStatsPanel";
import MobileStatBar from "@/components/my-verdicts/MobileStatBar";
import VerdictCard from "@/components/my-verdicts/VerdictCard";
import EmptyState from "@/components/my-verdicts/EmptyState";
import "./my-verdicts.css";

export default function MyVerdictsPage() {
  const [records, setRecords] = useState<VerdictRecord[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [shareTarget, setShareTarget] = useState<VerdictRecord | null>(null);
  const [clientOrigin, setClientOrigin] = useState("");

  useEffect(() => {
    setRecords(getHistory());
    setClientOrigin(window.location.origin);
  }, []);

  const stats = useMemo(() => {
    const total = records.length;
    const avgSpice = total > 0 ? Math.round(records.reduce((sum, r) => sum + (SPICE_MAP[r.judgeId] ?? 50), 0) / total) : 0;
    const judgeCount: Record<string, number> = {};
    records.forEach((r) => { judgeCount[r.judgeId] = (judgeCount[r.judgeId] || 0) + 1; });
    const favoriteJudgeId = Object.entries(judgeCount).sort((a, b) => b[1] - a[1])[0]?.[0];
    return { total, avgSpice, favoriteJudgeId, judgeCount };
  }, [records]);

  const rank = getUserRank(stats.total);

  const donutSegments = useMemo(() => {
    if (stats.total === 0) return [];
    return judges
      .filter((j) => (stats.judgeCount[j.id] || 0) > 0)
      .map((j) => ({ color: j.accentColor, percent: Math.round(((stats.judgeCount[j.id] || 0) / stats.total) * 100), label: j.name }));
  }, [stats]);

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
    if (!confirmClear) { setConfirmClear(true); setTimeout(() => setConfirmClear(false), 3000); return; }
    clearHistory(); setRecords([]); setConfirmClear(false);
  };

  const handleToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  return (
    <div className="min-h-screen cyber-grid crt-overlay relative overflow-hidden pt-14">
      {/* Ambient glow */}
      <div className="fixed pointer-events-none rounded-full" style={{ top: "-200px", left: "33%", width: "500px", height: "500px", background: "rgba(57,255,20,0.05)", filter: "blur(200px)" }} />
      <div className="fixed pointer-events-none rounded-full" style={{ bottom: "-150px", right: "25%", width: "400px", height: "400px", background: "rgba(0,240,255,0.08)", filter: "blur(180px)" }} />

      <div className="relative z-10 w-full mx-auto py-8 md:py-12 px-4 sm:px-6 md:px-8" style={{ maxWidth: "95%" }}>
        {/* Header */}
        <div className="text-center" style={{ marginBottom: "24px" }}>
          <h1 className="uppercase" style={{ fontFamily: "var(--font-orbitron)", fontSize: "clamp(22px, 4vw, 42px)", fontWeight: 900, color: "var(--text-primary)", letterSpacing: "0.1em", textShadow: "0 0 6px rgba(57,255,20,0.35), 0 0 18px rgba(57,255,20,0.12)", marginBottom: "8px" }}>
            나의 판결 로그
          </h1>
          <p className="tracking-wider" style={{ fontFamily: "var(--font-share-tech)", fontSize: "14px", color: "var(--text-secondary)", fontWeight: 500 }}>MY VERDICT LOG</p>
        </div>
        <div className="holo-line" style={{ marginBottom: "24px" }} />

        {/* Mobile compact stat bar */}
        {records.length > 0 && <MobileStatBar stats={stats} rank={rank} />}

        {/* 2-column layout */}
        <div className="flex flex-col lg:flex-row lg:items-start" style={{ gap: "24px" }}>
          <div className="hidden lg:block">
            {records.length > 0 && (
              <UserStatsPanel stats={stats} rank={rank} donutSegments={donutSegments} recordCount={records.length} confirmClear={confirmClear} onClearAll={handleClearAll} />
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            {records.length === 0 && <EmptyState />}

            {records.length > 0 && (
              <div className="relative">
                <div className="absolute timeline-line hidden md:block" style={{ left: "13px", top: 0, bottom: 0, width: "2px", background: "linear-gradient(180deg, rgba(57,255,20,0.4), rgba(0,240,255,0.2), rgba(180,74,255,0.15), transparent)" }} />

                {groupedRecords.map((group) => (
                  <div key={group.date} style={{ marginBottom: "28px" }}>
                    <div className="flex items-center mb-3 md:pl-10" style={{ gap: "12px" }}>
                      <div className="hidden md:block absolute timeline-dot" style={{ left: "4px", width: "20px", height: "20px", borderRadius: "50%", background: "rgba(57,255,20,0.2)", border: "2px solid rgba(57,255,20,0.5)", color: "rgba(57,255,20,0.5)" }} />
                      <div className="flex items-center" style={{ background: "rgba(57,255,20,0.06)", border: "1px solid rgba(57,255,20,0.15)", padding: "6px 14px", borderRadius: "2px", gap: "8px" }}>
                        <span className="uppercase tracking-widest" style={{ fontFamily: "var(--font-share-tech)", fontSize: "13px", color: "rgba(57,255,20,0.7)", textShadow: "0 0 8px rgba(57,255,20,0.3)", fontWeight: 600 }}>
                          {"\uD83D\uDCC5"} {group.date}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col md:pl-10" style={{ gap: "12px" }}>
                      {group.records.map((record) => (
                        <VerdictCard
                          key={record.id}
                          record={record}
                          isExpanded={expandedId === record.id}
                          onToggle={setExpandedId}
                          onDelete={handleDelete}
                          onShare={setShareTarget}
                        />
                      ))}
                    </div>
                  </div>
                ))}

                <div className="text-center" style={{ marginTop: "28px" }}>
                  <span className="tracking-widest" style={{ fontFamily: "var(--font-share-tech)", fontSize: "13px", color: "var(--text-muted)", fontWeight: 500 }}>
                    TOTAL_RECORDS: {records.length} / 50
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center" style={{ paddingTop: "48px" }}>
          <div className="holo-line" style={{ marginBottom: "20px" }} />
          <p className="uppercase" style={{ fontFamily: "var(--font-share-tech)", fontSize: "12px", color: "var(--text-muted)", letterSpacing: "0.25em", fontWeight: 500 }}>
            Neon Court System &copy; 2026 &mdash; All judgments are AI-generated
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "16px", marginTop: "12px", fontFamily: "var(--font-share-tech)", fontSize: "9px", color: "#4b5563", letterSpacing: "0.15em" }}>
            <Link href="/terms" style={{ transition: "color 0.2s" }} onMouseEnter={e => (e.currentTarget.style.color = "#22d3ee")} onMouseLeave={e => (e.currentTarget.style.color = "#4b5563")}>이용약관</Link>
            <span>|</span>
            <Link href="/privacy" style={{ transition: "color 0.2s" }} onMouseEnter={e => (e.currentTarget.style.color = "#22d3ee")} onMouseLeave={e => (e.currentTarget.style.color = "#4b5563")}>개인정보처리방침</Link>
            <span>|</span>
            <Link href="/legal" style={{ transition: "color 0.2s" }} onMouseEnter={e => (e.currentTarget.style.color = "#f87171")} onMouseLeave={e => (e.currentTarget.style.color = "#4b5563")}>저작권 보호 및 법적 고지</Link>
          </div>
        </footer>
      </div>

      {/* Share Modal */}
      {shareTarget && (
        <ShareModal
          open={!!shareTarget} onClose={() => setShareTarget(null)}
          shareUrl={`${clientOrigin}/verdict/${shareTarget.id}`} onToast={handleToast}
          kakaoTitle={`[네온 코트] ${shareTarget.judgeName}의 판결`}
          kakaoDescription={shareTarget.viralQuote || shareTarget.verdict.slice(0, 80)}
          kakaoImageUrl={`${clientOrigin}/verdict/${shareTarget.id}/opengraph-image`}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-toast-in" style={{ background: "rgba(8,8,24,0.95)", border: "1px solid rgba(57,255,20,0.35)", fontFamily: "var(--font-share-tech)", fontSize: "15px", fontWeight: 600, color: "#39ff14", boxShadow: "0 0 25px rgba(57,255,20,0.2)", padding: "14px 28px" }}>
          {toast}
        </div>
      )}
    </div>
  );
}
