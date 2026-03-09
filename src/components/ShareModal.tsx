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

const NEON_IMAGE =
  "https://images.unsplash.com/photo-1555680202-c86f0e12f086?q=80&w=1000&auto=format&fit=crop";

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

  useEffect(() => {
    setCanNativeShare(
      typeof navigator !== "undefined" && typeof navigator.share === "function"
    );
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

  const imageUrl = kakaoImageUrl || NEON_IMAGE;

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

  // ── 페이스북 ──
  const handleFacebook = () => {
    trackEvent("share_clicked", { platform: "facebook" });
    const url = encodeURIComponent(shareUrl);
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      "_blank",
      "noopener,noreferrer"
    );
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
      label: "페이스북",
      icon: (
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="white">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
      bg: "#1877F2",
      onClick: handleFacebook,
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
          background: "rgba(8, 8, 24, 0.95)",
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
                  backgroundColor: btn.bg,
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
