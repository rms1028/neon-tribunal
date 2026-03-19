"use client";

interface ErrorDisplayProps {
  error: string;
  onRetry: () => void;
}

export default function ErrorDisplay({ error, onRetry }: ErrorDisplayProps) {
  return (
    <section className="pb-12 verdict-reveal">
      <div className="holo-line mb-8" />

      <div className="cyber-clip glass-card relative p-6 md:p-8 border border-red-500/20" style={{ boxShadow: "0 0 30px rgba(255,50,50,0.1)" }}>
        <div className="flex items-center gap-4 mb-4">
          <div className="text-4xl">⚠️</div>
          <div>
            <h3 className="font-[family-name:var(--font-orbitron)] font-bold text-sm md:text-base uppercase tracking-wide text-red-400">
              시스템 오류
            </h3>
            <p className="font-[family-name:var(--font-share-tech)] text-[10px] text-gray-500 tracking-[0.2em]">
              ERROR_OCCURRED
            </p>
          </div>
        </div>

        <p className="text-sm text-red-300 font-[family-name:var(--font-share-tech)] leading-relaxed">
          {error}
        </p>
      </div>

      <div className="flex gap-4 mt-6">
        <button
          onClick={onRetry}
          className="cyber-clip-btn flex-1 py-3 md:py-4 font-[family-name:var(--font-orbitron)] font-bold text-xs md:text-sm tracking-[0.15em] uppercase border border-neon-blue/40 text-neon-blue bg-neon-blue/5 cursor-pointer hover:bg-neon-blue/10 transition-all duration-300"
        >
          &#x21BB; 다시 시도
        </button>
      </div>
    </section>
  );
}
