"use client";

import { forwardRef } from "react";

interface ShareCardProps {
  viralQuote: string;
  judgeName: string;
  judgeEmoji: string;
  judgeAvatarUrl?: string;
  accentColor: string;
  glowRgb: string;
  storySummary?: string;
}

/**
 * ShareCard – 1:1 정사각형 이중 구조 contextual 카드
 *
 * 구조: 로고 → 판사 아바타 → 사연 패널 → 판결 패널 → 브랜딩
 * 핵심: 외부 컨테이너(aspect-square) + 내부 flex-col (absolute inset-0)
 * html-to-image(toPng)에 explicit width:480, height:480 전달하여 렌더 보장.
 */
const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(
  ({ viralQuote, judgeName, judgeEmoji, judgeAvatarUrl, accentColor, glowRgb, storySummary }, ref) => {
    return (
      <div
        ref={ref}
        className="aspect-square"
        style={{
          position: "relative",
          width: "100%",
          overflow: "hidden",
          background: "linear-gradient(160deg, #0a0a1a 0%, #0d0618 30%, #0a0a1a 60%, #060612 100%)",
          fontFamily: "'Orbitron', 'Share Tech Mono', monospace, sans-serif",
        }}
      >
        {/* ── BG: Grid ── */}
        <div
          style={{
            position: "absolute", inset: 0, opacity: 0.06,
            backgroundImage: `linear-gradient(rgba(${glowRgb},0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(${glowRgb},0.5) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />

        {/* ── BG: Glow blobs ── */}
        <div style={{ position: "absolute", top: 0, left: 0, width: "50%", height: "35%", borderRadius: "50%", filter: "blur(70px)", opacity: 0.18, background: "radial-gradient(circle, rgba(255,80,20,0.7), transparent 70%)" }} />
        <div style={{ position: "absolute", top: "30%", left: "10%", width: "80%", height: "40%", borderRadius: "50%", filter: "blur(80px)", opacity: 0.15, background: `radial-gradient(circle, rgba(${glowRgb},0.8), transparent 70%)` }} />
        <div style={{ position: "absolute", bottom: 0, right: 0, width: "50%", height: "30%", borderRadius: "50%", filter: "blur(70px)", opacity: 0.12, background: "radial-gradient(circle, rgba(180,74,255,0.6), transparent 70%)" }} />

        {/* ── BG: Corner brackets ── */}
        <div style={{ position: "absolute", top: 12, left: 12, width: 18, height: 18, borderTop: `2px solid rgba(${glowRgb},0.45)`, borderLeft: `2px solid rgba(${glowRgb},0.45)` }} />
        <div style={{ position: "absolute", top: 12, right: 12, width: 18, height: 18, borderTop: `2px solid rgba(${glowRgb},0.45)`, borderRight: `2px solid rgba(${glowRgb},0.45)` }} />
        <div style={{ position: "absolute", bottom: 12, left: 12, width: 18, height: 18, borderBottom: `2px solid rgba(${glowRgb},0.45)`, borderLeft: `2px solid rgba(${glowRgb},0.45)` }} />
        <div style={{ position: "absolute", bottom: 12, right: 12, width: 18, height: 18, borderBottom: `2px solid rgba(${glowRgb},0.45)`, borderRight: `2px solid rgba(${glowRgb},0.45)` }} />

        {/* ── BG: Scanlines ── */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" as const, opacity: 0.03, backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)" }} />

        {/* ══════════ CONTENT (flex-col centered) ══════════ */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px 24px",
            gap: 8,
          }}
        >
          {/* 1) NEON COURT 로고 */}
          <span style={{
            fontSize: 10,
            fontWeight: 900,
            letterSpacing: "0.3em",
            textTransform: "uppercase" as const,
            color: "#fff",
            textShadow: "0 0 6px rgba(0,240,255,0.5), 0 0 14px rgba(0,240,255,0.25)",
            flexShrink: 0,
          }}>
            NEON COURT
          </span>

          {/* 2) 판사 아바타 + 이름 */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flexShrink: 0 }}>
            <div style={{ position: "relative", display: "inline-block" }}>
              {/* Fire aura */}
              <div style={{ position: "absolute", top: "50%", left: "50%", width: 64, height: 64, marginTop: -32, marginLeft: -32, borderRadius: "50%", filter: "blur(14px)", opacity: 0.55, background: `radial-gradient(circle, rgba(${glowRgb},0.9), rgba(255,80,20,0.5), transparent 70%)` }} />
              {judgeAvatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={judgeAvatarUrl}
                  alt={judgeName}
                  style={{
                    position: "relative",
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    objectFit: "cover",
                    filter: `drop-shadow(0 0 10px rgba(${glowRgb},0.8)) drop-shadow(0 0 20px rgba(${glowRgb},0.4))`,
                  }}
                />
              ) : (
                <div style={{ position: "relative", fontSize: 32, lineHeight: 1, filter: `drop-shadow(0 0 10px rgba(${glowRgb},0.8)) drop-shadow(0 0 20px rgba(${glowRgb},0.4))` }}>
                  {judgeEmoji}
                </div>
              )}
            </div>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase" as const, color: accentColor }}>
              {judgeName}
            </span>
          </div>

          {/* 3) 사연 패널 */}
          {storySummary && (
            <div style={{ width: "100%", flexShrink: 0 }}>
              {/* Top scanline */}
              <div style={{ height: 1, width: "100%", marginBottom: 6, background: `linear-gradient(90deg, transparent, rgba(255,100,20,0.5), rgba(${glowRgb},0.6), rgba(255,100,20,0.5), transparent)` }} />
              <div style={{ position: "relative", padding: "6px 10px", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ position: "absolute", inset: 0, opacity: 0.07, background: `linear-gradient(135deg, rgba(255,80,20,0.6), rgba(${glowRgb},0.3), rgba(255,80,20,0.6))`, borderRadius: 4 }} />
                <div style={{ position: "relative" }}>
                  <span style={{ display: "block", fontSize: 8, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase" as const, color: "rgba(255,160,60,0.75)", marginBottom: 2 }}>
                    &#x2696;&#xFE0F; 사연
                  </span>
                  <p style={{
                    fontSize: 10,
                    letterSpacing: "0.03em",
                    lineHeight: 1.45,
                    color: "rgba(255,200,150,0.85)",
                    textShadow: "0 0 6px rgba(255,100,20,0.25)",
                    margin: 0,
                    wordBreak: "keep-all" as const,
                    overflowWrap: "break-word" as const,
                  }}>
                    &ldquo;{storySummary}&rdquo;
                  </p>
                </div>
              </div>
              {/* Bottom scanline */}
              <div style={{ height: 1, width: "100%", marginTop: 6, background: `linear-gradient(90deg, transparent, rgba(${glowRgb},0.6), rgba(255,100,20,0.5), rgba(${glowRgb},0.6), transparent)` }} />
            </div>
          )}

          {/* 4) 판결 (ROAST) — 메인 영역 */}
          <div
            style={{
              width: "100%",
              flex: "1 1 0%",
              minHeight: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            {/* Fire underlay behind verdict */}
            <div style={{ position: "absolute", inset: 0, borderRadius: 8, opacity: 0.06, background: `radial-gradient(ellipse at center, rgba(${glowRgb},0.9), rgba(255,60,10,0.5), transparent 80%)` }} />

            <div style={{ position: "relative", textAlign: "center", width: "100%", padding: "0 4px" }}>
              {/* Open quote */}
              <div style={{ fontSize: 20, lineHeight: 1, opacity: 0.35, color: accentColor, marginBottom: 4 }}>
                &#x201C;
              </div>

              {/* ★ THE ROAST ★ */}
              <p
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  lineHeight: 1.55,
                  letterSpacing: "0.03em",
                  color: "#ffffff",
                  margin: "0 auto",
                  maxWidth: "96%",
                  wordBreak: "keep-all" as const,
                  overflowWrap: "break-word" as const,
                  textShadow: `0 0 8px rgba(${glowRgb},1), 0 0 20px rgba(${glowRgb},0.85), 0 0 40px rgba(${glowRgb},0.5), 0 0 60px rgba(${glowRgb},0.25)`,
                }}
              >
                {viralQuote}
              </p>

              {/* Close quote */}
              <div style={{ fontSize: 20, lineHeight: 1, opacity: 0.35, color: accentColor, marginTop: 4 }}>
                &#x201D;
              </div>
            </div>
          </div>

          {/* 5) 하단 브랜딩 */}
          <div style={{ flexShrink: 0, textAlign: "center", width: "100%" }}>
            <div style={{ height: 1, width: "60%", margin: "0 auto 4px", background: `linear-gradient(90deg, transparent, rgba(${glowRgb},0.25), transparent)` }} />
            <span style={{ fontSize: 7, letterSpacing: "0.14em", color: "#6b7280" }}>
              전국민 고민 재판소: 네온즈
            </span>
          </div>
        </div>
      </div>
    );
  }
);

ShareCard.displayName = "ShareCard";

export default ShareCard;
