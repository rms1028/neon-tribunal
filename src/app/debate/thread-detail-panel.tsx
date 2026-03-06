"use client"

import { MessageSquare, ArrowLeft } from "lucide-react"
import { useThreadData } from "./use-thread-data"
import { ProConBattle } from "@/components/procon-battle"
import { BattleComments } from "@/components/battle-comments"
import { CyberJudgePanel } from "@/components/cyber-judge-panel"
import { AutoSummaryCard } from "@/components/auto-summary-card"
import { ShareButton } from "@/components/share-button"
import { ThreadEditButton } from "@/components/thread-edit-button"
import { DebateReplay } from "@/components/debate-replay"
import { AIDebatePanel } from "@/components/ai-debate-panel"
import { XpGate } from "@/components/xp-gate"
import { CountdownWrapper } from "@/app/thread/[id]/countdown-wrapper"
import { MuteButton } from "@/app/thread/[id]/mute-button"

export function ThreadDetailPanel({
  threadId,
  onBack,
}: {
  threadId: string | null
  onBack?: () => void
}) {
  const { data, loading, error } = useThreadData(threadId)

  /* ─── No thread selected ─── */
  if (!threadId) {
    return (
      <div style={{
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        height: "100%", background: "#0a0a0f", color: "#444",
        gap: 12,
      }}>
        <MessageSquare style={{ width: 48, height: 48, opacity: 0.3 }} />
        <span style={{ fontSize: 15, fontWeight: 600 }}>토론을 선택해주세요</span>
        <span style={{ fontSize: 12, color: "#333" }}>왼쪽 목록에서 토론을 선택하면 여기에 표시됩니다</span>
      </div>
    )
  }

  /* ─── Loading ─── */
  if (loading) {
    return (
      <div style={{
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        height: "100%", background: "#0a0a0f", gap: 12,
      }}>
        <div style={{
          width: 32, height: 32, border: "2px solid rgba(0,228,165,0.2)",
          borderTopColor: "#00e4a5", borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }} />
        <span style={{ fontSize: 12, color: "#555" }}>토론 불러오는 중...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  /* ─── Error ─── */
  if (error || !data) {
    return (
      <div style={{
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        height: "100%", background: "#0a0a0f", color: "#ef4444", gap: 8,
      }}>
        <span style={{ fontSize: 14, fontWeight: 600 }}>{error || "토론을 찾을 수 없습니다"}</span>
        {onBack && (
          <button type="button" onClick={onBack} style={{
            padding: "6px 16px", borderRadius: 8, fontSize: 12,
            border: "1px solid rgba(255,255,255,0.1)", background: "transparent",
            color: "#888", cursor: "pointer",
          }}>
            목록으로 돌아가기
          </button>
        )}
      </div>
    )
  }

  const isStrict = data.template === "strict"

  /* ─── Build header actions ─── */
  const headerActions = (
    <>
      {onBack && (
        <button type="button" onClick={onBack} className="md:hidden inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/5 p-1.5 text-zinc-400 hover:text-zinc-200 transition" title="목록으로">
          <ArrowLeft className="size-3.5" />
        </button>
      )}
      <ThreadEditButton threadId={data.threadId} threadCreatedBy={data.createdBy} initialTitle={data.title} initialContent={data.content} initialTag={data.tag} isClosed={data.isClosed} />
      <MuteButton threadId={data.threadId} />
      <ShareButton title={data.title} threadId={data.threadId} />
    </>
  )

  const countdownSlot = <CountdownWrapper expiresAt={data.expiresAt} isClosed={data.isClosed} threadId={data.threadId} />

  /* ─── STRICT template → ProConBattle ─── */
  if (isStrict) {
    const proCommentCount = data.comments.filter(c => c.side === "pro" && !c.isDeleted && !c.parentId).length
    const conCommentCount = data.comments.filter(c => c.side === "con" && !c.isDeleted && !c.parentId).length
    const isImbalanced = Math.abs(proCommentCount - conCommentCount) >= 2
    const weakerSide = proCommentCount < conCommentCount ? "찬성" : "반대"

    const toolsBlock = (
      <>
        <CyberJudgePanel threadId={data.threadId} initialSummary={data.aiSummary} initialVerdict={data.aiVerdict} isClosed={data.isClosed} proCommentCount={proCommentCount} conCommentCount={conCommentCount} />
        {!data.isClosed && (
          <div style={{ padding: "14px 16px", borderRadius: 14, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#bbb" }}>AI 반론 생성기</span>
            </div>
            {isImbalanced ? (
              <>
                <p style={{ fontSize: 10, color: "#666", lineHeight: 1.4, marginBottom: 6 }}>
                  <strong style={{ color: weakerSide === "찬성" ? "#00e4a5" : "#ff4d8d" }}>{weakerSide}</strong> 측 의견이 부족합니다
                </p>
                <XpGate requiredXp={30}>
                  <AIDebatePanel threadId={data.threadId} threadTitle={data.title} />
                </XpGate>
              </>
            ) : (
              <p style={{ fontSize: 10, color: "#555", lineHeight: 1.4 }}>양쪽 의견이 균형을 이루고 있습니다</p>
            )}
          </div>
        )}
        <AutoSummaryCard threadId={data.threadId} commentCount={data.comments.length} initialSummary={data.autoSummary} />
        {data.isClosed && <DebateReplay threadId={data.threadId} />}
      </>
    )

    return (
      <ProConBattle
        key={data.threadId}
        threadId={data.threadId} title={data.title} tag={data.tag} isClosed={data.isClosed}
        threadCreatedBy={data.createdBy} template={data.template}
        proPercent={data.proPercent} conPercent={data.conPercent} totalVotes={data.totalVotes}
        proCount={data.proCount} conCount={data.conCount}
        expiresAt={data.expiresAt} threadUpdatedAt={data.threadUpdatedAt}
        comments={data.comments}
        hasMoreComments={data.hasMoreComments} nextCursor={data.nextCursor}
        headerActions={headerActions} countdown={countdownSlot}
        toolsBlock={toolsBlock}
      />
    )
  }

  /* ─── FREE template → BattleComments (card grid) ─── */
  return (
    <div key={data.threadId} className="flex h-full flex-col overflow-hidden text-zinc-100" style={{ background: "#0a0f14" }}>
      {/* Header */}
      <div className="shrink-0 px-4 pt-3 pb-2 relative md:px-6" style={{ background: "#0a0f14" }}>
        {onBack && (
          <button type="button" onClick={onBack} className="absolute left-4 top-3 inline-flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-200 transition md:hidden">
            <ArrowLeft className="size-3.5" /> 목록
          </button>
        )}
        <div className="text-center max-w-xl mx-auto">
          <h1 className="font-orbitron text-lg font-black tracking-wide text-zinc-100 md:text-xl">{data.title}</h1>
          {data.content && <p className="mt-1 text-[12px] text-zinc-500 line-clamp-2 leading-relaxed">{data.content}</p>}
          <div className="mt-1 flex items-center justify-center gap-2">
            {data.tag && <span className="text-[10px] font-bold tracking-wider text-zinc-600">#{data.tag}</span>}
            {data.threadUpdatedAt && <span className="text-[9px] text-zinc-700">(수정됨)</span>}
          </div>
        </div>
        <div className="absolute right-4 top-3 flex items-center gap-1 md:right-6">
          <ThreadEditButton threadId={data.threadId} threadCreatedBy={data.createdBy} initialTitle={data.title} initialContent={data.content} initialTag={data.tag} isClosed={data.isClosed} />
          <MuteButton threadId={data.threadId} />
          <ShareButton title={data.title} threadId={data.threadId} />
        </div>
        <CountdownWrapper expiresAt={data.expiresAt} isClosed={data.isClosed} threadId={data.threadId} />
      </div>

      {/* Card Grid */}
      <div className="flex-1 min-h-0">
        <BattleComments
          threadId={data.threadId} comments={data.comments} isClosed={data.isClosed}
          threadCreatedBy={data.createdBy} template="free"
          hasMoreComments={data.hasMoreComments} nextCursor={data.nextCursor}
        />
      </div>
    </div>
  )
}
