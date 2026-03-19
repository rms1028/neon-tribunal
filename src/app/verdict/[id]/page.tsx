import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSupabase } from "@/lib/supabase";
import { getJudgeById } from "@/lib/judges";
import type { HallOfFameEntry } from "@/lib/types";
import VerdictContent from "./VerdictContent";
import CompactVerdictView from "./CompactVerdictView";

async function getVerdict(id: string): Promise<HallOfFameEntry | null> {
  const { data, error } = await getSupabase()
    .from("verdicts")
    .select("id, judge_id, judge_name, story, verdict, likes, jury_agree, jury_disagree, created_at, image_url, viral_quote, tldr, og_image_url, author_nickname, author_icon, category")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data as HallOfFameEntry;
}

function stripViralTag(text: string): string {
  return text.replace(/\n*\[\[VIRAL:\s*.+?\]\]\s*$/, "").trim();
}

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const entry = await getVerdict(id);

  if (!entry) {
    return { title: "판결을 찾을 수 없습니다 | NEON COURT" };
  }

  const judge = getJudgeById(entry.judge_id);
  const emoji = judge?.emoji || "⚖";
  const cleanVerdict = stripViralTag(entry.verdict);
  const verdictSummary =
    cleanVerdict.length > 100
      ? cleanVerdict.slice(0, 100) + "..."
      : cleanVerdict;

  const title = `${emoji} ${entry.judge_name}의 판결 | NEON COURT`;
  const description = `"${entry.story.length > 60 ? entry.story.slice(0, 60) + "..." : entry.story}" — ${verdictSummary}`;

  const ogImageUrl = entry.og_image_url || `/verdict/${id}/opengraph-image`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      locale: "ko_KR",
      siteName: "전국민 고민 재판소: 네온즈",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${entry.judge_name}의 판결 — NEON COURT`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function VerdictPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const entry = await getVerdict(id);

  if (!entry) notFound();

  if (sp.from === "hof") {
    return <CompactVerdictView entry={entry} />;
  }

  return <VerdictContent entry={entry} />;
}
