"use client";

import { useState, useRef, useEffect } from "react";
import { judges } from "@/lib/judges";
import type { JudgeResponse, JudgeErrorResponse, TrialMode, FullCourtJudgeResult } from "@/lib/types";
import { saveVerdict } from "@/lib/history";
import { containsProfanity, PROFANITY_ERROR_MESSAGE } from "@/lib/content-filter";
import Toast from "@/components/Toast";
import ShareModal from "@/components/ShareModal";
import JudgeAvatar from "@/components/JudgeAvatar";
import { trackEvent } from "@/lib/analytics";

function stripMetaTags(text: string): string {
  return text
    .replace(/\n*\[\[VIRAL:\s*.+?\]\]\s*/g, "")
    .replace(/\n*\[\[STORY:\s*.+?\]\]\s*/g, "")
    .trim();
}

export default function Home() {
  const [story, setStory] = useState("");
  const [selectedJudge, setSelectedJudge] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [verdict, setVerdict] = useState<JudgeResponse | null>(null);
  const [streamingText, setStreamingText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: "", visible: false });
  const [isSubmittingToHof, setIsSubmittingToHof] = useState(false);
  const [hofSubmitted, setHofSubmitted] = useState(false);
  const [hofId, setHofId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [trialMode, setTrialMode] = useState<TrialMode>("single");
  const [fullCourtResults, setFullCourtResults] = useState<Record<string, FullCourtJudgeResult>>({});
  const [selectedFavoriteJudge, setSelectedFavoriteJudge] = useState<string | null>(null);
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [appealReason, setAppealReason] = useState("");
  const [isAppealTrial, setIsAppealTrial] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const verdictRef = useRef<HTMLDivElement>(null);
  const appealDataRef = useRef<{ reason: string; originalVerdict: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const trimmedLength = story.trim().length;
  const isValidLength = trimmedLength >= 10 && trimmedLength <= 2000;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      setValidationError("이미지는 4MB 이하만 업로드 가능합니다.");
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      setValidationError("JPG, PNG, WebP, GIF 형식만 지원합니다.");
      return;
    }

    setValidationError(null);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleImageRemove = () => {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1]); // strip data:...;base64, prefix
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleSubmit = async () => {
    setValidationError(null);
    setError(null);

    if (!story.trim()) {
      setValidationError("사연을 입력해주세요.");
      return;
    }
    if (trimmedLength < 10) {
      setValidationError("사연은 최소 10자 이상 입력해주세요.");
      return;
    }
    if (trimmedLength > 2000) {
      setValidationError("사연은 2000자 이하로 입력해주세요.");
      return;
    }
    if (containsProfanity(story)) {
      setValidationError(PROFANITY_ERROR_MESSAGE);
      return;
    }
    if (!selectedJudge) {
      setValidationError("판사를 선택해주세요.");
      return;
    }

    setIsLoading(true);
    setIsStreaming(false);
    setVerdict(null);
    setStreamingText("");
    setHofSubmitted(false);
    setHofId(null);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000);

      // Build request body
      const requestBody: {
        story: string;
        judgeId: string;
        image?: { base64: string; mimeType: string };
        appealReason?: string;
        originalVerdict?: string;
      } = { story: story.trim(), judgeId: selectedJudge };

      if (imageFile) {
        const base64 = await fileToBase64(imageFile);
        requestBody.image = { base64, mimeType: imageFile.type };
      }

      if (appealDataRef.current) {
        requestBody.appealReason = appealDataRef.current.reason;
        requestBody.originalVerdict = appealDataRef.current.originalVerdict;
      }

      const res = await fetch("/api/judge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        // Non-streaming error (validation errors return JSON)
        try {
          const data = await res.json() as JudgeErrorResponse;
          setError(data.error || "알 수 없는 오류가 발생했습니다.");
        } catch {
          setError("알 수 없는 오류가 발생했습니다.");
        }
        return;
      }

      // Start reading the SSE stream
      const reader = res.body?.getReader();
      if (!reader) {
        setError("스트리밍을 시작할 수 없습니다.");
        return;
      }

      setIsLoading(false);
      setIsStreaming(true);
      let accumulated = "";
      let hasScrolled = false;
      let receivedDone = false;
      const decoder = new TextDecoder();
      let sseBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        sseBuffer += decoder.decode(value, { stream: true });
        const parts = sseBuffer.split("\n\n");
        sseBuffer = parts.pop() || "";

        for (const part of parts) {
          for (const line of part.split("\n")) {
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6);
            if (!jsonStr) continue;

            try {
              const event = JSON.parse(jsonStr);

              if (event.type === "chunk") {
                accumulated += event.text;
                setStreamingText(accumulated);

                if (!hasScrolled) {
                  hasScrolled = true;
                  setTimeout(() => {
                    verdictRef.current?.scrollIntoView({ behavior: "smooth" });
                  }, 100);
                }
              } else if (event.type === "done") {
                receivedDone = true;
                const cleanVerdict = stripMetaTags(accumulated);
                const judgeResponse: JudgeResponse = {
                  verdict: cleanVerdict,
                  judgeId: event.judgeId,
                  judgeName: event.judgeName,
                  imageUrl: event.imageUrl,
                  viralQuote: event.viralQuote,
                  storySummary: event.storySummary,
                };
                setVerdict(judgeResponse);
                setIsStreaming(false);
                trackEvent("verdict_generated", { judge_id: event.judgeId, judge_name: event.judgeName });
                saveVerdict({
                  story: story.trim(),
                  judgeId: judgeResponse.judgeId,
                  judgeName: judgeResponse.judgeName,
                  verdict: judgeResponse.verdict,
                  imageUrl: judgeResponse.imageUrl,
                  viralQuote: judgeResponse.viralQuote,
                });
              } else if (event.type === "error") {
                receivedDone = true;
                setError(event.error);
                setIsStreaming(false);
              }
            } catch {
              // skip malformed JSON lines
            }
          }
        }
      }

      // Fallback: if stream ended without a done event, construct verdict from accumulated text
      if (!receivedDone && accumulated) {
        const cleanVerdict = stripMetaTags(accumulated);
        const viralMatch = accumulated.match(/\[\[VIRAL:\s*(.+?)\]\]/);
        const viralQuote = viralMatch ? viralMatch[1].trim() : undefined;
        const judgeResponse: JudgeResponse = {
          verdict: cleanVerdict,
          judgeId: selectedJudge!,
          judgeName: selectedJudgeData?.name || "",
          viralQuote,
        };
        setVerdict(judgeResponse);
        setIsStreaming(false);
        saveVerdict({
          story: story.trim(),
          judgeId: judgeResponse.judgeId,
          judgeName: judgeResponse.judgeName,
          verdict: judgeResponse.verdict,
          viralQuote: judgeResponse.viralQuote,
        });
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setError("요청 시간이 초과되었습니다. 다시 시도해주세요.");
      } else {
        setError("네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.");
      }
      setIsStreaming(false);
    } finally {
      setIsLoading(false);
      appealDataRef.current = null;
    }
  };

  const handleSubmitFullCourt = async () => {
    setValidationError(null);
    setError(null);

    if (!story.trim()) { setValidationError("사연을 입력해주세요."); return; }
    if (trimmedLength < 10) { setValidationError("사연은 최소 10자 이상 입력해주세요."); return; }
    if (trimmedLength > 2000) { setValidationError("사연은 2000자 이하로 입력해주세요."); return; }
    if (containsProfanity(story)) { setValidationError(PROFANITY_ERROR_MESSAGE); return; }

    setIsLoading(true);
    setVerdict(null);
    setStreamingText("");
    setIsStreaming(false);
    setSelectedFavoriteJudge(null);
    setHofSubmitted(false);

    const initial: Record<string, FullCourtJudgeResult> = {};
    for (const j of judges) {
      initial[j.id] = { judgeId: j.id, judgeName: j.name, status: "loading" };
    }
    setFullCourtResults(initial);

    let imagePayload: { base64: string; mimeType: string } | undefined;
    if (imageFile) {
      const base64 = await fileToBase64(imageFile);
      imagePayload = { base64, mimeType: imageFile.type };
    }

    let hasScrolled = false;

    const promises = judges.map(async (judge) => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 60000);

        const body: Record<string, unknown> = { story: story.trim(), judgeId: judge.id };
        if (imagePayload) body.image = imagePayload;
        if (appealDataRef.current) {
          body.appealReason = appealDataRef.current.reason;
          body.originalVerdict = appealDataRef.current.originalVerdict;
        }

        const res = await fetch("/api/judge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!res.ok) {
          let errMsg = "알 수 없는 오류";
          try { const d = await res.json(); errMsg = d.error || errMsg; } catch {}
          setFullCourtResults(prev => ({ ...prev, [judge.id]: { ...prev[judge.id], status: "error", error: errMsg } }));
          return;
        }

        // Handle SSE stream
        const reader = res.body?.getReader();
        if (!reader) {
          setFullCourtResults(prev => ({ ...prev, [judge.id]: { ...prev[judge.id], status: "error", error: "스트리밍 실패" } }));
          return;
        }

        let accumulated = "";
        let receivedDone = false;
        const decoder = new TextDecoder();
        let sseBuffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          sseBuffer += decoder.decode(value, { stream: true });
          const parts = sseBuffer.split("\n\n");
          sseBuffer = parts.pop() || "";

          for (const part of parts) {
            for (const line of part.split("\n")) {
              if (!line.startsWith("data: ")) continue;
              try {
                const event = JSON.parse(line.slice(6));
                if (event.type === "chunk") {
                  accumulated += event.text;
                  setFullCourtResults(prev => ({ ...prev, [judge.id]: { ...prev[judge.id], status: "loading", verdict: accumulated } }));
                  if (!hasScrolled) {
                    hasScrolled = true;
                    setTimeout(() => verdictRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
                  }
                } else if (event.type === "done") {
                  receivedDone = true;
                  const cleanVerdict = stripMetaTags(accumulated);
                  const result: FullCourtJudgeResult = {
                    judgeId: judge.id,
                    judgeName: event.judgeName || judge.name,
                    status: "success",
                    verdict: cleanVerdict,
                    imageUrl: event.imageUrl,
                    viralQuote: event.viralQuote,
                    storySummary: event.storySummary,
                  };
                  setFullCourtResults(prev => ({ ...prev, [judge.id]: result }));
                  saveVerdict({
                    story: story.trim(),
                    judgeId: judge.id,
                    judgeName: event.judgeName || judge.name,
                    verdict: cleanVerdict,
                    imageUrl: event.imageUrl,
                    viralQuote: event.viralQuote,
                  });
                } else if (event.type === "error") {
                  receivedDone = true;
                  setFullCourtResults(prev => ({ ...prev, [judge.id]: { ...prev[judge.id], status: "error", error: event.error } }));
                }
              } catch {}
            }
          }
        }

        // Fallback: if stream ended without done event
        if (!receivedDone && accumulated) {
          const cleanVerdict = stripMetaTags(accumulated);
          const viralMatch = accumulated.match(/\[\[VIRAL:\s*(.+?)\]\]/);
          const viralQuote = viralMatch ? viralMatch[1].trim() : undefined;
          setFullCourtResults(prev => ({
            ...prev,
            [judge.id]: { judgeId: judge.id, judgeName: judge.name, status: "success", verdict: cleanVerdict, viralQuote },
          }));
          saveVerdict({ story: story.trim(), judgeId: judge.id, judgeName: judge.name, verdict: cleanVerdict, viralQuote });
        }
      } catch (err) {
        const msg = err instanceof DOMException && err.name === "AbortError" ? "시간 초과" : "네트워크 오류";
        setFullCourtResults(prev => ({ ...prev, [judge.id]: { ...prev[judge.id], status: "error", error: msg } }));
      }
    });

    await Promise.allSettled(promises);
    setIsLoading(false);
    appealDataRef.current = null;
  };

  const retrySingleJudge = async (judgeId: string) => {
    const judge = judges.find(j => j.id === judgeId);
    if (!judge) return;

    setFullCourtResults(prev => ({ ...prev, [judgeId]: { judgeId, judgeName: judge.name, status: "loading" } }));

    let imagePayload: { base64: string; mimeType: string } | undefined;
    if (imageFile) {
      const base64 = await fileToBase64(imageFile);
      imagePayload = { base64, mimeType: imageFile.type };
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000);
      const body: Record<string, unknown> = { story: story.trim(), judgeId };
      if (imagePayload) body.image = imagePayload;

      const res = await fetch("/api/judge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        let errMsg = "알 수 없는 오류";
        try { const d = await res.json(); errMsg = d.error || errMsg; } catch {}
        setFullCourtResults(prev => ({ ...prev, [judgeId]: { ...prev[judgeId], status: "error", error: errMsg } }));
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        setFullCourtResults(prev => ({ ...prev, [judgeId]: { ...prev[judgeId], status: "error", error: "스트리밍 실패" } }));
        return;
      }

      let accumulated = "";
      let receivedDone = false;
      const decoder = new TextDecoder();
      let sseBuffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        sseBuffer += decoder.decode(value, { stream: true });
        const parts = sseBuffer.split("\n\n");
        sseBuffer = parts.pop() || "";
        for (const part of parts) {
          for (const line of part.split("\n")) {
            if (!line.startsWith("data: ")) continue;
            try {
              const event = JSON.parse(line.slice(6));
              if (event.type === "chunk") {
                accumulated += event.text;
                setFullCourtResults(prev => ({ ...prev, [judgeId]: { ...prev[judgeId], status: "loading", verdict: accumulated } }));
              } else if (event.type === "done") {
                receivedDone = true;
                const cleanVerdict = stripMetaTags(accumulated);
                setFullCourtResults(prev => ({
                  ...prev,
                  [judgeId]: { judgeId, judgeName: event.judgeName || judge.name, status: "success", verdict: cleanVerdict, imageUrl: event.imageUrl, viralQuote: event.viralQuote, storySummary: event.storySummary },
                }));
                saveVerdict({ story: story.trim(), judgeId, judgeName: event.judgeName || judge.name, verdict: cleanVerdict, imageUrl: event.imageUrl, viralQuote: event.viralQuote });
              } else if (event.type === "error") {
                receivedDone = true;
                setFullCourtResults(prev => ({ ...prev, [judgeId]: { ...prev[judgeId], status: "error", error: event.error } }));
              }
            } catch {}
          }
        }
      }
      if (!receivedDone && accumulated) {
        const cleanVerdict = stripMetaTags(accumulated);
        const viralMatch = accumulated.match(/\[\[VIRAL:\s*(.+?)\]\]/);
        const viralQuote = viralMatch ? viralMatch[1].trim() : undefined;
        setFullCourtResults(prev => ({
          ...prev,
          [judgeId]: { judgeId, judgeName: judge.name, status: "success", verdict: cleanVerdict, viralQuote },
        }));
        saveVerdict({ story: story.trim(), judgeId, judgeName: judge.name, verdict: cleanVerdict, viralQuote });
      }
    } catch (err) {
      const msg = err instanceof DOMException && err.name === "AbortError" ? "시간 초과" : "네트워크 오류";
      setFullCourtResults(prev => ({ ...prev, [judgeId]: { ...prev[judgeId], status: "error", error: msg } }));
    }
  };

  const handleRetry = () => {
    setError(null);
    if (trialMode === "full-court") {
      handleSubmitFullCourt();
    } else {
      handleSubmit();
    }
  };

  const handleAppealClick = () => {
    setAppealReason("");
    setShowAppealModal(true);
  };

  const handleAppealSubmit = () => {
    if (!appealReason.trim()) return;

    // Build original verdict text for the API
    let originalVerdictText = "";
    if (trialMode === "single" && verdict) {
      originalVerdictText = verdict.verdict;
    } else if (trialMode === "full-court") {
      originalVerdictText = Object.values(fullCourtResults)
        .filter(r => r.status === "success" && r.verdict)
        .map(r => `[${r.judgeName}]: ${r.verdict}`)
        .join("\n\n");
    }

    appealDataRef.current = {
      reason: appealReason.trim(),
      originalVerdict: originalVerdictText,
    };
    setIsAppealTrial(true);
    setShowAppealModal(false);
    setError(null);

    if (trialMode === "full-court") {
      handleSubmitFullCourt();
    } else {
      handleSubmit();
    }
  };

  const handleNewStory = () => {
    setStory("");
    setSelectedJudge(null);
    setVerdict(null);
    setStreamingText("");
    setIsStreaming(false);
    setFullCourtResults({});
    setSelectedFavoriteJudge(null);
    setError(null);
    setValidationError(null);
    setHofSubmitted(false);
    setHofId(null);
    setIsSubmittingToHof(false);
    setIsAppealTrial(false);
    setAppealReason("");
    appealDataRef.current = null;
    handleImageRemove();
    contentRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmitToHallOfFame = async () => {
    if (hofSubmitted) return;

    let payload: { judgeId: string; judgeName: string; story: string; verdict: string; imageUrl?: string; viralQuote?: string };

    if (trialMode === "full-court") {
      if (!selectedFavoriteJudge) return;
      const r = fullCourtResults[selectedFavoriteJudge];
      if (!r || r.status !== "success") return;
      payload = { judgeId: r.judgeId, judgeName: r.judgeName, story: story.trim(), verdict: r.verdict!, imageUrl: r.imageUrl, viralQuote: r.viralQuote };
    } else {
      if (!verdict) return;
      payload = { judgeId: verdict.judgeId, judgeName: verdict.judgeName, story: story.trim(), verdict: verdict.verdict, imageUrl: verdict.imageUrl, viralQuote: verdict.viralQuote };
    }

    setIsSubmittingToHof(true);
    try {
      const res = await fetch("/api/hall-of-fame", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        setHofId(data.id);
        setHofSubmitted(true);
        // Save to localStorage so /verdict/[id] knows this user is the author
        try {
          const key = "neon-court-my-verdicts";
          const existing = JSON.parse(localStorage.getItem(key) || "[]");
          if (!existing.includes(data.id)) {
            existing.push(data.id);
            localStorage.setItem(key, JSON.stringify(existing));
          }
        } catch { /* ignore */ }
        trackEvent("hall_of_fame_submitted", { judge_id: payload.judgeId, judge_name: payload.judgeName });
        showToast("📢 성공적으로 배심원단이 소집되었습니다! 이제 다른 유저들이 투표에 참여합니다.");
      } else {
        showToast("등록에 실패했습니다. 다시 시도해주세요.");
      }
    } catch {
      showToast("네트워크 오류로 등록에 실패했습니다.");
    } finally {
      setIsSubmittingToHof(false);
    }
  };

  const scrollToContent = () => {
    contentRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = (msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message: msg, visible: true });
    toastTimer.current = setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
  };

  const getShareUrl = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return hofId ? `${origin}/verdict/${hofId}` : origin;
  };

  const getStorySummaryText = () => {
    const storyText = story.trim();
    const maxLen = 50;
    return storyText.length > maxLen ? storyText.slice(0, maxLen) + "..." : storyText;
  };

  // ── 공유하기 모달 ──
  const [showShareModal, setShowShareModal] = useState(false);

  const getShareTitle = () => {
    let mainTitle = "";
    if (trialMode === "full-court") {
      const fcJudgeId = selectedFavoriteJudge || Object.keys(fullCourtResults).find(k => fullCourtResults[k]?.viralQuote);
      const fcResult = fcJudgeId ? fullCourtResults[fcJudgeId] : null;
      mainTitle = fcResult?.viralQuote || "";
    } else {
      mainTitle = verdict?.viralQuote || "";
    }
    return mainTitle || "AI 판사의 팩폭 판결이 도착했습니다!";
  };

  const getShareDescription = () => `"${getStorySummaryText()}" ...과연 당신의 판결은?`;


  const isReady = trialMode === "full-court"
    ? trimmedLength >= 10 && trimmedLength <= 2000
    : trimmedLength >= 10 && trimmedLength <= 2000 && selectedJudge !== null;
  const selectedJudgeData = judges.find((j) => j.id === selectedJudge);
  const fullCourtCompletedCount = Object.values(fullCourtResults).filter(r => r.status === "success").length;
  const fullCourtHasResults = Object.keys(fullCourtResults).length > 0;
  const fullCourtAllDone = fullCourtHasResults && Object.values(fullCourtResults).every(r => r.status === "success" || r.status === "error");

  return (
    <div className="min-h-screen cyber-grid crt-overlay relative overflow-hidden">
      {/* Ambient background glow orbs */}
      <div className="fixed top-[-200px] left-1/4 w-[600px] h-[600px] bg-neon-purple/10 rounded-full blur-[200px] pointer-events-none" />
      <div className="fixed bottom-[-150px] right-1/4 w-[500px] h-[500px] bg-neon-blue/10 rounded-full blur-[180px] pointer-events-none" />
      <div className="fixed top-1/2 left-[-100px] w-[400px] h-[400px] bg-neon-pink/5 rounded-full blur-[150px] pointer-events-none" />

      {/* ===== HERO: FULL VIEWPORT ===== */}
      <section className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6">
        {/* Decorative corner brackets */}
        <div className="absolute top-6 left-6 w-12 h-12 border-t-2 border-l-2 border-neon-blue/30" />
        <div className="absolute top-6 right-6 w-12 h-12 border-t-2 border-r-2 border-neon-blue/30" />
        <div className="absolute bottom-24 left-6 w-12 h-12 border-b-2 border-l-2 border-neon-blue/30" />
        <div className="absolute bottom-24 right-6 w-12 h-12 border-b-2 border-r-2 border-neon-blue/30" />

        {/* Large gavel icon */}
        <div className="text-7xl md:text-9xl mb-6 drop-shadow-[0_0_40px_rgba(0,240,255,0.5)]">
          &#9878;
        </div>

        {/* Glitch Title */}
        <h1
          className="glitch text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-[family-name:var(--font-orbitron)] font-black mb-6 uppercase tracking-wider text-center"
          data-text="전국민 고민 재판소: 네온즈"
          style={{ wordBreak: "keep-all", overflowWrap: "break-word" }}
        >
          <span
            className="relative z-20"
            style={{
              color: "#ffffff",
              textShadow:
                "0 0 10px rgba(0,240,255,1), 0 0 40px rgba(0,240,255,0.7), 0 0 80px rgba(0,240,255,0.4)",
            }}
          >
            전국민 고민 재판소: 네온즈
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-2xl text-gray-300 mb-10 text-center leading-relaxed max-w-2xl" style={{ wordBreak: "keep-all", overflowWrap: "break-word" }}>
          고민이나 다툼 상황을 올리면,
          <strong className="text-white"> AI 판사가 판결</strong>을 내려드립니다
        </p>

        {/* 3-step flow */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 md:gap-6 text-[10px] sm:text-xs md:text-sm font-[family-name:var(--font-share-tech)] tracking-wider mb-12">
          <span className="flex items-center gap-1.5 sm:gap-2 text-neon-blue">
            <span className="inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 border border-neon-blue/60 text-[10px] sm:text-xs font-bold" style={{ clipPath: "polygon(4px 0,100% 0,100% calc(100% - 4px),calc(100% - 4px) 100%,0 100%,0 4px)" }}>1</span>
            사연 작성
          </span>
          <span className="text-gray-600 text-sm sm:text-lg">&#9654;</span>
          <span className="flex items-center gap-1.5 sm:gap-2 text-neon-purple">
            <span className="inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 border border-neon-purple/60 text-[10px] sm:text-xs font-bold" style={{ clipPath: "polygon(4px 0,100% 0,100% calc(100% - 4px),calc(100% - 4px) 100%,0 100%,0 4px)" }}>2</span>
            판사 선택
          </span>
          <span className="text-gray-600 text-sm sm:text-lg">&#9654;</span>
          <span className="flex items-center gap-1.5 sm:gap-2 text-neon-pink">
            <span className="inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 border border-neon-pink/60 text-[10px] sm:text-xs font-bold" style={{ clipPath: "polygon(4px 0,100% 0,100% calc(100% - 4px),calc(100% - 4px) 100%,0 100%,0 4px)" }}>3</span>
            판결 받기
          </span>
        </div>

        {/* Scroll CTA */}
        <button
          onClick={scrollToContent}
          className="cyber-clip-btn px-10 py-3 border border-neon-blue/50 text-neon-blue font-[family-name:var(--font-orbitron)] text-sm uppercase tracking-widest cursor-pointer hover:bg-neon-blue/10 transition-all duration-300"
          style={{ boxShadow: "0 0 20px rgba(0,240,255,0.15)" }}
        >
          시작하기
        </button>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <span className="font-[family-name:var(--font-share-tech)] text-[10px] text-gray-600 tracking-widest">SCROLL</span>
          <svg width="20" height="20" viewBox="0 0 20 20" className="text-neon-blue/50">
            <path d="M4 8 L10 14 L16 8" stroke="currentColor" fill="none" strokeWidth="1.5" />
          </svg>
        </div>
      </section>

      {/* ===== MAIN CONTENT: FULL WIDTH ===== */}
      <div ref={contentRef} className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 md:px-10 py-10 md:py-16">
        <div className="holo-line mb-10" />

        {/* ===== MODE TOGGLE ===== */}
        <div className="flex gap-3 mb-10 justify-center">
          <button
            onClick={() => { setTrialMode("single"); setFullCourtResults({}); setSelectedFavoriteJudge(null); }}
            className={`cyber-clip-btn px-5 md:px-7 py-2.5 md:py-3 font-[family-name:var(--font-orbitron)] text-[10px] md:text-xs tracking-[0.12em] uppercase border transition-all duration-300 cursor-pointer ${
              trialMode === "single"
                ? "border-neon-blue/60 text-neon-blue bg-neon-blue/10"
                : "border-dark-border text-gray-500 hover:text-gray-300 hover:border-gray-500"
            }`}
            style={trialMode === "single" ? { boxShadow: "0 0 20px rgba(0,240,255,0.15)" } : undefined}
          >
            &#9878; 단독 재판
          </button>
          <button
            onClick={() => { setTrialMode("full-court"); setSelectedJudge(null); setVerdict(null); setStreamingText(""); setIsStreaming(false); }}
            className={`cyber-clip-btn px-5 md:px-7 py-2.5 md:py-3 font-[family-name:var(--font-orbitron)] text-[10px] md:text-xs tracking-[0.12em] uppercase border transition-all duration-300 cursor-pointer ${
              trialMode === "full-court"
                ? "border-neon-purple/60 text-neon-purple bg-neon-purple/10"
                : "border-dark-border text-gray-500 hover:text-gray-300 hover:border-gray-500"
            }`}
            style={trialMode === "full-court" ? { boxShadow: "0 0 20px rgba(180,74,255,0.15)" } : undefined}
          >
            &#9878;&#9878; 전원 재판
          </button>
        </div>

        {/* ===== 2-column layout on desktop ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 mb-12">

          {/* LEFT: Story Input */}
          <section className="flex flex-col">
            <h2 className="font-[family-name:var(--font-orbitron)] text-sm md:text-base font-bold mb-4 text-white flex items-center gap-3 uppercase tracking-wider">
              <span className="accent-bar bg-neon-blue" />
              <span className="text-neon-blue text-xs mr-1">01</span>
              사연을 입력하세요
            </h2>

            <div className="relative flex-1">
              <div className="cyber-clip-input h-full">
                <textarea
                  value={story}
                  onChange={(e) => {
                    setStory(e.target.value);
                    if (validationError) setValidationError(null);
                  }}
                  maxLength={2000}
                  placeholder="예: 친구와 돈 문제로 다투고 있어요. 제가 빌려준 돈을 안 갚는데..."
                  className="textarea-cyber w-full h-full min-h-[250px] lg:min-h-[340px] bg-black/50 backdrop-blur-md border border-dark-border px-5 py-4 text-sm md:text-base text-gray-200 placeholder-gray-500 resize-none outline-none transition-all duration-300 focus:border-neon-blue/40 font-[family-name:var(--font-share-tech)] leading-relaxed"
                />
              </div>
              <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-neon-blue/40" />
              <div className="absolute bottom-0 left-0 w-6 h-6">
                <svg viewBox="0 0 24 24" className="text-neon-blue/30" fill="none" stroke="currentColor" strokeWidth="1">
                  <path d="M0 24 L24 24 L24 0" />
                </svg>
              </div>
              <div
                className="absolute bottom-2 right-3 text-[10px] font-[family-name:var(--font-share-tech)] tracking-wider transition-colors"
                style={{
                  color: trimmedLength === 0
                    ? "#4a4a6a"
                    : trimmedLength < 10
                      ? "#ff4444"
                      : trimmedLength > 1900
                        ? "#ff8800"
                        : "#39ff14",
                }}
              >
                CHAR: {story.length} / 2000
              </div>
            </div>

            {/* Image upload */}
            <div className="mt-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleImageSelect}
                className="hidden"
              />
              {!imagePreview ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="cyber-clip-btn w-full py-2.5 font-[family-name:var(--font-share-tech)] text-xs tracking-[0.15em] uppercase border border-dark-border text-gray-500 bg-black/30 cursor-pointer hover:border-neon-blue/40 hover:text-neon-blue transition-all duration-300"
                >
                  {"\uD83D\uDCF7"} 증거 사진 첨부 (선택)
                </button>
              ) : (
                <div className="relative border border-neon-blue/30 bg-black/30 p-2">
                  <div className="flex items-center gap-3">
                    <img
                      src={imagePreview}
                      alt="증거 사진 미리보기"
                      className="w-16 h-16 object-cover border border-dark-border"
                      style={{ clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))" }}
                    />
                    <div className="flex-1">
                      <p className="font-[family-name:var(--font-share-tech)] text-[10px] text-neon-blue tracking-widest uppercase">
                        EVIDENCE_ATTACHED
                      </p>
                      <p className="font-[family-name:var(--font-share-tech)] text-[10px] text-gray-500 tracking-wider mt-0.5">
                        {imageFile?.name} ({((imageFile?.size || 0) / 1024).toFixed(0)}KB)
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleImageRemove}
                      className="px-2 py-1 text-xs text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-colors cursor-pointer font-[family-name:var(--font-share-tech)] tracking-wider"
                    >
                      {"\u2715"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Validation error */}
            {validationError && (
              <div className="mt-2 px-3 py-2 text-xs text-red-400 font-[family-name:var(--font-share-tech)] tracking-wider border border-red-500/30 bg-red-500/5">
                ⚠ {validationError}
              </div>
            )}
          </section>

          {/* RIGHT: Judge Selection */}
          <section className="flex flex-col">
            <h2 className="font-[family-name:var(--font-orbitron)] text-sm md:text-base font-bold mb-4 text-white flex items-center gap-3 uppercase tracking-wider">
              <span className="accent-bar bg-neon-purple" />
              <span className="text-neon-purple text-xs mr-1">02</span>
              {trialMode === "full-court" ? "전원 출석" : "판사를 선택하세요"}
            </h2>

            <div className="grid grid-cols-2 gap-2 sm:gap-3 flex-1 relative">
              {judges.map((judge) => {
                const isSelected = trialMode === "full-court" || selectedJudge === judge.id;
                return (
                  <button
                    key={judge.id}
                    onClick={() => { if (trialMode === "single") { setSelectedJudge(judge.id); trackEvent("judge_selected", { judge_id: judge.id, judge_name: judge.name }); } }}
                    style={{
                      ["--card-glow-color" as string]: judge.accentColor,
                    }}
                    className={`
                      cyber-clip
                      relative p-4 md:p-5 text-left transition-all duration-300
                      glass-card
                      ${trialMode === "full-court" ? "cursor-default" : "cursor-pointer"}
                      ${isSelected ? "glass-card-active" : ""}
                    `}
                  >
                    {isSelected && (
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          boxShadow: `0 0 25px rgba(${judge.glowRgb}, 0.25), inset 0 0 25px rgba(${judge.glowRgb}, 0.05)`,
                        }}
                      />
                    )}

                    <div className="absolute top-2.5 right-4 flex items-center gap-1.5">
                      <span className="font-[family-name:var(--font-share-tech)] text-[8px] md:text-[9px] tracking-wider" style={{ color: isSelected ? judge.accentColor : '#444' }}>
                        {isSelected ? "ACTIVE" : "STANDBY"}
                      </span>
                      <div
                        className={`w-2 h-2 ${isSelected ? "animate-neon-pulse" : ""}`}
                        style={{
                          backgroundColor: isSelected ? judge.accentColor : "#333",
                          clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
                        }}
                      />
                    </div>

                    <JudgeAvatar avatarUrl={judge.avatarUrl} name={judge.name} size={48} glowRgb={isSelected ? judge.glowRgb : undefined} className="mb-2" />

                    <h3
                      className="font-[family-name:var(--font-orbitron)] font-bold text-xs md:text-sm mb-1 transition-colors uppercase tracking-wide"
                      style={{ color: isSelected ? judge.accentColor : "#e0e0f0" }}
                    >
                      {judge.name}
                    </h3>

                    <p className="font-[family-name:var(--font-share-tech)] text-[9px] md:text-[10px] text-gray-500 tracking-[0.15em] mb-1.5">
                      &gt; {judge.subtitle}
                    </p>

                    <p className="text-[11px] md:text-xs text-gray-400 leading-relaxed">
                      {judge.description}
                    </p>

                    <div
                      className="absolute bottom-0 left-0 h-[2px] transition-all duration-500"
                      style={{
                        width: isSelected ? "100%" : "0%",
                        backgroundColor: judge.accentColor,
                        boxShadow: isSelected ? `0 0 10px rgba(${judge.glowRgb}, 0.6)` : "none",
                      }}
                    />
                  </button>
                );
              })}

              {/* Full court overlay badge */}
              {trialMode === "full-court" && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-black/70 backdrop-blur-sm border border-neon-purple/50 px-4 py-2" style={{ boxShadow: "0 0 30px rgba(180,74,255,0.2)" }}>
                    <span className="font-[family-name:var(--font-orbitron)] text-[10px] md:text-xs text-neon-purple tracking-[0.2em] uppercase">
                      All Judges Active
                    </span>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* ===== SUBMIT BUTTON (full width) ===== */}
        <section className="pb-10">
          <button
            onClick={trialMode === "full-court" ? handleSubmitFullCourt : handleSubmit}
            disabled={!isReady || isLoading}
            className={`
              cyber-clip-btn w-full py-5 md:py-6 font-[family-name:var(--font-orbitron)] font-bold
              text-base md:text-xl tracking-[0.2em] uppercase
              transition-all duration-300 relative overflow-hidden
              ${
                isReady && !isLoading
                  ? trialMode === "full-court"
                    ? "bg-gradient-to-r from-neon-purple/15 via-neon-pink/10 to-neon-purple/15 border border-neon-purple/40 text-neon-purple cursor-pointer hover:border-neon-purple/70 active:scale-[0.98]"
                    : "bg-gradient-to-r from-neon-blue/15 via-neon-purple/10 to-neon-blue/15 border border-neon-blue/40 text-neon-blue cursor-pointer hover:border-neon-blue/70 active:scale-[0.98]"
                  : "bg-dark-surface/50 border border-dark-border text-gray-600 cursor-not-allowed"
              }
            `}
            style={
              isReady && !isLoading
                ? trialMode === "full-court"
                  ? { boxShadow: "0 0 40px rgba(180,74,255,0.2), inset 0 0 40px rgba(180,74,255,0.05)" }
                  : { boxShadow: "0 0 40px rgba(0,240,255,0.2), inset 0 0 40px rgba(0,240,255,0.05)" }
                : undefined
            }
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-3">
                <svg className="animate-spin-slow w-6 h-6 text-neon-purple" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="31.4 31.4" strokeLinecap="round" />
                </svg>
                <span className="animate-neon-pulse tracking-[0.3em]">
                  {isAppealTrial
                    ? "항소심 재판이 진행 중입니다..."
                    : trialMode === "full-court"
                      ? `전원 판결 중... (${fullCourtCompletedCount}/${judges.length})`
                      : "판결을 내리는 중..."}
                </span>
              </span>
            ) : (
              <span className="flex items-center justify-center gap-3">
                <span className="text-2xl">&#9878;</span>
                <span>{trialMode === "full-court" ? "전원 판결 받기" : "판결 받기"}</span>
              </span>
            )}

            {isReady && !isLoading && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent animate-shimmer pointer-events-none" />
            )}
          </button>

          <div className="flex justify-between mt-2 px-1">
            <span className="font-[family-name:var(--font-share-tech)] text-[9px] text-gray-700 tracking-widest">
              &#x25B8; SYS.READY
            </span>
            <span className="font-[family-name:var(--font-share-tech)] text-[9px] text-gray-700 tracking-widest">
              {!isReady
                ? !story.trim()
                  ? "AWAITING_INPUT"
                  : trimmedLength < 10
                    ? "MIN_10_CHARS"
                    : trialMode === "full-court"
                      ? "ALL_READY"
                      : "SELECT_JUDGE"
                : "EXECUTE &#x25C0;"}
            </span>
          </div>
        </section>

        {/* ===== FULL COURT VERDICT GRID ===== */}
        {trialMode === "full-court" && fullCourtHasResults && (
          <section ref={verdictRef} className="pb-12 verdict-reveal">
            <div className="holo-line mb-8" />

            <h2 className="font-[family-name:var(--font-orbitron)] text-sm md:text-base font-bold mb-6 text-white flex items-center gap-3 uppercase tracking-wider">
              <span className="accent-bar bg-neon-purple" />
              <span className="text-neon-purple text-xs mr-1">03</span>
              {isAppealTrial ? "2심 전원 판결 결과" : "전원 판결 결과"}
              <span className="ml-auto font-[family-name:var(--font-share-tech)] text-[10px] text-gray-500 tracking-widest">
                {fullCourtCompletedCount}/{judges.length} {isAppealTrial ? "APPEAL_RENDERED" : "RENDERED"}
              </span>
            </h2>

            {/* Progress bar */}
            <div className="w-full h-1 bg-dark-border mb-6 overflow-hidden">
              <div
                className="h-full transition-all duration-500 ease-out"
                style={{
                  width: `${(fullCourtCompletedCount / judges.length) * 100}%`,
                  background: "linear-gradient(90deg, #00f0ff, #b44aff, #ff2d95)",
                  boxShadow: "0 0 10px rgba(0,240,255,0.3), 0 0 20px rgba(180,74,255,0.2)",
                }}
              />
            </div>

            {/* ===== Side-by-Side Layout ===== */}
            <div className="flex flex-col lg:flex-row gap-6 items-start">
              {/* LEFT: 2x2 Grid */}
              <div className="flex-1 min-w-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
              {judges.map(judge => {
                const result = fullCourtResults[judge.id];
                if (!result) return null;
                const isSuccess = result.status === "success";
                const isError = result.status === "error";
                const isCardLoading = result.status === "loading";
                const isFavorite = selectedFavoriteJudge === judge.id;

                return (
                  <div
                    key={judge.id}
                    className={`cyber-clip glass-card relative p-5 md:p-6 transition-all duration-500 ${
                      isSuccess ? "verdict-card-reveal" : ""
                    } ${isFavorite ? "" : ""}`}
                    style={{
                      ["--card-glow-color" as string]: judge.accentColor,
                      boxShadow: isSuccess
                        ? isFavorite
                          ? `0 0 20px rgba(${judge.glowRgb}, 0.2), 0 0 0 2px rgba(240,225,48,0.4)`
                          : `0 0 20px rgba(${judge.glowRgb}, 0.15)`
                        : undefined,
                      opacity: isCardLoading && !result.verdict ? 0.7 : 1,
                    }}
                  >
                    {/* Judge header */}
                    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/5">
                      <JudgeAvatar avatarUrl={judge.avatarUrl} name={judge.name} size={36} glowRgb={judge.glowRgb} />
                      <div className="flex-1 min-w-0">
                        <h3
                          className="font-[family-name:var(--font-orbitron)] font-bold text-xs uppercase tracking-wide"
                          style={{ color: judge.accentColor }}
                        >
                          {judge.name}
                        </h3>
                        <p className="font-[family-name:var(--font-share-tech)] text-[9px] text-gray-500 tracking-[0.2em]">
                          {isCardLoading ? "ANALYZING..." : isSuccess ? "VERDICT_RENDERED" : "ERROR"}
                        </p>
                      </div>
                      <div
                        className={`w-2.5 h-2.5 flex-shrink-0 ${isCardLoading ? "animate-neon-pulse" : ""}`}
                        style={{
                          backgroundColor: isCardLoading ? judge.accentColor : isSuccess ? "#39ff14" : "#ff4444",
                          clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
                        }}
                      />
                    </div>

                    {/* Content */}
                    {isCardLoading && !result.verdict && (
                      <div className="space-y-2.5">
                        <div className="h-3 skeleton-line w-full" />
                        <div className="h-3 skeleton-line w-4/5" />
                        <div className="h-3 skeleton-line w-3/5" />
                        <div className="h-3 skeleton-line w-5/6" />
                      </div>
                    )}

                    {(isCardLoading && result.verdict) && (
                      <div className="text-xs md:text-sm text-gray-200 leading-relaxed whitespace-pre-wrap font-[family-name:var(--font-share-tech)] max-h-[250px] overflow-y-auto">
                        {stripMetaTags(result.verdict)}
                        <span
                          className="inline-block w-[2px] h-[1em] ml-[2px] align-middle animate-neon-pulse"
                          style={{ backgroundColor: judge.accentColor }}
                        />
                      </div>
                    )}

                    {isSuccess && (
                      <div className="text-xs md:text-sm text-gray-200 leading-relaxed whitespace-pre-wrap font-[family-name:var(--font-share-tech)] max-h-[250px] overflow-y-auto">
                        {result.verdict}
                      </div>
                    )}

                    {isError && (
                      <div>
                        <p className="text-xs text-red-400 font-[family-name:var(--font-share-tech)] mb-3">
                          {result.error}
                        </p>
                        <button
                          onClick={() => retrySingleJudge(judge.id)}
                          className="cyber-clip-btn w-full py-2 text-[10px] font-[family-name:var(--font-share-tech)] tracking-widest uppercase border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                        >
                          &#x21BB; 재시도
                        </button>
                      </div>
                    )}

                    {/* Favorite selector for HoF */}
                    {isSuccess && fullCourtAllDone && (
                      <button
                        onClick={() => setSelectedFavoriteJudge(isFavorite ? null : judge.id)}
                        className={`mt-3 w-full py-2 text-[10px] font-[family-name:var(--font-share-tech)] tracking-widest uppercase border transition-all cursor-pointer ${
                          isFavorite
                            ? "border-neon-yellow/50 text-neon-yellow bg-neon-yellow/10"
                            : "border-dark-border text-gray-600 hover:text-gray-400 hover:border-gray-500"
                        }`}
                      >
                        {isFavorite ? "\u2605 대표 판결 선택됨" : "\u2606 대표 판결로 선택"}
                      </button>
                    )}

                    {/* Corner decorations */}
                    <div className="absolute top-2 right-3 w-2.5 h-2.5 border-t border-r" style={{ borderColor: `rgba(${judge.glowRgb}, 0.3)` }} />
                    <div className="absolute bottom-2 left-3 w-2.5 h-2.5 border-b border-l" style={{ borderColor: `rgba(${judge.glowRgb}, 0.3)` }} />
                  </div>
                );
              })}
                </div>
              </div>

            </div>

            {/* 하단 2x2 액션 버튼 그리드 */}
            {fullCourtAllDone && !isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                {/* 🔗 공유하기 */}
                <button
                  onClick={() => setShowShareModal(true)}
                  className="cyber-clip-btn w-full py-4 px-5 font-[family-name:var(--font-orbitron)] font-bold text-xs md:text-sm tracking-[0.12em] uppercase border-2 border-neon-blue/60 text-neon-blue bg-neon-blue/10 cursor-pointer hover:bg-neon-blue/20 hover:border-neon-blue transition-all duration-300"
                  style={{ boxShadow: "0 0 20px rgba(0,240,255,0.15), inset 0 0 20px rgba(0,240,255,0.04)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 0 35px rgba(0,240,255,0.3), inset 0 0 25px rgba(0,240,255,0.08)"; e.currentTarget.style.textShadow = "0 0 10px rgba(0,240,255,0.8), 0 0 25px rgba(0,240,255,0.4)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 0 20px rgba(0,240,255,0.15), inset 0 0 20px rgba(0,240,255,0.04)"; e.currentTarget.style.textShadow = "none"; }}
                >
                  {"\uD83D\uDD17"} 공유하기
                </button>

                {/* 👨‍⚖️ 국민 배심원 소집하기 */}
                {!hofSubmitted ? (
                  <button
                    onClick={handleSubmitToHallOfFame}
                    disabled={isSubmittingToHof || !selectedFavoriteJudge}
                    className={`cyber-clip-btn w-full py-4 px-5 font-[family-name:var(--font-orbitron)] font-bold text-xs md:text-sm tracking-[0.12em] uppercase border-2 transition-all duration-300 ${
                      !selectedFavoriteJudge
                        ? "border-dark-border text-gray-600 cursor-not-allowed bg-white/[0.02]"
                        : "border-neon-yellow/60 text-neon-yellow bg-neon-yellow/10 cursor-pointer hover:bg-neon-yellow/20 hover:border-neon-yellow disabled:opacity-50 disabled:cursor-not-allowed"
                    }`}
                    style={{ boxShadow: selectedFavoriteJudge ? "0 0 20px rgba(240,225,48,0.15), inset 0 0 20px rgba(240,225,48,0.04)" : undefined }}
                    onMouseEnter={(e) => { if (selectedFavoriteJudge) { e.currentTarget.style.boxShadow = "0 0 35px rgba(240,225,48,0.3), inset 0 0 25px rgba(240,225,48,0.08)"; e.currentTarget.style.textShadow = "0 0 10px rgba(240,225,48,0.8), 0 0 25px rgba(240,225,48,0.4)"; } }}
                    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = selectedFavoriteJudge ? "0 0 20px rgba(240,225,48,0.15), inset 0 0 20px rgba(240,225,48,0.04)" : "none"; e.currentTarget.style.textShadow = "none"; }}
                  >
                    {isSubmittingToHof
                      ? "소집 중..."
                      : !selectedFavoriteJudge
                        ? "\u2606 대표 판결 선택"
                        : "\uD83D\uDC68\u200D\u2696\uFE0F 국민 배심원 소집하기"}
                  </button>
                ) : <div />}

                {/* ⚖ 항소하기 */}
                {!isAppealTrial ? (
                  <button
                    onClick={handleAppealClick}
                    className="cyber-clip-btn w-full py-4 px-5 font-[family-name:var(--font-orbitron)] font-bold text-xs md:text-sm tracking-[0.12em] uppercase border-2 border-neon-pink/60 text-neon-pink bg-neon-pink/10 cursor-pointer hover:bg-neon-pink/20 hover:border-neon-pink transition-all duration-300"
                    style={{ boxShadow: "0 0 20px rgba(255,45,149,0.15), inset 0 0 20px rgba(255,45,149,0.04)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 0 35px rgba(255,45,149,0.3), inset 0 0 25px rgba(255,45,149,0.08)"; e.currentTarget.style.textShadow = "0 0 10px rgba(255,45,149,0.8), 0 0 25px rgba(255,45,149,0.4)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 0 20px rgba(255,45,149,0.15), inset 0 0 20px rgba(255,45,149,0.04)"; e.currentTarget.style.textShadow = "none"; }}
                  >
                    &#x2696; 항소하기
                  </button>
                ) : <div />}

                {/* ✎ 새 사연 작성 */}
                <button
                  onClick={handleNewStory}
                  className="cyber-clip-btn w-full py-4 px-5 font-[family-name:var(--font-orbitron)] font-bold text-xs md:text-sm tracking-[0.12em] uppercase border-2 border-neon-purple/60 text-neon-purple bg-neon-purple/10 cursor-pointer hover:bg-neon-purple/20 hover:border-neon-purple transition-all duration-300"
                  style={{ boxShadow: "0 0 20px rgba(180,74,255,0.15), inset 0 0 20px rgba(180,74,255,0.04)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 0 35px rgba(180,74,255,0.3), inset 0 0 25px rgba(180,74,255,0.08)"; e.currentTarget.style.textShadow = "0 0 10px rgba(180,74,255,0.8), 0 0 25px rgba(180,74,255,0.4)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 0 20px rgba(180,74,255,0.15), inset 0 0 20px rgba(180,74,255,0.04)"; e.currentTarget.style.textShadow = "none"; }}
                >
                  &#x270E; 새 사연 작성
                </button>
              </div>
            )}
          </section>
        )}

        {/* ===== VERDICT RESULT (streaming or complete) — single mode only ===== */}
        {trialMode === "single" && (verdict || isStreaming) && selectedJudgeData && (
          <section ref={verdictRef} className="pb-12 verdict-reveal">
            <div className="holo-line mb-8" />

            <h2 className="font-[family-name:var(--font-orbitron)] text-sm md:text-base font-bold mb-6 text-white flex items-center gap-3 uppercase tracking-wider">
              <span className="accent-bar" style={{ backgroundColor: selectedJudgeData.accentColor }} />
              <span className="text-xs mr-1" style={{ color: selectedJudgeData.accentColor }}>03</span>
              {isAppealTrial ? "2심 판결 결과" : "판결 결과"}
            </h2>

            {/* ===== Full-Width Verdict Card ===== */}
            <div
              className="cyber-clip glass-card relative p-6 md:p-8"
              style={{
                ["--card-glow-color" as string]: selectedJudgeData.accentColor,
                boxShadow: `0 0 30px rgba(${selectedJudgeData.glowRgb}, 0.15), inset 0 0 30px rgba(${selectedJudgeData.glowRgb}, 0.03)`,
              }}
            >
              {/* Judge header */}
              <div className="flex items-center gap-4 mb-6 pb-4 border-b border-white/5">
                <JudgeAvatar avatarUrl={selectedJudgeData.avatarUrl} name={selectedJudgeData.name} size={56} glowRgb={selectedJudgeData.glowRgb} />
                <div>
                  <h3
                    className="font-[family-name:var(--font-orbitron)] font-bold text-sm md:text-base uppercase tracking-wide"
                    style={{ color: selectedJudgeData.accentColor }}
                  >
                    {verdict?.judgeName ?? selectedJudgeData.name}
                  </h3>
                  <p className="font-[family-name:var(--font-share-tech)] text-[10px] text-gray-500 tracking-[0.2em]">
                    {isStreaming
                      ? (isAppealTrial ? "RENDERING_APPEAL..." : "RENDERING_VERDICT...")
                      : (isAppealTrial ? "APPEAL_VERDICT_RENDERED" : "VERDICT_RENDERED")}
                  </p>
                </div>
              </div>

              {/* Evidence image */}
              {verdict?.imageUrl && (
                <div className="mb-4">
                  <p className="font-[family-name:var(--font-share-tech)] text-[9px] text-gray-600 tracking-widest uppercase mb-2">
                    EVIDENCE_FILE
                  </p>
                  <img
                    src={verdict.imageUrl}
                    alt="증거 사진"
                    className="max-w-full max-h-[300px] object-contain border border-dark-border"
                    style={{ clipPath: "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))" }}
                  />
                </div>
              )}

              {/* Verdict text */}
              <div className="text-sm md:text-base text-gray-200 leading-relaxed whitespace-pre-wrap font-[family-name:var(--font-share-tech)]">
                {verdict ? verdict.verdict : stripMetaTags(streamingText)}
                {isStreaming && (
                  <span
                    className="inline-block w-[2px] h-[1em] ml-[2px] align-middle animate-neon-pulse"
                    style={{ backgroundColor: selectedJudgeData.accentColor }}
                  />
                )}
              </div>

              {/* Corner decorations */}
              <div className="absolute top-2 right-3 w-3 h-3 border-t border-r" style={{ borderColor: `rgba(${selectedJudgeData.glowRgb}, 0.4)` }} />
              <div className="absolute bottom-2 left-3 w-3 h-3 border-b border-l" style={{ borderColor: `rgba(${selectedJudgeData.glowRgb}, 0.4)` }} />
            </div>

            {/* 하단 2x2 액션 버튼 그리드 */}
            {verdict && !isStreaming && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                {/* 🔗 공유하기 */}
                <button
                  onClick={() => setShowShareModal(true)}
                  className="cyber-clip-btn w-full py-4 px-5 font-[family-name:var(--font-orbitron)] font-bold text-xs md:text-sm tracking-[0.12em] uppercase border-2 border-neon-blue/60 text-neon-blue bg-neon-blue/10 cursor-pointer hover:bg-neon-blue/20 hover:border-neon-blue transition-all duration-300"
                  style={{ boxShadow: "0 0 20px rgba(0,240,255,0.15), inset 0 0 20px rgba(0,240,255,0.04)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 0 35px rgba(0,240,255,0.3), inset 0 0 25px rgba(0,240,255,0.08)"; e.currentTarget.style.textShadow = "0 0 10px rgba(0,240,255,0.8), 0 0 25px rgba(0,240,255,0.4)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 0 20px rgba(0,240,255,0.15), inset 0 0 20px rgba(0,240,255,0.04)"; e.currentTarget.style.textShadow = "none"; }}
                >
                  {"\uD83D\uDD17"} 공유하기
                </button>

                {/* 👨‍⚖️ 국민 배심원 소집하기 */}
                {!hofSubmitted ? (
                  <button
                    onClick={handleSubmitToHallOfFame}
                    disabled={isSubmittingToHof}
                    className="cyber-clip-btn w-full py-4 px-5 font-[family-name:var(--font-orbitron)] font-bold text-xs md:text-sm tracking-[0.12em] uppercase border-2 border-neon-yellow/60 text-neon-yellow bg-neon-yellow/10 cursor-pointer hover:bg-neon-yellow/20 hover:border-neon-yellow transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ boxShadow: "0 0 20px rgba(240,225,48,0.15), inset 0 0 20px rgba(240,225,48,0.04)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 0 35px rgba(240,225,48,0.3), inset 0 0 25px rgba(240,225,48,0.08)"; e.currentTarget.style.textShadow = "0 0 10px rgba(240,225,48,0.8), 0 0 25px rgba(240,225,48,0.4)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 0 20px rgba(240,225,48,0.15), inset 0 0 20px rgba(240,225,48,0.04)"; e.currentTarget.style.textShadow = "none"; }}
                  >
                    {isSubmittingToHof ? "소집 중..." : "\uD83D\uDC68\u200D\u2696\uFE0F 국민 배심원 소집하기"}
                  </button>
                ) : <div />}

                {/* ⚖ 항소하기 */}
                {!isAppealTrial ? (
                  <button
                    onClick={handleAppealClick}
                    className="cyber-clip-btn w-full py-4 px-5 font-[family-name:var(--font-orbitron)] font-bold text-xs md:text-sm tracking-[0.12em] uppercase border-2 border-neon-pink/60 text-neon-pink bg-neon-pink/10 cursor-pointer hover:bg-neon-pink/20 hover:border-neon-pink transition-all duration-300"
                    style={{ boxShadow: "0 0 20px rgba(255,45,149,0.15), inset 0 0 20px rgba(255,45,149,0.04)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 0 35px rgba(255,45,149,0.3), inset 0 0 25px rgba(255,45,149,0.08)"; e.currentTarget.style.textShadow = "0 0 10px rgba(255,45,149,0.8), 0 0 25px rgba(255,45,149,0.4)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 0 20px rgba(255,45,149,0.15), inset 0 0 20px rgba(255,45,149,0.04)"; e.currentTarget.style.textShadow = "none"; }}
                  >
                    &#x2696; 항소하기
                  </button>
                ) : <div />}

                {/* ✎ 새 사연 작성 */}
                <button
                  onClick={handleNewStory}
                  className="cyber-clip-btn w-full py-4 px-5 font-[family-name:var(--font-orbitron)] font-bold text-xs md:text-sm tracking-[0.12em] uppercase border-2 border-neon-purple/60 text-neon-purple bg-neon-purple/10 cursor-pointer hover:bg-neon-purple/20 hover:border-neon-purple transition-all duration-300"
                  style={{ boxShadow: "0 0 20px rgba(180,74,255,0.15), inset 0 0 20px rgba(180,74,255,0.04)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 0 35px rgba(180,74,255,0.3), inset 0 0 25px rgba(180,74,255,0.08)"; e.currentTarget.style.textShadow = "0 0 10px rgba(180,74,255,0.8), 0 0 25px rgba(180,74,255,0.4)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 0 20px rgba(180,74,255,0.15), inset 0 0 20px rgba(180,74,255,0.04)"; e.currentTarget.style.textShadow = "none"; }}
                >
                  &#x270E; 새 사연 작성
                </button>
              </div>
            )}
          </section>
        )}

        {/* ===== ERROR DISPLAY (single mode only) ===== */}
        {trialMode === "single" && error && !verdict && (
          <section className="pb-12 verdict-reveal">
            <div className="holo-line mb-8" />

            <div className="cyber-clip glass-card relative p-6 md:p-8 border border-red-500/20" style={{ boxShadow: "0 0 30px rgba(255,50,50,0.1)" }}>
              <div className="flex items-center gap-4 mb-4">
                <div className="text-4xl">⚠️</div>
                <div>
                  <h3 className="font-[family-name:var(--font-orbitron)] font-bold text-sm md:text-base uppercase tracking-wide text-red-400">
                    시스템 오류
                  </h3>
                  <p className="font-[family-name:var(--font-share-tech)] text-[10px] text-gray-500 tracking-[0.2em]">
                    ERROR_OCCURRED
                  </p>
                </div>
              </div>

              <p className="text-sm text-red-300 font-[family-name:var(--font-share-tech)] leading-relaxed">
                {error}
              </p>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={handleRetry}
                className="cyber-clip-btn flex-1 py-3 md:py-4 font-[family-name:var(--font-orbitron)] font-bold text-xs md:text-sm tracking-[0.15em] uppercase border border-neon-blue/40 text-neon-blue bg-neon-blue/5 cursor-pointer hover:bg-neon-blue/10 transition-all duration-300"
              >
                &#x21BB; 다시 시도
              </button>
            </div>
          </section>
        )}

        {/* ===== FOOTER ===== */}
        <footer className="text-center pt-6">
          <div className="holo-line mb-5" />
          <p className="font-[family-name:var(--font-share-tech)] text-[10px] text-gray-600 tracking-[0.3em] uppercase">
            Neon Court System &copy; 2026 &mdash; All judgments are AI-generated
          </p>
        </footer>
      </div>

      <Toast message={toast.message} visible={toast.visible} />

      {/* Share Modal */}
      <ShareModal
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        shareUrl={getShareUrl()}
        onToast={showToast}
        kakaoTitle={getShareTitle()}
        kakaoDescription={getShareDescription()}
        kakaoImageUrl={(() => {
          const origin = typeof window !== "undefined" ? window.location.origin : "";
          return hofId ? `${origin}/verdict/${hofId}/opengraph-image` : `${origin}/opengraph-image`;
        })()}
      />

      {/* Appeal Modal */}
      {showAppealModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          onClick={() => setShowAppealModal(false)}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

          <div
            className="relative w-full max-w-md cyber-clip animate-modal-in"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "rgba(8, 8, 24, 0.97)",
              border: "1px solid rgba(0, 240, 255, 0.3)",
              boxShadow: "0 0 60px rgba(0,240,255,0.12), inset 0 0 60px rgba(0,240,255,0.03), 0 0 120px rgba(180,74,255,0.08)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-3">
              <div className="flex items-center gap-3">
                <span className="text-xl">&#x2696;&#xFE0F;</span>
                <h3 className="font-[family-name:var(--font-orbitron)] text-xs font-bold tracking-[0.2em] uppercase text-neon-blue">
                  항소장 작성
                </h3>
              </div>
              <button
                onClick={() => setShowAppealModal(false)}
                className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Divider */}
            <div
              className="h-px mx-6"
              style={{ background: "linear-gradient(90deg, transparent, rgba(0,240,255,0.3), transparent)" }}
            />

            {/* Content */}
            <div className="px-6 py-5">
              <p className="font-[family-name:var(--font-share-tech)] text-xs text-gray-400 mb-3 tracking-wider">
                1심 판결에 불복하시나요? 변명을 제출하면 더 강력한 2심 판결이 내려집니다.
              </p>
              <textarea
                value={appealReason}
                onChange={(e) => setAppealReason(e.target.value)}
                placeholder="판결에 불복하는 이유나 변명을 적어보세요..."
                maxLength={500}
                rows={4}
                className="w-full bg-dark-surface/80 border border-neon-blue/20 text-sm text-gray-200 placeholder-gray-600 p-4 font-[family-name:var(--font-share-tech)] focus:outline-none focus:border-neon-blue/50 transition-colors resize-none"
                style={{
                  clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))",
                  boxShadow: "inset 0 0 20px rgba(0,240,255,0.03)",
                }}
              />
              <div className="flex justify-end mt-1">
                <span className="font-[family-name:var(--font-share-tech)] text-[9px] text-gray-600 tracking-widest">
                  {appealReason.length}/500
                </span>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={() => setShowAppealModal(false)}
                className="cyber-clip-btn flex-1 py-3 font-[family-name:var(--font-orbitron)] font-bold text-[10px] tracking-[0.12em] uppercase border border-gray-700 text-gray-500 bg-transparent cursor-pointer hover:text-gray-300 hover:border-gray-500 transition-all duration-300"
              >
                취소
              </button>
              <button
                onClick={handleAppealSubmit}
                disabled={!appealReason.trim()}
                className="cyber-clip-btn flex-1 py-3 font-[family-name:var(--font-orbitron)] font-bold text-[10px] tracking-[0.12em] uppercase border border-neon-blue/50 text-neon-blue bg-neon-blue/10 cursor-pointer hover:bg-neon-blue/20 hover:border-neon-blue/70 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-neon-blue/10"
                style={{ boxShadow: appealReason.trim() ? "0 0 20px rgba(0,240,255,0.15)" : undefined }}
              >
                제출하고 2심 받기
              </button>
            </div>

            {/* Corner decorations */}
            <div className="absolute top-2 right-3 w-3 h-3 border-t border-r border-neon-blue/30" />
            <div className="absolute bottom-2 left-3 w-3 h-3 border-b border-l border-neon-blue/30" />
            <div className="absolute top-2 left-3 w-3 h-3 border-t border-l border-neon-purple/20" />
            <div className="absolute bottom-2 right-3 w-3 h-3 border-b border-r border-neon-purple/20" />
          </div>
        </div>
      )}
    </div>
  );
}
