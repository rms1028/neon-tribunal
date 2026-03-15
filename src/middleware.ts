import { NextRequest, NextResponse } from "next/server";

/**
 * 허용 도메인 목록 (CORS).
 * 프로덕션 도메인과 로컬 개발 환경을 포함한다.
 */
const ALLOWED_ORIGINS = new Set([
  "https://neon-tribunal.vercel.app",
  "https://neons.app",
  "https://www.neons.app",
  // 개발 환경
  "http://localhost:3000",
  "http://localhost:3001",
]);

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.has(origin)) return true;
  // Vercel preview 배포 허용
  if (origin.endsWith(".vercel.app")) return true;
  return false;
}

function corsHeaders(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const origin = req.headers.get("origin");

  // ── API 라우트에만 CORS 적용 ──
  if (pathname.startsWith("/api/")) {
    // Preflight (OPTIONS)
    if (req.method === "OPTIONS") {
      if (isAllowedOrigin(origin)) {
        return new NextResponse(null, {
          status: 204,
          headers: corsHeaders(origin!),
        });
      }
      return new NextResponse(null, { status: 403 });
    }

    // 실제 요청
    const response = NextResponse.next();

    if (isAllowedOrigin(origin)) {
      const headers = corsHeaders(origin!);
      for (const [key, value] of Object.entries(headers)) {
        response.headers.set(key, value);
      }
    }

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
