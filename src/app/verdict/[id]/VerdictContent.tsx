"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { judges } from "@/lib/judges";
import type { HallOfFameEntry } from "@/lib/types";
import ShareCard from "@/components/ShareCard";
import Toast from "@/components/Toast";
import JudgeAvatar from "@/components/JudgeAvatar";
import EvidenceImage from "@/components/EvidenceImage";
// html-to-image is lazy-loaded to reduce initial bundle size

const LIKED_KEY = "neon-court-liked-ids";

function getLikedIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(LIKED_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveLikedIds(ids: Set<string>) {
  localStorage.setItem(LIKED_KEY, JSON.stringify([...ids]));
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}일 전`;
  return new Date(dateStr).toLocaleDateString("ko-KR");
}

function extractViralQuote(text: string): string | undefined {
  const match = text.match(/\[\[VIRAL:\s*(.+?)\]\]/);
  return match ? match[1].trim() : undefined;
}

function stripViralTag(text: string): string {
  return text
    .replace(/\n*\[\[TLDR:\s*.+?\]\]\s*/g, "")
    .replace(/\n*\[\[VIRAL:\s*.+?\]\]\s*/g, "")
    .replace(/\n*\[\[STORY:\s*.+?\]\]\s*/g, "")
    .trim();
}

export default function VerdictContent({ entry }: { entry: HallOfFameEntry }) {
  const judge = judges.find((j) => j.id === entry.judge_id);
  const accentColor = judge?.accentColor || "#00f0ff";
  const glowRgb = judge?.glowRgb || "0,240,255";

  const viralQuote = entry.viral_quote || extractViralQuote(entry.verdict);
  const cleanVerdict = stripViralTag(entry.verdict);

  // viralQuote fallback: 판결문 첫 문장
  const displayQuote = viralQuote || cleanVerdict.split(/[.!?。]\s/)[0] + ".";

  const [likes, setLikes] = useState(entry.likes);
  const [isLiked, setIsLiked] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [isSavingShareCard, setIsSavingShareCard] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [clientOrigin, setClientOrigin] = useState("");
  const [toast, setToast] = useState({ message: "", visible: false });
  const shareCardRef = useRef<HTMLDivElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setIsLiked(getLikedIds().has(entry.id));
    setCanNativeShare(typeof navigator !== "undefined" && "share" in navigator);
    setClientOrigin(window.location.origin);
  }, [entry.id]);

  const handleLike = async () => {
    const wasLiked = isLiked;
    const method = wasLiked ? "DELETE" : "POST";

    setIsLiked(!wasLiked);
    setLikes((prev) => prev + (wasLiked ? -1 : 1));

    const newLikedIds = getLikedIds();
    if (wasLiked) {
      newLikedIds.delete(entry.id);
    } else {
      newLikedIds.add(entry.id);
      setAnimating(true);
      setTimeout(() => setAnimating(false), 300);
    }
    saveLikedIds(newLikedIds);

    try {
      const res = await fetch(`/api/hall-of-fame/${entry.id}/like`, { method });
      if (!res.ok) throw new Error();
    } catch {
      setIsLiked(wasLiked);
      setLikes((prev) => prev + (wasLiked ? 1 : -1));
      const rollback = getLikedIds();
      if (wasLiked) rollback.add(entry.id);
      else rollback.delete(entry.id);
      saveLikedIds(rollback);
    }
  };

  const getShareUrl = () => {
    return `${clientOrigin}/verdict/${entry.id}`;
  };

  const showToast = (msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message: msg, visible: true });
    toastTimer.current = setTimeout(
      () => setToast((prev) => ({ ...prev, visible: false })),
      3000
    );
  };

  const handleShare = async () => {
    const shareUrl = getShareUrl();
    const title = "\uD83D\uDEA8 AI 판사의 미친 팩폭 ㅋㅋㅋ";
    const storySummaryText = entry.story.length > 50 ? entry.story.slice(0, 50) + "..." : entry.story;
    const description = `${storySummaryText} 과연 결과는? 지금 들어와서 국민 배심원 투표에 참여해 보세요!`;
    const ogImageUrl = entry.og_image_url || `${clientOrigin}/verdict/${entry.id}/opengraph-image`;

    if (typeof window !== "undefined" && window.Kakao && window.Kakao.isInitialized()) {
      try {
        window.Kakao.Share.sendDefault({
          objectType: "feed",
          content: {
            title,
            description,
            imageUrl: ogImageUrl,
            link: { mobileWebUrl: shareUrl, webUrl: shareUrl },
          },
          buttons: [
            {
              title: "\u2696\uFE0F 판결문 보러가기",
              link: { mobileWebUrl: shareUrl, webUrl: shareUrl },
            },
            {
              title: "\uD83D\uDD25 나도 재판받기",
              link: { mobileWebUrl: origin, webUrl: origin },
            },
          ],
        });
        return;
      } catch { /* fallback */ }
    }

    if (canNativeShare) {
      try {
        await navigator.share({ title, text: description, url: shareUrl });
        return;
      } catch { /* user cancelled */ }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast("링크가 복사되었습니다!");
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = shareUrl;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      showToast("링크가 복사되었습니다!");
    }
  };

  const handleSaveShareCard = async () => {
    if (!shareCardRef.current) return;
    setIsSavingShareCard(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(shareCardRef.current, {
        pixelRatio: 2,
        cacheBust: true,
      });

      if (typeof navigator !== "undefined" && "share" in navigator && navigator.canShare) {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const file = new File([blob], "neon-court-share.png", { type: "image/png" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: "전국민 고민 재판소: 네온즈 판결 결과",
          });
          return;
        }
      }

      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = "neon-court-share.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      void err;
    } finally {
      setIsSavingShareCard(false);
    }
  };

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden cyber-grid crt-overlay relative overflow-hidden">
      {/* Ambient glow effects */}
      <div
        className="fixed top-[-200px] right-1/4 w-[500px] h-[500px] rounded-full blur-[200px] pointer-events-none"
        style={{ backgroundColor: `rgba(${glowRgb}, 0.1)` }}
      />
      <div className="fixed bottom-[-150px] left-1/4 w-[400px] h-[400px] bg-neon-purple/10 rounded-full blur-[180px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-5 lg:px-10 lg:h-screen lg:flex lg:flex-col">

        {/* ===== NAV ===== */}
        <nav className="py-4 shrink-0">
          <Link
            href="/hall-of-fame"
            className="inline-flex items-center gap-2 font-[family-name:var(--font-share-tech)] text-xs text-gray-500 tracking-widest uppercase hover:text-gray-300 transition-colors"
          >
            &larr; 공개 재판소
          </Link>
        </nav>

        {/* ===== MAIN 50:50 LAYOUT ===== */}
        <div className="flex-1 flex flex-col lg:flex-row gap-8 lg:gap-10 lg:items-stretch lg:min-h-0">

          {/* ─── RIGHT on desktop / FIRST on mobile: VIRAL QUOTE + ACTIONS ─── */}
          <div className="lg:w-1/2 lg:order-2 flex flex-col items-center justify-center gap-6 py-4 lg:py-0">

            {/* Neon Sign Viral Quote */}
            <div className="w-full flex flex-col items-center text-center px-4">
              {/* Opening quote */}
              <div
                className="text-4xl lg:text-5xl leading-none mb-3 opacity-40 select-none"
                style={{ color: accentColor }}
              >
                &ldquo;
              </div>

              {/* THE QUOTE — largest element on the page */}
              <p
                className="animate-neon-sign font-[family-name:var(--font-orbitron)] font-black text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl leading-tight tracking-wide break-keep max-w-lg"
                style={{
                  color: "var(--text-primary)",
                  textShadow: `
                    0 0 10px rgba(${glowRgb}, 0.9),
                    0 0 30px rgba(${glowRgb}, 0.7),
                    0 0 60px rgba(${glowRgb}, 0.4),
                    0 0 100px rgba(${glowRgb}, 0.2)
                  `,
                }}
              >
                {displayQuote}
              </p>

              {/* Closing quote */}
              <div
                className="text-4xl lg:text-5xl leading-none mt-3 opacity-40 select-none"
                style={{ color: accentColor }}
              >
                &rdquo;
              </div>

              {/* Judge badge under quote */}
              <div
                className="mt-4 px-4 py-1.5 text-[9px] font-[family-name:var(--font-share-tech)] tracking-[0.2em] uppercase border"
                style={{
                  borderColor: `rgba(${glowRgb}, 0.4)`,
                  color: accentColor,
                  background: `rgba(${glowRgb}, 0.08)`,
                }}
              >
                {judge && <JudgeAvatar avatarUrl={judge.avatarUrl} name={judge.name} size={16} className="inline-block align-middle mr-1" />} {entry.judge_name}의 판결
              </div>
            </div>

            {/* Holo divider */}
            <div
              className="w-full max-w-xs h-px"
              style={{ background: `linear-gradient(90deg, transparent, rgba(${glowRgb}, 0.4), transparent)` }}
            />

            {/* 3 Large Action Buttons */}
            <div className="w-full max-w-xs flex flex-col gap-3">
              {/* Share */}
              <button
                onClick={handleShare}
                className="cyber-clip-btn w-full py-4 font-[family-name:var(--font-orbitron)] font-bold text-sm tracking-[0.12em] uppercase border border-neon-blue/50 text-neon-blue bg-neon-blue/5 cursor-pointer hover:bg-neon-blue/15 transition-all duration-300"
                style={{ boxShadow: "0 0 20px rgba(0,240,255,0.12), inset 0 0 20px rgba(0,240,255,0.03)" }}
              >
                <span className="flex items-center justify-center gap-2.5">
                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                  공유하기
                </span>
              </button>

              {/* Image Save */}
              {viralQuote && (
                <button
                  onClick={handleSaveShareCard}
                  disabled={isSavingShareCard}
                  className="cyber-clip-btn w-full py-4 font-[family-name:var(--font-orbitron)] font-bold text-sm tracking-[0.12em] uppercase border border-neon-pink/50 text-neon-pink bg-neon-pink/5 cursor-pointer hover:bg-neon-pink/15 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ boxShadow: "0 0 20px rgba(255,45,149,0.12), inset 0 0 20px rgba(255,45,149,0.03)" }}
                >
                  <span className="flex items-center justify-center gap-2.5">
                    {isSavingShareCard ? (
                      <>
                        <svg className="animate-spin-slow w-5 h-5" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="31.4 31.4" strokeLinecap="round" />
                        </svg>
                        저장 중...
                      </>
                    ) : (
                      <>
                        {"\uD83D\uDCF8"} 이미지 저장
                      </>
                    )}
                  </span>
                </button>
              )}

              {/* Hall of Fame */}
              <Link
                href="/hall-of-fame"
                className="cyber-clip-btn w-full py-4 font-[family-name:var(--font-orbitron)] font-bold text-sm tracking-[0.12em] uppercase transition-all duration-300 text-center block"
                style={{
                  border: "1px solid rgba(240,225,48,0.5)",
                  color: "#f0e130",
                  background: "rgba(240,225,48,0.05)",
                  boxShadow: "0 0 20px rgba(240,225,48,0.12), inset 0 0 20px rgba(240,225,48,0.03)",
                }}
              >
                <span className="flex items-center justify-center gap-2.5">
                  {"\uD83D\uDC68\u200D\u2696\uFE0F"} 국민 배심원 소집하기
                </span>
              </Link>
            </div>

            {/* Like button (compact) */}
            <button
              onClick={handleLike}
              className={`font-[family-name:var(--font-share-tech)] text-sm tracking-wider transition-all duration-300 cursor-pointer ${
                isLiked
                  ? "text-neon-pink"
                  : "text-gray-500 hover:text-neon-pink"
              }`}
            >
              <span className="flex items-center gap-2">
                <span className={`text-lg ${animating ? "like-animate" : ""}`}>
                  {isLiked ? "\u2764" : "\u2661"}
                </span>
                공감 {likes}
              </span>
            </button>
          </div>

          {/* ─── LEFT on desktop / SECOND on mobile: JUDGE + VERDICT ─── */}
          <div className="lg:w-1/2 lg:order-1 flex flex-col gap-5 lg:min-h-0 lg:overflow-hidden">

            {/* Author + Judge info */}
            <div className="flex items-center gap-4 shrink-0">
              <div className="relative">
                {/* Fire glow background */}
                <div
                  className="absolute inset-0 rounded-full blur-[40px] opacity-30"
                  style={{ background: `radial-gradient(circle, rgba(${glowRgb}, 0.8), transparent 70%)`, transform: "scale(2.5)" }}
                />
                {judge ? (
                  <JudgeAvatar avatarUrl={judge.avatarUrl} name={judge.name} size={80} glowRgb={glowRgb} className="relative animate-avatar-fire" style={{ ["--fire-color" as string]: accentColor } as React.CSSProperties} />
                ) : (
                  <span className="relative text-7xl lg:text-8xl block animate-avatar-fire" style={{ ["--fire-color" as string]: accentColor }}>
                    {"\u2696"}
                  </span>
                )}
              </div>
              <div>
                {/* Author nickname */}
                <div className="flex items-center gap-2 mb-1">
                  <span style={{ fontSize: "20px" }}>{entry.author_icon || "😎"}</span>
                  <span
                    className="font-[family-name:var(--font-share-tech)] font-bold text-sm lg:text-base tracking-wide"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {entry.author_nickname || "익명의 시민"}
                  </span>
                </div>
                {/* Judge name (smaller) */}
                <h1
                  className="font-[family-name:var(--font-orbitron)] font-bold text-xs lg:text-sm uppercase tracking-wide"
                  style={{ color: accentColor, opacity: 0.8 }}
                >
                  {entry.judge_name}의 판결
                </h1>
                <p className="font-[family-name:var(--font-share-tech)] text-[10px] text-gray-600 tracking-wider">
                  {timeAgo(entry.created_at)} &middot; VERDICT_{entry.id.slice(0, 6).toUpperCase()}
                </p>
                {/* Animated fire line under name */}
                <div
                  className="mt-2 h-[2px] w-full animate-fire-line"
                  style={{
                    backgroundImage: `linear-gradient(90deg, transparent, rgba(${glowRgb}, 0.8), ${accentColor}, rgba(${glowRgb}, 0.8), transparent)`,
                  }}
                />
              </div>
            </div>

            {/* Verdict Card — scrollable on desktop */}
            <div
              className="glass-card cyber-clip relative p-5 md:p-6 lg:flex-1 lg:overflow-y-auto lg:min-h-0"
              style={{
                boxShadow: `0 0 40px rgba(${glowRgb}, 0.1), inset 0 0 40px rgba(${glowRgb}, 0.02)`,
              }}
            >
              {/* Corner decorations */}
              <div
                className="absolute top-2 right-3 w-3 h-3 border-t border-r"
                style={{ borderColor: `rgba(${glowRgb}, 0.4)` }}
              />
              <div
                className="absolute bottom-2 left-3 w-3 h-3 border-b border-l"
                style={{ borderColor: `rgba(${glowRgb}, 0.4)` }}
              />

              {/* Story */}
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-[family-name:var(--font-orbitron)] text-[10px] text-gray-500 tracking-[0.2em] uppercase">
                    사연
                  </span>
                  <div className="flex-1 h-px bg-white/5" />
                </div>
                <p className="text-sm text-gray-400 font-[family-name:var(--font-share-tech)] leading-relaxed whitespace-pre-wrap">
                  &quot;{entry.story}&quot;
                </p>
              </div>

              {/* Evidence image */}
              {entry.image_url && (
                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-[family-name:var(--font-orbitron)] text-[10px] text-gray-500 tracking-[0.2em] uppercase">
                      증거
                    </span>
                    <div className="flex-1 h-px bg-white/5" />
                  </div>
                  <EvidenceImage
                    src={entry.image_url}
                    maxHeight={250}
                    className="border border-dark-border"
                    style={{
                      clipPath: "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))",
                    }}
                  />
                </div>
              )}

              {/* Verdict */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="font-[family-name:var(--font-orbitron)] text-[10px] tracking-[0.2em] uppercase"
                    style={{ color: accentColor }}
                  >
                    판결문
                  </span>
                  <div
                    className="flex-1 h-px"
                    style={{ background: `linear-gradient(90deg, rgba(${glowRgb}, 0.3), transparent)` }}
                  />
                </div>
                {entry.tldr && (
                  <div className="mb-3">
                    <span
                      style={{
                        display: "inline-block",
                        background: `rgba(${glowRgb}, 0.12)`,
                        border: `1px solid rgba(${glowRgb}, 0.3)`,
                        borderRadius: 99,
                        padding: "5px 16px",
                        fontWeight: 900,
                        fontSize: "15px",
                        color: accentColor,
                      }}
                    >
                      {entry.tldr}
                    </span>
                  </div>
                )}
                <div
                  className="border-l-2 pl-4 py-2"
                  style={{ borderColor: `rgba(${glowRgb}, 0.3)` }}
                >
                  <p className="text-sm text-gray-200 font-[family-name:var(--font-share-tech)] leading-relaxed whitespace-pre-wrap">
                    {cleanVerdict}
                  </p>
                </div>
              </div>
            </div>

            {/* 하단 버튼 2개 — 항소하기 + 새 재판 받기 */}
            <div className="shrink-0 flex gap-3 btn-row-wrap" style={{ flexWrap: "wrap" }}>
              <Link
                href="/"
                className="flex-1 cyber-clip-btn py-3.5 text-center font-[family-name:var(--font-orbitron)] font-bold text-xs md:text-sm tracking-[0.12em] uppercase transition-all duration-300"
                style={{
                  border: "1px solid rgba(191,90,242,0.5)",
                  color: "#bf5af2",
                  background: "rgba(191,90,242,0.05)",
                  boxShadow: "0 0 20px rgba(191,90,242,0.12), inset 0 0 20px rgba(191,90,242,0.03)",
                  minWidth: "0",
                }}
              >
                <span className="flex items-center justify-center gap-2">
                  &#x2696;&#xFE0F; 항소하기
                </span>
              </Link>
              <Link
                href="/"
                className="flex-1 cyber-clip-btn py-3.5 text-center font-[family-name:var(--font-orbitron)] font-bold text-xs md:text-sm tracking-[0.12em] uppercase transition-all duration-300"
                style={{
                  border: "1px solid rgba(48,209,88,0.5)",
                  color: "#30d158",
                  background: "rgba(48,209,88,0.05)",
                  boxShadow: "0 0 20px rgba(48,209,88,0.12), inset 0 0 20px rgba(48,209,88,0.03)",
                  minWidth: "0",
                }}
              >
                <span className="flex items-center justify-center gap-2">
                  &#x270E;&#xFE0F; 새 재판 받기
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden ShareCard for image capture */}
      {viralQuote && judge && (
        <div className="absolute opacity-0 pointer-events-none" style={{ left: "-9999px", top: 0 }}>
          <div style={{ width: "400px" }}>
            <ShareCard
              ref={shareCardRef}
              viralQuote={viralQuote}
              judgeName={entry.judge_name}
              judgeEmoji={judge.emoji}
              judgeAvatarUrl={judge.avatarUrl}
              accentColor={accentColor}
              glowRgb={glowRgb}
              storySummary={undefined}
            />
          </div>
        </div>
      )}

      <Toast message={toast.message} visible={toast.visible} />
    </div>
  );
}
