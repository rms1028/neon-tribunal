import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { searchLogRateLimit } from "@/lib/rate-limit";
import { sanitizeInput } from "@/lib/content-filter";

export async function POST(req: NextRequest) {
  const rateLimitResponse = searchLogRateLimit(req);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await req.json();
    const keyword = sanitizeInput(String(body.keyword || "").trim()).slice(0, 50);
    if (keyword.length < 2) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    await getSupabase().from("search_keywords").insert({ keyword });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
