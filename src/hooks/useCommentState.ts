"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/components/toast-provider"
import { useProfile } from "@/components/profile-provider"
import { useBlocks } from "@/hooks/useBlocks"
import { useConfirm } from "@/components/confirm-dialog"
import { getFeaturedBadge, type FeaturedBadgeDef } from "@/lib/gamification"
import type { CoachingResult } from "@/components/coaching-panel"
import type { BattleComment, FactCheck, Reaction } from "@/types/comments"

export function useCommentState({
  threadId,
  comments,
  template,
}: {
  threadId: string
  comments: BattleComment[]
  template?: string
}) {
  const { user, loading } = useAuth()
  const { showToast } = useToast()
  const { profile, awardXp } = useProfile()
  const { blockedIds } = useBlocks()
  const { confirm } = useConfirm()

  const [mounted, setMounted] = useState(false)
  const [reactingId, setReactingId] = useState<string | null>(null)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)

  // 댓글 수정/삭제
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")

  // 신고 모달
  const [reportTarget, setReportTarget] = useState<{
    targetType: "comment" | "thread" | "user"
    targetId: string
    targetUserId?: string
  } | null>(null)

  // 팩트체크
  const [factChecks, setFactChecks] = useState<Record<string, FactCheck>>({})
  const [factCheckingId, setFactCheckingId] = useState<string | null>(null)

  // 코칭
  const [coachResults, setCoachResults] = useState<Record<string, CoachingResult>>({})
  const [coachingId, setCoachingId] = useState<string | null>(null)

  // 감성 분석
  const [sentiments, setSentiments] = useState<Record<string, string>>({})

  // 특별 뱃지
  const [userFeaturedBadges, setUserFeaturedBadges] = useState<Record<string, FeaturedBadgeDef[]>>({})

  const [counts, setCounts] = useState<
    Record<string, { like: number; fire: number; clap: number; think: number }>
  >({})
  const [my, setMy] = useState<Record<string, Reaction | null>>({})
  const pendingReactions = useRef<Set<string>>(new Set())
  const [localComments, setLocalComments] = useState<BattleComment[]>(comments)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => { setLocalComments(comments) }, [comments])

  // 특별 뱃지 로드
  useEffect(() => {
    const userIds = [...new Set(comments.map((c) => c.userId).filter(Boolean))]
    if (userIds.length === 0) return
    let cancelled = false
    ;(async () => {
      const { data } = await supabase
        .from("user_achievements")
        .select("user_id, achievement_key")
        .in("user_id", userIds)
        .in("achievement_key", ["logic_king", "agora_star"])
      if (cancelled || !data) return
      const map: Record<string, FeaturedBadgeDef[]> = {}
      for (const row of data as { user_id: string; achievement_key: string }[]) {
        const badge = getFeaturedBadge(row.achievement_key)
        if (badge) {
          if (!map[row.user_id]) map[row.user_id] = []
          map[row.user_id].push(badge)
        }
      }
      setUserFeaturedBadges(map)
    })()
    return () => { cancelled = true }
  }, [comments])

  // 초기 카운트 동기화
  useEffect(() => {
    const next: Record<string, { like: number; fire: number; clap: number; think: number }> = {}
    for (const c of comments) {
      next[c.id] = {
        like: Number.isFinite(c.likeCount) ? c.likeCount : 0,
        fire: Number.isFinite(c.fireCount) ? c.fireCount : 0,
        clap: Number.isFinite(c.clapCount) ? c.clapCount : 0,
        think: Number.isFinite(c.thinkCount) ? c.thinkCount : 0,
      }
    }
    setCounts(next)
  }, [comments])

  // 내 리액션 로드
  useEffect(() => {
    if (!mounted) return
    if (!user || loading) { setMy({}); return }
    const ids = comments.map((c) => c.id).filter(Boolean)
    if (ids.length === 0) return

    let cancelled = false
    ;(async () => {
      const { data, error } = await supabase
        .from("comment_reactions")
        .select("comment_id, reaction")
        .eq("user_id", user.id)
        .in("comment_id", ids)

      if (cancelled || error) return
      const next: Record<string, Reaction | null> = {}
      for (const row of data ?? []) {
        const r = row as Record<string, unknown>
        const cid = String(r.comment_id ?? "")
        const reaction =
          r.reaction === "like" || r.reaction === "fire" || r.reaction === "clap" || r.reaction === "think"
            ? (r.reaction as Reaction)
            : null
        if (cid) next[cid] = reaction
      }
      setMy(next)
    })()
    return () => { cancelled = true }
  }, [mounted, user?.id, loading, comments])

  // 팩트체크 로드
  useEffect(() => {
    const ids = localComments.map((c) => c.id).filter(Boolean)
    if (ids.length === 0) return
    let cancelled = false
    ;(async () => {
      const { data, error } = await supabase
        .from("fact_checks")
        .select("comment_id, verdict, explanation")
        .in("comment_id", ids)
      if (cancelled || error) return
      const map: Record<string, FactCheck> = {}
      for (const row of data ?? []) {
        const r = row as Record<string, unknown>
        const cid = String(r.comment_id ?? "")
        if (cid) {
          map[cid] = {
            verdict: r.verdict as FactCheck["verdict"],
            explanation: String(r.explanation ?? ""),
          }
        }
      }
      setFactChecks(map)
    })()
    return () => { cancelled = true }
  }, [localComments.length])

  // 팩트체크 실시간 구독
  useEffect(() => {
    const channel = supabase
      .channel(`fact-checks-rt-${threadId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "fact_checks" },
        (payload) => {
          const row = payload.new as Record<string, unknown>
          const cid = String(row.comment_id ?? "")
          if (!cid) return
          setFactChecks((prev) => ({
            ...prev,
            [cid]: {
              verdict: row.verdict as FactCheck["verdict"],
              explanation: String(row.explanation ?? ""),
            },
          }))
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [threadId])

  const handleFactCheck = useCallback(async (commentId: string) => {
    if (!user) { showToast("로그인이 필요합니다.", "info"); return }
    if ((profile?.xp ?? 0) < 50) { showToast("50 XP 이상 필요합니다.", "info"); return }
    if (factChecks[commentId]) return

    setFactCheckingId(commentId)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) {
      showToast("인증 세션이 만료되었습니다.", "error")
      setFactCheckingId(null)
      return
    }

    const res = await fetch("/api/fact-check", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ commentId }),
    })

    if (!res.ok) {
      const json = await res.json().catch(() => ({})) as { error?: string }
      showToast(json.error ?? "팩트체크에 실패했습니다.", "error")
      setFactCheckingId(null)
      return
    }

    const data = await res.json() as FactCheck
    setFactChecks((prev) => ({ ...prev, [commentId]: data }))
    awardXp("fact_check")
    showToast("팩트체크가 완료되었습니다!", "success")
    setFactCheckingId(null)
  }, [user, profile?.xp, factChecks, showToast, awardXp])

  // 코칭 데이터 로드
  useEffect(() => {
    const ids = localComments.map((c) => c.id).filter(Boolean)
    if (ids.length === 0) return
    let cancelled = false
    ;(async () => {
      const { data, error } = await supabase
        .from("comment_coaching")
        .select("comment_id, scores, strengths, improvements")
        .in("comment_id", ids)
      if (cancelled || error) return
      const map: Record<string, CoachingResult> = {}
      for (const row of data ?? []) {
        const r = row as Record<string, unknown>
        const cid = String(r.comment_id ?? "")
        if (cid) {
          map[cid] = {
            scores: r.scores as CoachingResult["scores"],
            strengths: r.strengths as string[],
            improvements: r.improvements as string[],
          }
        }
      }
      setCoachResults(map)
    })()
    return () => { cancelled = true }
  }, [localComments.length])

  // 감성 데이터 로드
  useEffect(() => {
    const ids = localComments.map((c) => c.id).filter(Boolean)
    if (ids.length === 0) return
    let cancelled = false
    ;(async () => {
      const { data, error } = await supabase
        .from("comment_sentiments")
        .select("comment_id, tone")
        .in("comment_id", ids)
      if (cancelled || error) return
      const map: Record<string, string> = {}
      for (const row of data ?? []) {
        const r = row as Record<string, unknown>
        const cid = String(r.comment_id ?? "")
        if (cid) map[cid] = String(r.tone ?? "")
      }
      setSentiments(map)
    })()
    return () => { cancelled = true }
  }, [localComments.length])

  // 미분석 댓글 자동 감성 분석 트리거
  const sentimentTriggeredRef = useRef<Set<string>>(new Set())
  useEffect(() => {
    if (!user) return
    const unanalyzed = localComments
      .filter((c) => !c.isDeleted && c.content && !sentiments[c.id] && !sentimentTriggeredRef.current.has(c.id))
      .map((c) => c.id)
      .slice(0, 20)

    if (unanalyzed.length === 0) return
    for (const id of unanalyzed) sentimentTriggeredRef.current.add(id)

    ;(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return
      fetch("/api/sentiment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ commentIds: unanalyzed }),
      }).catch(() => {})
    })()
  }, [user, localComments.length])

  // 감성 분석 실시간 구독
  useEffect(() => {
    const channel = supabase
      .channel(`sentiments-rt-${threadId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "comment_sentiments" },
        (payload) => {
          const row = payload.new as Record<string, unknown>
          const cid = String(row.comment_id ?? "")
          if (!cid) return
          setSentiments((prev) => ({ ...prev, [cid]: String(row.tone ?? "") }))
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [threadId])

  // 코칭 실시간 구독
  useEffect(() => {
    const channel = supabase
      .channel(`coaching-rt-${threadId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "comment_coaching" },
        (payload) => {
          const row = payload.new as Record<string, unknown>
          const cid = String(row.comment_id ?? "")
          if (!cid) return
          setCoachResults((prev) => ({
            ...prev,
            [cid]: {
              scores: row.scores as CoachingResult["scores"],
              strengths: row.strengths as string[],
              improvements: row.improvements as string[],
            },
          }))
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [threadId])

  const handleCoach = useCallback(async (commentId: string) => {
    if (!user) { showToast("로그인이 필요합니다.", "info"); return }
    if ((profile?.xp ?? 0) < 30) { showToast("30 XP 이상 필요합니다.", "info"); return }
    if (coachResults[commentId]) return

    setCoachingId(commentId)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) {
      showToast("인증 세션이 만료되었습니다.", "error")
      setCoachingId(null)
      return
    }

    const res = await fetch("/api/coach", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ commentId }),
    })

    if (!res.ok) {
      const json = await res.json().catch(() => ({})) as { error?: string }
      showToast(json.error ?? "코칭에 실패했습니다.", "error")
      setCoachingId(null)
      return
    }

    const data = await res.json() as CoachingResult
    setCoachResults((prev) => ({ ...prev, [commentId]: data }))
    awardXp("coaching")
    showToast("AI 코칭이 완료되었습니다!", "success")
    setCoachingId(null)
  }, [user, profile?.xp, coachResults, showToast, awardXp])

  const handleStartEdit = useCallback((commentId: string, currentContent: string) => {
    setEditingId(commentId)
    setEditContent(currentContent)
  }, [])

  const handleCancelEdit = useCallback(() => {
    setEditingId(null)
    setEditContent("")
  }, [])

  const handleSaveEdit = useCallback(async (commentId: string) => {
    if (!user) return
    const trimmed = editContent.trim()
    if (!trimmed) return

    const prevComments = localComments
    setLocalComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? { ...c, content: trimmed, updatedAt: new Date().toISOString() }
          : c
      )
    )
    setEditingId(null)
    setEditContent("")

    const { error } = await supabase
      .from("comments")
      .update({ content: trimmed, updated_at: new Date().toISOString() })
      .eq("id", commentId)
      .eq("user_id", user.id)

    if (error) {
      setLocalComments(prevComments)
      showToast("댓글 수정에 실패했습니다.", "error")
    }
  }, [user, editContent, localComments, showToast])

  const handleTogglePin = useCallback(async (commentId: string, pin: boolean) => {
    if (!user) return

    const prevComments = localComments
    setLocalComments((prev) => {
      if (pin) {
        return prev.map((c) =>
          c.id === commentId
            ? { ...c, isPinned: true }
            : { ...c, isPinned: false }
        )
      }
      return prev.map((c) =>
        c.id === commentId ? { ...c, isPinned: false } : c
      )
    })

    if (pin) {
      await supabase
        .from("comments")
        .update({ is_pinned: false })
        .eq("thread_id", threadId)
        .eq("is_pinned", true)
    }

    const { error } = await supabase
      .from("comments")
      .update({ is_pinned: pin })
      .eq("id", commentId)

    if (error) {
      setLocalComments(prevComments)
      showToast("댓글 고정에 실패했습니다.", "error")
    }
  }, [user, localComments, threadId, showToast])

  const handleDelete = useCallback(async (commentId: string) => {
    if (!user) return
    const ok = await confirm({
      title: "댓글 삭제",
      message: "정말 이 댓글을 삭제하시겠습니까?",
      confirmText: "삭제",
      variant: "danger",
    })
    if (!ok) return

    const prevComments = localComments
    setLocalComments((prev) =>
      prev.map((c) =>
        c.id === commentId ? { ...c, isDeleted: true, content: "[삭제됨]" } : c
      )
    )

    const { error } = await supabase
      .from("comments")
      .update({ is_deleted: true, content: "[삭제됨]", updated_at: new Date().toISOString() })
      .eq("id", commentId)
      .eq("user_id", user.id)

    if (error) {
      setLocalComments(prevComments)
      showToast("댓글 삭제에 실패했습니다.", "error")
    }
  }, [user, localComments, showToast, confirm])

  const handleReact = useCallback(async (commentId: string, reaction: Reaction) => {
    if (!user) {
      showToast("VIP 로그인 유저만 리액션을 달 수 있어요.", "info")
      return
    }
    if (reactingId === commentId) return

    const prev = my[commentId] ?? null
    const next: Reaction | null = prev === reaction ? null : reaction

    pendingReactions.current.add(commentId)
    setReactingId(commentId)
    setMy((cur) => ({ ...cur, [commentId]: next }))
    setCounts((cur) => {
      const base = cur[commentId] ?? { like: 0, fire: 0, clap: 0, think: 0 }
      let like = base.like
      let fire = base.fire
      let clap = base.clap
      let think = base.think

      if (prev === "like") like = Math.max(0, like - 1)
      if (prev === "fire") fire = Math.max(0, fire - 1)
      if (prev === "clap") clap = Math.max(0, clap - 1)
      if (prev === "think") think = Math.max(0, think - 1)
      if (next === "like") like += 1
      if (next === "fire") fire += 1
      if (next === "clap") clap += 1
      if (next === "think") think += 1

      return { ...cur, [commentId]: { like, fire, clap, think } }
    })

    const rollback = () => {
      setMy((cur) => ({ ...cur, [commentId]: prev }))
      setCounts((cur) => {
        const base = cur[commentId] ?? { like: 0, fire: 0, clap: 0, think: 0 }
        let like = base.like
        let fire = base.fire
        let clap = base.clap
        let think = base.think
        if (next === "like") like = Math.max(0, like - 1)
        if (next === "fire") fire = Math.max(0, fire - 1)
        if (next === "clap") clap = Math.max(0, clap - 1)
        if (next === "think") think = Math.max(0, think - 1)
        if (prev === "like") like += 1
        if (prev === "fire") fire += 1
        if (prev === "clap") clap += 1
        if (prev === "think") think += 1
        return { ...cur, [commentId]: { like, fire, clap, think } }
      })
    }

    const { error: delErr } = await supabase
      .from("comment_reactions")
      .delete()
      .match({ comment_id: commentId, user_id: user.id })

    if (delErr) {
      rollback()
      setTimeout(() => pendingReactions.current.delete(commentId), 500)
      setReactingId(null)
      showToast("리액션 저장에 실패했어요. (테이블/RLS 확인)", "error")
      return
    }

    if (next) {
      const { error: insErr } = await supabase.from("comment_reactions").insert({
        comment_id: commentId,
        user_id: user.id,
        reaction: next,
      })
      if (insErr) {
        rollback()
        setTimeout(() => pendingReactions.current.delete(commentId), 500)
        setReactingId(null)
        showToast("리액션 저장에 실패했어요. (테이블/RLS 확인)", "error")
        return
      }
    }

    setTimeout(() => pendingReactions.current.delete(commentId), 500)
    setReactingId(null)
  }, [user, reactingId, my, showToast])

  // 실시간 댓글 구독 (INSERT + UPDATE)
  useEffect(() => {
    const channel = supabase
      .channel(`comments-rt-${threadId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "comments",
          filter: `thread_id=eq.${threadId}`,
        },
        async (payload) => {
          const row = payload.new as Record<string, unknown>
          const cid = String(row.id ?? "")
          if (!cid) return

          const userIdRaw = row.user_id
          const idStr =
            typeof userIdRaw === "string" ? userIdRaw : String(userIdRaw ?? "")

          let displayName = "익명"
          if (idStr) {
            const { data: prof } = await supabase
              .from("profiles")
              .select("display_name")
              .eq("id", idStr)
              .maybeSingle()
            const dn = (prof as Record<string, unknown> | null)?.display_name
            if (typeof dn === "string" && dn.trim()) {
              displayName = dn
            } else {
              const short = idStr.replace(/-/g, "").slice(0, 5)
              displayName = short ? `유저 ${short}` : "익명"
            }
          }

          setLocalComments((prev) => {
            if (prev.some((c) => c.id === cid)) return prev
            const createdRaw = row.created_at
            const created =
              typeof createdRaw === "string" && createdRaw.trim().length > 0
                ? createdRaw
                : null
            const side =
              row.side === "pro" ? "pro" : row.side === "con" ? "con" : null
            const rawParentId = row.parent_id
            const parentId = typeof rawParentId === "string" && rawParentId.trim().length > 0
              ? rawParentId : null
            const newComment: BattleComment = {
              id: cid,
              content: String(row.content ?? ""),
              created_at: created,
              side,
              userId: idStr,
              parentId,
              displayName,
              likeCount: 0,
              fireCount: 0,
              clapCount: 0,
              thinkCount: 0,
              dislikeCount: 0,
            }
            return [newComment, ...prev]
          })
          setCounts((prev) => ({ ...prev, [cid]: { like: 0, fire: 0, clap: 0, think: 0 } }))
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "comments",
          filter: `thread_id=eq.${threadId}`,
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>
          const cid = String(row.id ?? "")
          if (!cid) return

          setLocalComments((prev) =>
            prev.map((c) => {
              if (c.id !== cid) return c
              return {
                ...c,
                content: String(row.content ?? c.content),
                isDeleted: row.is_deleted === true,
                updatedAt: typeof row.updated_at === "string" ? row.updated_at : c.updatedAt,
              }
            })
          )
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [threadId])

  // 실시간 리액션 구독
  useEffect(() => {
    const channel = supabase
      .channel(`reactions-rt-${threadId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "comment_reactions" },
        (payload) => {
          const row = (
            payload.eventType === "DELETE" ? payload.old : payload.new
          ) as Record<string, unknown>
          const commentId = String(row.comment_id ?? "")
          if (!commentId) return
          if (pendingReactions.current.has(commentId)) return
          const reaction = String(row.reaction ?? "")
          if (reaction !== "like" && reaction !== "fire" && reaction !== "clap" && reaction !== "think") return

          const delta = payload.eventType === "DELETE" ? -1 : 1
          setCounts((prev) => {
            const base = prev[commentId] ?? { like: 0, fire: 0, clap: 0, think: 0 }
            return {
              ...prev,
              [commentId]: {
                like: Math.max(0, base.like + (reaction === "like" ? delta : 0)),
                fire: Math.max(0, base.fire + (reaction === "fire" ? delta : 0)),
                clap: Math.max(0, base.clap + (reaction === "clap" ? delta : 0)),
                think: Math.max(0, base.think + (reaction === "think" ? delta : 0)),
              },
            }
          })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [threadId])

  return {
    user,
    profile,
    blockedIds,
    mounted,
    reactingId,
    replyingTo,
    setReplyingTo,
    editingId,
    editContent,
    setEditContent,
    reportTarget,
    setReportTarget,
    factChecks,
    factCheckingId,
    coachResults,
    coachingId,
    sentiments,
    userFeaturedBadges,
    counts,
    setCounts,
    my,
    localComments,
    setLocalComments,
    handleFactCheck,
    handleCoach,
    handleStartEdit,
    handleCancelEdit,
    handleSaveEdit,
    handleTogglePin,
    handleDelete,
    handleReact,
  }
}
