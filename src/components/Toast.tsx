"use client";

import { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  visible: boolean;
}

export default function Toast({ message, visible }: ToastProps) {
  const [shouldRender, setShouldRender] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      setAnimating(true);
    } else if (shouldRender) {
      setAnimating(false);
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [visible, shouldRender]);

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 ${
        animating ? "animate-toast-in" : "animate-toast-out"
      }`}
    >
      <div
        className="flex items-center gap-3 px-5 py-3 rounded-sm border border-neon-green/30"
        style={{
          background: "rgba(8, 8, 24, 0.9)",
          backdropFilter: "blur(12px)",
          boxShadow:
            "0 0 20px rgba(57,255,20,0.1), inset 0 0 20px rgba(57,255,20,0.02)",
        }}
      >
        <span
          className="w-0.5 h-5 rounded-full shrink-0"
          style={{ backgroundColor: "#39ff14" }}
        />
        <span className="font-[family-name:var(--font-share-tech)] text-xs text-gray-200 tracking-wider whitespace-nowrap">
          {message}
        </span>
      </div>
    </div>
  );
}
