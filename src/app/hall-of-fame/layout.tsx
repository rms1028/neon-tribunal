import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "공개 재판소 | 전국민 고민 재판소: 네온즈",
  description:
    "AI 판사들의 팩폭 판결 모음! 국민 배심원으로 참여하고 투표해보세요.",
  openGraph: {
    title: "공개 재판소 | 전국민 고민 재판소: 네온즈",
    description:
      "AI 판사들의 팩폭 판결 모음! 국민 배심원으로 참여하고 투표해보세요.",
  },
  twitter: {
    title: "공개 재판소 | 전국민 고민 재판소: 네온즈",
    description:
      "AI 판사들의 팩폭 판결 모음! 국민 배심원으로 참여하고 투표해보세요.",
  },
};

export default function HallOfFameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
