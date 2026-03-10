import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Orbitron, Share_Tech_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import CyberNav from "@/components/CyberNav";
import KakaoScript from "@/components/KakaoScript";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import "./globals.css";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const shareTechMono = Share_Tech_Mono({
  variable: "--font-share-tech",
  subsets: ["latin"],
  weight: "400",
});

const SITE_NAME = "전국민 고민 재판소: 네온즈";
const TITLE = "전국민 고민 재판소: 네온즈 | NEON COURT";
const DESCRIPTION =
  "고민이나 다툼 상황을 올리면 4명의 AI 판사가 판결을 내려드립니다. 저스티스 제로, 하트 비트, 사이버 렉카, 형사 네온 중 판사를 선택하세요!";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#05050e",
};

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL || "https://neon-tribunal.vercel.app"
  ),
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "AI 판사",
    "고민 상담",
    "네온즈",
    "NEON COURT",
    "AI 판결",
    "고민 재판소",
  ],
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    siteName: SITE_NAME,
    locale: "ko_KR",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "네온즈 메인 이미지",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og-image.png"],
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
  other: {
    "naver-site-verification": "",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${orbitron.variable} ${shareTechMono.variable} antialiased`}
      >
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`}
            </Script>
          </>
        )}
        <CyberNav />
        {children}
        <Analytics />
        <SpeedInsights />
        <KakaoScript />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}