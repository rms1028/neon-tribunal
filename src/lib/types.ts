export interface JudgeRequest {
  story: string;
  judgeId: string;
}

export interface JudgeResponse {
  verdict: string;
  judgeId: string;
  judgeName: string;
  imageUrl?: string;
  viralQuote?: string;
  storySummary?: string;
  tldr?: string;
  category?: string;
}

export interface JudgeErrorResponse {
  error: string;
}

// --- Full Court (전원 재판) ---

export type TrialMode = "single" | "full-court";

export interface FullCourtJudgeResult {
  judgeId: string;
  judgeName: string;
  status: "loading" | "success" | "error";
  verdict?: string;
  error?: string;
  imageUrl?: string;
  viralQuote?: string;
  storySummary?: string;
  tldr?: string;
  category?: string;
}

// --- Verdict History ---

export interface VerdictRecord {
  id: string;
  story: string;
  judgeId: string;
  judgeName: string;
  verdict: string;
  imageUrl?: string;
  viralQuote?: string;
  createdAt: string;
}

// --- Hall of Fame ---

export interface HallOfFameEntry {
  id: string;
  judge_id: string;
  judge_name: string;
  story: string;
  verdict: string;
  likes: number;
  jury_agree: number;
  jury_disagree: number;
  created_at: string;
  image_url?: string;
  viral_quote?: string;
  tldr?: string;
  og_image_url?: string;
  comment_count?: number;
  author_nickname?: string;
  author_icon?: string;
  category?: string;
}

export interface HallOfFameSubmitRequest {
  judgeId: string;
  judgeName: string;
  story: string;
  verdict: string;
  imageUrl?: string;
  viralQuote?: string;
  tldr?: string;
  category?: string;
}

export interface HallOfFameListResponse {
  entries: HallOfFameEntry[];
  hasMore: boolean;
}

export interface HallOfFameLikeResponse {
  likes: number;
}

export type SortMode = "newest" | "popular";
export type VoteType = "agree" | "disagree";

// --- Verdict Comments ---

export interface VerdictComment {
  id: string;
  verdict_id: string;
  nickname: string;
  content: string;
  likes: number;
  created_at: string;
  vote_stance?: "agree" | "disagree" | null;
  parent_id?: string | null;
}
