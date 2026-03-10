import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "전국민 고민 재판소: 네온즈",
    short_name: "네온즈",
    description:
      "고민이나 다툼 상황을 올리면 4명의 AI 판사가 판결을 내려드립니다.",
    start_url: "/",
    display: "standalone",
    background_color: "#05050e",
    theme_color: "#05050e",
    orientation: "portrait",
    categories: ["entertainment", "social"],
    lang: "ko",
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
  };
}
