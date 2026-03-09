<<<<<<< HEAD
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Orbitron, Share_Tech_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import CyberNav from "@/components/CyberNav";
import KakaoScript from "@/components/KakaoScript";
import "./globals.css";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
=======
import type { Metadata, Viewport } from "next"
import Link from "next/link"
import { Geist, Geist_Mono, Orbitron } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})
>>>>>>> fa6b4c1b2ce350bb3dba5b3fd22e8596f3bbefc5

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
<<<<<<< HEAD
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
    process.env.NEXT_PUBLIC_BASE_URL || "https://neon-court.vercel.app"
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
        url: "https://images.unsplash.com/photo-1555680202-c86f0e12f086?q=80&w=1200&auto=format&fit=crop",
        width: 1200,
        height: 630,
        alt: "전국민 고민 재판소: 네온즈",
=======
  weight: ["400", "700", "900"],
})

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://neon-agora.vercel.app"

export const metadata: Metadata = {
  title: "네온 아고라: 토론 광장",
  description: "사이버펑크 테마의 실시간 찬반 토론 플랫폼",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "네온 아고라",
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "네온 아고라: 토론 광장",
    description: "사이버펑크 테마의 실시간 찬반 토론 플랫폼. 찬성 vs 반대, 당신의 입장은?",
    siteName: "네온 아고라",
    type: "website",
    locale: "ko_KR",
    url: SITE_URL,
    images: [
      {
        url: `${SITE_URL}/og-default.png`,
        width: 1200,
        height: 630,
        alt: "네온 아고라 — 사이버펑크 토론 광장",
>>>>>>> fa6b4c1b2ce350bb3dba5b3fd22e8596f3bbefc5
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
<<<<<<< HEAD
    title: TITLE,
    description: DESCRIPTION,
    images: [
      "https://images.unsplash.com/photo-1555680202-c86f0e12f086?q=80&w=1200&auto=format&fit=crop",
    ],
  },
  other: {
    "naver-site-verification": "",
  },
};
=======
    title: "네온 아고라: 토론 광장",
    description: "사이버펑크 테마의 실시간 찬반 토론 플랫폼. 찬성 vs 반대, 당신의 입장은?",
    images: [`${SITE_URL}/og-default.png`],
  },
}
>>>>>>> fa6b4c1b2ce350bb3dba5b3fd22e8596f3bbefc5

export default function RootLayout({
  children,
}: Readonly<{
<<<<<<< HEAD
  children: React.ReactNode;
=======
  children: React.ReactNode
>>>>>>> fa6b4c1b2ce350bb3dba5b3fd22e8596f3bbefc5
}>) {
  return (
    <html lang="ko">
      <body
<<<<<<< HEAD
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
      </body>
    </html>
  );
=======
        className={`${geistSans.variable} ${geistMono.variable} ${orbitron.variable} antialiased pb-16 md:pb-0`}
      >
        <Providers>{children}</Providers>
        <footer className="relative border-t border-white/[0.06] bg-black px-4 py-8 text-center text-[11px] text-zinc-500 md:pb-8">
          <div className="mx-auto flex max-w-md flex-col items-center gap-3">
            <div className="flex items-center gap-3">
              <Link href="/terms" className="transition hover:text-zinc-200">이용약관</Link>
              <span className="text-zinc-700">·</span>
              <Link href="/privacy" className="transition hover:text-zinc-200">개인정보처리방침</Link>
            </div>
            <span className="text-zinc-600">&copy; {new Date().getFullYear()} 네온 아고라</span>
          </div>
        </footer>
      </body>
    </html>
  )
>>>>>>> fa6b4c1b2ce350bb3dba5b3fd22e8596f3bbefc5
}
