"use client";

import Image from "next/image";

interface JudgeAvatarProps {
  avatarUrl: string;
  name: string;
  size?: number;
  className?: string;
  glowRgb?: string;
  style?: React.CSSProperties;
}

export default function JudgeAvatar({ avatarUrl, name, size = 40, className = "", glowRgb, style }: JudgeAvatarProps) {
  return (
    <div
      className={`relative inline-block shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        ...style,
      }}
    >
      {glowRgb && (
        <div
          className="absolute inset-0 rounded-full blur-[10px] opacity-40"
          style={{
            background: `radial-gradient(circle, rgba(${glowRgb}, 0.8), transparent 70%)`,
            transform: "scale(1.5)",
          }}
        />
      )}
      <Image
        src={avatarUrl}
        alt={name}
        width={size}
        height={size}
        className="relative rounded-full object-cover"
        style={{ width: size, height: size }}
        unoptimized
      />
    </div>
  );
}
