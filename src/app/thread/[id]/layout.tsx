import { Suspense } from "react"
import { ThreadLayoutWrapper } from "./thread-layout-wrapper"

export default function ThreadLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", height: "100dvh", background: "#0a0a0f" }}>
        <div style={{ flex: 1 }}>{children}</div>
      </div>
    }>
      <ThreadLayoutWrapper>{children}</ThreadLayoutWrapper>
    </Suspense>
  )
}
