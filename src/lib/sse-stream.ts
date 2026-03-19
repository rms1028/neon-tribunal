export interface SSEDoneEvent {
  judgeId: string;
  judgeName: string;
  imageUrl?: string;
  viralQuote?: string;
  storySummary?: string;
  tldr?: string;
  category?: string;
}

export interface SSECallbacks {
  onChunk: (accumulated: string) => void;
  onDone: (event: SSEDoneEvent, accumulated: string) => void;
  onError: (error: string) => void;
  onFirstChunk?: () => void;
}

export async function consumeSSEStream(
  response: Response,
  callbacks: SSECallbacks,
  stripMeta?: (text: string) => string,
): Promise<{ accumulated: string; receivedDone: boolean }> {
  const reader = response.body?.getReader();
  if (!reader) {
    callbacks.onError("스트리밍을 시작할 수 없습니다.");
    return { accumulated: "", receivedDone: false };
  }

  let accumulated = "";
  let receivedDone = false;
  let hasTriggeredFirst = false;
  const decoder = new TextDecoder();
  let sseBuffer = "";

  try {
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
              callbacks.onChunk(accumulated);
              if (!hasTriggeredFirst) {
                hasTriggeredFirst = true;
                callbacks.onFirstChunk?.();
              }
            } else if (event.type === "done") {
              receivedDone = true;
              const cleanAccumulated = stripMeta ? stripMeta(accumulated) : accumulated;
              callbacks.onDone(event as SSEDoneEvent, cleanAccumulated);
            } else if (event.type === "error") {
              receivedDone = true;
              callbacks.onError(event.error);
            }
          } catch { /* skip malformed */ }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  return { accumulated, receivedDone };
}
