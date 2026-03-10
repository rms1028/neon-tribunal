import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { juryVoteRateLimit } from "@/lib/rate-limit";

type VoteType = "agree" | "disagree";

function isValidVote(v: unknown): v is VoteType {
  return v === "agree" || v === "disagree";
}

async function atomicVote(
  id: string,
  agreeDelta: number,
  disagreeDelta: number
) {
  return getSupabase().rpc("update_jury_votes", {
    row_id: id,
    agree_delta: agreeDelta,
    disagree_delta: disagreeDelta,
  });
}

// POST — 새 투표
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = juryVoteRateLimit(req);
  if (rateLimitResponse) return rateLimitResponse;

  const { id } = await params;
  let body: { vote: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  if (!isValidVote(body.vote)) {
    return NextResponse.json(
      { error: "유효하지 않은 투표입니다." },
      { status: 400 }
    );
  }

  const agreeDelta = body.vote === "agree" ? 1 : 0;
  const disagreeDelta = body.vote === "disagree" ? 1 : 0;

  const { data, error } = await atomicVote(id, agreeDelta, disagreeDelta);

  if (error) {
    const status = error.code === "PGRST116" ? 404 : 500;
    const msg =
      status === 404
        ? "존재하지 않는 판결입니다."
        : "투표 처리에 실패했습니다.";
    return NextResponse.json({ error: msg }, { status });
  }

  const row = Array.isArray(data) ? data[0] : data;
  return NextResponse.json({
    jury_agree: row.jury_agree,
    jury_disagree: row.jury_disagree,
  });
}

// DELETE — 투표 취소
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = juryVoteRateLimit(req);
  if (rateLimitResponse) return rateLimitResponse;

  const { id } = await params;
  let body: { vote: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  if (!isValidVote(body.vote)) {
    return NextResponse.json(
      { error: "유효하지 않은 투표입니다." },
      { status: 400 }
    );
  }

  const agreeDelta = body.vote === "agree" ? -1 : 0;
  const disagreeDelta = body.vote === "disagree" ? -1 : 0;

  const { data, error } = await atomicVote(id, agreeDelta, disagreeDelta);

  if (error) {
    const status = error.code === "PGRST116" ? 404 : 500;
    const msg =
      status === 404
        ? "존재하지 않는 판결입니다."
        : "투표 취소에 실패했습니다.";
    return NextResponse.json({ error: msg }, { status });
  }

  const row = Array.isArray(data) ? data[0] : data;
  return NextResponse.json({
    jury_agree: row.jury_agree,
    jury_disagree: row.jury_disagree,
  });
}

// PATCH — 투표 변경 (찬성↔반대)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = juryVoteRateLimit(req);
  if (rateLimitResponse) return rateLimitResponse;

  const { id } = await params;
  let body: { from: unknown; to: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  if (
    !isValidVote(body.from) ||
    !isValidVote(body.to) ||
    body.from === body.to
  ) {
    return NextResponse.json(
      { error: "유효하지 않은 투표 변경입니다." },
      { status: 400 }
    );
  }

  const agreeDelta =
    body.to === "agree" ? 1 : body.from === "agree" ? -1 : 0;
  const disagreeDelta =
    body.to === "disagree" ? 1 : body.from === "disagree" ? -1 : 0;

  const { data, error } = await atomicVote(id, agreeDelta, disagreeDelta);

  if (error) {
    const status = error.code === "PGRST116" ? 404 : 500;
    const msg =
      status === 404
        ? "존재하지 않는 판결입니다."
        : "투표 변경에 실패했습니다.";
    return NextResponse.json({ error: msg }, { status });
  }

  const row = Array.isArray(data) ? data[0] : data;
  return NextResponse.json({
    jury_agree: row.jury_agree,
    jury_disagree: row.jury_disagree,
  });
}
