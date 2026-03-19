import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET() {
  try {
    // 최근 7일 인기 카테고리
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const { data: recentEntries } = await getSupabase()
      .from("verdicts")
      .select("category")
      .not("category", "is", null)
      .gte("created_at", sevenDaysAgo)
      .order("likes", { ascending: false })
      .limit(100);

    const categoryCounts: Record<string, number> = {};
    recentEntries?.forEach((row) => {
      if (row.category) {
        categoryCounts[row.category] = (categoryCounts[row.category] || 0) + 1;
      }
    });

    const trendingCategories = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cat, count]) => ({ category: cat, count }));

    // 24시간 트렌딩 키워드
    const oneDayAgo = new Date(Date.now() - 24 * 3600000).toISOString();
    let trendingKeywords: { keyword: string; count: number }[] = [];
    try {
      const { data: keywords } = await getSupabase().rpc("get_trending_keywords", {
        since: oneDayAgo,
      });
      if (keywords) {
        trendingKeywords = keywords;
      }
    } catch {
      // RPC가 아직 없을 수 있음
    }

    return NextResponse.json({ trendingCategories, trendingKeywords });
  } catch {
    return NextResponse.json({ trendingCategories: [], trendingKeywords: [] });
  }
}
