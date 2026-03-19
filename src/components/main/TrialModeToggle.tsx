"use client";

import type { TrialMode } from "@/lib/types";

interface TrialModeToggleProps {
  trialMode: TrialMode;
  onSelectSingle: () => void;
  onSelectFullCourt: () => void;
}

export default function TrialModeToggle({ trialMode, onSelectSingle, onSelectFullCourt }: TrialModeToggleProps) {
  return (
    <div className="flex gap-3 mb-4 md:mb-10 justify-center">
      <button
        onClick={onSelectSingle}
        className={`cyber-clip-btn px-5 md:px-7 py-2.5 md:py-3 font-[family-name:var(--font-orbitron)] text-[10px] md:text-xs tracking-[0.12em] uppercase border transition-all duration-300 cursor-pointer ${
          trialMode === "single"
            ? "border-neon-blue/60 text-neon-blue bg-neon-blue/10"
            : "border-dark-border text-gray-500 hover:text-gray-300 hover:border-gray-500"
        }`}
        style={trialMode === "single" ? { boxShadow: "0 0 20px rgba(0,240,255,0.15)" } : undefined}
      >
        &#9878; 단독 재판
      </button>
      <button
        onClick={onSelectFullCourt}
        className={`cyber-clip-btn px-5 md:px-7 py-2.5 md:py-3 font-[family-name:var(--font-orbitron)] text-[10px] md:text-xs tracking-[0.12em] uppercase border transition-all duration-300 cursor-pointer ${
          trialMode === "full-court"
            ? "border-neon-purple/60 text-neon-purple bg-neon-purple/10"
            : "border-dark-border text-gray-500 hover:text-gray-300 hover:border-gray-500"
        }`}
        style={trialMode === "full-court" ? { boxShadow: "0 0 20px rgba(180,74,255,0.15)" } : undefined}
      >
        &#9878;&#9878; 전원 재판
      </button>
    </div>
  );
}
