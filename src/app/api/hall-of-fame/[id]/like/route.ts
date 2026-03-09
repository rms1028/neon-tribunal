import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { likeRateLimit } from "@/lib/rate-limit";
import type { HallOfFameLikeResponse } from "@/lib/types";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rate limiting: 1분당 30회
  const rateLimitResponse = likeRateLimit(_req);
  if (rateLimitResponse) return rateLimitResponse;

  const { id } = await params;

  const { data: current } = await getSupabase()
    .from("verdicts")
    .select("likes")
    .eq("id", id)
    .single();

  if (!current) {
    return NextResponse.json(
      { error: "존재하지 않는 판결입니다." },
      { status: 404 }
    );
  }

  const newLikes = current.likes + 1;

  const { error } = await getSupabase()
    .from("verdicts")
    .update({ likes: newLikes })
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: "좋아요 처리에 실패했습니다." },
      { status: 500 }
    );
  }

  return NextResponse.json<HallOfFameLikeResponse>({ likes: newLikes });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rate limiting: 1분당 30회 (좋아요와 공유)
  const rateLimitResponse = likeRateLimit(_req);
  if (rateLimitResponse) return rateLimitResponse;

  const { id } = await params;

  const { data: current } = await getSupabase()
    .from("verdicts")
    .select("likes")
    .eq("id", id)
    .single();

  if (!current) {
    return NextResponse.json(
      { error: "존재하지 않는 판결입니다." },
      { status: 404 }
    );
  }

  const newLikes = Math.max(0, current.likes - 1);

  const { error } = await getSupabase()
    .from("verdicts")
    .update({ likes: newLikes })
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: "좋아요 취소에 실패했습니다." },
      { status: 500 }
    );
  }

  return NextResponse.json<HallOfFameLikeResponse>({ likes: newLikes });
}
