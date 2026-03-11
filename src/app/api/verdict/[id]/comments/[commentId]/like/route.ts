import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { commentLikeRateLimit } from "@/lib/rate-limit";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const rateLimitResponse = commentLikeRateLimit(req);
  if (rateLimitResponse) return rateLimitResponse;

  const { commentId } = await params;

  const { data, error } = await getSupabase().rpc("increment_comment_likes", {
    comment_id: commentId,
    delta: 1,
  });

  if (error) {
    return NextResponse.json(
      { error: "좋아요 처리에 실패했습니다." },
      { status: 500 }
    );
  }

  return NextResponse.json({ likes: data });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const rateLimitResponse = commentLikeRateLimit(req);
  if (rateLimitResponse) return rateLimitResponse;

  const { commentId } = await params;

  const { data, error } = await getSupabase().rpc("increment_comment_likes", {
    comment_id: commentId,
    delta: -1,
  });

  if (error) {
    return NextResponse.json(
      { error: "좋아요 취소에 실패했습니다." },
      { status: 500 }
    );
  }

  return NextResponse.json({ likes: data });
}
