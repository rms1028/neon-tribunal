"use client"

import { useEffect, useState } from "react"
import { Eye, EyeOff, Lock, LogIn, Mail, RefreshCw, Sparkles, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/toast-provider"

type Tab = "login" | "signup" | "reset"

export function AuthModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { showToast } = useToast()
  const [tab, setTab] = useState<Tab>("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState("")
  const [oauthLoading, setOauthLoading] = useState<"google" | "kakao" | null>(null)
  // 이메일 인증 대기 중인지 여부
  const [needsConfirmation, setNeedsConfirmation] = useState(false)

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open, onClose])

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  function reset() {
    setEmail("")
    setPassword("")
    setError("")
    setShowPw(false)
    setNeedsConfirmation(false)
    setOauthLoading(null)
  }

  function handleTabChange(next: Tab) {
    setTab(next)
    setError("")
    setNeedsConfirmation(false)
  }

  async function handleOAuth(provider: "google" | "kakao") {
    setOauthLoading(provider)
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin,
        ...(provider === "kakao" && {
          scopes: "profile_nickname profile_image",
        }),
      },
    })
    if (error) {
      setError(error.message)
      setOauthLoading(null)
    }
  }

  // 이메일 인증 메일 재발송
  async function handleResend() {
    if (!email) return
    setResending(true)
    await supabase.auth.resend({ type: "signup", email })
    setResending(false)
    showToast("인증 이메일을 다시 발송했습니다. 받은편지함을 확인해주세요.", "success")
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) {
      setError("이메일을 입력해주세요.")
      return
    }
    setLoading(true)
    setError("")

    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/`,
    })
    setLoading(false)

    if (err) {
      setError(err.message)
      return
    }
    showToast("비밀번호 재설정 이메일을 발송했습니다. 받은편지함을 확인해주세요.", "success")
    setTab("login")
    reset()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (tab === "reset") {
      return handleResetPassword(e)
    }
    if (!email.trim() || !password.trim()) {
      setError("이메일과 비밀번호를 입력해주세요.")
      return
    }

    setLoading(true)
    setError("")
    setNeedsConfirmation(false)

    if (tab === "login") {
      const { error: err } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      setLoading(false)

      if (err) {
        // 이메일 미인증 — 가장 흔한 오류
        if (err.message === "Email not confirmed") {
          setNeedsConfirmation(true)
          setError("이메일 인증이 완료되지 않았습니다. 가입 시 발송된 메일의 인증 링크를 클릭해주세요.")
          return
        }
        setError(
          err.message === "Invalid login credentials"
            ? "이메일 또는 비밀번호가 올바르지 않습니다."
            : err.message
        )
        return
      }

      showToast("로그인 성공! 환영합니다.", "success")
      reset()
      onClose()
    } else {
      const { data, error: err } = await supabase.auth.signUp({ email, password })
      setLoading(false)

      if (err) {
        setError(err.message)
        return
      }

      // session이 null이면 이메일 인증 필요, non-null이면 즉시 로그인
      if (data.session) {
        showToast("가입 완료! 로그인되었습니다.", "success")
        reset()
        onClose()
      } else {
        setNeedsConfirmation(true)
        setError("가입 완료! 발송된 인증 이메일을 확인하고 링크를 클릭한 뒤 로그인해주세요.")
        setTab("login")
      }
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* 배경 */}
      <div
        className="absolute inset-0 z-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 드로어 패널 */}
      <div className="relative z-10 flex h-full w-full max-w-sm flex-col border-l border-white/10 bg-zinc-950 shadow-[-40px_0_80px_rgba(0,0,0,0.7)]">
        {/* 상단 네온 라인 */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-fuchsia-400/70 to-cyan-400/50" />

        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="grid size-8 place-items-center rounded-lg border border-fuchsia-400/20 bg-fuchsia-400/10 text-fuchsia-300">
              <LogIn className="size-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-50">네온 아고라</h2>
              <p className="text-[11px] text-zinc-500">광장에 입장하려면 인증이 필요해</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-8 place-items-center rounded-lg border border-white/10 bg-white/5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-zinc-100"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* 탭 */}
        <div className="flex gap-1 border-b border-white/10 px-6 py-3">
          {tab === "reset" ? (
            <div className="flex w-full items-center gap-2 py-2 text-xs text-zinc-400">
              <button
                onClick={() => handleTabChange("login")}
                className="text-fuchsia-300 underline underline-offset-2 hover:text-fuchsia-200"
              >
                로그인으로 돌아가기
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => handleTabChange("login")}
                className={`flex-1 rounded-lg py-2 text-xs font-medium transition-all duration-200 ${
                  tab === "login"
                    ? "bg-fuchsia-500/20 text-fuchsia-200 ring-1 ring-fuchsia-400/30 shadow-[0_0_12px_rgba(236,72,153,0.15)]"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                로그인
              </button>
              <button
                onClick={() => handleTabChange("signup")}
                className={`flex-1 rounded-lg py-2 text-xs font-medium transition-all duration-200 ${
                  tab === "signup"
                    ? "bg-cyan-500/20 text-cyan-200 ring-1 ring-cyan-400/30 shadow-[0_0_12px_rgba(34,211,238,0.15)]"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                회원가입
              </button>
            </>
          )}
        </div>

        {/* 폼 */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-6"
        >
          {/* OAuth 버튼 */}
          {tab !== "reset" && (
            <>
              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => handleOAuth("google")}
                  disabled={oauthLoading !== null}
                  className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-white/10 bg-white py-2.5 text-sm font-medium text-zinc-800 transition hover:bg-zinc-100 disabled:opacity-50"
                >
                  {oauthLoading === "google" ? (
                    <RefreshCw className="size-4 animate-spin text-zinc-500" />
                  ) : (
                    <svg className="size-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                  )}
                  Google로 계속하기
                </button>
                <button
                  type="button"
                  disabled
                  className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-yellow-400/20 py-2.5 text-sm font-medium text-zinc-500 cursor-not-allowed opacity-50"
                  style={{ backgroundColor: "#FEE50044" }}
                  title="카카오 로그인은 준비 중입니다"
                >
                  <svg className="size-4" viewBox="0 0 24 24">
                    <path fill="#3C1E1E" d="M12 3C6.48 3 2 6.36 2 10.44c0 2.62 1.75 4.93 4.38 6.24l-1.12 4.16a.3.3 0 0 0 .45.34l4.84-3.2c.47.05.95.08 1.45.08 5.52 0 10-3.36 10-7.62C22 6.36 17.52 3 12 3z" />
                  </svg>
                  카카오 (준비 중)
                </button>
              </div>

              {/* 구분선 */}
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-[11px] text-zinc-500">또는 이메일로 계속</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>
            </>
          )}

          {/* 이메일 */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400">이메일</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                autoFocus
                className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-zinc-100 placeholder:text-zinc-600 transition focus:border-fuchsia-400/40 focus:outline-none focus:ring-1 focus:ring-fuchsia-400/30"
              />
            </div>
          </div>

          {/* 비밀번호 (reset 모드에서는 숨김) */}
          {tab !== "reset" && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-400">비밀번호</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={tab === "signup" ? "6자 이상 입력" : "비밀번호 입력"}
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-10 text-sm text-zinc-100 placeholder:text-zinc-600 transition focus:border-fuchsia-400/40 focus:outline-none focus:ring-1 focus:ring-fuchsia-400/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {tab === "login" && (
                <button
                  type="button"
                  onClick={() => handleTabChange("reset")}
                  className="text-xs text-zinc-500 underline underline-offset-2 hover:text-zinc-300"
                >
                  비밀번호를 잊으셨나요?
                </button>
              )}
            </div>
          )}

          {tab === "reset" && (
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs leading-relaxed text-zinc-500">
              가입한 이메일을 입력하면 비밀번호 재설정 링크를 보내드립니다.
            </div>
          )}

          {tab === "signup" && !needsConfirmation && (
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs leading-relaxed text-zinc-500">
              💡 비밀번호는 최소 6자 이상이어야 합니다.
            </div>
          )}

          {/* 오류 / 안내 메시지 */}
          {error && (
            <div className={`rounded-lg border px-3 py-2.5 text-xs leading-relaxed ${
              needsConfirmation
                ? "border-amber-500/20 bg-amber-500/10 text-amber-300"
                : "border-red-500/20 bg-red-500/10 text-red-400"
            }`}>
              {error}

              {/* 이메일 미인증일 때 재발송 버튼 */}
              {needsConfirmation && (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="mt-2 flex items-center gap-1.5 text-amber-200 underline underline-offset-2 hover:text-amber-100 disabled:opacity-50"
                >
                  <RefreshCw className={`size-3 ${resending ? "animate-spin" : ""}`} />
                  인증 이메일 다시 받기
                </button>
              )}
            </div>
          )}

          {/* 제출 버튼 */}
          <div className="mt-auto pt-2">
            <Button
              type="submit"
              disabled={loading}
              className={`w-full disabled:opacity-50 ${
                tab === "login"
                  ? "bg-fuchsia-500 text-white hover:bg-fuchsia-600 shadow-[0_0_20px_rgba(236,72,153,0.3)]"
                  : "bg-cyan-500 text-black hover:bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.3)]"
              }`}
            >
              <Sparkles className="size-4" />
              {loading
                ? "처리 중…"
                : tab === "login"
                  ? "로그인"
                  : tab === "reset"
                    ? "재설정 메일 보내기"
                    : "회원가입"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
