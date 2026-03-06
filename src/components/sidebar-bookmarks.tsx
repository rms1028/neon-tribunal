"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Bookmark, ChevronDown, ChevronUp } from "lucide-react"

import { supabase } from "@/lib/supabase"
import { useAuth } from "@/components/auth-provider"

type BookmarkItem = {
  thread_id: string
  title: string
}

export function SidebarBookmarks() {
  const { user, loading } = useAuth()
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (loading || !user) {
      setBookmarks([])
      setLoaded(true)
      return
    }

    let cancelled = false

    ;(async () => {
      const { data: bmRows } = await supabase
        .from("bookmarks")
        .select("thread_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5)

      if (cancelled || !bmRows || bmRows.length === 0) {
        if (!cancelled) setLoaded(true)
        return
      }

      const ids = bmRows.map((r: { thread_id: string }) => r.thread_id)
      const { data: threads } = await supabase
        .from("threads")
        .select("id, title")
        .in("id", ids)

      if (cancelled) return

      const map = new Map(
        (threads ?? []).map((t: { id: string; title: string }) => [t.id, t.title])
      )
      setBookmarks(
        ids
          .map((id: string) => ({ thread_id: id, title: map.get(id) ?? "" }))
          .filter((b: BookmarkItem) => b.title)
      )
      setLoaded(true)
    })()

    return () => { cancelled = true }
  }, [user?.id, loading])

  const [open, setOpen] = useState(false)

  if (!loaded || !user || bookmarks.length === 0) return null

  return (
    <div className="rounded-xl border border-white/[0.08] bg-black/30 backdrop-blur">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2.5 text-[10px] font-semibold tracking-widest text-zinc-500 transition hover:text-zinc-300"
      >
        <span className="flex items-center gap-1.5">
          <Bookmark className="size-3" />
          BOOKMARKS
          <span className="rounded-full bg-white/5 px-1.5 py-0.5 text-[9px] text-zinc-600">
            {bookmarks.length}
          </span>
        </span>
        {open ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
      </button>

      {open && (
        <nav className="space-y-0.5 px-3 pb-2.5">
          {bookmarks.map((b) => (
            <Link
              key={b.thread_id}
              href={`/thread/${b.thread_id}`}
              className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[11px] font-medium text-zinc-400 transition-all hover:bg-white/5 hover:text-zinc-200"
            >
              <Bookmark className="size-3 shrink-0 text-amber-400/60" />
              <span className="min-w-0 truncate">{b.title}</span>
            </Link>
          ))}
        </nav>
      )}
    </div>
  )
}
