import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { likeRateLimit } from "@/lib/rate-limit";
import type { HallOfFameLikeResponse } from "@/lib/types";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = likeRateLimit(_req);
  if (rateLimitResponse) return rateLimitResponse;

  const { id } = await params;

  const { data, error } = await getSupabase().rpc("increment_likes", {
    row_id: id,
    delta: 1,
  });

  if (error) {
    const status = error.code === "PGRST116" ? 404 : 500;
    const msg =
      status === 404
        ? "존재하지 않는 판결입니다."
        : "좋아요 처리에 실패했습니다.";
    return NextResponse.json({ error: msg }, { status });
  }

  return NextResponse.json<HallOfFameLikeResponse>({ likes: data });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = likeRateLimit(_req);
  if (rateLimitResponse) return rateLimitResponse;

  const { id } = await params;

  const { data, error } = await getSupabase().rpc("increment_likes", {
    row_id: id,
    delta: -1,
  });

  if (error) {
    const status = error.code === "PGRST116" ? 404 : 500;
    const msg =
      status === 404
        ? "존재하지 않는 판결입니다."
        : "좋아요 취소에 실패했습니다.";
    return NextResponse.json({ error: msg }, { status });
  }

  return NextResponse.json<HallOfFameLikeResponse>({ likes: data });
}
