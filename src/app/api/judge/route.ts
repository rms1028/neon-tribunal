import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, Part } from "@google/generative-ai";
import { getJudgeById } from "@/lib/judges";
import { getSupabase } from "@/lib/supabase";
import { judgeRateLimit } from "@/lib/rate-limit";
import { sanitizeInput, containsProfanity, PROFANITY_ERROR_MESSAGE } from "@/lib/content-filter";
import type { JudgeErrorResponse } from "@/lib/types";
import { logger } from "@/lib/logger";

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

        // Extract tldr, viral_quote and story_summary from accumulated text
        const tldrMatch = fullText.match(/\[\[TLDR:\s*(.+?)\]\]/);
        const tldr = tldrMatch ? tldrMatch[1].trim() : undefined;
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
          tldr,
        });
      } catch (err) {
        logger.error("Gemini API error", { judgeId: judge.id, error: err instanceof Error ? err.message : String(err) });
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
}
