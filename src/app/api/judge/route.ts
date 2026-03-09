<<<<<<< HEAD
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, Part } from "@google/generative-ai";
import { getJudgeById } from "@/lib/judges";
import { getSupabase } from "@/lib/supabase";
import { judgeRateLimit } from "@/lib/rate-limit";
import { sanitizeInput, containsProfanity, PROFANITY_ERROR_MESSAGE } from "@/lib/content-filter";
import type { JudgeErrorResponse } from "@/lib/types";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

/** 이미지 최대 크기: 5MB (base64 인코딩 시 ~6.67MB) */
const MAX_IMAGE_BASE64_LENGTH = Math.ceil((5 * 1024 * 1024) / 3) * 4;
/** 요청 바디 최대 크기: 약 8MB */
const MAX_BODY_SIZE = 8 * 1024 * 1024;

function jsonError(error: string, status: number) {
  return NextResponse.json<JudgeErrorResponse>({ error }, { status });
}

export async function POST(req: NextRequest) {
  // Rate limiting: 1분당 5회
  const rateLimitResponse = judgeRateLimit(req);
  if (rateLimitResponse) return rateLimitResponse;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return jsonError("API 키가 설정되지 않았습니다. 서버 관리자에게 문의하세요.", 500);
  }

  // 요청 바디 크기 체크
  const contentLength = req.headers.get("content-length");
  if (contentLength && parseInt(contentLength) > MAX_BODY_SIZE) {
    return jsonError("요청 크기가 너무 큽니다. (최대 8MB)", 413);
  }

  let body: {
    story: string;
    judgeId: string;
    image?: { base64: string; mimeType: string };
    appealReason?: string;
    originalVerdict?: string;
  };
  try {
    body = await req.json();
  } catch {
    return jsonError("잘못된 요청 형식입니다.", 400);
  }

  const { story, judgeId, image, appealReason, originalVerdict } = body;

  if (!story || typeof story !== "string") {
    return jsonError("사연을 입력해주세요.", 400);
  }

  const trimmed = sanitizeInput(story.trim());
  if (trimmed.length < 10) {
    return jsonError("사연은 최소 10자 이상 입력해주세요.", 400);
  }
  if (trimmed.length > 2000) {
    return jsonError("사연은 2000자 이하로 입력해주세요.", 400);
  }

  if (containsProfanity(trimmed)) {
    return jsonError(PROFANITY_ERROR_MESSAGE, 400);
  }

  const judge = getJudgeById(judgeId);
  if (!judge) {
    return jsonError("존재하지 않는 판사입니다.", 400);
  }

  if (image) {
    if (!image.base64 || !image.mimeType) {
      return jsonError("이미지 형식이 올바르지 않습니다.", 400);
    }
    if (!ALLOWED_MIME_TYPES.includes(image.mimeType)) {
      return jsonError("지원하지 않는 이미지 형식입니다. (JPG, PNG, WebP, GIF만 가능)", 400);
    }
    if (image.base64.length > MAX_IMAGE_BASE64_LENGTH) {
      return jsonError("이미지 크기는 5MB 이하만 가능합니다.", 413);
    }
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const parts: Part[] = [];
        const isAppeal = appealReason && originalVerdict;
        let promptText: string;

        if (isAppeal) {
          promptText = `${judge.systemPrompt}\n\n---\n\n[⚖️ 2심 항소 재판]\n\n사용자의 원래 사연:\n${trimmed}\n\n1심 판결 내용:\n${originalVerdict}\n\n1심 판결에 대한 사용자의 변명/항소 이유:\n${appealReason}\n\n위 내용을 바탕으로 2심 판결을 내려주세요. 사용자의 변명이 타당한지 날카롭게 분석하고, 변명의 허점을 찔러가며 더욱 강력하게 팩폭하는 2심 판결을 내려주세요. 1심보다 더 날카롭고 구체적으로 판결해주세요.`;
        } else if (image) {
          promptText = `${judge.systemPrompt}\n\n---\n\n다음 사연에 대해 판결을 내려주세요. 첨부된 증거 사진도 함께 분석하여 판결에 반영하세요:\n\n${trimmed}`;
        } else {
          promptText = `${judge.systemPrompt}\n\n---\n\n다음 사연에 대해 판결을 내려주세요:\n\n${trimmed}`;
        }

        parts.push({ text: promptText });

        if (image) {
          parts.push({
            inlineData: {
              mimeType: image.mimeType,
              data: image.base64,
            },
          });
        }

        const result = await model.generateContentStream({
          contents: [{ role: "user", parts }],
        });

        let fullText = "";
        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            fullText += text;
            send({ type: "chunk", text });
          }
        }

        // Extract viral_quote and story_summary from accumulated text
        const viralMatch = fullText.match(/\[\[VIRAL:\s*(.+?)\]\]/);
        const viralQuote = viralMatch ? viralMatch[1].trim() : undefined;
        const storyMatch = fullText.match(/\[\[STORY:\s*(.+?)\]\]/);
        const storySummary = storyMatch ? storyMatch[1].trim() : undefined;

        // Upload image to Supabase Storage after streaming completes
        let imageUrl: string | undefined;
        if (image) {
          try {
            const supabase = getSupabase();
            const ext = image.mimeType.split("/")[1] || "jpg";
            const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

            const buffer = Buffer.from(image.base64, "base64");
            const { error: uploadError } = await supabase.storage
              .from("evidence")
              .upload(fileName, buffer, {
                contentType: image.mimeType,
              });

            if (!uploadError) {
              const { data: urlData } = supabase.storage
                .from("evidence")
                .getPublicUrl(fileName);
              imageUrl = urlData.publicUrl;
            }
          } catch {
            // Storage upload failed, continue without image URL
          }
        }

        send({
          type: "done",
          judgeId: judge.id,
          judgeName: judge.name,
          imageUrl,
          viralQuote,
          storySummary,
        });
      } catch (err) {
        console.error("Gemini API error:", err);
        send({ type: "error", error: "AI 판결 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
=======
import { rateLimitResponse } from "@/lib/rate-limit"
import { callGemini, extractJson } from "@/lib/gemini"
import { authenticateUser } from "@/lib/auth-guard"
import { supabaseAdmin } from "@/lib/supabase-admin"

export const maxDuration = 60

const MIN_COMMENTS_PER_SIDE = 3
const EARLY_VOTE_THRESHOLD = 10

export type JudgeResult = {
  pro_summary: string
  con_summary: string
  winner: "pro" | "con" | "draw"
  verdict_reason: string
  pro_score: number
  con_score: number
  judged_at: string
}

export async function POST(req: Request) {
  try {
    const limited = await rateLimitResponse(req, 5, 60000)
    if (limited) return limited

    const { threadId } = await req.json()
    if (!threadId || typeof threadId !== "string") {
      return Response.json({ error: "threadId가 필요합니다." }, { status: 400 })
    }

    // ① 인증 (시스템 키 or 로그인 유저)
    const systemKey = req.headers.get("X-System-Key")
    const isSystem = systemKey === process.env.CRON_SECRET && !!systemKey

    if (!isSystem) {
      const auth = await authenticateUser(req)
      if ("error" in auth) return auth.error
    }

    // ② 토론 데이터 로드
    const { data: thread } = await supabaseAdmin
      .from("threads")
      .select("id, title, content, ai_verdict, is_closed")
      .eq("id", threadId)
      .maybeSingle()

    if (!thread) {
      return Response.json({ error: "토론을 찾을 수 없습니다." }, { status: 404 })
    }

    // ③ 중복 판결 방지
    if (thread.ai_verdict) {
      return Response.json(
        { error: "이미 판결이 완료된 토론입니다." },
        { status: 409 }
      )
    }

    // ④ 댓글 수집 + 조건 확인
    const { data: comments } = await supabaseAdmin
      .from("comments")
      .select("content, side")
      .eq("thread_id", threadId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .limit(60)

    const proComments = (comments ?? []).filter((c) => c.side === "pro")
    const conComments = (comments ?? []).filter((c) => c.side === "con")

    if (proComments.length < MIN_COMMENTS_PER_SIDE || conComments.length < MIN_COMMENTS_PER_SIDE) {
      return Response.json(
        { error: `양측 각각 ${MIN_COMMENTS_PER_SIDE}개 이상의 의견이 필요합니다.` },
        { status: 400 }
      )
    }

    // ⑤ 트리거 조건: 마감 OR 조기 투표 충족
    if (!thread.is_closed) {
      const { count } = await supabaseAdmin
        .from("judge_early_votes")
        .select("id", { count: "exact", head: true })
        .eq("thread_id", threadId)

      if ((count ?? 0) < EARLY_VOTE_THRESHOLD) {
        return Response.json(
          { error: "토론이 마감되거나 조기 판결 투표가 충족되어야 합니다." },
          { status: 403 }
        )
      }
    }

    // ⑥ 프롬프트 구성
    const fmtList = (list: { content: string }[]) =>
      list.length > 0
        ? list.map((c, i) => `[${i + 1}] ${c.content}`).join("\n")
        : "(댓글 없음)"

    const userPrompt = `다음 토론을 분석하여 판결을 내려주세요.

## 토론 제목
${thread.title}

## 토론 본문
${thread.content || "(본문 없음)"}

## 찬성 측 댓글 (${proComments.length}개)
${fmtList(proComments)}

## 반대 측 댓글 (${conComments.length}개)
${fmtList(conComments)}

각 진영의 논리 강도를 평가하고 더 설득력 있는 쪽의 손을 들어주세요.`

    const systemPrompt = `당신은 '네온 아고라'의 AI 사이버 판사입니다. 편향 없이 논리와 근거의 질을 평가합니다.
반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 절대 포함하지 마세요.

{
  "pro_summary": "찬성 측 핵심 논리 요약 (2-3문장, 한국어)",
  "con_summary": "반대 측 핵심 논리 요약 (2-3문장, 한국어)",
  "winner": "pro 또는 con 또는 draw",
  "verdict_reason": "최종 판결 이유 (3-4문장. 어느 쪽의 논리가 왜 더 설득력 있는지 명확하게, 한국어)",
  "pro_score": 찬성 측 논리 점수 (0~100 정수),
  "con_score": 반대 측 논리 점수 (0~100 정수)
}`

    // ⑦ Gemini API 호출
    const aiResult = await callGemini({
      systemPrompt,
      userPrompt,
      temperature: 0.7,
      maxOutputTokens: 65536,
    })

    if ("error" in aiResult) {
      console.error("[CyberJudge] Gemini error:", aiResult.error)
      return Response.json({ error: aiResult.error }, { status: aiResult.status })
    }

    // ⑧ 응답 파싱
    const parsed = extractJson<Partial<JudgeResult>>(aiResult.text)
    if (!parsed) {
      return Response.json({ error: "AI 응답을 파싱할 수 없습니다." }, { status: 500 })
    }

    const winner: "pro" | "con" | "draw" = ["pro", "con", "draw"].includes(parsed.winner ?? "")
      ? (parsed.winner as "pro" | "con" | "draw")
      : "draw"
    const proScore = Math.max(0, Math.min(100, Math.round(Number(parsed.pro_score) || 50)))
    const conScore = Math.max(0, Math.min(100, Math.round(Number(parsed.con_score) || 50)))

    const judgeResult: JudgeResult = {
      pro_summary: String(parsed.pro_summary || "분석 데이터 없음"),
      con_summary: String(parsed.con_summary || "분석 데이터 없음"),
      winner,
      verdict_reason: String(parsed.verdict_reason || "판결 이유를 생성할 수 없습니다."),
      pro_score: proScore,
      con_score: conScore,
      judged_at: new Date().toISOString(),
    }

    // ⑨ DB 저장
    const { error: saveError } = await supabaseAdmin
      .from("threads")
      .update({ ai_summary: judgeResult, ai_verdict: winner })
      .eq("id", threadId)

    if (saveError) {
      console.error("[CyberJudge] DB save error:", saveError.message)
      return Response.json({ error: "판결 저장에 실패했습니다." }, { status: 500 })
    }

    // ⑩ AI 판결 완료 알림 — 투표/댓글 참여자에게 알림
    try {
      const { data: threadData } = await supabaseAdmin
        .from("threads")
        .select("title, created_by")
        .eq("id", threadId)
        .maybeSingle()
      const threadTitle = String((threadData as Record<string, unknown>)?.title ?? "")

      // 투표자 + 댓글 작성자 수집
      const [{ data: voters }, { data: commenters }] = await Promise.all([
        supabaseAdmin.from("thread_votes").select("user_id").eq("thread_id", threadId),
        supabaseAdmin.from("comments").select("user_id").eq("thread_id", threadId),
      ])
      const participantIds = new Set<string>()
      for (const r of voters ?? []) participantIds.add(String((r as Record<string, unknown>).user_id))
      for (const r of commenters ?? []) participantIds.add(String((r as Record<string, unknown>).user_id))
      if (threadData && (threadData as Record<string, unknown>).created_by) {
        participantIds.add(String((threadData as Record<string, unknown>).created_by))
      }

      const winnerLabel = winner === "pro" ? "찬성" : winner === "con" ? "반대" : "무승부"
      const notifications = [...participantIds].map((uid) => ({
        user_id: uid,
        type: "ai_result",
        thread_id: threadId,
        thread_title: threadTitle,
        message: `AI 판사가 판결했습니다: ${winnerLabel} — "${threadTitle}"`,
      }))
      if (notifications.length > 0) {
        await supabaseAdmin.from("notifications").insert(notifications)
      }
    } catch (e) {
      console.error("[CyberJudge] Notification error:", e)
    }

    return Response.json(judgeResult)
  } catch (err) {
    console.error("[CyberJudge] Unexpected error:", err)
    return Response.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
>>>>>>> fa6b4c1b2ce350bb3dba5b3fd22e8596f3bbefc5
}
