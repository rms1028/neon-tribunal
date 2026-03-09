import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { hallOfFameWriteRateLimit, hallOfFameReadRateLimit } from "@/lib/rate-limit";
import { sanitizeInput, containsProfanity, PROFANITY_ERROR_MESSAGE } from "@/lib/content-filter";
import type {
  HallOfFameSubmitRequest,
  HallOfFameListResponse,
  HallOfFameEntry,
} from "@/lib/types";

const PAGE_SIZE = 12;

export async function GET(req: NextRequest) {
  const readRateLimitResponse = hallOfFameReadRateLimit(req);
  if (readRateLimitResponse) return readRateLimitResponse;

  const { searchParams } = new URL(req.url);
  const sort = searchParams.get("sort") === "popular" ? "popular" : "newest";
  const offset = parseInt(searchParams.get("cursor") || "0", 10);
  const judge = searchParams.get("judge");

  let query = getSupabase()
    .from("verdicts")
    .select("*")
    .range(offset, offset + PAGE_SIZE);

  if (judge) {
    query = query.eq("judge_id", judge);
  }

  if (sort === "popular") {
    query = query
      .order("likes", { ascending: false })
      .order("created_at", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: "데이터를 불러오지 못했습니다." },
      { status: 500 }
    );
  }

  const entries = (data || []) as HallOfFameEntry[];
  const hasMore = entries.length > PAGE_SIZE;
  const trimmed = hasMore ? entries.slice(0, PAGE_SIZE) : entries;

  return NextResponse.json<HallOfFameListResponse>({
    entries: trimmed,
    hasMore,
  });
}

export async function POST(req: NextRequest) {
  // Rate limiting: 1분당 10회
  const rateLimitResponse = hallOfFameWriteRateLimit(req);
  if (rateLimitResponse) return rateLimitResponse;

  let body: HallOfFameSubmitRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "잘못된 요청 형식입니다." },
      { status: 400 }
    );
  }

  const { judgeId, judgeName, story, verdict, imageUrl, viralQuote } = body;

  if (!judgeId || !judgeName || !story || !verdict) {
    return NextResponse.json(
      { error: "필수 항목이 누락되었습니다." },
      { status: 400 }
    );
  }

  if (verdict.length > 5000 || story.length > 2000) {
    return NextResponse.json(
      { error: "내용이 너무 깁니다." },
      { status: 400 }
    );
  }

  const sanitizedStory = sanitizeInput(story);
  const sanitizedVerdict = sanitizeInput(verdict);

  if (containsProfanity(sanitizedStory)) {
    return NextResponse.json(
      { error: PROFANITY_ERROR_MESSAGE },
      { status: 400 }
    );
  }

  const insertData: Record<string, unknown> = {
    judge_id: sanitizeInput(judgeId),
    judge_name: sanitizeInput(judgeName).slice(0, 50),
    story: sanitizedStory.slice(0, 2000),
    verdict: sanitizedVerdict.slice(0, 5000),
    likes: 0,
  };
  if (imageUrl) {
    insertData.image_url = imageUrl;
  }
  if (viralQuote) {
    insertData.viral_quote = sanitizeInput(String(viralQuote)).slice(0, 200);
  }

  const { data, error } = await getSupabase()
    .from("verdicts")
    .insert(insertData)
    .select("id")
    .single();

  if (error) {
    console.error("Supabase insert error:", error);
    return NextResponse.json(
      { error: "등록에 실패했습니다." },
      { status: 500 }
    );
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}
