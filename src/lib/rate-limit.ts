import { NextRequest, NextResponse } from "next/server";

interface RateLimitEntry {
  timestamps: number[];
}

interface RateLimitConfig {
  /** 윈도우 크기 (밀리초) */
  windowMs: number;
  /** 윈도우 내 최대 요청 수 */
  maxRequests: number;
}

// 글로벌 인메모리 저장소 (엔드포인트별로 분리)
const stores = new Map<string, Map<string, RateLimitEntry>>();

// 오래된 엔트리 정리 주기 (5분)
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  for (const [, store] of stores) {
    for (const [key, entry] of store) {
      entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);
      if (entry.timestamps.length === 0) {
        store.delete(key);
      }
    }
  }
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Sliding window rate limiter.
 * 제한 초과 시 429 응답을 반환하고, 통과 시 null을 반환합니다.
 */
export function rateLimit(
  storeKey: string,
  config: RateLimitConfig
): (req: NextRequest) => NextResponse | null {
  if (!stores.has(storeKey)) {
    stores.set(storeKey, new Map());
  }

  return (req: NextRequest) => {
    const { windowMs, maxRequests } = config;
    const store = stores.get(storeKey)!;
    const ip = getClientIp(req);
    const now = Date.now();

    cleanup(windowMs);

    const entry = store.get(ip) || { timestamps: [] };

    // 윈도우 밖의 오래된 타임스탬프 제거
    entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

    if (entry.timestamps.length >= maxRequests) {
      const oldestInWindow = entry.timestamps[0];
      const retryAfterMs = windowMs - (now - oldestInWindow);
      const retryAfterSec = Math.ceil(retryAfterMs / 1000);

      return NextResponse.json(
        {
          error: `요청이 너무 많습니다. ${retryAfterSec}초 후에 다시 시도해주세요.`,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfterSec),
            "X-RateLimit-Limit": String(maxRequests),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(
              Math.ceil((oldestInWindow + windowMs) / 1000)
            ),
          },
        }
      );
    }

    // 요청 기록
    entry.timestamps.push(now);
    store.set(ip, entry);

    return null; // 통과
  };
}

// === 사전 정의된 rate limiter들 ===

/** /api/judge — 1분당 5회 (Gemini API 비용 보호) */
export const judgeRateLimit = rateLimit("judge", {
  windowMs: 60 * 1000,
  maxRequests: 5,
});

/** /api/hall-of-fame POST — 1분당 10회 */
export const hallOfFameWriteRateLimit = rateLimit("hall-of-fame-write", {
  windowMs: 60 * 1000,
  maxRequests: 10,
});

/** /api/hall-of-fame/[id]/like — 1분당 30회 */
export const likeRateLimit = rateLimit("like", {
  windowMs: 60 * 1000,
  maxRequests: 30,
});

/** /api/hall-of-fame/[id]/jury-vote — 1분당 30회 */
export const juryVoteRateLimit = rateLimit("jury-vote", {
  windowMs: 60 * 1000,
  maxRequests: 30,
});

/** /api/hall-of-fame GET — 1분당 60회 (DB 쿼리 남용 방지) */
export const hallOfFameReadRateLimit = rateLimit("hall-of-fame-read", {
  windowMs: 60 * 1000,
  maxRequests: 60,
});

