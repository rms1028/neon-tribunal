export type Reaction = "fire" | "like" | "clap" | "think"
export type SortMode = "hot" | "deep" | "recent"

export type FactCheck = {
  verdict: "확인됨" | "의심" | "거짓" | "판단불가"
  explanation: string
}

export type CommentPoll = {
  pollId: string
  question: string
  proCount: number
  conCount: number
}

export type BattleComment = {
  id: string
  content: string
  created_at: string | null
  side: "pro" | "con" | null // kept for DB compat, not displayed
  userId?: string
  parentId?: string | null
  displayName: string
  likeCount: number   // 💡
  fireCount: number   // 🔥
  clapCount: number   // 👏
  thinkCount: number  // 🤔
  dislikeCount: number // legacy compat
  updatedAt?: string | null
  isDeleted?: boolean
  isPinned?: boolean
  customTitle?: string | null
  poll?: CommentPoll | null
}
