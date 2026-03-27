"use client";

interface CategoryChipsProps {
  selectedCategory: string | null;
  onCategoryChange: (cat: string | null) => void;
}

const CATEGORIES = [
  { id: "연애", emoji: "💕" },
  { id: "직장", emoji: "💼" },
  { id: "가족", emoji: "👨‍👩‍👧" },
  { id: "친구", emoji: "🤝" },
  { id: "돈", emoji: "💰" },
  { id: "학교", emoji: "🎓" },
  { id: "이웃", emoji: "🏘️" },
  { id: "기타", emoji: "📌" },
];

export default function CategoryChips({ selectedCategory, onCategoryChange }: CategoryChipsProps) {
  return (
    <div className="feed-tabs-scroll scrollbar-hide" style={{ padding: "6px 12px" }}>
      {CATEGORIES.map((cat) => {
        const isActive = selectedCategory === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => onCategoryChange(cat.id)}
            className="feed-tab"
            style={isActive ? {
              borderColor: "rgba(180,74,255,0.4)",
              color: "#b44aff",
              background: "rgba(180,74,255,0.08)",
            } : {}}
          >
            {cat.emoji} {cat.id}
          </button>
        );
      })}
    </div>
  );
}
