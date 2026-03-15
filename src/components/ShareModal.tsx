"use client";

import { useEffect, useState } from "react";
import { trackEvent } from "@/lib/analytics";

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  shareUrl: string;
  onToast: (msg: string) => void;
  kakaoTitle: string;
  kakaoDescription: string;
  kakaoImageUrl: string;
}

const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
    return true;
  }
};

export default function ShareModal({
  open,
  onClose,
  shareUrl,
  onToast,
  kakaoTitle,
  kakaoDescription,
  kakaoImageUrl,
}: ShareModalProps) {
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setCanNativeShare(
      typeof navigator !== "undefined" && typeof navigator.share === "function"
    );
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const imageUrl = kakaoImageUrl || `${origin}/opengraph-image`;

  // ── 카카오톡 ──
  const handleKakao = async () => {
    trackEvent("share_clicked", { platform: "kakao" });
    if (
      typeof window !== "undefined" &&
      window.Kakao &&
      window.Kakao.isInitialized()
    ) {
      try {
        window.Kakao.Share.sendDefault({
          objectType: "feed",
          content: {
            title: kakaoTitle,
            description: kakaoDescription,
            imageUrl,
            link: { mobileWebUrl: shareUrl, webUrl: shareUrl },
          },
          buttons: [
            {
              title: "\uD83D\uDC68\u200D\u2696\uFE0F 배심원단 참전하기",
              link: { mobileWebUrl: shareUrl, webUrl: shareUrl },
            },
          ],
        });
        onClose();
        return;
      } catch {
        // SDK 실패 → fallback
      }
    }
    await copyToClipboard(shareUrl);
    onToast("카카오톡 SDK 준비 중입니다. 링크가 복사되었습니다!");
    onClose();
  };

  // ── X (트위터) ──
  const handleTwitter = () => {
    trackEvent("share_clicked", { platform: "twitter" });
    const text = encodeURIComponent(`${kakaoTitle}\n\n${kakaoDescription}`);
    const url = encodeURIComponent(shareUrl);
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      "_blank",
      "noopener,noreferrer"
    );
    onClose();
  };

  // ── 인스타그램 ──
  const handleInstagram = async () => {
    trackEvent("share_clicked", { platform: "instagram" });
    await copyToClipboard(shareUrl);
    onToast("링크가 복사되었습니다! 인스타그램 스토리에 붙여넣기 하세요 📋");
    window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
    onClose();
  };

  // ── 링크 복사 ──
  const handleCopyLink = async () => {
    trackEvent("share_clicked", { platform: "link_copy" });
    await copyToClipboard(shareUrl);
    onToast("\u2705 링크가 복사되었습니다!");
    onClose();
  };

  // ── 기타 앱 공유 (모바일 navigator.share) ──
  const handleNativeShare = async () => {
    trackEvent("share_clicked", { platform: "native" });
    try {
      await navigator.share({
        title: kakaoTitle,
        text: `${kakaoTitle}\n\n${kakaoDescription}`,
        url: shareUrl,
      });
    } catch {
      // 사용자 취소
    }
    onClose();
  };

  const buttons: {
    label: string;
    icon: React.ReactNode;
    bg: string;
    border?: string;
    textColor?: string;
    onClick: () => void;
    mobileOnly?: boolean;
  }[] = [
    {
      label: "카카오톡",
      icon: (
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="#3C1E1E">
          <path d="M12 3C6.48 3 2 6.58 2 10.9c0 2.78 1.86 5.22 4.65 6.6l-.95 3.47c-.08.3.25.54.52.38L10.2 18.6c.58.08 1.19.13 1.8.13 5.52 0 10-3.58 10-7.83C22 6.58 17.52 3 12 3z" />
        </svg>
      ),
      bg: "#FEE500",
      onClick: handleKakao,
    },
    {
      label: "X (트위터)",
      icon: (
        <span className="text-lg font-bold text-white leading-none">𝕏</span>
      ),
      bg: "#000000",
      border: "rgba(255,255,255,0.2)",
      onClick: handleTwitter,
    },
    {
      label: "인스타그램",
      icon: (
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="white">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.17.054 1.97.24 2.43.403a4.088 4.088 0 011.47.957c.453.453.757.91.957 1.47.163.46.349 1.26.403 2.43.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.054 1.17-.24 1.97-.403 2.43a4.088 4.088 0 01-.957 1.47 4.088 4.088 0 01-1.47.957c-.46.163-1.26.349-2.43.403-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.17-.054-1.97-.24-2.43-.403a4.088 4.088 0 01-1.47-.957 4.088 4.088 0 01-.957-1.47c-.163-.46-.349-1.26-.403-2.43C2.175 15.584 2.163 15.204 2.163 12s.012-3.584.07-4.85c.054-1.17.24-1.97.403-2.43a4.088 4.088 0 01.957-1.47A4.088 4.088 0 015.063 2.293c.46-.163 1.26-.349 2.43-.403C8.759 1.832 9.139 1.82 12 1.82V2.163zM12 0C8.741 0 8.333.014 7.053.072 5.775.131 4.903.333 4.14.63a5.876 5.876 0 00-2.126 1.384A5.876 5.876 0 00.63 4.14C.333 4.903.131 5.775.072 7.053.014 8.333 0 8.741 0 12s.014 3.667.072 4.947c.059 1.278.261 2.15.558 2.913a5.876 5.876 0 001.384 2.126A5.876 5.876 0 004.14 23.37c.763.297 1.635.499 2.913.558C8.333 23.986 8.741 24 12 24s3.667-.014 4.947-.072c1.278-.059 2.15-.261 2.913-.558a6.128 6.128 0 003.51-3.51c.297-.763.499-1.635.558-2.913.058-1.28.072-1.688.072-4.947s-.014-3.667-.072-4.947c-.059-1.278-.261-2.15-.558-2.913a5.876 5.876 0 00-1.384-2.126A5.876 5.876 0 0019.86.63C19.097.333 18.225.131 16.947.072 15.667.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
        </svg>
      ),
      bg: "linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)",
      onClick: handleInstagram,
    },
    {
      label: "링크 복사",
      icon: (
        <svg
          viewBox="0 0 24 24"
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      ),
      bg: "rgba(0,240,255,0.15)",
      textColor: "#00f0ff",
      onClick: handleCopyLink,
    },
    {
      label: "기타 앱",
      icon: (
        <svg
          viewBox="0 0 24 24"
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="1" />
          <circle cx="19" cy="12" r="1" />
          <circle cx="5" cy="12" r="1" />
        </svg>
      ),
      bg: "rgba(180,74,255,0.15)",
      textColor: "#b44aff",
      onClick: handleNativeShare,
      mobileOnly: true,
    },
  ];

  const visibleButtons = buttons.filter(
    (btn) => !btn.mobileOnly || canNativeShare
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      onClick={onClose}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-sm cyber-clip animate-modal-in"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--modal-bg)",
          border: "1px solid rgba(0, 240, 255, 0.2)",
          boxShadow:
            "0 0 40px rgba(0,240,255,0.08), inset 0 0 40px rgba(0,240,255,0.02)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm">{"\uD83D\uDCE1"}</span>
            <h3 className="font-[family-name:var(--font-orbitron)] text-[11px] font-bold tracking-[0.15em] uppercase text-gray-300">
              어디로 퍼나를까요?
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Divider */}
        <div
          className="h-px mx-5"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(0,240,255,0.25), transparent)",
          }}
        />

        {/* Share buttons grid */}
        <div className="flex items-start justify-center gap-4 px-5 py-6 flex-wrap">
          {visibleButtons.map((btn) => (
            <button
              key={btn.label}
              onClick={btn.onClick}
              className="flex flex-col items-center gap-2 group cursor-pointer"
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
                style={{
                  background: btn.bg,
                  border: btn.border ? `1px solid ${btn.border}` : undefined,
                  color: btn.textColor,
                }}
              >
                {btn.icon}
              </div>
              <span className="font-[family-name:var(--font-share-tech)] text-[10px] text-gray-500 tracking-wider group-hover:text-gray-300 transition-colors">
                {btn.label}
              </span>
            </button>
          ))}
        </div>

        {/* Corner decorations */}
        <div className="absolute top-2 right-3 w-2.5 h-2.5 border-t border-r border-neon-blue/30" />
        <div className="absolute bottom-2 left-3 w-2.5 h-2.5 border-b border-l border-neon-blue/30" />
      </div>
    </div>
  );
}
