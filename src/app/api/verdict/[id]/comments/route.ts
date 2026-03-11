import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { commentReadRateLimit, commentWriteRateLimit } from "@/lib/rate-limit";
import { sanitizeInput, containsProfanity, PROFANITY_ERROR_MESSAGE } from "@/lib/content-filter";

// GET — 댓글 목록 조회
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = commentReadRateLimit(req);
  if (rateLimitResponse) return rateLimitResponse;

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit")) || 20, 50);
  const offset = Math.max(Number(searchParams.get("offset")) || 0, 0);
  const sort = searchParams.get("sort") === "popular" ? "popular" : "newest";

  let query = getSupabase()
    .from("verdict_comments")
    .select("*", { count: "exact" })
    .eq("verdict_id", id);

  if (sort === "popular") {
    query = query
      .order("likes", { ascending: false })
      .order("created_at", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data, error, count } = await query.range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json(
      { error: "댓글을 불러오지 못했습니다." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    comments: data || [],
    total: count || 0,
    hasMore: (count || 0) > offset + limit,
  });
}

// POST — 댓글 작성
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = commentWriteRateLimit(req);
  if (rateLimitResponse) return rateLimitResponse;

  const { id } = await params;

  let body: {
    nickname?: unknown;
    content: unknown;
    vote_stance?: unknown;
    parent_id?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  if (typeof body.content !== "string") {
    return NextResponse.json(
      { error: "내용을 입력해주세요." },
      { status: 400 }
    );
  }

  const nickname = typeof body.nickname === "string" && body.nickname.trim()
    ? sanitizeInput(body.nickname.trim()).slice(0, 20)
    : `익명${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const content = sanitizeInput(body.content.trim());

  if (content.length < 1 || content.length > 500) {
    return NextResponse.json(
      { error: "댓글은 1~500자로 입력해주세요." },
      { status: 400 }
    );
  }

  if (containsProfanity(nickname) || containsProfanity(content)) {
    return NextResponse.json(
      { error: PROFANITY_ERROR_MESSAGE },
      { status: 400 }
    );
  }

  // vote_stance 검증
  let voteStance: string | null = null;
  if (body.vote_stance === "agree" || body.vote_stance === "disagree") {
    voteStance = body.vote_stance;
  }

  // parent_id 검증
  let parentId: string | null = null;
  if (typeof body.parent_id === "string" && body.parent_id.trim()) {
    parentId = body.parent_id.trim();
  }

  // 판결 존재 확인
  const { data: verdict } = await getSupabase()
    .from("verdicts")
    .select("id")
    .eq("id", id)
    .single();

  if (!verdict) {
    return NextResponse.json(
      { error: "존재하지 않는 판결입니다." },
      { status: 404 }
    );
  }

  const insertData: Record<string, unknown> = {
    verdict_id: id,
    nickname,
    content,
  };
  if (voteStance) insertData.vote_stance = voteStance;
  if (parentId) insertData.parent_id = parentId;

  const { data, error } = await getSupabase()
    .from("verdict_comments")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error("[verdict_comments] INSERT error:", error.message, error.code, error.details);
    return NextResponse.json(
      { error: "댓글 등록에 실패했습니다." },
      { status: 500 }
    );
  }

  return NextResponse.json({ comment: data }, { status: 201 });
}
