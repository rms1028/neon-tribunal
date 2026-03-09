import { Suspense } from "react"
import type { Metadata } from "next"
import { DebateLayout } from "./debate-layout"

export const metadata: Metadata = {
  title: "내 토론 | 네온 아고라",
  description: "참여한 토론 목록을 확인하고 실시간으로 대화하세요.",
}

export default function DebatePage() {
  return (
    <Suspense fallback={
      <div style={{
        height: "100dvh", display: "flex",
        alignItems: "center", justifyContent: "center",
        background: "#0a0a0f", color: "#555", fontSize: 13,
      }}>
        불러오는 중...
      </div>
    }>
      <DebateLayout />
    </Suspense>
  )
}
