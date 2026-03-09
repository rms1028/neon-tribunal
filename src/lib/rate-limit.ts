<<<<<<< HEAD
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

=======
// Persistent rate limiter using Supabase RPC (REST)
// Serverless-safe: state is stored in DB, not in-memory

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0].trim()
  const realIp = req.headers.get("x-real-ip")
  if (realIp) return realIp.trim()
  return "unknown"
}

/**
 * 레이트 리밋 체크. 초과 시 429 Response 반환, 아니면 null.
 * Supabase RPC 기반 — Serverless 환경에서도 영속적으로 동작.
 * RPC 실패 시 fail-open (DB 장애가 API를 차단하지 않도록).
 */
export async function rateLimitResponse(
  req: Request,
  limit: number,
  windowMs: number,
  failClosed = false
): Promise<Response | null> {
  if (!supabaseUrl || !serviceKey) {
    return failClosed
      ? Response.json({ error: "서비스를 일시적으로 사용할 수 없습니다." }, { status: 503 })
      : null
  }

  const ip = getClientIp(req)
  const url = new URL(req.url)
  const key = `${ip}:${url.pathname}`

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/rpc/check_rate_limit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        p_key: key,
        p_limit: limit,
        p_window_ms: windowMs,
      }),
    })

    if (!res.ok) {
      console.error("[rate-limit] RPC error:", res.status)
      return failClosed
        ? Response.json({ error: "서비스를 일시적으로 사용할 수 없습니다." }, { status: 503 })
        : null
    }

    const data = await res.json()

    // 확률적 cleanup (1% 확률)
    if (Math.random() < 0.01) {
      fetch(`${supabaseUrl}/rest/v1/rpc/cleanup_rate_limits`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
      }).catch(() => {})
    }

    if (data && !data.allowed) {
      const retryAfter = data.retry_after ?? 60
      return Response.json(
        { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
        {
          status: 429,
          headers: { "Retry-After": String(retryAfter) },
        }
      )
    }

    return null
  } catch (err) {
    console.error("[rate-limit] unexpected error:", err)
    return failClosed
      ? Response.json({ error: "서비스를 일시적으로 사용할 수 없습니다." }, { status: 503 })
      : null
  }
}
>>>>>>> fa6b4c1b2ce350bb3dba5b3fd22e8596f3bbefc5
