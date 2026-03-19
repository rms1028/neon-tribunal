"use client";

import React from "react";

interface StoryInputSectionProps {
  story: string;
  onStoryChange: (value: string) => void;
  imageFile: File | null;
  imagePreview: string | null;
  onImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImageRemove: () => void;
  validationError: string | null;
  trimmedLength: number;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

export default function StoryInputSection({
  story,
  onStoryChange,
  imageFile,
  imagePreview,
  onImageSelect,
  onImageRemove,
  validationError,
  trimmedLength,
  fileInputRef,
}: StoryInputSectionProps) {
  return (
    <section className="flex flex-col">
      <h2 className="font-[family-name:var(--font-orbitron)] text-sm md:text-base font-bold mb-2 md:mb-4 text-white flex items-center gap-3 uppercase tracking-wider">
        <span className="accent-bar bg-neon-blue" />
        <span className="text-neon-blue text-xs mr-1">01</span>
        사연을 입력하세요
      </h2>

      <div className="relative flex-1">
        <div className="cyber-clip-input h-full">
          <textarea
            value={story}
            onChange={(e) => onStoryChange(e.target.value)}
            maxLength={2000}
            placeholder="예: 친구와 돈 문제로 다투고 있어요. 제가 빌려준 돈을 안 갚는데..."
            className="textarea-cyber w-full h-full min-h-[130px] md:min-h-[250px] lg:min-h-[340px] bg-black/50 backdrop-blur-md border border-dark-border px-4 py-3 md:px-5 md:py-4 text-sm md:text-base text-gray-200 placeholder-gray-500 resize-none outline-none transition-all duration-300 focus:border-neon-blue/40 font-[family-name:var(--font-share-tech)] leading-relaxed"
          />
        </div>
        <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-neon-blue/40" />
        <div className="absolute bottom-0 left-0 w-6 h-6">
          <svg viewBox="0 0 24 24" className="text-neon-blue/30" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M0 24 L24 24 L24 0" />
          </svg>
        </div>
        <div
          className="absolute bottom-2 right-3 text-[10px] font-[family-name:var(--font-share-tech)] tracking-wider transition-colors"
          style={{
            color: trimmedLength === 0
              ? "#4a4a6a"
              : trimmedLength < 10
                ? "#ff4444"
                : trimmedLength > 1900
                  ? "#ff8800"
                  : "#39ff14",
          }}
        >
          CHAR: {story.length} / 2000
        </div>
      </div>

      {/* Image upload */}
      <div className="mt-2 md:mt-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={onImageSelect}
          className="hidden"
        />
        {!imagePreview ? (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="cyber-clip-btn w-full py-1.5 md:py-2.5 font-[family-name:var(--font-share-tech)] text-[10px] md:text-xs tracking-[0.15em] uppercase border border-dark-border text-gray-500 bg-black/30 cursor-pointer hover:border-neon-blue/40 hover:text-neon-blue transition-all duration-300"
          >
            {"\uD83D\uDCF7"} 증거 사진 첨부 (선택)
          </button>
        ) : (
          <div className="relative border border-neon-blue/30 bg-black/30 p-2">
            <div className="flex items-center gap-3">
              <img
                src={imagePreview}
                alt="증거 사진 미리보기"
                className="w-16 h-16 object-cover border border-dark-border"
                style={{ clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))" }}
              />
              <div className="flex-1">
                <p className="font-[family-name:var(--font-share-tech)] text-[10px] text-neon-blue tracking-widest uppercase">
                  EVIDENCE_ATTACHED
                </p>
                <p className="font-[family-name:var(--font-share-tech)] text-[10px] text-gray-500 tracking-wider mt-0.5">
                  {imageFile?.name} ({((imageFile?.size || 0) / 1024).toFixed(0)}KB)
                </p>
              </div>
              <button
                type="button"
                onClick={onImageRemove}
                className="px-2 py-1 text-xs text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-colors cursor-pointer font-[family-name:var(--font-share-tech)] tracking-wider"
              >
                {"\u2715"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Validation error */}
      {validationError && (
        <div className="mt-2 px-3 py-2 text-xs text-red-400 font-[family-name:var(--font-share-tech)] tracking-wider border border-red-500/30 bg-red-500/5">
          ⚠ {validationError}
        </div>
      )}
    </section>
  );
}
