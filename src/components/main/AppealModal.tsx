"use client";

interface AppealModalProps {
  open: boolean;
  appealReason: string;
  onAppealReasonChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export default function AppealModal({ open, appealReason, onAppealReasonChange, onClose, onSubmit }: AppealModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-md cyber-clip animate-modal-in"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--modal-bg)",
          border: "1px solid rgba(0, 240, 255, 0.3)",
          boxShadow: "0 0 60px rgba(0,240,255,0.12), inset 0 0 60px rgba(0,240,255,0.03), 0 0 120px rgba(180,74,255,0.08)",
        }}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-3">
          <div className="flex items-center gap-3">
            <span className="text-xl">&#x2696;&#xFE0F;</span>
            <h3 className="font-[family-name:var(--font-orbitron)] text-xs font-bold tracking-[0.2em] uppercase text-neon-blue">
              항소장 작성
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="h-px mx-6" style={{ background: "linear-gradient(90deg, transparent, rgba(0,240,255,0.3), transparent)" }} />

        <div className="px-6 py-5">
          <p className="font-[family-name:var(--font-share-tech)] text-xs text-gray-400 mb-3 tracking-wider">
            1심 판결에 불복하시나요? 변명을 제출하면 더 강력한 2심 판결이 내려집니다.
          </p>
          <textarea
            value={appealReason}
            onChange={(e) => onAppealReasonChange(e.target.value)}
            placeholder="판결에 불복하는 이유나 변명을 적어보세요..."
            maxLength={500}
            rows={4}
            className="w-full bg-dark-surface/80 border border-neon-blue/20 text-sm text-gray-200 placeholder-gray-600 p-4 font-[family-name:var(--font-share-tech)] focus:outline-none focus:border-neon-blue/50 transition-colors resize-none"
            style={{
              clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))",
              boxShadow: "inset 0 0 20px rgba(0,240,255,0.03)",
            }}
          />
          <div className="flex justify-end mt-1">
            <span className="font-[family-name:var(--font-share-tech)] text-[9px] text-gray-600 tracking-widest">
              {appealReason.length}/500
            </span>
          </div>
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            className="cyber-clip-btn flex-1 py-3 font-[family-name:var(--font-orbitron)] font-bold text-[10px] tracking-[0.12em] uppercase border border-gray-700 text-gray-500 bg-transparent cursor-pointer hover:text-gray-300 hover:border-gray-500 transition-all duration-300"
          >
            취소
          </button>
          <button
            onClick={onSubmit}
            disabled={!appealReason.trim()}
            className="cyber-clip-btn flex-1 py-3 font-[family-name:var(--font-orbitron)] font-bold text-[10px] tracking-[0.12em] uppercase border border-neon-blue/50 text-neon-blue bg-neon-blue/10 cursor-pointer hover:bg-neon-blue/20 hover:border-neon-blue/70 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-neon-blue/10"
            style={{ boxShadow: appealReason.trim() ? "0 0 20px rgba(0,240,255,0.15)" : undefined }}
          >
            제출하고 2심 받기
          </button>
        </div>

        <div className="absolute top-2 right-3 w-3 h-3 border-t border-r border-neon-blue/30" />
        <div className="absolute bottom-2 left-3 w-3 h-3 border-b border-l border-neon-blue/30" />
        <div className="absolute top-2 left-3 w-3 h-3 border-t border-l border-neon-purple/20" />
        <div className="absolute bottom-2 right-3 w-3 h-3 border-b border-r border-neon-purple/20" />
      </div>
    </div>
  );
}
