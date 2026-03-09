import type { VerdictRecord } from "./types";

const STORAGE_KEY = "neon-court-verdict-history";
const MAX_RECORDS = 50;

export function getHistory(): VerdictRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveVerdict(record: Omit<VerdictRecord, "id" | "createdAt">): void {
  const history = getHistory();
  const entry: VerdictRecord = {
    ...record,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  history.unshift(entry);
  if (history.length > MAX_RECORDS) {
    history.length = MAX_RECORDS;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

export function deleteVerdict(id: string): void {
  const history = getHistory().filter((r) => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}
