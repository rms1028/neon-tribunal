"use client";

import { judges } from "@/lib/judges";
import JudgeAvatar from "@/components/JudgeAvatar";

interface FilterTabsBarProps {
  judgeFilter: string | null;
  onJudgeFilter: (judgeId: string | null) => void;
}

export default function FilterTabsBar({ judgeFilter, onJudgeFilter }: FilterTabsBarProps) {
  return (
    <div className="feed-tabs">
      <div className="feed-tabs-scroll scrollbar-hide">
        <button
          onClick={() => onJudgeFilter(null)}
          className="feed-tab"
          style={judgeFilter === null ? {
            border: "1px solid rgba(0,255,204,0.4)",
            color: "#00ffcc",
            background: "rgba(0,255,204,0.08)",
          } : {}}
        >
          ⚡ 전체
        </button>
        {judges.map((j) => {
          const isActive = judgeFilter === j.id;
          return (
            <button
              key={j.id}
              onClick={() => onJudgeFilter(j.id)}
              className="feed-tab"
              style={isActive ? {
                borderColor: j.accentColor,
                color: j.accentColor,
                background: `rgba(${j.glowRgb},0.08)`,
              } : {}}
            >
              <JudgeAvatar avatarUrl={j.avatarUrl} name={j.name} size={16} />
              {j.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
