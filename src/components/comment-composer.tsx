"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { BarChart3, Send } from "lucide-react"

import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/components/toast-provider"
import { useProfile } from "@/components/profile-provider"
import { containsProfanity } from "@/lib/profanity"

type MentionUser = {
  id: string
  displayName: string
}

export function CommentComposer({
  threadId,
  fixedSide,
  parentId,
  onSubmitted,
  template,
  variant,
}: {
  threadId: string
  fixedSide?: "pro" | "con"
  parentId?: string
  onSubmitted?: () => void
  template?: string
  variant?: "default" | "fixed-bar"
}) {
  const router = useRouter()
  const { user, loading } = useAuth()
  const { showToast } = useToast()
  const { awardXp, trackActivity, isBanned, profile } = useProfile()

  const [content, setContent] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [pollEnabled, setPollEnabled] = useState(false)
  const [pollQuestion, setPollQuestion] = useState("")

  // Mention autocomplete
  const [mentionQuery, setMentionQuery] = useState<string | null>(null)
  const [mentionResults, setMentionResults] = useState<MentionUser[]>([])
  const [mentionIndex, setMentionIndex] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSubmitRef = useRef<number>(0)
  const COOLDOWN_MS = 10_000
  const draftKey = `neon_comment_draft_${threadId}`

  // Draft recovery
  useEffect(() => {
    try {
      const saved = localStorage.getItem(draftKey)
      if (saved) setContent(saved)
    } catch { /* ignore */ }
  }, [draftKey])

  const canWrite = Boolean(user) && !loading
  const disabled = submitting || !canWrite
  const isFixedBar = variant === "fixed-bar"

  // Mention search
  const searchMentionUsers = useCallback(async (query: string) => {
    if (query.length === 0) {
      const { data } = await supabase
        .from("comments")
        .select("user_id")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: false })
        .limit(20)

      const seen = new Set<string>()
      const results: MentionUser[] = []
      for (const row of data ?? []) {
        const uid = String((row as Record<string, unknown>).user_id ?? "")
        if (!uid || uid === user?.id || seen.has(uid)) continue
        seen.add(uid)
        const short = uid.replace(/-/g, "").slice(0, 5)
        results.push({ id: uid, displayName: `유저 ${short}` })
        if (results.length >= 5) break
      }
      setMentionResults(results)
      setMentionIndex(0)
      return
    }

    const { data } = await supabase
      .from("comments")
      .select("user_id")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: false })
      .limit(50)

    const seen = new Set<string>()
    const results: MentionUser[] = []
    for (const row of data ?? []) {
      const uid = String((row as Record<string, unknown>).user_id ?? "")
      if (!uid || uid === user?.id || seen.has(uid)) continue
      seen.add(uid)
      const short = uid.replace(/-/g, "").slice(0, 5)
      const name = `유저 ${short}`
      if (name.includes(query) || short.includes(query)) {
        results.push({ id: uid, displayName: name })
      }
      if (results.length >= 5) break
    }
    setMentionResults(results)
    setMentionIndex(0)
  }, [threadId, user?.id])

  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setContent(value)

    if (draftTimerRef.current) clearTimeout(draftTimerRef.current)
    draftTimerRef.current = setTimeout(() => {
      try {
        if (value.trim()) localStorage.setItem(draftKey, value)
        else localStorage.removeItem(draftKey)
      } catch { /* ignore */ }
    }, 500)

    const cursorPos = e.target.selectionStart
    const textBefore = value.slice(0, cursorPos)

    const mentionMatch = textBefore.match(/@(\S*)$/)
    if (mentionMatch) {
      const query = mentionMatch[1]
      setMentionQuery(query)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        searchMentionUsers(query)
      }, 200)
    } else {
      setMentionQuery(null)
      setMentionResults([])
    }
  }, [draftKey, searchMentionUsers])

  function selectMention(mentionUser: MentionUser) {
    const textarea = textareaRef.current
    if (!textarea) return

    const cursorPos = textarea.selectionStart
    const textBefore = content.slice(0, cursorPos)
    const textAfter = content.slice(cursorPos)

    const mentionText = `@[${mentionUser.displayName}](${mentionUser.id}) `
    const newBefore = textBefore.replace(/@\S*$/, mentionText)

    setContent(newBefore + textAfter)
    setMentionQuery(null)
    setMentionResults([])

    requestAnimationFrame(() => {
      textarea.focus()
      const newPos = newBefore.length
      textarea.setSelectionRange(newPos, newPos)
    })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Mention autocomplete keys
    if (mentionQuery !== null && mentionResults.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setMentionIndex((i) => (i + 1) % mentionResults.length)
        return
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setMentionIndex((i) => (i - 1 + mentionResults.length) % mentionResults.length)
        return
      } else if (e.key === "Enter") {
        e.preventDefault()
        selectMention(mentionResults[mentionIndex])
        return
      } else if (e.key === "Escape") {
        setMentionQuery(null)
        setMentionResults([])
        return
      }
    }

    // Enter to submit (Shift+Enter for newline) — fixed-bar variant
    if (isFixedBar && e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (content.trim().length > 0 && !disabled) {
        handleSubmit(e as unknown as React.FormEvent)
      }
    }
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current)
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!user) {
      showToast("로그인 후 의견을 등록할 수 있어요.", "info")
      return
    }

    if (isBanned) {
      const until = profile?.bannedUntil ? new Date(profile.bannedUntil).toLocaleDateString("ko-KR") : ""
      showToast(`계정이 정지되었습니다. 해제: ${until}`, "error")
      return
    }

    const text = content.trim()
    if (!text) return

    if (containsProfanity(text)) {
      showToast("부적절한 표현이 포함되어 있습니다. 수정 후 다시 시도해주세요.", "error")
      return
    }

    const elapsed = Date.now() - lastSubmitRef.current
    if (elapsed < COOLDOWN_MS) {
      const remain = Math.ceil((COOLDOWN_MS - elapsed) / 1000)
      showToast(`도배 방지: ${remain}초 후에 다시 작성할 수 있습니다.`, "info")
      return
    }

    setSubmitting(true)
    const { data: insertedComment, error } = await supabase
      .from("comments")
      .insert({
        thread_id: threadId,
        user_id: user.id,
        content: text,
        side: fixedSide ?? null,
        parent_id: parentId ?? null,
      })
      .select("id")
      .single()
    setSubmitting(false)

    if (error) {
      showToast("의견 등록에 실패했습니다. 다시 시도해주세요.", "error")
      return
    }

    if (pollEnabled && pollQuestion.trim() && insertedComment?.id) {
      await supabase.from("comment_polls").insert({
        comment_id: insertedComment.id,
        question: pollQuestion.trim().slice(0, 100),
      })
    }

    lastSubmitRef.current = Date.now()
    setContent("")
    try { localStorage.removeItem(draftKey) } catch { /* ignore */ }
    setPollEnabled(false)
    setPollQuestion("")
    router.refresh()
    awardXp("comment")
    trackActivity("comment")
    onSubmitted?.()
  }

  /* ── fixed-bar variant: single-line input ── */
  if (isFixedBar) {
    return (
      <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
        <div className="relative flex flex-1 items-center rounded-xl border border-white/[0.08] bg-zinc-900/80 backdrop-blur transition-shadow focus-within:border-emerald-400/30 focus-within:shadow-[0_0_12px_rgba(52,211,153,0.08)]">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown}
            placeholder={canWrite ? "의견을 입력하세요..." : "로그인 후 이용 가능"}
            rows={1}
            maxLength={500}
            disabled={!canWrite || submitting}
            className="w-full resize-none bg-transparent px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none disabled:cursor-not-allowed disabled:opacity-60"
            style={{ maxHeight: "80px", overflow: "auto" }}
            onInput={(e) => {
              const el = e.currentTarget
              el.style.height = "auto"
              el.style.height = Math.min(el.scrollHeight, 80) + "px"
            }}
          />

          {/* Mention dropdown */}
          {mentionQuery !== null && mentionResults.length > 0 && (
            <div className="absolute bottom-full left-2 right-2 z-50 mb-1 rounded-xl border border-zinc-700 bg-zinc-950/95 p-1 shadow-xl backdrop-blur">
              {mentionResults.map((mu, idx) => (
                <button
                  key={mu.id}
                  type="button"
                  onClick={() => selectMention(mu)}
                  className={[
                    "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs transition",
                    idx === mentionIndex
                      ? "bg-emerald-400/15 text-emerald-100"
                      : "text-zinc-300 hover:bg-white/5",
                  ].join(" ")}
                >
                  <span className="grid size-6 place-items-center rounded-full bg-gradient-to-br from-cyan-300 to-emerald-300 text-[9px] font-semibold text-black">
                    {mu.displayName.slice(0, 2)}
                  </span>
                  {mu.displayName}
                </button>
              ))}
            </div>
          )}
        </div>

        <Button
          type="submit"
          disabled={disabled || content.trim().length === 0}
          className="h-9 shrink-0 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 px-3 text-xs font-semibold text-black hover:from-emerald-300 hover:to-teal-300 disabled:opacity-60"
        >
          <Send className="size-3.5" />
        </Button>
      </form>
    )
  }

  /* ── default variant ── */
  return (
    <form onSubmit={handleSubmit}>
      <div className="relative rounded-xl border border-white/[0.08] bg-zinc-900/80 backdrop-blur">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleContentChange}
          onKeyDown={handleKeyDown}
          placeholder={canWrite ? "의견을 입력하세요..." : "로그인 후 의견을 등록할 수 있어요."}
          rows={4}
          maxLength={500}
          disabled={!canWrite || submitting}
          className="w-full resize-none bg-transparent px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none disabled:cursor-not-allowed disabled:opacity-60"
          style={{ minHeight: "100px", maxHeight: "200px", overflow: "auto" }}
          onInput={(e) => {
            const el = e.currentTarget
            el.style.height = "auto"
            el.style.height = Math.min(el.scrollHeight, 120) + "px"
          }}
        />

        {/* Mention dropdown */}
        {mentionQuery !== null && mentionResults.length > 0 && (
          <div className="absolute bottom-full left-2 right-2 z-50 mb-1 rounded-xl border border-emerald-400/30 bg-zinc-950/95 p-1 shadow-xl backdrop-blur">
            {mentionResults.map((mu, idx) => (
              <button
                key={mu.id}
                type="button"
                onClick={() => selectMention(mu)}
                className={[
                  "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs transition",
                  idx === mentionIndex
                    ? "bg-emerald-400/15 text-emerald-100"
                    : "text-zinc-300 hover:bg-white/5",
                ].join(" ")}
              >
                <span className="grid size-6 place-items-center rounded-full bg-gradient-to-br from-cyan-300 to-emerald-300 text-[9px] font-semibold text-black">
                  {mu.displayName.slice(0, 2)}
                </span>
                {mu.displayName}
              </button>
            ))}
          </div>
        )}

        {/* Poll attachment */}
        {pollEnabled && (
          <div className="border-t border-white/10 px-4 py-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="size-3.5 shrink-0 text-amber-300" />
              <input
                type="text"
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value.slice(0, 100))}
                placeholder="투표 질문을 입력하세요 (최대 100자)"
                className="flex-1 bg-transparent text-xs text-zinc-100 placeholder:text-zinc-600 outline-none"
              />
              <span className="text-[10px] text-zinc-600">{pollQuestion.length}/100</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-white/10 px-3 py-1.5">
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-zinc-600">{content.length}/500</span>
            <button
              type="button"
              onClick={() => setPollEnabled((v) => !v)}
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] transition ${
                pollEnabled
                  ? "border-amber-400/40 bg-amber-400/15 text-amber-200"
                  : "border-white/10 bg-white/5 text-zinc-500 hover:text-zinc-300"
              }`}
              title="투표 첨부"
            >
              <BarChart3 className="size-2.5" />
              투표
            </button>
            <span className="hidden text-[10px] text-zinc-600 sm:inline">
              **굵게** *기울임* `코드` @멘션
            </span>
          </div>
          <Button
            type="submit"
            disabled={disabled || content.trim().length === 0}
            className="h-7 rounded-lg bg-gradient-to-r from-emerald-400 to-teal-400 px-3 text-xs font-semibold text-black hover:from-emerald-300 hover:to-teal-300 disabled:opacity-60"
          >
            <Send className="size-3" />
            {submitting ? "…" : ""}
          </Button>
        </div>
      </div>
    </form>
  )
}
