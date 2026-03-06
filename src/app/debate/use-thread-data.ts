"use client"

import { useEffect, useState, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { getDisplayName } from "@/lib/utils"
import type { BattleComment, CommentPoll } from "@/types/comments"
import type { JudgeResult } from "@/components/cyber-judge-panel"
import type { AutoSummary } from "@/components/auto-summary-card"

/* ─── Helpers (mirror of thread/[id]/page.tsx) ─── */
function pickString(row: Record<string, unknown>, keys: string[], fallback = "") {
  for (const k of keys) {
    const v = row[k]
    if (typeof v === "string" && v.trim().length > 0) return v
  }
  return fallback
}
function pickNumber(row: Record<string, unknown>, keys: string[], fallback = 0) {
  for (const k of keys) {
    const v = row[k]
    if (typeof v === "number" && Number.isFinite(v)) return v
    if (typeof v === "string") { const p = Number(v); if (Number.isFinite(p)) return p }
  }
  return fallback
}
function pickSide(value: unknown): "pro" | "con" | null {
  if (value === "pro" || value === "con") return value
  return null
}

export type ThreadData = {
  threadId: string
  title: string
  content: string
  tag: string
  template: string
  createdBy: string
  isClosed: boolean
  expiresAt: string | null
  threadUpdatedAt: string | null
  proCount: number
  conCount: number
  totalVotes: number
  proPercent: number
  conPercent: number
  comments: BattleComment[]
  hasMoreComments: boolean
  nextCursor: { created_at: string; id: string } | null
  aiSummary: JudgeResult | null
  aiVerdict: string | null
  autoSummary: AutoSummary | null
}

const PAGE_SIZE = 20

export function useThreadData(threadId: string | null) {
  const [data, setData] = useState<ThreadData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef(0)

  useEffect(() => {
    if (!threadId) { setData(null); setLoading(false); setError(null); return }

    const fetchId = ++abortRef.current
    setLoading(true)
    setError(null)

    ;(async () => {
      try {
        /* 1) Thread row */
        const { data: threadRow, error: threadErr } = await supabase
          .from("threads").select("*").eq("id", threadId).maybeSingle()
        if (fetchId !== abortRef.current) return
        if (threadErr || !threadRow) { setError("토론을 찾을 수 없습니다"); setLoading(false); return }

        const row = threadRow as Record<string, unknown>
        const title = pickString(row, ["title", "subject", "name"], "제목 없는 토론")
        const createdBy = typeof row.created_by === "string" ? row.created_by : ""
        const template = typeof row.template === "string" ? row.template : "free"
        const content = pickString(row, ["content", "description", "body"], "")
        const tag = pickString(row, ["tag"], "")
        const threadUpdatedAt = typeof row.updated_at === "string" ? row.updated_at : null
        const proCount = Math.max(0, pickNumber(row, ["pro_count", "proCount"], 0))
        const conCount = Math.max(0, pickNumber(row, ["con_count", "conCount"], 0))
        const totalVotes = proCount + conCount
        const yesPct = totalVotes > 0 ? Math.round((proCount / totalVotes) * 100) : 50
        const noPct = Math.max(0, Math.min(100, 100 - yesPct))

        const expiresAt = typeof row.expires_at === "string" ? row.expires_at : null
        let isClosed = row.is_closed === true
        if (!isClosed && expiresAt && new Date(expiresAt).getTime() <= Date.now()) isClosed = true

        /* 2) Parse AI data */
        let aiSummary: JudgeResult | null = null
        if (row.ai_summary) {
          let parsed: unknown = row.ai_summary
          if (typeof parsed === "string") { try { parsed = JSON.parse(parsed) } catch { parsed = null } }
          if (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed) && (parsed as JudgeResult).pro_summary) {
            aiSummary = parsed as JudgeResult
          }
        }
        const aiVerdict = typeof row.ai_verdict === "string" ? row.ai_verdict : null

        let autoSummary: AutoSummary | null = null
        if (row.ai_auto_summary) {
          let parsedAuto: unknown = row.ai_auto_summary
          if (typeof parsedAuto === "string") { try { parsedAuto = JSON.parse(parsedAuto) } catch { parsedAuto = null } }
          if (parsedAuto !== null && typeof parsedAuto === "object" && !Array.isArray(parsedAuto) && Array.isArray((parsedAuto as AutoSummary).key_points)) {
            autoSummary = parsedAuto as AutoSummary
          }
        }

        /* 3) Fetch comments */
        const { data: topLevelComments, count: totalTopLevel } = await supabase
          .from("comments")
          .select("id, content, created_at, user_id, side, parent_id, updated_at, is_deleted, is_pinned", { count: "exact" })
          .eq("thread_id", threadId).is("parent_id", null)
          .order("created_at", { ascending: false }).limit(PAGE_SIZE)
        if (fetchId !== abortRef.current) return

        const topLevelIds = (topLevelComments ?? []).map((c) => String((c as Record<string, unknown>)?.id ?? "")).filter(v => v.length > 0)

        let replyComments: typeof topLevelComments = []
        if (topLevelIds.length > 0) {
          const { data: replies } = await supabase.from("comments")
            .select("id, content, created_at, user_id, side, parent_id, updated_at, is_deleted, is_pinned")
            .eq("thread_id", threadId).in("parent_id", topLevelIds)
            .order("created_at", { ascending: true })
          replyComments = replies ?? []
        }
        if (fetchId !== abortRef.current) return

        const commentsAll = [...(topLevelComments ?? []), ...(replyComments ?? [])]
        const hasMoreComments = (totalTopLevel ?? 0) > PAGE_SIZE
        const lastTopLevel = topLevelComments?.length ? topLevelComments[topLevelComments.length - 1] as Record<string, unknown> : null
        const nextCursor = hasMoreComments && lastTopLevel ? { created_at: String(lastTopLevel.created_at ?? ""), id: String(lastTopLevel.id ?? "") } : null

        const commentIds = commentsAll.map(c => String((c as Record<string, unknown>)?.id ?? "")).filter(v => v.length > 0)
        const commentUserIds = [...new Set(commentsAll.map(c => String((c as Record<string, unknown>)?.user_id ?? "")).filter(v => v.length > 0))]

        /* 4) Parallel: reactions, profiles, polls */
        const [reactionsResult, profilesResult, pollsResult] = await Promise.all([
          commentIds.length > 0 ? supabase.from("comment_reactions").select("comment_id, reaction").in("comment_id", commentIds) : Promise.resolve({ data: null, error: null }),
          commentUserIds.length > 0 ? supabase.from("profiles").select("id, custom_title, display_name").in("id", commentUserIds) : Promise.resolve({ data: null }),
          commentIds.length > 0 ? supabase.from("comment_polls").select("id, comment_id, question, pro_count, con_count").in("comment_id", commentIds) : Promise.resolve({ data: null }),
        ])
        if (fetchId !== abortRef.current) return

        const reactionCounts: Record<string, { like: number; fire: number; clap: number; think: number }> = {}
        if (!reactionsResult.error) {
          for (const r of reactionsResult.data ?? []) {
            const rr = r as Record<string, unknown>; const cid = String(rr?.comment_id ?? ""); if (!cid) continue
            const cur = reactionCounts[cid] ?? { like: 0, fire: 0, clap: 0, think: 0 }
            if (rr?.reaction === "like") cur.like += 1
            if (rr?.reaction === "fire") cur.fire += 1
            if (rr?.reaction === "clap") cur.clap += 1
            if (rr?.reaction === "think") cur.think += 1
            reactionCounts[cid] = cur
          }
        }

        const userTitleMap: Record<string, string | null> = {}
        const userNameMap: Record<string, string | null> = {}
        for (const p of profilesResult.data ?? []) {
          const pr = p as Record<string, unknown>; const uid = String(pr.id ?? "")
          userTitleMap[uid] = typeof pr.custom_title === "string" ? pr.custom_title : null
          userNameMap[uid] = typeof pr.display_name === "string" ? pr.display_name : null
        }

        const pollMap: Record<string, CommentPoll> = {}
        for (const p of pollsResult.data ?? []) {
          const pr = p as Record<string, unknown>; const cid = String(pr.comment_id ?? "")
          if (cid) pollMap[cid] = { pollId: String(pr.id ?? ""), question: String(pr.question ?? ""), proCount: Number(pr.pro_count) || 0, conCount: Number(pr.con_count) || 0 }
        }

        /* 5) Build DTOs */
        const commentDtos: BattleComment[] = commentsAll.map((c, idx) => {
          const cRow = c as Record<string, unknown>
          const createdRaw = cRow?.created_at; const created = typeof createdRaw === "string" && createdRaw.trim().length > 0 ? createdRaw : null
          const rawUserId = cRow?.user_id; const userIdStr = typeof rawUserId === "string" ? rawUserId : String(rawUserId ?? "")
          const commentId = typeof cRow?.id === "string" && (cRow.id as string).trim().length > 0 ? cRow.id as string : `missing-${threadId}-${idx}`
          const rawParentId = cRow?.parent_id; const parentId = typeof rawParentId === "string" && rawParentId.trim().length > 0 ? rawParentId : null
          const rawUpdatedAt = cRow?.updated_at; const updatedAt = typeof rawUpdatedAt === "string" && rawUpdatedAt.trim().length > 0 ? rawUpdatedAt : null

          return {
            id: commentId, content: String(cRow?.content ?? ""), created_at: created,
            side: template === "free" ? null : pickSide(cRow?.side),
            userId: userIdStr, parentId, displayName: getDisplayName({ id: userIdStr, display_name: userNameMap[userIdStr] }),
            likeCount: reactionCounts[commentId]?.like ?? 0,
            fireCount: reactionCounts[commentId]?.fire ?? 0,
            clapCount: reactionCounts[commentId]?.clap ?? 0,
            thinkCount: reactionCounts[commentId]?.think ?? 0,
            dislikeCount: 0,
            updatedAt, isDeleted: cRow?.is_deleted === true, isPinned: cRow?.is_pinned === true,
            customTitle: userTitleMap[userIdStr] ?? null, poll: pollMap[commentId] ?? null,
          }
        })

        setData({
          threadId, title, content, tag, template, createdBy, isClosed,
          expiresAt, threadUpdatedAt,
          proCount, conCount, totalVotes,
          proPercent: yesPct, conPercent: noPct,
          comments: commentDtos, hasMoreComments, nextCursor,
          aiSummary, aiVerdict, autoSummary,
        })
        setLoading(false)
      } catch (err) {
        if (fetchId !== abortRef.current) return
        setError(err instanceof Error ? err.message : "알 수 없는 오류")
        setLoading(false)
      }
    })()
  }, [threadId])

  return { data, loading, error }
}
