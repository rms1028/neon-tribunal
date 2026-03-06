"use client"

import { useEffect, useState, useCallback, useRef, useMemo } from "react"
import { Search, MessageSquare, Lock } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/components/auth-provider"
import { timeAgo } from "@/lib/utils"

type ThreadItem = {
  id: string
  title: string
  tag: string
  template: string
  proCount: number
  conCount: number
  isClosed: boolean
  lastMessage: string | null
  lastMessageAt: string | null
  unreadCount: number
}

const VISIT_KEY = "debate-last-visit"

function getLastVisit(threadId: string): number {
  try {
    const map = JSON.parse(localStorage.getItem(VISIT_KEY) || "{}")
    return Number(map[threadId]) || 0
  } catch { return 0 }
}

function setLastVisit(threadId: string) {
  try {
    const map = JSON.parse(localStorage.getItem(VISIT_KEY) || "{}")
    map[threadId] = Date.now()
    localStorage.setItem(VISIT_KEY, JSON.stringify(map))
  } catch { /* noop */ }
}

export function ThreadListPanel({
  selectedId,
  onSelect,
}: {
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  const { user } = useAuth()
  const [threads, setThreads] = useState<ThreadItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const selectedIdRef = useRef(selectedId)
  selectedIdRef.current = selectedId

  /* ─── Fetch ─── */
  const fetchThreads = useCallback(async () => {
    if (!user) { setThreads([]); setLoading(false); return }
    try {
      const [commentsRes, votesRes] = await Promise.all([
        supabase.from("comments").select("thread_id").eq("user_id", user.id),
        supabase.from("thread_votes").select("thread_id").eq("user_id", user.id),
      ])
      const threadIdSet = new Set<string>()
      for (const c of commentsRes.data ?? []) { const tid = (c as Record<string, unknown>).thread_id; if (typeof tid === "string") threadIdSet.add(tid) }
      for (const v of votesRes.data ?? []) { const tid = (v as Record<string, unknown>).thread_id; if (typeof tid === "string") threadIdSet.add(tid) }
      const { data: ownThreads } = await supabase.from("threads").select("id").eq("created_by", user.id)
      for (const t of ownThreads ?? []) { const tid = (t as Record<string, unknown>).id; if (typeof tid === "string") threadIdSet.add(tid) }
      if (threadIdSet.size === 0) { setThreads([]); setLoading(false); return }
      const threadIds = [...threadIdSet]

      const { data: threadRows } = await supabase.from("threads")
        .select("id, title, tag, template, pro_count, con_count, is_closed, expires_at, created_at")
        .in("id", threadIds).order("created_at", { ascending: false })

      const { data: latestComments } = await supabase.from("comments")
        .select("thread_id, content, created_at").in("thread_id", threadIds)
        .is("is_deleted", false).order("created_at", { ascending: false })

      const latestMap: Record<string, { content: string; created_at: string }> = {}
      for (const c of latestComments ?? []) {
        const cr = c as Record<string, unknown>; const tid = String(cr.thread_id ?? "")
        if (tid && !latestMap[tid]) latestMap[tid] = { content: String(cr.content ?? ""), created_at: String(cr.created_at ?? "") }
      }

      const items: ThreadItem[] = (threadRows ?? []).map(t => {
        const r = t as Record<string, unknown>; const tid = String(r.id ?? "")
        const lastVisit = getLastVisit(tid); const latest = latestMap[tid]
        let unread = 0
        if (latest && lastVisit > 0) {
          for (const c of latestComments ?? []) {
            const cr = c as Record<string, unknown>
            if (String(cr.thread_id) === tid && new Date(String(cr.created_at)).getTime() > lastVisit) unread++
          }
        }
        const expiresAt = typeof r.expires_at === "string" ? r.expires_at : null
        let closed = r.is_closed === true
        if (!closed && expiresAt && new Date(expiresAt).getTime() <= Date.now()) closed = true
        return {
          id: tid, title: String(r.title ?? "제목 없음"), tag: String(r.tag ?? ""),
          template: typeof r.template === "string" ? r.template : "free",
          proCount: Number(r.pro_count) || 0, conCount: Number(r.con_count) || 0,
          isClosed: closed, lastMessage: latest?.content?.slice(0, 60) ?? null,
          lastMessageAt: latest?.created_at ?? String(r.created_at ?? ""), unreadCount: unread,
        }
      })
      items.sort((a, b) => {
        const ta = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0
        const tb = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0
        return tb - ta
      })
      setThreads(items)
    } catch { /* silent */ } finally { setLoading(false) }
  }, [user])

  useEffect(() => { fetchThreads() }, [fetchThreads])

  /* ─── Realtime ─── */
  useEffect(() => {
    if (!user) return
    const channel = supabase.channel("debate-list-rt")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "comments" }, (payload) => {
        const nc = payload.new as Record<string, unknown>
        const tid = String(nc.thread_id ?? ""); const content = String(nc.content ?? ""); const createdAt = String(nc.created_at ?? "")
        setThreads(prev => {
          const idx = prev.findIndex(t => t.id === tid); if (idx === -1) return prev
          const updated = [...prev]; const item = { ...updated[idx] }
          item.lastMessage = content.slice(0, 60); item.lastMessageAt = createdAt
          if (selectedIdRef.current !== tid) item.unreadCount += 1
          updated[idx] = item
          updated.sort((a, b) => {
            const ta = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0
            const tb = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0
            return tb - ta
          })
          return updated
        })
      }).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user])

  const handleSelect = useCallback((id: string) => {
    setLastVisit(id)
    setThreads(prev => prev.map(t => t.id === id ? { ...t, unreadCount: 0 } : t))
    onSelect(id)
  }, [onSelect])

  const filtered = useMemo(() => {
    if (!search.trim()) return threads
    const q = search.toLowerCase()
    return threads.filter(t => t.title.toLowerCase().includes(q) || t.tag.toLowerCase().includes(q))
  }, [threads, search])

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "transparent" }}>
      {/* ─── Header ─── */}
      <div style={{ padding: "16px 16px 12px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <div style={{
            width: 6, height: 6, borderRadius: "50%", background: "#00e4a5",
            boxShadow: "0 0 6px #00e4a5",
          }} />
          <h2 style={{ fontSize: 14, fontWeight: 800, color: "#ccc", letterSpacing: 0.5 }}>
            내 토론
          </h2>
          <span style={{
            fontSize: 10, fontWeight: 700, color: "#00e4a5",
            background: "rgba(0,228,165,0.08)", padding: "2px 7px",
            borderRadius: 6, marginLeft: "auto",
          }}>
            {threads.length}
          </span>
        </div>

        {/* Search */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "7px 12px", borderRadius: 10,
          background: "rgba(255,255,255,0.025)",
          border: "1px solid rgba(255,255,255,0.05)",
        }}>
          <Search style={{ width: 13, height: 13, color: "#444", flexShrink: 0 }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="토론 검색..."
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              fontSize: 12, color: "#aaa",
            }}
          />
        </div>
      </div>

      {/* ─── Divider ─── */}
      <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)", margin: "0 16px" }} />

      {/* ─── Thread list ─── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "4px 0" }} className="custom-scrollbar">
        {loading ? (
          <div style={{ padding: 40, textAlign: "center" }}>
            <div style={{
              width: 22, height: 22, border: "2px solid rgba(0,228,165,0.15)",
              borderTopColor: "#00e4a5", borderRadius: "50%",
              animation: "spin 0.8s linear infinite", margin: "0 auto 10px",
            }} />
            <div style={{ fontSize: 11, color: "#444" }}>불러오는 중...</div>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        ) : !user ? (
          <div style={{ padding: "40px 20px", textAlign: "center" }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, margin: "0 auto 10px",
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Lock style={{ width: 16, height: 16, color: "#333" }} />
            </div>
            <div style={{ fontSize: 12, color: "#444", lineHeight: 1.5 }}>
              로그인하면 참여한<br />토론이 여기에 표시됩니다
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center" }}>
            <MessageSquare style={{ width: 24, height: 24, color: "#222", margin: "0 auto 8px" }} />
            <div style={{ fontSize: 12, color: "#444" }}>
              {search ? "검색 결과가 없습니다" : "참여한 토론이 없습니다"}
            </div>
          </div>
        ) : (
          filtered.map(t => {
            const isSelected = selectedId === t.id
            const isStrict = t.template === "strict"

            return (
              <button
                key={t.id}
                type="button"
                onClick={() => handleSelect(t.id)}
                style={{
                  display: "flex", width: "100%", textAlign: "left",
                  padding: "12px 16px", gap: 12, alignItems: "center",
                  background: isSelected
                    ? "rgba(0,228,165,0.06)"
                    : "transparent",
                  borderLeft: isSelected ? "3px solid #00e4a5" : "3px solid transparent",
                  cursor: "pointer", transition: "all 0.12s ease",
                }}
                className="hover:!bg-white/[0.03]"
              >
                {/* Type icon */}
                <div style={{
                  width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                  background: isStrict
                    ? "rgba(255,77,141,0.08)"
                    : "rgba(0,228,165,0.06)",
                  border: isStrict
                    ? "1px solid rgba(255,77,141,0.15)"
                    : "1px solid rgba(0,228,165,0.12)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 17,
                }}>
                  {isStrict ? "\u2694\uFE0F" : "\uD83D\uDCAC"}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Title */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                    <span style={{
                      fontSize: 14, fontWeight: 700,
                      color: isSelected ? "#eee" : "#ccc",
                      overflow: "hidden", textOverflow: "ellipsis",
                      whiteSpace: "nowrap", flex: 1,
                    }}>
                      {t.title}
                    </span>
                    {t.isClosed && (
                      <span style={{
                        fontSize: 9, fontWeight: 600, color: "#666",
                        padding: "1px 6px", borderRadius: 4,
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        letterSpacing: 0.3, flexShrink: 0,
                      }}>
                        종료
                      </span>
                    )}
                  </div>

                  {/* Last message preview */}
                  <div style={{
                    fontSize: 12, color: "#555",
                    overflow: "hidden", textOverflow: "ellipsis",
                    whiteSpace: "nowrap", lineHeight: 1.4,
                  }}>
                    {t.lastMessage || (t.tag ? `#${t.tag}` : "아직 댓글이 없습니다")}
                  </div>
                </div>

                {/* Right: time + unread */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5, flexShrink: 0 }}>
                  <span style={{ fontSize: 11, color: "#444", fontVariantNumeric: "tabular-nums" }} suppressHydrationWarning>
                    {timeAgo(t.lastMessageAt)}
                  </span>
                  {t.unreadCount > 0 && (
                    <span style={{
                      minWidth: 18, height: 18, borderRadius: 9,
                      background: "#00e4a5", color: "#000",
                      fontSize: 10, fontWeight: 800,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      padding: "0 5px",
                    }}>
                      {t.unreadCount > 99 ? "99+" : t.unreadCount}
                    </span>
                  )}
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
