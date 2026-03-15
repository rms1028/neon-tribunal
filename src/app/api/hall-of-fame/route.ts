import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getSupabase } from "@/lib/supabase";
import { hallOfFameWriteRateLimit, hallOfFameReadRateLimit } from "@/lib/rate-limit";
import { sanitizeInput, containsProfanity, PROFANITY_ERROR_MESSAGE } from "@/lib/content-filter";
import { generateOgImageBuffer } from "@/lib/generate-og-image";
import { judges } from "@/lib/judges";
import { logger } from "@/lib/logger";
import type {
  HallOfFameSubmitRequest,
  HallOfFameListResponse,
  HallOfFameEntry,
} from "@/lib/types";

const VALID_JUDGE_IDS = new Set(judges.map((j) => j.id));

const PAGE_SIZE = 12;

const AUTHOR_MODIFIERS = ["재판관", "시민", "배심원", "방청객", "목격자", "변호인", "증인"];
const AUTHOR_ICONS = ["😎", "🦊", "🐱", "🎭", "🌙", "⚡", "🔥", "🎪", "🎯", "🎲"];

function generateAuthorNickname(): string {
  const mod = AUTHOR_MODIFIERS[Math.floor(Math.random() * AUTHOR_MODIFIERS.length)];
  const num = String(Math.floor(1000 + Math.random() * 9000));
  return `익명의 ${mod} #${num}`;
}

function randomAuthorIcon(): string {
  return AUTHOR_ICONS[Math.floor(Math.random() * AUTHOR_ICONS.length)];
}

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

  // Batch fetch comment counts
  const entryIds = trimmed.map((e) => e.id);
  let countMap = new Map<string, number>();
  if (entryIds.length > 0) {
    try {
      const { data: countData } = await getSupabase().rpc("get_comment_counts", {
        entry_ids: entryIds,
      });
      if (countData) {
        for (const row of countData) {
          countMap.set(row.verdict_id, Number(row.comment_count));
        }
      }
    } catch {
      // comment counts are optional, don't fail the request
    }
  }

  const enriched = trimmed.map((e) => ({
    ...e,
    comment_count: countMap.get(e.id) || 0,
  }));

  return NextResponse.json<HallOfFameListResponse>({
    entries: enriched,
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

  const { judgeId, judgeName, story, verdict, imageUrl, viralQuote, tldr } = body;

  if (!judgeId || !judgeName || !story || !verdict) {
    return NextResponse.json(
      { error: "필수 항목이 누락되었습니다." },
      { status: 400 }
    );
  }

  if (!VALID_JUDGE_IDS.has(judgeId)) {
    return NextResponse.json(
      { error: "유효하지 않은 판사입니다." },
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

  const deleteToken = crypto.randomBytes(16).toString("hex");

  const insertData: Record<string, unknown> = {
    judge_id: sanitizeInput(judgeId),
    judge_name: sanitizeInput(judgeName).slice(0, 50),
    story: sanitizedStory.slice(0, 2000),
    verdict: sanitizedVerdict.slice(0, 5000),
    likes: 0,
    delete_token: deleteToken,
    author_nickname: generateAuthorNickname(),
    author_icon: randomAuthorIcon(),
  };
  if (imageUrl && typeof imageUrl === "string") {
    try {
      const parsed = new URL(imageUrl);
      if (parsed.protocol === "https:") {
        insertData.image_url = imageUrl.slice(0, 2000);
      }
    } catch {
      // 잘못된 URL은 무시
    }
  }
  if (viralQuote) {
    insertData.viral_quote = sanitizeInput(String(viralQuote)).slice(0, 200);
  }
  if (tldr) {
    insertData.tldr = sanitizeInput(String(tldr)).slice(0, 100);
  }

  const { data, error } = await getSupabase()
    .from("verdicts")
    .insert(insertData)
    .select("id")
    .single();

  if (error) {
    logger.error("Supabase insert error", { error: error.message, code: error.code });
    return NextResponse.json(
      { error: "등록에 실패했습니다." },
      { status: 500 }
    );
  }

  // Generate and upload OG image (non-blocking, don't fail the request)
  const verdictId = data.id as string;
  try {
    const imgBuffer = await generateOgImageBuffer({
      judgeId: insertData.judge_id as string,
      judgeName: insertData.judge_name as string,
      story: insertData.story as string,
      verdict: insertData.verdict as string,
      likes: 0,
    });

    const filePath = `og/${verdictId}.png`;
    const { error: uploadError } = await getSupabase()
      .storage.from("og-images")
      .upload(filePath, imgBuffer, {
        contentType: "image/png",
        upsert: true,
      });

    if (!uploadError) {
      const { data: urlData } = getSupabase()
        .storage.from("og-images")
        .getPublicUrl(filePath);

      if (urlData?.publicUrl) {
        await getSupabase()
          .from("verdicts")
          .update({ og_image_url: urlData.publicUrl })
          .eq("id", verdictId);
      }
    }
  } catch {
    // OG image generation failed, but verdict was saved successfully
  }

  return NextResponse.json({ id: verdictId, deleteToken }, { status: 201 });
}

// DELETE — 본인 사연 삭제
export async function DELETE(req: NextRequest) {
  const rateLimitResponse = hallOfFameWriteRateLimit(req);
  if (rateLimitResponse) return rateLimitResponse;

  let body: { id: string; deleteToken: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const { id, deleteToken } = body;
  if (!id) {
    return NextResponse.json({ error: "필수 항목이 누락되었습니다." }, { status: 400 });
  }

  // Verify token matches
  const { data: verdict } = await getSupabase()
    .from("verdicts")
    .select("id, delete_token")
    .eq("id", id)
    .single();

  if (!verdict) {
    return NextResponse.json({ error: "존재하지 않는 판결입니다." }, { status: 404 });
  }

  // 삭제 토큰 검증: 반드시 일치해야 함
  if (!deleteToken || !verdict.delete_token || verdict.delete_token !== deleteToken) {
    return NextResponse.json({ error: "삭제 권한이 없습니다." }, { status: 403 });
  }

  // Delete comments first, then verdict
  await getSupabase().from("verdict_comments").delete().eq("verdict_id", id);
  const { error } = await getSupabase().from("verdicts").delete().eq("id", id);

  if (error) {
    logger.error("Supabase delete error", { error: error.message, code: error.code });
    return NextResponse.json({ error: "삭제에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
