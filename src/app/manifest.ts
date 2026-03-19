import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "전국민 고민 재판소: 네온즈",
    short_name: "네온즈",
    description:
      "고민이나 다툼 상황을 올리면 4명의 AI 판사가 판결을 내려드립니다. 사이버펑크 감성의 AI 재판소!",
    start_url: "/",
    id: "/",
    scope: "/",
    display: "standalone",
    background_color: "#05050e",
    theme_color: "#05050e",
    orientation: "portrait",
    categories: ["entertainment", "social"],
    lang: "ko",
    dir: "ltr",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
    screenshots: [
      {
        src: "/screenshots/screenshot-main.png",
        sizes: "1080x1920",
        type: "image/png",
        form_factor: "narrow",
        label: "메인 화면 - AI 판사에게 고민을 맡겨보세요",
      },
    ],
    shortcuts: [
      {
        name: "새 재판 시작",
        short_name: "재판",
        url: "/",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "명예의 전당",
        short_name: "전당",
        url: "/hall-of-fame",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "내 판결 기록",
        short_name: "기록",
        url: "/my-verdicts",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
