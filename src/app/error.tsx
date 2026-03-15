"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error("Neon Court Error:", error);
    }
  }, [error]);

  return (
    <div className="min-h-screen cyber-grid relative overflow-hidden flex items-center justify-center pt-14">
      {/* Ambient glows - red tinted for error */}
      <div className="fixed top-[-200px] right-1/4 w-[500px] h-[500px] bg-red-500/8 rounded-full blur-[200px] pointer-events-none" />
      <div className="fixed bottom-[-150px] left-1/3 w-[400px] h-[400px] bg-neon-purple/8 rounded-full blur-[180px] pointer-events-none" />

      {/* Animated static noise overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-20 opacity-[0.04]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.08) 2px, rgba(255,255,255,0.08) 4px)",
        }}
      />

      <div className="relative z-10 w-full max-w-2xl mx-auto px-6 text-center">
        {/* Glitch error icon */}
        <div className="mb-6 relative">
          <div
            className="glitch text-[80px] md:text-[100px] font-[family-name:var(--font-orbitron)] font-black leading-none select-none"
            data-text="&#9888;"
            style={{
              color: "#ff4444",
              textShadow:
                "0 0 20px rgba(255,68,68,0.8), 0 0 60px rgba(255,68,68,0.4), 0 0 120px rgba(255,68,68,0.2)",
            }}
          >
            &#9888;
          </div>
          <div
            className="font-[family-name:var(--font-orbitron)] text-4xl md:text-5xl font-black uppercase tracking-wider mt-2"
            style={{
              color: "var(--text-primary)",
              textShadow:
                "0 0 10px rgba(255,68,68,0.6), 0 0 40px rgba(255,68,68,0.3)",
            }}
          >
            SYS_CRASH
          </div>
        </div>

        {/* Glass card with error info */}
        <div className="cyber-clip glass-card p-8 mb-8">
          {/* Terminal header */}
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/5">
            <div className="w-2 h-2 bg-red-500 animate-neon-pulse" />
            <span className="font-[family-name:var(--font-share-tech)] text-[10px] text-red-400 tracking-[0.3em] uppercase">
              CRITICAL_MALFUNCTION :: CORE_DUMP
            </span>
          </div>

          {/* Main message */}
          <h2
            className="font-[family-name:var(--font-orbitron)] text-lg md:text-xl font-bold mb-4 uppercase tracking-wider"
            style={{
              color: "#ff4444",
              textShadow: "0 0 10px rgba(255,68,68,0.4)",
            }}
          >
            시스템에 예기치 않은 충격이 감지되었습니다
          </h2>

          <div className="space-y-3 font-[family-name:var(--font-share-tech)] text-sm text-gray-400 leading-relaxed text-left">
            <p>
              <span className="text-red-400">&gt;</span> 네온 코트 중앙 시스템에 일시적 오류가 발생했습니다.
            </p>
            <p>
              <span className="text-red-400">&gt;</span> 걱정 마세요, 판사들은 아직 멀쩡합니다. 아마도요.
            </p>
            <p className="text-gray-600 text-xs mt-4">
              &quot;시스템 오류? 그게 바로 이 도시의 매력이지. 완벽한 건 재미없으니까.&quot;
              <br />
              <span className="text-neon-green/60">&mdash; 사이버 렉카</span>
            </p>
          </div>

          {/* Error details toggle */}
          {error.digest && (
            <div className="mt-4 pt-3 border-t border-white/5">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="font-[family-name:var(--font-share-tech)] text-[10px] text-gray-600 tracking-widest uppercase hover:text-gray-400 transition-colors cursor-pointer"
              >
                {showDetails ? "\u25B2" : "\u25BC"} ERROR_TRACE
              </button>
              {showDetails && (
                <div className="mt-2 p-3 bg-black/40 border border-dark-border text-left">
                  <code className="font-[family-name:var(--font-share-tech)] text-[10px] text-red-400/70 break-all">
                    DIGEST: {error.digest}
                  </code>
                </div>
              )}
            </div>
          )}

          {/* Decorative footer */}
          <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
            <span className="font-[family-name:var(--font-share-tech)] text-[9px] text-gray-700 tracking-widest">
              ERR_CODE: 0x1F4_RUNTIME_FAULT
            </span>
            <span className="font-[family-name:var(--font-share-tech)] text-[9px] text-red-500/50 tracking-widest animate-neon-pulse">
              RECOVERING...
            </span>
          </div>

          {/* Corner decorations */}
          <div className="absolute top-1.5 right-2 w-3 h-3 border-t border-r border-red-500/30" />
          <div className="absolute bottom-1.5 left-2 w-3 h-3 border-b border-l border-red-500/30" />
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={reset}
            className="cyber-clip-btn px-8 py-3 font-[family-name:var(--font-orbitron)] text-xs font-bold tracking-[0.2em] uppercase border border-neon-blue/50 text-neon-blue bg-neon-blue/5 hover:bg-neon-blue/15 transition-all duration-300 cursor-pointer"
            style={{ boxShadow: "0 0 15px rgba(0,240,255,0.1)" }}
          >
            시스템 재부팅
          </button>
          <Link
            href="/"
            className="cyber-clip-btn px-8 py-3 font-[family-name:var(--font-orbitron)] text-xs font-bold tracking-[0.2em] uppercase border border-neon-purple/40 text-neon-purple bg-neon-purple/5 hover:bg-neon-purple/15 transition-all duration-300"
            style={{ boxShadow: "0 0 15px rgba(180,74,255,0.08)" }}
          >
            메인으로 탈출
          </Link>
        </div>

        {/* Footer decoration */}
        <div className="mt-12">
          <div className="holo-line mb-4" />
          <p className="font-[family-name:var(--font-share-tech)] text-[9px] text-gray-700 tracking-[0.3em] uppercase">
            NEON COURT SYSTEM // ERROR_RECOVERY_PROTOCOL
          </p>
        </div>
      </div>
    </div>
  );
}
