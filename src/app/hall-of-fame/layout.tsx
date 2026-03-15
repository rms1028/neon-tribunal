import type { Metadata } from "next";
import Script from "next/script";

const TITLE = "공개 재판소 — AI 판결에 투표하고 배심원이 되세요 | 네온즈";
const DESCRIPTION =
  "4명의 AI 판사가 내리는 판결, 당신은 동의하시나요? 네온즈에서 다양한 사연을 읽고 배심원으로 참여하세요. 🔥 불타는 사연과 판결을 확인해보세요!";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "AI 판결",
    "공개 재판소",
    "네온즈",
    "배심원 투표",
    "AI 판사",
    "고민 상담",
    "사연 판결",
    "NEON COURT",
  ],
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    locale: "ko_KR",
    siteName: "NEONS",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "네온즈 공개재판소",
  description: DESCRIPTION,
  url: "https://neon-tribunal.vercel.app/hall-of-fame",
  applicationCategory: "EntertainmentApplication",
  operatingSystem: "Web",
  inLanguage: "ko",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "KRW",
  },
};

export default function HallOfFameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Script
        id="hall-of-fame-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        strategy="afterInteractive"
      />
      {children}
    </>
  );
}
