"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react"

type Theme = "dark" | "light"

type ThemeContextType = {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  toggleTheme: () => {},
})

export function useTheme() {
  return useContext(ThemeContext)
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // 서버·클라이언트 모두 "dark"로 시작해 hydration mismatch 방지.
  // layout.tsx의 인라인 스크립트가 data-theme을 즉시 설정하므로 FOUC 없음.
  const [theme, setTheme] = useState<Theme>("dark")

  // 마운트 후 localStorage / prefers-color-scheme 에서 실제 테마 복원
  useEffect(() => {
    const stored = localStorage.getItem("neon-agora-theme") as Theme | null
    let resolved: Theme = "dark"
    if (stored === "light" || stored === "dark") {
      resolved = stored
    } else if (window.matchMedia?.("(prefers-color-scheme: light)").matches) {
      resolved = "light"
    }
    setTheme(resolved)
    document.documentElement.setAttribute("data-theme", resolved)
  }, [])

  // 테마 변경 시 data-theme 동기화
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark"
      localStorage.setItem("neon-agora-theme", next)
      document.documentElement.setAttribute("data-theme", next)
      return next
    })
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
