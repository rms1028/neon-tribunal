"use client"

import { Link2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useToast } from "@/components/toast-provider"

export function ShareButton({
  title,
  threadId,
}: {
  title: string
  threadId: string
}) {
  const { showToast } = useToast()

  async function handleShare() {
    const url = `${window.location.origin}/thread/${threadId}`
    try {
      if (navigator.share) {
        await navigator.share({ title, url })
      } else {
        await navigator.clipboard.writeText(url)
        showToast("링크가 복사되었습니다!", "success")
      }
    } catch {
      // 사용자가 공유 취소
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="inline-flex size-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-400 transition hover:bg-white/10 hover:text-zinc-100 md:h-8 md:w-auto md:gap-1.5 md:rounded-md md:px-3"
    >
      <Link2 className="size-3.5" />
      <span className="hidden md:inline text-[12px] font-medium">공유</span>
    </button>
  )
}
