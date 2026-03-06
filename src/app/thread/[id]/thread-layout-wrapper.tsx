"use client"

import { useCallback, useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { PanelLeftOpen, PanelLeftClose } from "lucide-react"
import { ThreadListPanel } from "@/app/debate/thread-list-panel"

const COLLAPSE_KEY = "thread-sidebar-collapsed"

export function ThreadLayoutWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const params = useParams()
  const currentId = typeof params.id === "string" ? params.id : null

  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false
    return localStorage.getItem(COLLAPSE_KEY) === "1"
  })

  useEffect(() => {
    localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0")
  }, [collapsed])

  const handleSelect = useCallback((id: string) => {
    router.push(`/thread/${id}`)
  }, [router])

  return (
    <div style={{ display: "flex", height: "100dvh", background: "#0a0a0f", marginBottom: "-4rem" }} className="md:!mb-0">
      {/* ═══ Left panel (desktop only) ═══ */}
      <div
        className="hidden md:flex"
        style={{
          width: collapsed ? 0 : 320,
          flexShrink: 0,
          flexDirection: "column",
          overflow: "hidden",
          transition: "width 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
          borderRight: collapsed ? "none" : "1px solid rgba(255,255,255,0.05)",
          background: "linear-gradient(180deg, rgba(10,15,20,0.98) 0%, rgba(8,10,14,0.99) 100%)",
        }}
      >
        {!collapsed && (
          <>
            {/* Collapse button — inside panel header */}
            <div style={{
              display: "flex", justifyContent: "flex-end",
              padding: "10px 12px 0",
              flexShrink: 0,
            }}>
              <button
                type="button"
                onClick={() => setCollapsed(true)}
                style={{
                  width: 28, height: 28, borderRadius: 8,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  color: "#555", cursor: "pointer",
                  transition: "all 0.15s",
                }}
                className="hover:!bg-white/[0.06] hover:!text-zinc-300"
                title="패널 접기"
              >
                <PanelLeftClose style={{ width: 14, height: 14 }} />
              </button>
            </div>
            <ThreadListPanel selectedId={currentId} onSelect={handleSelect} />
          </>
        )}
      </div>

      {/* ═══ Right panel (thread content) ═══ */}
      <div style={{ flex: 1, minWidth: 0, overflow: "hidden", position: "relative" }}>
        {/* Open tab — only when collapsed, vertical tab at left edge */}
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
        {children}
      </div>
    </div>
  )
}
