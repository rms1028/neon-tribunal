"use client";

import { useState, useRef, useEffect } from "react";
import { judges } from "@/lib/judges";
import type { JudgeResponse, JudgeErrorResponse, TrialMode, FullCourtJudgeResult } from "@/lib/types";
import { saveVerdict } from "@/lib/history";
import { containsProfanity, PROFANITY_ERROR_MESSAGE } from "@/lib/content-filter";
import { stripMetaTags, fileToBase64 } from "@/lib/verdict-utils";
import Toast from "@/components/Toast";
import ShareModal from "@/components/ShareModal";
import { trackEvent } from "@/lib/analytics";
import HeroSection from "@/components/main/HeroSection";
import Footer from "@/components/main/Footer";
import AppealModal from "@/components/main/AppealModal";
import ErrorDisplay from "@/components/main/ErrorDisplay";
import TrialModeToggle from "@/components/main/TrialModeToggle";
import StoryInputSection from "@/components/main/StoryInputSection";
import JudgeSelectionSection from "@/components/main/JudgeSelectionSection";
import SubmitButton from "@/components/main/SubmitButton";
import FullCourtResultsSection from "@/components/main/FullCourtResultsSection";
import SingleVerdictSection from "@/components/main/SingleVerdictSection";

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
  const [clientOrigin, setClientOrigin] = useState("");
  const contentRef = useRef<HTMLDivElement>(null);
  const verdictRef = useRef<HTMLDivElement>(null);
  const actionButtonsRef = useRef<HTMLDivElement>(null);
  const appealDataRef = useRef<{ reason: string; originalVerdict: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setClientOrigin(window.location.origin);
  }, []);

  // 스트리밍 중 레이아웃이 변해도 확실히 판결 섹션까지 도달하도록 반복 스크롤
  const scrollToVerdict = () => {
    const el = verdictRef.current;
    if (!el) return;
    const delays = [0, 300, 700, 1200];
    delays.forEach((ms) => {
      setTimeout(() => {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, ms);
    });
  };

  // 판결 완료 후 액션 버튼 영역까지 스크롤
  const scrollToActionButtons = () => {
    const el = actionButtonsRef.current;
    if (!el) return;
    setTimeout(() => {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 400);
  };

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
                  setTimeout(() => scrollToVerdict(), 150);
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
                  tldr: event.tldr,
                  category: event.category,
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
        const tldrMatch = accumulated.match(/\[\[TLDR:\s*(.+?)\]\]/);
        const tldr = tldrMatch ? tldrMatch[1].trim() : undefined;
        const judgeResponse: JudgeResponse = {
          verdict: cleanVerdict,
          judgeId: selectedJudge!,
          judgeName: selectedJudgeData?.name || "",
          viralQuote,
          tldr,
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
                    setTimeout(() => scrollToVerdict(), 150);
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
                    tldr: event.tldr,
                    category: event.category,
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
          const tldrMatch = accumulated.match(/\[\[TLDR:\s*(.+?)\]\]/);
          const tldr = tldrMatch ? tldrMatch[1].trim() : undefined;
          setFullCourtResults(prev => ({
            ...prev,
            [judge.id]: { judgeId: judge.id, judgeName: judge.name, status: "success", verdict: cleanVerdict, viralQuote, tldr },
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
                  [judgeId]: { judgeId, judgeName: event.judgeName || judge.name, status: "success", verdict: cleanVerdict, imageUrl: event.imageUrl, viralQuote: event.viralQuote, storySummary: event.storySummary, tldr: event.tldr, category: event.category },
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
        const tldrMatch = accumulated.match(/\[\[TLDR:\s*(.+?)\]\]/);
        const tldr = tldrMatch ? tldrMatch[1].trim() : undefined;
        setFullCourtResults(prev => ({
          ...prev,
          [judgeId]: { judgeId, judgeName: judge.name, status: "success", verdict: cleanVerdict, viralQuote, tldr },
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

    let payload: { judgeId: string; judgeName: string; story: string; verdict: string; imageUrl?: string; viralQuote?: string; tldr?: string; category?: string };

    if (trialMode === "full-court") {
      if (!selectedFavoriteJudge) return;
      const r = fullCourtResults[selectedFavoriteJudge];
      if (!r || r.status !== "success") return;
      payload = { judgeId: r.judgeId, judgeName: r.judgeName, story: story.trim(), verdict: r.verdict!, imageUrl: r.imageUrl, viralQuote: r.viralQuote, tldr: r.tldr, category: r.category };
    } else {
      if (!verdict) return;
      payload = { judgeId: verdict.judgeId, judgeName: verdict.judgeName, story: story.trim(), verdict: verdict.verdict, imageUrl: verdict.imageUrl, viralQuote: verdict.viralQuote, tldr: verdict.tldr, category: verdict.category };
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
          // Save delete token for this verdict
          if (data.deleteToken) {
            const tokens = JSON.parse(localStorage.getItem("neon-court-delete-tokens") || "{}");
            tokens[data.id] = data.deleteToken;
            localStorage.setItem("neon-court-delete-tokens", JSON.stringify(tokens));
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
    return hofId ? `${clientOrigin}/verdict/${hofId}` : clientOrigin;
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

  // 판결 완료 시 액션 버튼 영역으로 자동 스크롤
  useEffect(() => {
    // 싱글 모드: verdict가 세팅되고 스트리밍이 끝났을 때
    if (trialMode === "single" && verdict && !isStreaming) {
      scrollToActionButtons();
    }
    // 풀코트 모드: 모든 판결이 완료되었을 때
    if (trialMode === "full-court" && fullCourtAllDone) {
      scrollToActionButtons();
    }
  }, [verdict, isStreaming, fullCourtAllDone, trialMode]);

  return (
    <div className="min-h-screen cyber-grid crt-overlay relative overflow-hidden">
      {/* Ambient background glow orbs */}
      <div className="fixed top-[-200px] left-1/4 w-[600px] h-[600px] bg-neon-purple/10 rounded-full blur-[200px] pointer-events-none" />
      <div className="fixed bottom-[-150px] right-1/4 w-[500px] h-[500px] bg-neon-blue/10 rounded-full blur-[180px] pointer-events-none" />
      <div className="fixed top-1/2 left-[-100px] w-[400px] h-[400px] bg-neon-pink/5 rounded-full blur-[150px] pointer-events-none" />

      <HeroSection onScrollToContent={scrollToContent} />

      {/* ===== MAIN CONTENT: FULL WIDTH ===== */}
      <div ref={contentRef} className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 md:px-10 py-4 md:py-16">
        <div className="holo-line mb-4 md:mb-10" />

        <TrialModeToggle
          trialMode={trialMode}
          onSelectSingle={() => { setTrialMode("single"); setFullCourtResults({}); setSelectedFavoriteJudge(null); }}
          onSelectFullCourt={() => { setTrialMode("full-court"); setSelectedJudge(null); setVerdict(null); setStreamingText(""); setIsStreaming(false); }}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 lg:gap-10 mb-4 md:mb-12">
          <StoryInputSection
            story={story}
            onStoryChange={(v) => { setStory(v); if (validationError) setValidationError(null); }}
            imageFile={imageFile}
            imagePreview={imagePreview}
            onImageSelect={handleImageSelect}
            onImageRemove={handleImageRemove}
            validationError={validationError}
            trimmedLength={trimmedLength}
            fileInputRef={fileInputRef}
          />
          <JudgeSelectionSection
            trialMode={trialMode}
            selectedJudge={selectedJudge}
            onJudgeSelect={setSelectedJudge}
          />
        </div>

        <SubmitButton
          isReady={isReady}
          isLoading={isLoading}
          trialMode={trialMode}
          onSubmit={trialMode === "full-court" ? handleSubmitFullCourt : handleSubmit}
          isAppealTrial={isAppealTrial}
          fullCourtCompletedCount={fullCourtCompletedCount}
          judgesCount={judges.length}
          story={story}
          trimmedLength={trimmedLength}
        />

        {trialMode === "full-court" && fullCourtHasResults && (
          <FullCourtResultsSection
            verdictRef={verdictRef}
            actionButtonsRef={actionButtonsRef}
            fullCourtResults={fullCourtResults}
            fullCourtAllDone={fullCourtAllDone}
            fullCourtCompletedCount={fullCourtCompletedCount}
            isLoading={isLoading}
            isAppealTrial={isAppealTrial}
            selectedFavoriteJudge={selectedFavoriteJudge}
            onSelectFavoriteJudge={setSelectedFavoriteJudge}
            onRetrySingleJudge={retrySingleJudge}
            onShare={() => setShowShareModal(true)}
            onSubmitToHoF={handleSubmitToHallOfFame}
            isSubmittingToHof={isSubmittingToHof}
            hofSubmitted={hofSubmitted}
            onAppealClick={handleAppealClick}
            onNewStory={handleNewStory}
          />
        )}

        {trialMode === "single" && (verdict || isStreaming) && selectedJudgeData && (
          <SingleVerdictSection
            verdictRef={verdictRef}
            actionButtonsRef={actionButtonsRef}
            verdict={verdict}
            isStreaming={isStreaming}
            streamingText={streamingText}
            selectedJudgeData={selectedJudgeData}
            isAppealTrial={isAppealTrial}
            onShare={() => setShowShareModal(true)}
            onSubmitToHoF={handleSubmitToHallOfFame}
            isSubmittingToHof={isSubmittingToHof}
            hofSubmitted={hofSubmitted}
            onAppealClick={handleAppealClick}
            onNewStory={handleNewStory}
          />
        )}

        {trialMode === "single" && error && !verdict && (
          <ErrorDisplay error={error} onRetry={handleRetry} />
        )}

        <Footer />
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
        kakaoImageUrl={hofId ? `${clientOrigin}/verdict/${hofId}/opengraph-image` : `${clientOrigin}/opengraph-image`}
      />

      <AppealModal
        open={showAppealModal}
        appealReason={appealReason}
        onAppealReasonChange={setAppealReason}
        onClose={() => setShowAppealModal(false)}
        onSubmit={handleAppealSubmit}
      />
    </div>
  );
}
