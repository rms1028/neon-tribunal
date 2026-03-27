/** hall-of-fame localStorage 래퍼 유틸리티 */

export type VoteType = "agree" | "disagree";
export type SortMode = "newest" | "popular";

const LIKED_KEY = "neon-court-liked-ids";
const MY_VERDICTS_KEY = "neon-court-my-verdicts";
const JURY_VOTES_KEY = "neon-court-jury-votes";
const BOOKMARKS_KEY = "neon-court-bookmarks";

export function getLikedIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(LIKED_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function saveLikedIds(ids: Set<string>) {
  localStorage.setItem(LIKED_KEY, JSON.stringify([...ids]));
}

export function getMyVerdicts(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(MY_VERDICTS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function getDeleteTokens(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem("neon-court-delete-tokens");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function getJuryVotes(): Record<string, VoteType> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(JURY_VOTES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveJuryVotes(votes: Record<string, VoteType>) {
  localStorage.setItem(JURY_VOTES_KEY, JSON.stringify(votes));
}

export function removeJuryVote(verdictId: string) {
  const votes = getJuryVotes();
  delete votes[verdictId];
  localStorage.setItem(JURY_VOTES_KEY, JSON.stringify(votes));
}

export function getBookmarkedIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(BOOKMARKS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function saveBookmarkedIds(ids: Set<string>) {
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify([...ids]));
}
