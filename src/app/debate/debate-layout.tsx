"use client"

import { useCallback, useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { PanelLeftOpen, PanelLeftClose } from "lucide-react"
import { ThreadListPanel } from "./thread-list-panel"
import { ThreadDetailPanel } from "./thread-detail-panel"

const COLLAPSE_KEY = "thread-sidebar-collapsed"

export function DebateLayout() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedId = searchParams.get("t")

  const [mobileShowDetail, setMobileShowDetail] = useState(!!selectedId)
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false
    return localStorage.getItem(COLLAPSE_KEY) === "1"
  })

  useEffect(() => {
    localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0")
  }, [collapsed])

  const handleSelect = useCallback((id: string) => {
    router.replace(`/debate?t=${id}`, { scroll: false })
    setMobileShowDetail(true)
  }, [router])

  const handleBack = useCallback(() => {
    router.replace("/debate", { scroll: false })
    setMobileShowDetail(false)
  }, [router])

  return (
    <div
      style={{
        height: "100dvh", display: "flex", background: "#0a0a0f",
        marginBottom: "-4rem",
      }}
      className="md:!mb-0"
    >
      {/* ═══ LEFT PANEL ═══ */}
      <div
        style={{
          width: collapsed ? 0 : 320,
          flexShrink: 0,
          overflow: "hidden",
          transition: "width 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
          borderRight: collapsed ? "none" : "1px solid rgba(255,255,255,0.05)",
          background: "linear-gradient(180deg, rgba(10,15,20,0.98) 0%, rgba(8,10,14,0.99) 100%)",
          display: "flex", flexDirection: "column" as const,
        }}
        className={`
          ${mobileShowDetail && selectedId ? "hidden" : "!w-full"}
          md:!block ${collapsed ? "md:!w-0" : "md:!w-[320px]"}
        `}
      >
        {!collapsed && (
          <>
            {/* Collapse button — inside panel header */}
            <div style={{
              display: "flex", justifyContent: "flex-end",
              padding: "10px 12px 0", flexShrink: 0,
            }}>
              <button
                type="button"
                onClick={() => setCollapsed(true)}
                className="hidden md:flex hover:!bg-white/[0.06] hover:!text-zinc-300"
                style={{
                  width: 28, height: 28, borderRadius: 8,
                  alignItems: "center", justifyContent: "center",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  color: "#555", cursor: "pointer", transition: "all 0.15s",
                }}
                title="패널 접기"
              >
                <PanelLeftClose style={{ width: 14, height: 14 }} />
              </button>
            </div>
            <ThreadListPanel selectedId={selectedId} onSelect={handleSelect} />
          </>
        )}
      </div>

      {/* ═══ RIGHT PANEL ═══ */}
      <div
        style={{ flex: 1, minWidth: 0, overflow: "hidden", position: "relative" }}
        className={`
          ${!mobileShowDetail || !selectedId ? "hidden" : ""}
          md:!block
        `}
      >
        {/* Open tab — only when collapsed */}
        {collapsed && (
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            className="hidden md:flex"
            style={{
              position: "absolute",
              left: 0, top: "50%", transform: "translateY(-50%)",
              zIndex: 40,
              width: 20, height: 48, borderRadius: "0 8px 8px 0",
              alignItems: "center", justifyContent: "center",
              background: "rgba(0,228,165,0.08)",
              border: "1px solid rgba(0,228,165,0.15)",
              borderLeft: "none",
              color: "#00e4a5", cursor: "pointer",
              transition: "all 0.15s",
            }}
            title="패널 열기"
          >
            <PanelLeftOpen style={{ width: 12, height: 12 }} />
          </button>
        )}
        <ThreadDetailPanel threadId={selectedId} onBack={handleBack} />
      </div>
    </div>
  )
}
