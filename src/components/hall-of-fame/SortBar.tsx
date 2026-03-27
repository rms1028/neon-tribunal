"use client";

import type { SortMode } from "@/lib/types";

interface SortBarProps {
  sort: SortMode;
  onSortChange: (sort: SortMode) => void;
}

export default function SortBar({ sort, onSortChange }: SortBarProps) {
  return (
    <div className="feed-sort">
      {(["newest", "popular"] as SortMode[]).map((s) => {
        const isActive = sort === s;
        const cfg = s === "newest"
          ? { label: "⏰ 최신순", color: "#00E5FF" }
          : { label: "🔥 인기순", color: "#ff2d78" };
        return (
          <button
            key={s}
            onClick={() => onSortChange(s)}
            className="feed-tab"
            style={isActive ? {
              borderColor: `${cfg.color}66`,
              color: cfg.color,
              background: `${cfg.color}14`,
            } : {}}
          >
            {cfg.label}
          </button>
        );
      })}
    </div>
  );
}
