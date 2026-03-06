"use client"

import { useCallback, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import type { BattleComment } from "@/types/comments"

export function useCommentPagination({
  threadId,
  initialHasMore,
  initialCursor,
  setLocalComments,
  setCounts,
}: {
  threadId: string
  initialHasMore: boolean
  initialCursor: { created_at: string; id: string } | null
  setLocalComments: React.Dispatch<React.SetStateAction<BattleComment[]>>
  setCounts: React.Dispatch<React.SetStateAction<Record<string, { like: number; fire: number; clap: number; think: number }>>>
}) {
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [cursor, setCursor] = useState<{ created_at: string; id: string } | null>(initialCursor)
  const [loadingMore, setLoadingMore] = useState(false)

  useEffect(() => {
    setHasMore(initialHasMore)
    setCursor(initialCursor)
  }, [initialHasMore, initialCursor])

  const loadMore = useCallback(async () => {
    if (!cursor || loadingMore || !hasMore) return
    setLoadingMore(true)

    const { data: nextTopLevel } = await supabase
      .from("comments")
      .select("id, content, created_at, user_id, side, parent_id, updated_at, is_deleted, is_pinned")
      .eq("thread_id", threadId)
      .is("parent_id", null)
      .lt("created_at", cursor.created_at)
      .order("created_at", { ascending: false })
      .limit(20)

    if (!nextTopLevel || nextTopLevel.length === 0) {
      setHasMore(false)
      setLoadingMore(false)
      return
    }

    const newTopLevelIds = nextTopLevel
      .map((c) => String((c as Record<string, unknown>).id ?? ""))
      .filter(Boolean)

    let newReplies: typeof nextTopLevel = []
    if (newTopLevelIds.length > 0) {
      const { data: replies } = await supabase
        .from("comments")
        .select("id, content, created_at, user_id, side, parent_id, updated_at, is_deleted, is_pinned")
        .eq("thread_id", threadId)
        .in("parent_id", newTopLevelIds)
        .order("created_at", { ascending: true })
      newReplies = replies ?? []
    }

    const allNewComments = [...nextTopLevel, ...newReplies]
    const allNewIds = allNewComments
      .map((c) => String((c as Record<string, unknown>).id ?? ""))
      .filter(Boolean)

    const userIds = [...new Set(
      allNewComments
        .map((c) => String((c as Record<string, unknown>).user_id ?? ""))
        .filter(Boolean)
    )]
    const profileMap: Record<string, { display_name: string | null; custom_title: string | null }> = {}
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, custom_title")
        .in("id", userIds)
      for (const p of profiles ?? []) {
        const pr = p as Record<string, unknown>
        profileMap[String(pr.id ?? "")] = {
          display_name: typeof pr.display_name === "string" ? pr.display_name : null,
          custom_title: typeof pr.custom_title === "string" ? pr.custom_title : null,
        }
      }
    }

    const newReactionCounts: Record<string, { like: number; fire: number; clap: number; think: number }> = {}
    if (allNewIds.length > 0) {
      const { data: reactions } = await supabase
        .from("comment_reactions")
        .select("comment_id, reaction")
        .in("comment_id", allNewIds)

      for (const r of reactions ?? []) {
        const row = r as Record<string, unknown>
        const cid = String(row.comment_id ?? "")
        if (!cid) continue
        const cur = newReactionCounts[cid] ?? { like: 0, fire: 0, clap: 0, think: 0 }
        if (row.reaction === "like") cur.like += 1
        if (row.reaction === "fire") cur.fire += 1
        if (row.reaction === "clap") cur.clap += 1
        if (row.reaction === "think") cur.think += 1
        newReactionCounts[cid] = cur
      }
    }

    const { getDisplayName } = await import("@/lib/utils")
    const newCommentDtos: BattleComment[] = allNewComments.map((c, idx) => {
      const row = c as Record<string, unknown>
      const cid = String(row.id ?? `new-${idx}`)
      const uid = String(row.user_id ?? "")
      const profile = profileMap[uid]
      const rawParentId = row.parent_id
      const parentId = typeof rawParentId === "string" && (rawParentId as string).trim().length > 0
        ? rawParentId as string : null

      return {
        id: cid,
        content: String(row.content ?? ""),
        created_at: typeof row.created_at === "string" ? row.created_at : null,
        side: row.side === "pro" ? "pro" as const : row.side === "con" ? "con" as const : null,
        userId: uid,
        parentId,
        displayName: getDisplayName({ id: uid, display_name: profile?.display_name }),
        likeCount: newReactionCounts[cid]?.like ?? 0,
        fireCount: newReactionCounts[cid]?.fire ?? 0,
        clapCount: newReactionCounts[cid]?.clap ?? 0,
        thinkCount: newReactionCounts[cid]?.think ?? 0,
        dislikeCount: 0,
        updatedAt: typeof row.updated_at === "string" ? row.updated_at : null,
        isDeleted: row.is_deleted === true,
        isPinned: row.is_pinned === true,
        customTitle: profile?.custom_title ?? null,
        poll: null,
      }
    })

    setLocalComments((prev) => {
      const existingIds = new Set(prev.map((c) => c.id))
      const unique = newCommentDtos.filter((c) => !existingIds.has(c.id))
      return [...prev, ...unique]
    })

    setCounts((prev) => {
      const merged = { ...prev }
      for (const [cid, val] of Object.entries(newReactionCounts)) {
        merged[cid] = val
      }
      for (const dto of newCommentDtos) {
        if (!merged[dto.id]) {
          merged[dto.id] = { like: dto.likeCount, fire: dto.fireCount, clap: dto.clapCount, think: dto.thinkCount }
        }
      }
      return merged
    })

    const lastNew = nextTopLevel[nextTopLevel.length - 1] as Record<string, unknown>
    if (nextTopLevel.length < 20) {
      setHasMore(false)
      setCursor(null)
    } else {
      setCursor({
        created_at: String(lastNew.created_at ?? ""),
        id: String(lastNew.id ?? ""),
      })
    }

    setLoadingMore(false)
  }, [cursor, loadingMore, hasMore, threadId, setLocalComments, setCounts])

  return { hasMore, loadingMore, loadMore }
}
