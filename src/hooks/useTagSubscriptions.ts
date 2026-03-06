"use client"

import { useCallback, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/components/auth-provider"

export function useTagSubscriptions() {
  const auth = useAuth()
  const user = auth ? auth.user : null
  const loading = auth ? auth.loading : true
  const [subscribed, setSubscribed] = useState<Set<string>>(new Set())
  const [fetched, setFetched] = useState(false)

  const userId = user && user.id ? user.id : null

  // 태그 구독 로드
  useEffect(() => {
    if (loading || !userId) {
      if (!loading) setFetched(true)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const { data, error } = await supabase
          .from("tag_subscriptions")
          .select("tag")
          .eq("user_id", userId)
        if (cancelled) return
        if (error) {
          // 테이블 미존재 등 무시
          if (error.code !== "42P01" && error.code !== "PGRST205") {
            console.warn("[TagSub]", error.code, error.message)
          }
          setFetched(true)
          return
        }
        if (data && data.length > 0) {
          setSubscribed(new Set(data.map((r: { tag: string }) => r.tag)))
        } else {
          setSubscribed(new Set())
        }
      } catch {
        // 네트워크 에러 등 무시
      }
      if (!cancelled) setFetched(true)
    })()
    return () => { cancelled = true }
  }, [userId, loading])

  // 로그아웃 시 초기화
  useEffect(() => {
    if (!user && !loading) {
      setSubscribed(new Set())
    }
  }, [user, loading])

  const toggleSubscription = useCallback(
    async (tag: string) => {
      if (!user || !user.id) return

      const wasSub = subscribed.has(tag)

      // 낙관적 업데이트
      setSubscribed((prev) => {
        const next = new Set(prev)
        if (wasSub) next.delete(tag)
        else next.add(tag)
        return next
      })

      try {
        if (wasSub) {
          const { error } = await supabase
            .from("tag_subscriptions")
            .delete()
            .eq("user_id", user.id)
            .eq("tag", tag)

          if (error && error.code !== "42P01" && error.code !== "PGRST205") {
            setSubscribed((prev) => new Set([...prev, tag]))
          }
        } else {
          const { error } = await supabase
            .from("tag_subscriptions")
            .insert({ user_id: user.id, tag })

          if (error && error.code !== "42P01" && error.code !== "PGRST205") {
            setSubscribed((prev) => {
              const next = new Set(prev)
              next.delete(tag)
              return next
            })
          }
        }
      } catch {
        // 롤백
        setSubscribed((prev) => {
          const next = new Set(prev)
          if (wasSub) next.add(tag)
          else next.delete(tag)
          return next
        })
      }
    },
    [user, subscribed]
  )

  return { subscribed, toggleSubscription, loaded: fetched }
}
