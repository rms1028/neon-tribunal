"use client";

import Script from "next/script";

const KAKAO_KEY = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;

export default function KakaoScript() {
  if (!KAKAO_KEY) return null;

  return (
    <Script
      src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js"
      strategy="afterInteractive"
      onLoad={() => {
        if (window.Kakao && !window.Kakao.isInitialized()) {
          window.Kakao.init(KAKAO_KEY);
        }
      }}
    />
  );
}
