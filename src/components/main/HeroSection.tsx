"use client";

interface HeroSectionProps {
  onScrollToContent: () => void;
}

export default function HeroSection({ onScrollToContent }: HeroSectionProps) {
  return (
    <section className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6">
      {/* Decorative corner brackets */}
      <div className="absolute top-6 left-6 w-12 h-12 border-t-2 border-l-2 border-neon-blue/30" />
      <div className="absolute top-6 right-6 w-12 h-12 border-t-2 border-r-2 border-neon-blue/30" />
      <div className="absolute bottom-24 left-6 w-12 h-12 border-b-2 border-l-2 border-neon-blue/30" />
      <div className="absolute bottom-24 right-6 w-12 h-12 border-b-2 border-r-2 border-neon-blue/30" />

      <div className="text-7xl md:text-9xl mb-6 drop-shadow-[0_0_40px_rgba(0,240,255,0.5)]">
        &#9878;
      </div>

      <h1
        className="glitch text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-[family-name:var(--font-orbitron)] font-black mb-6 uppercase tracking-wider text-center"
        data-text="전국민 고민 재판소: 네온즈"
        style={{ wordBreak: "keep-all", overflowWrap: "break-word" }}
      >
        <span
          className="relative z-20"
          style={{
            color: "var(--text-primary)",
            textShadow: "0 0 10px rgba(0,240,255,1), 0 0 40px rgba(0,240,255,0.7), 0 0 80px rgba(0,240,255,0.4)",
          }}
        >
          전국민 고민 재판소: 네온즈
        </span>
      </h1>

      <p className="text-lg md:text-2xl text-gray-300 mb-10 text-center leading-relaxed max-w-2xl" style={{ wordBreak: "keep-all", overflowWrap: "break-word" }}>
        고민이나 다툼 상황을 올리면,
        <strong className="text-white"> AI 판사가 판결</strong>을 내려드립니다
      </p>

      <div className="flex items-center justify-center gap-2 sm:gap-3 md:gap-6 text-[10px] sm:text-xs md:text-sm font-[family-name:var(--font-share-tech)] tracking-wider mb-12">
        <span className="flex items-center gap-1.5 sm:gap-2 text-neon-blue">
          <span className="inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 border border-neon-blue/60 text-[10px] sm:text-xs font-bold" style={{ clipPath: "polygon(4px 0,100% 0,100% calc(100% - 4px),calc(100% - 4px) 100%,0 100%,0 4px)" }}>1</span>
          사연 작성
        </span>
        <span className="text-gray-600 text-sm sm:text-lg">&#9654;</span>
        <span className="flex items-center gap-1.5 sm:gap-2 text-neon-purple">
          <span className="inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 border border-neon-purple/60 text-[10px] sm:text-xs font-bold" style={{ clipPath: "polygon(4px 0,100% 0,100% calc(100% - 4px),calc(100% - 4px) 100%,0 100%,0 4px)" }}>2</span>
          판사 선택
        </span>
        <span className="text-gray-600 text-sm sm:text-lg">&#9654;</span>
        <span className="flex items-center gap-1.5 sm:gap-2 text-neon-pink">
          <span className="inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 border border-neon-pink/60 text-[10px] sm:text-xs font-bold" style={{ clipPath: "polygon(4px 0,100% 0,100% calc(100% - 4px),calc(100% - 4px) 100%,0 100%,0 4px)" }}>3</span>
          판결 받기
        </span>
      </div>

      <button
        onClick={onScrollToContent}
        className="cyber-clip-btn px-10 py-3 border border-neon-blue/50 text-neon-blue font-[family-name:var(--font-orbitron)] text-sm uppercase tracking-widest cursor-pointer hover:bg-neon-blue/10 transition-all duration-300"
        style={{ boxShadow: "0 0 20px rgba(0,240,255,0.15)" }}
      >
        시작하기
      </button>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
        <span className="font-[family-name:var(--font-share-tech)] text-[10px] text-gray-600 tracking-widest">SCROLL</span>
        <svg width="20" height="20" viewBox="0 0 20 20" className="text-neon-blue/50">
          <path d="M4 8 L10 14 L16 8" stroke="currentColor" fill="none" strokeWidth="1.5" />
        </svg>
      </div>
    </section>
  );
}
