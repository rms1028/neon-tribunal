"use client";

import { judges } from "@/lib/judges";
import type { SortMode } from "@/lib/types";
import JudgeAvatar from "@/components/JudgeAvatar";

interface StoriesRowProps {
  judgeFilter: string | null;
  sort: SortMode;
  onOpenStory: (judgeId: string) => void;
  onSortChange: (sort: SortMode) => void;
}

const SHORT_NAMES: Record<string, string> = {
  "저스티스 제로": "저스티스",
  "하트 비트": "하트빗",
  "사이버 벵카": "벵카",
  "형사 네온": "형사네온",
};

export default function StoriesRow({ judgeFilter, sort, onOpenStory, onSortChange }: StoriesRowProps) {
  return (
    <div className="feed-stories scrollbar-hide">
      {judges.map((j) => {
        const isActive = judgeFilter === j.id;
        const shortName = SHORT_NAMES[j.name] || j.name;
        return (
          <button key={j.id} className="story-circle" onClick={() => onOpenStory(j.id)}>
            <div
              className="story-ring"
              style={{
                background: `linear-gradient(135deg, ${j.accentColor}, ${j.accentColor}88)`,
                boxShadow: isActive ? `0 0 12px ${j.accentColor}66` : "none",
              }}
            >
              <div className="story-inner">
                <JudgeAvatar avatarUrl={j.avatarUrl} name={j.name} size={28} />
              </div>
            </div>
            <span className="story-name" style={isActive ? { color: j.accentColor, fontWeight: 700 } : {}}>
              {shortName}
            </span>
          </button>
        );
      })}
      <button
        className="story-circle"
        onClick={() => { if (sort !== "popular") onSortChange("popular"); }}
      >
        <div className="story-ring" style={{ background: "linear-gradient(135deg, #FFD700, #ff8c00)" }}>
          <div className="story-inner">
            <span style={{ fontSize: 22 }}>🏆</span>
          </div>
        </div>
        <span className="story-name" style={sort === "popular" ? { color: "#FFD700", fontWeight: 700 } : {}}>
          명예전당
        </span>
      </button>
    </div>
  );
}
