"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { trackEvent } from "@/lib/analytics";
import JudgeAvatar from "@/components/JudgeAvatar";

const JURY_VOTES_KEY = "neon-court-jury-votes";

type VoteType = "agree" | "disagree";

function getJuryVotes(): Record<string, VoteType> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(JURY_VOTES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveJuryVotes(votes: Record<string, VoteType>) {
  localStorage.setItem(JURY_VOTES_KEY, JSON.stringify(votes));
}

function removeJuryVote(verdictId: string) {
  const votes = getJuryVotes();
  delete votes[verdictId];
  localStorage.setItem(JURY_VOTES_KEY, JSON.stringify(votes));
}

interface JuryVoteSectionProps {
  verdictId: string;
  initialAgree: number;
  initialDisagree: number;
  judgeName: string;
  judgeEmoji: string;
  judgeAvatarUrl?: string;
  glowRgb: string;
  accentColor: string;
  isAuthor?: boolean;
}

export default function JuryVoteSection({
  verdictId,
  initialAgree,
  initialDisagree,
  judgeName,
  judgeEmoji,
  judgeAvatarUrl,
  glowRgb,
  accentColor,
  isAuthor = false,
}: JuryVoteSectionProps) {
  const [agree, setAgree] = useState(initialAgree);
  const [disagree, setDisagree] = useState(initialDisagree);
  const [myVote, setMyVote] = useState<VoteType | null>(null);
  const [isVoting, setIsVoting] = useState(false);

  useEffect(() => {
    const votes = getJuryVotes();
    if (votes[verdictId]) {
      setMyVote(votes[verdictId]);
    }
  }, [verdictId]);

  const total = agree + disagree;
  const agreePercent = total > 0 ? Math.round((agree / total) * 100) : 0;
  const disagreePercent = total > 0 ? 100 - agreePercent : 0;

  const handleVote = async (vote: VoteType) => {
    if (isVoting) return;
    trackEvent("jury_voted", { vote_type: vote, verdict_id: verdictId });
    setIsVoting(true);

    const prevVote = myVote;
    const prevAgree = agree;
    const prevDisagree = disagree;

    try {
      if (prevVote === vote) {
        // 같은 버튼 → 취소
        setMyVote(null);
        if (vote === "agree") setAgree((p) => Math.max(0, p - 1));
        else setDisagree((p) => Math.max(0, p - 1));
        removeJuryVote(verdictId);

        const res = await fetch(`/api/hall-of-fame/${verdictId}/jury-vote`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vote }),
        });
        if (!res.ok) throw new Error();
      } else if (prevVote && prevVote !== vote) {
        // 다른 버튼 → 변경
        setMyVote(vote);
        if (vote === "agree") {
          setAgree((p) => p + 1);
          setDisagree((p) => Math.max(0, p - 1));
        } else {
          setDisagree((p) => p + 1);
          setAgree((p) => Math.max(0, p - 1));
        }
        const votes = getJuryVotes();
        votes[verdictId] = vote;
        saveJuryVotes(votes);

        const res = await fetch(`/api/hall-of-fame/${verdictId}/jury-vote`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ from: prevVote, to: vote }),
        });
        if (!res.ok) throw new Error();
      } else {
        // 새 투표
        setMyVote(vote);
        if (vote === "agree") setAgree((p) => p + 1);
        else setDisagree((p) => p + 1);
        const votes = getJuryVotes();
        votes[verdictId] = vote;
        saveJuryVotes(votes);

        const res = await fetch(`/api/hall-of-fame/${verdictId}/jury-vote`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vote }),
        });
        if (!res.ok) throw new Error();
      }
    } catch {
      // rollback
      setMyVote(prevVote);
      setAgree(prevAgree);
      setDisagree(prevDisagree);
      if (prevVote) {
        const votes = getJuryVotes();
        votes[verdictId] = prevVote;
        saveJuryVotes(votes);
      } else {
        removeJuryVote(verdictId);
      }
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div
      className="glass-card cyber-clip relative p-5 md:p-6"
      style={{
        boxShadow: `0 0 30px rgba(${glowRgb}, 0.08), inset 0 0 30px rgba(${glowRgb}, 0.02)`,
      }}
    >
      {/* Corner decorations */}
      <div
        className="absolute top-2 right-3 w-2.5 h-2.5 border-t border-r"
        style={{ borderColor: `rgba(${glowRgb}, 0.3)` }}
      />
      <div
        className="absolute bottom-2 left-3 w-2.5 h-2.5 border-b border-l"
        style={{ borderColor: `rgba(${glowRgb}, 0.3)` }}
      />

      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">&#9878;</span>
        <h3 className="font-[family-name:var(--font-orbitron)] text-[11px] md:text-xs font-bold tracking-[0.2em] uppercase text-gray-300">
          국민 배심원단
        </h3>
        <span className="font-[family-name:var(--font-share-tech)] text-[9px] text-gray-600 tracking-widest">
          JURY_VOTE
        </span>
      </div>

      {/* Question or Author notice */}
      {isAuthor ? (
        <div
          className="mb-6 py-4 px-4 text-center border rounded-sm"
          style={{
            borderColor: `rgba(${glowRgb}, 0.25)`,
            background: `rgba(${glowRgb}, 0.03)`,
            boxShadow: `inset 0 0 30px rgba(${glowRgb}, 0.03)`,
          }}
        >
          <p className="font-[family-name:var(--font-share-tech)] text-xs tracking-wide leading-relaxed" style={{ color: accentColor }}>
            &#9878;&#65039; 당신의 사연입니다. 배심원단의 투표 결과를 지켜보세요!
          </p>
        </div>
      ) : (
        <>
          <p className="font-[family-name:var(--font-share-tech)] text-xs text-gray-400 mb-4 tracking-wide">
            이 판결에 동의하시나요?
          </p>

          {/* Vote buttons */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => handleVote("agree")}
              disabled={isVoting}
              className={`cyber-clip-btn flex-1 py-3 font-[family-name:var(--font-orbitron)] font-bold text-xs tracking-[0.12em] uppercase border transition-all duration-300 cursor-pointer disabled:cursor-not-allowed ${
                myVote === "agree"
                  ? "border-neon-green/60 text-neon-green bg-neon-green/15"
                  : myVote === "disagree"
                    ? "border-dark-border text-gray-600 hover:text-gray-400 hover:border-gray-500"
                    : "border-neon-green/30 text-neon-green/80 bg-neon-green/5 hover:bg-neon-green/10"
              }`}
              style={{
                boxShadow:
                  myVote === "agree"
                    ? "0 0 20px rgba(57,255,20,0.15), inset 0 0 20px rgba(57,255,20,0.05)"
                    : undefined,
              }}
            >
              <span className="flex items-center justify-center gap-2">
                <span className="text-base">&#128077;</span>
                동의
                {myVote === "agree" && (
                  <span className="text-[9px] font-normal tracking-widest opacity-70">&#10003;</span>
                )}
              </span>
            </button>

            <button
              onClick={() => handleVote("disagree")}
              disabled={isVoting}
              className={`cyber-clip-btn flex-1 py-3 font-[family-name:var(--font-orbitron)] font-bold text-xs tracking-[0.12em] uppercase border transition-all duration-300 cursor-pointer disabled:cursor-not-allowed ${
                myVote === "disagree"
                  ? "border-neon-pink/60 text-neon-pink bg-neon-pink/15"
                  : myVote === "agree"
                    ? "border-dark-border text-gray-600 hover:text-gray-400 hover:border-gray-500"
                    : "border-neon-pink/30 text-neon-pink/80 bg-neon-pink/5 hover:bg-neon-pink/10"
              }`}
              style={{
                boxShadow:
                  myVote === "disagree"
                    ? "0 0 20px rgba(255,45,149,0.15), inset 0 0 20px rgba(255,45,149,0.05)"
                    : undefined,
              }}
            >
              <span className="flex items-center justify-center gap-2">
                <span className="text-base">&#128078;</span>
                반대
                {myVote === "disagree" && (
                  <span className="text-[9px] font-normal tracking-widest opacity-70">&#10003;</span>
                )}
              </span>
            </button>
          </div>
        </>
      )}

      {/* Divider with label */}
      <div className="flex items-center gap-3 mb-5">
        <div
          className="flex-1 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, rgba(${glowRgb}, 0.25))`,
          }}
        />
        <span className="font-[family-name:var(--font-share-tech)] text-[9px] text-gray-500 tracking-[0.2em] uppercase whitespace-nowrap">
          AI 판사 vs 배심원단
        </span>
        <div
          className="flex-1 h-px"
          style={{
            background: `linear-gradient(90deg, rgba(${glowRgb}, 0.25), transparent)`,
          }}
        />
      </div>

      {/* Comparison graph */}
      <div className="space-y-3">
        {/* AI Judge bar */}
        <div className="flex items-center gap-3">
          {judgeAvatarUrl ? (
            <JudgeAvatar avatarUrl={judgeAvatarUrl} name={judgeName} size={20} className="w-6 shrink-0" />
          ) : (
            <span className="text-sm w-6 text-center shrink-0">{judgeEmoji}</span>
          )}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="font-[family-name:var(--font-share-tech)] text-[10px] tracking-wider" style={{ color: accentColor }}>
                {judgeName}
              </span>
              <span className="font-[family-name:var(--font-share-tech)] text-[9px] text-gray-500 tracking-widest">
                판결 완료
              </span>
            </div>
            <div className="h-2 rounded-sm overflow-hidden bg-white/5">
              <div
                className="h-full rounded-sm transition-all duration-500"
                style={{
                  width: "100%",
                  background: `linear-gradient(90deg, ${accentColor}, rgba(${glowRgb}, 0.4))`,
                  boxShadow: `0 0 8px rgba(${glowRgb}, 0.3)`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Agree bar */}
        <div className="flex items-center gap-3">
          <span className="text-sm w-6 text-center shrink-0">&#128077;</span>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="font-[family-name:var(--font-share-tech)] text-[10px] text-neon-green/80 tracking-wider">
                동의
              </span>
              <span className="font-[family-name:var(--font-share-tech)] text-[10px] text-gray-500 tracking-wider">
                {total > 0 ? `${agreePercent}% (${agree}명)` : "0명"}
              </span>
            </div>
            <div className="h-2 rounded-sm overflow-hidden bg-white/5">
              <div
                className="h-full rounded-sm transition-all duration-700 ease-out"
                style={{
                  width: total > 0 ? `${agreePercent}%` : "0%",
                  background: "linear-gradient(90deg, #39ff14, rgba(57,255,20,0.4))",
                  boxShadow: agreePercent > 0 ? "0 0 8px rgba(57,255,20,0.3)" : undefined,
                }}
              />
            </div>
          </div>
        </div>

        {/* Disagree bar */}
        <div className="flex items-center gap-3">
          <span className="text-sm w-6 text-center shrink-0">&#128078;</span>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="font-[family-name:var(--font-share-tech)] text-[10px] text-neon-pink/80 tracking-wider">
                반대
              </span>
              <span className="font-[family-name:var(--font-share-tech)] text-[10px] text-gray-500 tracking-wider">
                {total > 0 ? `${disagreePercent}% (${disagree}명)` : "0명"}
              </span>
            </div>
            <div className="h-2 rounded-sm overflow-hidden bg-white/5">
              <div
                className="h-full rounded-sm transition-all duration-700 ease-out"
                style={{
                  width: total > 0 ? `${disagreePercent}%` : "0%",
                  background: "linear-gradient(90deg, #ff2d95, rgba(255,45,149,0.4))",
                  boxShadow: disagreePercent > 0 ? "0 0 8px rgba(255,45,149,0.3)" : undefined,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Total count */}
      <div className="mt-4 text-center">
        {total > 0 ? (
          <span className="font-[family-name:var(--font-share-tech)] text-[10px] text-gray-500 tracking-[0.2em]">
            총 {total}명 참여
          </span>
        ) : (
          <span className="font-[family-name:var(--font-share-tech)] text-[10px] text-gray-600 tracking-wider">
            아직 투표가 없습니다. 첫 배심원이 되어보세요!
          </span>
        )}
      </div>

      {/* Hall of Fame shortcut — shown after voting or for author */}
      {(myVote || isAuthor) && (
        <Link
          href="/hall-of-fame"
          className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 font-[family-name:var(--font-share-tech)] text-[11px] tracking-wider border transition-all duration-200 hover:bg-neon-yellow/10"
          style={{
            borderColor: "rgba(240,225,48,0.25)",
            color: "#f0e130",
            background: "rgba(240,225,48,0.03)",
          }}
        >
          {"\uD83D\uDCE2"} 공개 재판소 바로가기
        </Link>
      )}
    </div>
  );
}
