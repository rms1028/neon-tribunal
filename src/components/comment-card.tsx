"use client"

import Link from "next/link"
import { CornerDownRight, Flag, GraduationCap, Pencil, Pin, ScanSearch, Trash2 } from "lucide-react"

import { MarkdownContent } from "@/components/markdown-content"
import { UserTitleBadge } from "@/components/user-title-badge"
import { CoachingPanel, type CoachingResult } from "@/components/coaching-panel"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/components/toast-provider"
import { supabase } from "@/lib/supabase"
import { timeAgo } from "@/lib/utils"
import type { BattleComment, CommentPoll, FactCheck, Reaction } from "@/types/comments"
import type { FeaturedBadgeDef } from "@/lib/gamification"
import { useState } from "react"

/** @[name](uuid) → [@name](/profile/uuid) */
function preprocessMentions(text: string): string {
  return text.replace(/@\[([^\]]+)\]\(([^)]+)\)/g, "[@$1](/profile/$2)")
}

function formatDateTime(value: string | null) {
  return timeAgo(value)
}

/* ─── Reaction config ─── */
const REACTIONS: { key: Reaction; emoji: string; label: string }[] = [
  { key: "fire", emoji: "🔥", label: "Hot" },
  { key: "like", emoji: "💡", label: "Insightful" },
  { key: "clap", emoji: "👏", label: "Well said" },
  { key: "think", emoji: "🤔", label: "Hmm" },
]

/* ─── CommentPollUI ─── */
export function CommentPollUI({ poll }: { poll: CommentPoll }) {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [pro, setPro] = useState(poll.proCount)
  const [con, setCon] = useState(poll.conCount)
  const [voted, setVoted] = useState<"pro" | "con" | null>(null)
  const [voting, setVoting] = useState(false)

  const total = pro + con
  const proPct = total > 0 ? Math.round((pro / total) * 100) : 50

  const handleVote = async (voteType: "pro" | "con") => {
    if (!user || voted || voting) return
    setVoting(true)
    if (voteType === "pro") setPro((p) => p + 1)
    else setCon((p) => p + 1)
    setVoted(voteType)

    const { error } = await supabase.rpc("cast_poll_vote", {
      p_poll_id: poll.pollId, p_user_id: user.id, p_vote_type: voteType,
    })
    if (error) {
      if (error.code === "PGRST202") {
        const { error: insertErr } = await supabase
          .from("comment_poll_votes")
          .insert({ poll_id: poll.pollId, user_id: user.id, vote_type: voteType })
        if (insertErr) {
          if (voteType === "pro") setPro((p) => p - 1); else setCon((p) => p - 1)
          setVoted(null)
          showToast(insertErr.code === "23505" ? "이미 투표했습니다." : "투표에 실패했습니다.", "info")
        }
      } else {
        if (voteType === "pro") setPro((p) => p - 1); else setCon((p) => p - 1)
        setVoted(null)
        showToast("이미 투표했습니다.", "info")
      }
    }
    setVoting(false)
  }

  return (
    <div className="mt-2 rounded-lg border border-white/[0.06] bg-black/40 p-2.5">
      <div className="mb-1.5 text-[11px] font-medium text-zinc-300">{poll.question}</div>
      {voted ? (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px]">
            <span className="w-7 text-emerald-400">찬성</span>
            <div className="relative flex-1 h-3.5 overflow-hidden rounded-full bg-white/[0.04]">
              <div className="poll-result-fill absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-400/70 to-emerald-400" style={{ "--poll-width": `${proPct}%` } as React.CSSProperties} />
              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white/90">{proPct}%</span>
            </div>
            <span className="w-5 text-right text-zinc-600">{pro}</span>
          </div>
          <div className="flex items-center gap-2 text-[10px]">
            <span className="w-7 text-rose-400">반대</span>
            <div className="relative flex-1 h-3.5 overflow-hidden rounded-full bg-white/[0.04]">
              <div className="poll-result-fill absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-rose-400/70 to-rose-400" style={{ "--poll-width": `${100 - proPct}%` } as React.CSSProperties} />
              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white/90">{100 - proPct}%</span>
            </div>
            <span className="w-5 text-right text-zinc-600">{con}</span>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={() => handleVote("pro")} disabled={!user || voting} className="flex-1 rounded border border-emerald-400/20 bg-emerald-400/5 py-1 text-[10px] font-bold text-emerald-400 transition hover:bg-emerald-400/15 disabled:opacity-50">찬성</button>
          <button type="button" onClick={() => handleVote("con")} disabled={!user || voting} className="flex-1 rounded border border-rose-400/20 bg-rose-400/5 py-1 text-[10px] font-bold text-rose-400 transition hover:bg-rose-400/15 disabled:opacity-50">반대</button>
        </div>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════
   CommentCard — Thread panel card style (no side colors)
   ════════════════════════════════════════════════════════════ */
export function CommentCard({
  comment, showTime, likeCount, myReaction, reacting, onReact,
  onReply, onReport, isBlocked, factCheck, onFactCheck, factChecking,
  isClosed, isOwn, editingId, editContent, onStartEdit, onCancelEdit,
  onSaveEdit, onChangeEdit, onDelete, onTogglePin, canPin,
  coaching, onCoach, coaching_loading, sentiment, featuredBadges,
  counts,
}: {
  comment: BattleComment; showTime: boolean; likeCount: number
  myReaction: Reaction | null; reacting: boolean
  onReact: (reaction: Reaction) => void; onReply?: () => void
  onReport?: () => void; isBlocked?: boolean
  factCheck?: FactCheck | null; onFactCheck?: () => void; factChecking?: boolean
  isClosed?: boolean; isOwn?: boolean
  editingId?: string | null; editContent?: string
  onStartEdit?: () => void; onCancelEdit?: () => void
  onSaveEdit?: () => void; onChangeEdit?: (value: string) => void
  onDelete?: () => void; onTogglePin?: () => void; canPin?: boolean
  coaching?: CoachingResult | null; onCoach?: () => void; coaching_loading?: boolean
  sentiment?: string | null; featuredBadges?: FeaturedBadgeDef[]
  counts?: { like: number; fire: number; clap?: number; think?: number }
}) {
  if (isBlocked) {
    return <div className="py-1 text-center text-[10px] italic text-zinc-700">차단한 사용자의 메시지</div>
  }
  if (comment.isDeleted) {
    return <div className="py-1 text-center text-[10px] italic text-zinc-700">삭제된 메시지</div>
  }

  const isEditing = editingId === comment.id

  const body = isEditing ? (
    <div className="mt-1.5 space-y-1.5">
      <textarea value={editContent ?? ""} onChange={(e) => onChangeEdit?.(e.target.value)} rows={2} maxLength={500} className="w-full resize-none rounded-lg border border-white/[0.08] bg-black/60 px-3 py-1.5 text-[13px] text-zinc-100 outline-none focus:border-zinc-600" />
      <div className="flex items-center justify-end gap-1.5">
        <button type="button" onClick={onCancelEdit} className="rounded px-2 py-0.5 text-[10px] text-zinc-500 hover:text-zinc-300">취소</button>
        <button type="button" onClick={onSaveEdit} className="rounded bg-emerald-400/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 hover:bg-emerald-400/20">저장</button>
      </div>
    </div>
  ) : (
    <div className="mt-1 text-[13px] leading-relaxed text-zinc-300">
      <MarkdownContent content={preprocessMentions(comment.content)} />
    </div>
  )

  const factBadge = factCheck && (
    <div className={`mt-1.5 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold ${
      factCheck.verdict === "확인됨" ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300" :
      factCheck.verdict === "의심" ? "border-amber-400/30 bg-amber-400/10 text-amber-300" :
      factCheck.verdict === "거짓" ? "border-red-400/30 bg-red-400/10 text-red-300" :
      "border-zinc-600 bg-zinc-800 text-zinc-400"
    }`} title={factCheck.explanation}>
      <ScanSearch className="size-2.5" /> 팩트체크: {factCheck.verdict}
    </div>
  )

  /* ─── 4-emoji reaction bar ─── */
  const reactions = (
    <div className="mt-2 flex items-center gap-0.5">
      {REACTIONS.map(({ key, emoji, label }) => {
        const count = key === "fire" ? (counts?.fire ?? comment.fireCount)
          : key === "like" ? (counts?.like ?? comment.likeCount)
          : key === "clap" ? (counts?.clap ?? comment.clapCount ?? 0)
          : (counts?.think ?? comment.thinkCount ?? 0)
        const isActive = myReaction === key

        return (
          <button
            key={key}
            type="button"
            onClick={() => onReact(key)}
            disabled={reacting}
            title={label}
            className={[
              "reaction-btn inline-flex items-center gap-0.5 rounded-full px-2 py-1 text-[11px] transition",
              isActive
                ? "bg-emerald-400/10 text-emerald-300 shadow-[0_0_6px_rgba(52,211,153,0.15)]"
                : count > 0
                  ? "text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300"
                  : "text-zinc-800 opacity-0 group-hover:opacity-100 hover:text-zinc-500",
            ].join(" ")}
          >
            <span className="text-[12px]">{emoji}</span>
            {count > 0 && <span className="text-[10px]">{count}</span>}
          </button>
        )
      })}

      {/* Action buttons */}
      {onReply && !isClosed && (
        <button type="button" onClick={onReply} className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-1 text-[10px] text-zinc-700 opacity-0 transition group-hover:opacity-100 hover:text-zinc-400">
          <CornerDownRight className="size-2.5" /> 답글
        </button>
      )}
      {onFactCheck && !factCheck && !isClosed && (
        <button type="button" onClick={onFactCheck} disabled={factChecking} className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-1 text-[10px] text-zinc-700 opacity-0 transition group-hover:opacity-100 hover:text-violet-400 disabled:opacity-40">
          <ScanSearch className="size-2.5" />{factChecking ? "…" : "팩트체크"}
        </button>
      )}
      {onCoach && !coaching && !isClosed && (
        <button type="button" onClick={onCoach} disabled={coaching_loading} className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-1 text-[10px] text-zinc-700 opacity-0 transition group-hover:opacity-100 hover:text-teal-400 disabled:opacity-40">
          <GraduationCap className="size-2.5" />{coaching_loading ? "…" : "AI 코칭"}
        </button>
      )}
      {onReport && (
        <button type="button" onClick={onReport} className="rounded-full px-1 py-0.5 text-zinc-800 opacity-0 transition group-hover:opacity-100 hover:text-zinc-400">
          <Flag className="size-2.5" />
        </button>
      )}
    </div>
  )

  const hoverActions = (
    <div className="absolute right-1 top-1 hidden items-center gap-0.5 rounded border border-white/[0.04] bg-[#0d0d0d]/95 px-0.5 py-0.5 shadow-xl group-hover:flex">
      {isOwn && !isClosed && !isEditing && (
        <>
          <button type="button" onClick={onStartEdit} className="rounded p-1 text-zinc-600 hover:text-zinc-300" title="수정"><Pencil className="size-2.5" /></button>
          <button type="button" onClick={onDelete} className="rounded p-1 text-zinc-600 hover:text-red-400" title="삭제"><Trash2 className="size-2.5" /></button>
        </>
      )}
      {canPin && !isClosed && (
        <button type="button" onClick={onTogglePin} className={`rounded p-1 ${comment.isPinned ? "text-yellow-300" : "text-zinc-600 hover:text-zinc-300"}`} title={comment.isPinned ? "고정 해제" : "고정"}>
          <Pin className="size-2.5" />
        </button>
      )}
    </div>
  )

  return (
    <div className="group relative rounded-lg px-3 py-2.5 transition hover:bg-white/[0.02]">
      {hoverActions}
      {/* Header: avatar + name + badges + time */}
      <div className="flex items-center gap-2">
        <div className="grid size-6 shrink-0 place-items-center rounded-full bg-gradient-to-br from-emerald-400/20 to-cyan-400/20 text-[9px] font-bold text-emerald-300">
          {comment.displayName.slice(0, 1)}
        </div>
        <div className="flex flex-wrap items-center gap-1.5 min-w-0">
          {comment.userId ? (
            <Link href={`/profile/${comment.userId}`} className="text-[12px] font-bold text-zinc-200 transition-colors hover:text-emerald-300 hover:underline" onClick={(e) => e.stopPropagation()}>
              {comment.displayName}
            </Link>
          ) : (
            <span className="text-[12px] font-bold text-zinc-200">{comment.displayName}</span>
          )}
          {comment.customTitle && <UserTitleBadge titleKey={comment.customTitle} />}
          {featuredBadges?.map((fb) => (
            <span key={fb.key} className={`featured-badge-glow inline-flex items-center gap-0.5 rounded-full border px-1 py-0.5 text-[8px] font-semibold ${fb.borderClass} ${fb.bgClass} ${fb.textClass}`} title={fb.name}>{fb.icon}</span>
          ))}
          {comment.isPinned && (
            <span className="inline-flex items-center gap-0.5 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-1 py-0.5 text-[8px] font-bold text-yellow-200 pin-pulse"><Pin className="size-2" /></span>
          )}
          {sentiment && (
            <span className={`inline-flex items-center rounded-full border px-1 py-0.5 text-[8px] font-semibold ${
              sentiment === "공격적" ? "border-red-400/20 bg-red-400/5 text-red-400" :
              sentiment === "논리적" ? "border-cyan-400/20 bg-cyan-400/5 text-cyan-400" :
              sentiment === "감성적" ? "border-pink-400/20 bg-pink-400/5 text-pink-400" :
              sentiment === "유머" ? "border-yellow-400/20 bg-yellow-400/5 text-yellow-400" :
              "border-zinc-600 bg-zinc-800 text-zinc-500"
            }`}>{sentiment}</span>
          )}
          {comment.updatedAt && <span className="text-[9px] text-zinc-700">(수정됨)</span>}
          <span className="text-[9px] text-zinc-700" suppressHydrationWarning>{showTime ? formatDateTime(comment.created_at) : ""}</span>
        </div>
      </div>
      {/* Body */}
      {body}
      {factBadge}
      {comment.poll && <CommentPollUI poll={comment.poll} />}
      {reactions}
      {coaching && <div className="mt-1 max-w-full"><CoachingPanel result={coaching} /></div>}
    </div>
  )
}
