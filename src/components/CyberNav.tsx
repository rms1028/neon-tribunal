"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useTheme } from "@/components/theme-provider";

export default function CyberNav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  // 페이지 이동 시 메뉴 닫기
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // 메뉴 열릴 때 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const navLinks = [
    { href: "/", label: "\u2696 판결", activeColor: "text-neon-blue", glowColor: "drop-shadow-[0_0_8px_#00f0ff]" },
    { href: "/hall-of-fame", label: "\uD83D\uDCE2 공개 재판소", activeColor: "text-neon-yellow", glowColor: "drop-shadow-[0_0_8px_#f0e130]" },
    { href: "/my-verdicts", label: "\uD83D\uDCDC 내 기록", activeColor: "text-neon-green", glowColor: "drop-shadow-[0_0_8px_#39ff14]" },
  ];

  const showFab = pathname !== "/" && pathname !== "/hall-of-fame";

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-6 py-3 bg-dark-bg/80 backdrop-blur-md border-b border-dark-border">
        <Link
          href="/"
          onClick={(e) => {
            if (pathname === "/") {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
          }}
          className="font-[family-name:var(--font-orbitron)] text-sm font-bold text-neon-blue tracking-wider uppercase hover:text-white transition-colors"
        >
          NEONS
        </Link>

        {/* 데스크톱 네비게이션 */}
        <div className="hidden md:flex items-center gap-6 font-[family-name:var(--font-share-tech)] text-xs tracking-widest uppercase">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`transition-colors ${
                pathname === link.href
                  ? link.activeColor
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <button
            onClick={toggleTheme}
            className="ml-2 p-1.5 rounded-md transition-all duration-200 hover:bg-white/10"
            aria-label={theme === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환"}
            style={{
              color: theme === "dark" ? "#f0e130" : "#b44aff",
              fontSize: "16px",
            }}
          >
            {theme === "dark" ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/>
                <line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </button>
        </div>

        {/* 모바일 우측: 테마 토글 + 햄버거 */}
        <div className="md:hidden flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-md transition-all duration-200"
            aria-label={theme === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환"}
            style={{
              color: theme === "dark" ? "#f0e130" : "#b44aff",
            }}
          >
            {theme === "dark" ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/>
                <line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </button>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="relative w-8 h-8 flex flex-col items-center justify-center gap-[5px] group"
            aria-label={isOpen ? "메뉴 닫기" : "메뉴 열기"}
            aria-expanded={isOpen}
          >
            <span
              className={`block w-5 h-[2px] bg-neon-blue transition-all duration-300 ${
                isOpen ? "rotate-45 translate-y-[7px]" : ""
              }`}
            />
            <span
              className={`block w-5 h-[2px] bg-neon-blue transition-all duration-300 ${
                isOpen ? "opacity-0 scale-x-0" : ""
              }`}
            />
            <span
              className={`block w-5 h-[2px] bg-neon-blue transition-all duration-300 ${
                isOpen ? "-rotate-45 -translate-y-[7px]" : ""
              }`}
            />
          </button>
        </div>
      </nav>

      {/* 모바일 메뉴 오버레이 */}
      <div
        className={`fixed inset-0 z-40 bg-dark-bg/60 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* 모바일 메뉴 패널 */}
      <div
        className={`fixed top-[53px] right-0 z-40 w-64 h-[calc(100dvh-53px)] bg-dark-bg/95 backdrop-blur-lg border-l border-dark-border transition-transform duration-300 ease-out md:hidden ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col gap-1 p-4 font-[family-name:var(--font-share-tech)] text-sm tracking-widest uppercase">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-3 border transition-all duration-200 ${
                  isActive
                    ? `${link.activeColor} ${link.glowColor} border-current bg-white/5`
                    : "text-gray-500 border-transparent hover:text-gray-300 hover:border-dark-border hover:bg-white/[0.02]"
                }`}
                style={{
                  clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))",
                }}
              >
                {link.label}
              </Link>
            );
          })}

          {/* 장식 요소 */}
          <div className="mt-6 px-4">
            <div className="h-[1px] bg-gradient-to-r from-neon-blue/40 via-neon-purple/40 to-transparent" />
            <p className="mt-3 text-[10px] text-gray-600 tracking-[0.2em] normal-case font-[family-name:var(--font-share-tech)]">
              System v1.0 // Online
            </p>
          </div>
        </div>
      </div>

      {/* Mobile floating action button */}
      {showFab && (
        <Link
          href="/"
          className="fixed md:hidden z-50 flex items-center justify-center gap-1.5 transition-all duration-200"
          style={{
            bottom: "24px",
            right: "20px",
            fontFamily: "var(--font-share-tech)",
            fontSize: "12px",
            fontWeight: 700,
            letterSpacing: "0.06em",
            color: "#000000",
            background: "#00E5FF",
            border: "none",
            padding: "12px 20px",
            borderRadius: "9999px",
            boxShadow: "0 0 16px rgba(0,229,255,0.4), 0 0 40px rgba(0,229,255,0.15), 0 2px 12px rgba(0,0,0,0.5)",
          }}
        >
          {"\u2696\uFE0F"} 새 재판
        </Link>
      )}
    </>
  );
}
