"use client"

import { type ReactNode, useState } from "react"
import { X } from "lucide-react"

/* ─── 툴바 아이콘 ─── */
const toolbarIcons = [
  /* AI 판결 */
  <svg key="ai" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
  /* 투표 통계 */
  <svg key="chart" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 17V13M12 17V9M17 17V5"/></svg>,
  /* 감정 분석 */
  <svg key="trend" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 8 14 12"/><path d="M2 20l6-6 4 4 10-10"/></svg>,
  /* 팩트 체크 */
  <svg key="target" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  /* 베스트 의견 */
  <svg key="star" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
]

export function ToolsDrawer({
  toolsBlock,
  children,
}: {
  toolsBlock: ReactNode
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* ── 툴바 (사이버펑크 HUD 툴벨트) ── */}
      <div className="flex shrink-0 items-center gap-1 border-b border-white/[0.06] px-4 py-1.5 md:px-6" style={{ background: "#0a0f14" }}>
        {/* 글래스모피즘 메인 버튼 */}
        <button type="button" onClick={() => setOpen(true)} className="hud-main-btn">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 3v18M3 12h18" /></svg>
          도구 &amp; 분석
        </button>

        {/* 구분선 */}
        <div className="hud-divider hidden sm:block" />

        {/* 아이콘 버튼들 — 테두리 없이, 호버 시 네온 발광 */}
        {toolbarIcons.map((icon, i) => (
          <button key={i} type="button" onClick={() => setOpen(true)} className="hud-icon-btn hidden sm:grid">
            {icon}
          </button>
        ))}

        {children}
      </div>

      {/* ── 오버레이 ── */}
      {open && (
        <div
          className="fixed inset-0 z-[100] bg-black/45 transition-opacity"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── 글래스모피즘 드로어 패널 ── */}
      <div
        className={`drawer-glass fixed inset-y-0 left-0 z-[101] flex w-[370px] max-w-[90vw] flex-col transition-transform duration-[400ms] ease-[cubic-bezier(.22,1,.36,1)] ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="h-4 w-[3px] rounded-sm bg-[#00ffcc] shadow-[0_0_8px_#00ffcc]" />
            <span className="font-orbitron text-sm font-bold text-[#00ffcc]">도구 &amp; 분석</span>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="grid size-8 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-zinc-400 transition hover:bg-white/10 hover:text-white hover:border-white/20"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* 바디 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 side-panel-scroll">
          {toolsBlock}
        </div>
      </div>
    </>
  )
}
