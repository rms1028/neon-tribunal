import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { juryVoteRateLimit } from "@/lib/rate-limit";

type VoteType = "agree" | "disagree";

function isValidVote(v: unknown): v is VoteType {
  return v === "agree" || v === "disagree";
}

function col(vote: VoteType) {
  return vote === "agree" ? "jury_agree" : "jury_disagree";
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
    return NextResponse.json({ error: "유효하지 않은 투표입니다." }, { status: 400 });
  }

  const column = col(body.vote);

  const { data: current } = await getSupabase()
    .from("verdicts")
    .select("jury_agree, jury_disagree")
    .eq("id", id)
    .single();

  if (!current) {
    return NextResponse.json({ error: "존재하지 않는 판결입니다." }, { status: 404 });
  }

  const newValue = (current[column] ?? 0) + 1;

  const { error } = await getSupabase()
    .from("verdicts")
    .update({ [column]: newValue })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: "투표 처리에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({
    jury_agree: column === "jury_agree" ? newValue : current.jury_agree,
    jury_disagree: column === "jury_disagree" ? newValue : current.jury_disagree,
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
    return NextResponse.json({ error: "유효하지 않은 투표입니다." }, { status: 400 });
  }

  const column = col(body.vote);

  const { data: current } = await getSupabase()
    .from("verdicts")
    .select("jury_agree, jury_disagree")
    .eq("id", id)
    .single();

  if (!current) {
    return NextResponse.json({ error: "존재하지 않는 판결입니다." }, { status: 404 });
  }

  const newValue = Math.max(0, (current[column] ?? 0) - 1);

  const { error } = await getSupabase()
    .from("verdicts")
    .update({ [column]: newValue })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: "투표 취소에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({
    jury_agree: column === "jury_agree" ? newValue : current.jury_agree,
    jury_disagree: column === "jury_disagree" ? newValue : current.jury_disagree,
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

  if (!isValidVote(body.from) || !isValidVote(body.to) || body.from === body.to) {
    return NextResponse.json({ error: "유효하지 않은 투표 변경입니다." }, { status: 400 });
  }

  const fromCol = col(body.from);
  const toCol = col(body.to);

  const { data: current } = await getSupabase()
    .from("verdicts")
    .select("jury_agree, jury_disagree")
    .eq("id", id)
    .single();

  if (!current) {
    return NextResponse.json({ error: "존재하지 않는 판결입니다." }, { status: 404 });
  }

  const newFrom = Math.max(0, (current[fromCol] ?? 0) - 1);
  const newTo = (current[toCol] ?? 0) + 1;

  const { error } = await getSupabase()
    .from("verdicts")
    .update({ [fromCol]: newFrom, [toCol]: newTo })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: "투표 변경에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({
    jury_agree: fromCol === "jury_agree" ? newFrom : toCol === "jury_agree" ? newTo : current.jury_agree,
    jury_disagree: fromCol === "jury_disagree" ? newFrom : toCol === "jury_disagree" ? newTo : current.jury_disagree,
  });
}
