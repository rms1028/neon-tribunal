<<<<<<< HEAD
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen cyber-grid relative overflow-hidden flex items-center justify-center pt-14">
      {/* Ambient glows */}
      <div className="fixed top-[-200px] left-1/4 w-[500px] h-[500px] bg-neon-pink/8 rounded-full blur-[200px] pointer-events-none" />
      <div className="fixed bottom-[-150px] right-1/3 w-[400px] h-[400px] bg-neon-purple/10 rounded-full blur-[180px] pointer-events-none" />

      {/* Scanline noise overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-20 opacity-[0.03]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.08) 2px, rgba(255,255,255,0.08) 4px)",
        }}
      />

      <div className="relative z-10 w-full max-w-2xl mx-auto px-6 text-center">
        {/* Error code - massive glitch title */}
        <div className="mb-6">
          <h1
            className="glitch text-[120px] md:text-[180px] font-[family-name:var(--font-orbitron)] font-black leading-none select-none"
            data-text="404"
            style={{
              color: "#ffffff",
              textShadow:
                "0 0 20px rgba(255,45,149,0.8), 0 0 60px rgba(255,45,149,0.4), 0 0 120px rgba(255,45,149,0.2)",
            }}
          >
            404
          </h1>
        </div>

        {/* Glass card with message */}
        <div className="cyber-clip glass-card p-8 mb-8">
          {/* Terminal-style header */}
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/5">
            <div className="w-2 h-2 bg-neon-pink animate-neon-pulse" />
            <span className="font-[family-name:var(--font-share-tech)] text-[10px] text-neon-pink tracking-[0.3em] uppercase">
              SYSTEM_ERROR :: SECTOR_NOT_FOUND
            </span>
          </div>

          {/* Main message */}
          <h2
            className="font-[family-name:var(--font-orbitron)] text-xl md:text-2xl font-bold mb-4 uppercase tracking-wider"
            style={{
              color: "#ff2d95",
              textShadow: "0 0 10px rgba(255,45,149,0.5)",
            }}
          >
            관할구역 이탈 감지
          </h2>

          <div className="space-y-3 font-[family-name:var(--font-share-tech)] text-sm text-gray-400 leading-relaxed">
            <p>
              <span className="text-neon-pink">&gt;</span> 요청하신 구역은 네온 코트 관할 밖입니다.
            </p>
            <p>
              <span className="text-neon-pink">&gt;</span> 혹시 길을 잃으셨나요? 이 도시에서 그건 흔한 일이죠.
            </p>
            <p className="text-gray-600 text-xs mt-4">
              &quot;존재하지 않는 곳을 찾는 건, 있지도 않은 정의를 찾는 것과 같다.&quot;
              <br />
              <span className="text-neon-purple/60">&mdash; 형사 네온</span>
            </p>
          </div>

          {/* Decorative data */}
          <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
            <span className="font-[family-name:var(--font-share-tech)] text-[9px] text-gray-700 tracking-widest">
              ERR_CODE: 0x194_SECTOR_NULL
            </span>
            <span className="font-[family-name:var(--font-share-tech)] text-[9px] text-gray-700 tracking-widest animate-neon-pulse">
              SIGNAL_LOST...
            </span>
          </div>

          {/* Corner decorations */}
          <div className="absolute top-1.5 right-2 w-3 h-3 border-t border-r border-neon-pink/30" />
          <div className="absolute bottom-1.5 left-2 w-3 h-3 border-b border-l border-neon-pink/30" />
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="cyber-clip-btn px-8 py-3 font-[family-name:var(--font-orbitron)] text-xs font-bold tracking-[0.2em] uppercase border border-neon-blue/50 text-neon-blue bg-neon-blue/5 hover:bg-neon-blue/15 transition-all duration-300"
            style={{ boxShadow: "0 0 15px rgba(0,240,255,0.1)" }}
          >
            재판소로 복귀
          </Link>
          <Link
            href="/hall-of-fame"
            className="cyber-clip-btn px-8 py-3 font-[family-name:var(--font-orbitron)] text-xs font-bold tracking-[0.2em] uppercase border border-neon-yellow/40 text-neon-yellow bg-neon-yellow/5 hover:bg-neon-yellow/15 transition-all duration-300"
            style={{ boxShadow: "0 0 15px rgba(240,225,48,0.08)" }}
          >
            공개 재판소
          </Link>
        </div>

        {/* Footer decoration */}
        <div className="mt-12">
          <div className="holo-line mb-4" />
          <p className="font-[family-name:var(--font-share-tech)] text-[9px] text-gray-700 tracking-[0.3em] uppercase">
            NEON COURT SYSTEM // NAVIGATION_RECOVERY_PROTOCOL
          </p>
        </div>
      </div>
    </div>
  );
=======
import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-zinc-100">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(800px_circle_at_50%_40%,rgba(236,72,153,0.12),transparent_55%)]" />
      </div>

      <div className="relative mx-4 max-w-md text-center">
        {/* glitch 404 */}
        <div className="mb-6 text-8xl font-black tracking-tighter">
          <span className="bg-gradient-to-r from-fuchsia-400 via-cyan-300 to-fuchsia-400 bg-clip-text text-transparent">
            404
          </span>
        </div>

        <h1 className="mb-2 text-xl font-bold text-zinc-100">
          신호를 찾을 수 없습니다
        </h1>
        <p className="mb-8 text-sm leading-relaxed text-zinc-500">
          요청한 페이지가 네온 아고라에 존재하지 않거나,
          <br />
          이미 삭제되었습니다.
        </p>

        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-6 py-3 text-sm font-medium text-cyan-200 transition hover:bg-cyan-400/20 hover:shadow-[0_0_20px_rgba(34,211,238,0.2)]"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  )
>>>>>>> fa6b4c1b2ce350bb3dba5b3fd22e8596f3bbefc5
}
