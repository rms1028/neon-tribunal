"use client"

import { useCallback, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/components/auth-provider"
import { useSupabaseFetch } from "@/hooks/useSupabaseFetch"

export function useThreadMute(threadId: string) {
  const { user } = useAuth()
  const [muted, setMuted] = useState(false)

  const uid = user?.id
  const { loading, data } = useSupabaseFetch<{ id: string } | null>(
    () => {
      if (!uid) return Promise.resolve({ data: null, error: null })
      return supabase
        .from("thread_mutes")
        .select("id")
        .eq("user_id", uid)
        .eq("thread_id", threadId)
        .maybeSingle() as any
    },
    [uid, threadId],
    { enabled: !!uid }
  )

  useEffect(() => {
    if (data !== undefined) {
      setMuted(!!data)
    }
    if (!uid) {
      setMuted(false)
    }
  }, [data, uid])

  const toggleMute = useCallback(async () => {
    if (!uid) return
    const prev = muted
    setMuted(!prev)

    if (prev) {
      // unmute
      const { error } = await supabase
        .from("thread_mutes")
        .delete()
        .eq("user_id", uid)
        .eq("thread_id", threadId)
      if (error) setMuted(prev)
    } else {
      // mute
      const { error } = await supabase
        .from("thread_mutes")
        .insert({ user_id: uid, thread_id: threadId })
      if (error) setMuted(prev)
    }
  }, [uid, muted, threadId])

  return { muted, loading, toggleMute }
}
