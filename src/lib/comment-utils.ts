/** 댓글 시스템 공용 유틸리티 */

export const LIKED_COMMENTS_KEY = "neon-court-liked-comment-ids";
export const COMMENT_AUTHORS_KEY = "neon-court-comment-authors";

export const COMMENT_MODIFIERS = ["재판관", "시민", "배심원", "방청객", "목격자", "변호인", "증인"];
export const COMMENT_ICONS = ["😎", "🦊", "🐱", "🎭", "🌙", "⚡", "🔥", "🎪", "🎯", "🎲"];

export function getOrCreateCommentAuthor(verdictId: string): { nickname: string; icon: string } {
  if (typeof window === "undefined") return { nickname: "익명의 시민", icon: "😎" };
  try {
    const raw = localStorage.getItem(COMMENT_AUTHORS_KEY);
    const authors: Record<string, { nickname: string; icon: string }> = raw ? JSON.parse(raw) : {};
    if (authors[verdictId]) return authors[verdictId];

    const mod = COMMENT_MODIFIERS[Math.floor(Math.random() * COMMENT_MODIFIERS.length)];
    const num = String(Math.floor(1000 + Math.random() * 9000));
    const icon = COMMENT_ICONS[Math.floor(Math.random() * COMMENT_ICONS.length)];
    const newAuthor = { nickname: `익명의 ${mod} #${num}`, icon };
    authors[verdictId] = newAuthor;
    localStorage.setItem(COMMENT_AUTHORS_KEY, JSON.stringify(authors));
    return newAuthor;
  } catch {
    return { nickname: "익명의 시민", icon: "😎" };
  }
}

export function getLikedCommentIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(LIKED_COMMENTS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function saveLikedCommentIds(ids: Set<string>) {
  localStorage.setItem(LIKED_COMMENTS_KEY, JSON.stringify([...ids]));
}
