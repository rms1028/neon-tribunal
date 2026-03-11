import { useState, useEffect, useRef } from "react";

const NEON_GREEN = "#39FF14";
const NEON_PINK = "#FF2E97";
const NEON_YELLOW = "#FFE600";
const DARK_BG = "#0a0a0f";
const CARD_BG = "#111118";
const CARD_BORDER = "#1a1a2e";

// Glow keyframes injected via style tag
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Black+Han+Sans&family=Noto+Sans+KR:wght@300;400;500;700;900&family=JetBrains+Mono:wght@400;700&display=swap');

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body { background: ${DARK_BG}; }

    @keyframes pulseGlow {
      0%, 100% { box-shadow: 0 0 8px rgba(57,255,20,0.3); }
      50% { box-shadow: 0 0 20px rgba(57,255,20,0.6); }
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes countUp {
      from { opacity: 0; transform: scale(0.5); }
      to { opacity: 1; transform: scale(1); }
    }

    @keyframes shakeNo {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-4px); }
      75% { transform: translateX(4px); }
    }

    @keyframes ripple {
      0% { transform: scale(0); opacity: 0.6; }
      100% { transform: scale(4); opacity: 0; }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes barGrow {
      from { width: 0%; }
    }

    .vote-btn:active {
      transform: scale(0.96);
    }

    .comment-item:hover {
      background: rgba(57,255,20,0.03);
    }

    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: #555; }
  `}</style>
);

// ─── 아이콘 컴포넌트들 ───
const FireIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={NEON_GREEN} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
  </svg>
);

const ThumbUpIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"/>
  </svg>
);

const ThumbDownIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 14V2"/><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z"/>
  </svg>
);

const HeartIcon = ({ size = 16, filled = false }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? NEON_PINK : "none"} stroke={NEON_PINK} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
  </svg>
);

const ChatIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const GavelIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={NEON_YELLOW} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m14 13-7.5 7.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L11 10"/>
    <path d="m16 16 6-6"/><path d="m8 8 6-6"/><path d="m9 7 8 8"/><path d="m21 11-8-8"/>
  </svg>
);

const ClockIcon = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);

const ChevronLeft = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m15 18-6-6 6-6"/>
  </svg>
);

const SendIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>
  </svg>
);

// ─── 데이터 ───
const JUDGES = {
  cyber: { name: "사이버 렉카", emoji: "🤖", color: NEON_GREEN },
  justice: { name: "저스티스 제로", emoji: "⚖️", color: "#00BFFF" },
  heart: { name: "하트 비트", emoji: "💗", color: NEON_PINK },
  neon: { name: "형사 네온", emoji: "🔮", color: "#A855F7" },
};

const MOCK_CASES = [
  {
    id: 1,
    judge: "cyber",
    caseTitle: "ㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋ",
    verdict: "그만 쓰면서 판결? 염치도 없나, 인마?",
    description: "지금 나랑 장난하나? 사연을 'ㅋ'으로 때우려는 폐기, 박수는 쳐줄게. 어이가 없어서 말이야...",
    agreeCount: 847,
    disagreeCount: 123,
    totalVotes: 970,
    comments: [
      { id: 1, user: "익명_2847", text: "ㅋㅋㅋ 렉카 화났다", time: "3분 전", likes: 24 },
      { id: 2, user: "판결봇싫어", text: "이건 좀 억울한데... 재미로 쓴 건데", time: "5분 전", likes: 8 },
      { id: 3, user: "네온시민", text: "AI 판사님 매워요 🔥", time: "12분 전", likes: 56 },
      { id: 4, user: "재판소단골", text: "동의 100% 갈 기세", time: "15분 전", likes: 31 },
    ],
    time: "2일 전",
    hearts: 8,
    isHot: true,
  },
  {
    id: 2,
    judge: "justice",
    caseTitle: "회사에서 월급 3개월 밀렸습니다",
    verdict: "사용자의 노동권이 심각하게 침해되었습니다. 즉시 노동청 신고를 권고합니다.",
    description: "중소기업에서 일하는데 사장이 계속 다음 달에 준다고만 하고 3개월째 월급을 안 줍니다. 퇴사하면 밀린 월급도 못 받을까 봐 불안합니다.",
    agreeCount: 1523,
    disagreeCount: 12,
    totalVotes: 1535,
    comments: [
      { id: 1, user: "직장인A", text: "노동청 고고! 증거 꼭 모아두세요", time: "1시간 전", likes: 89 },
      { id: 2, user: "법알못", text: "이런 건 진짜 도움이 되네", time: "2시간 전", likes: 45 },
    ],
    time: "5시간 전",
    hearts: 234,
    isHot: true,
  },
  {
    id: 3,
    judge: "heart",
    caseTitle: "남자친구가 여사친이랑 둘이 영화 봤대요",
    verdict: "감정은 이해하지만, 신뢰가 부족한 관계는 대화로 풀어야 해요 💕",
    description: "3년 사귄 남자친구가 여자사친이랑 둘이 영화 봤다고 합니다. 미리 말은 했는데 기분이 나쁜 건 어쩔 수 없네요.",
    agreeCount: 678,
    disagreeCount: 445,
    totalVotes: 1123,
    comments: [
      { id: 1, user: "연애마스터", text: "이건 진짜 의견이 갈리네", time: "30분 전", likes: 12 },
    ],
    time: "1일 전",
    hearts: 67,
    isHot: false,
  },
  {
    id: 4,
    judge: "neon",
    caseTitle: "친구가 빌린 돈 100만원을 안 갚습니다",
    verdict: "우정과 돈은 별개입니다. 차용증 없이 빌려준 본인에게도 책임이 있습니다.",
    description: "2년 전에 친구에게 급하다고 해서 100만원 빌려줬는데, 계속 미루기만 합니다. 독촉하면 사이가 멀어질 것 같아서 고민입니다.",
    agreeCount: 892,
    disagreeCount: 234,
    totalVotes: 1126,
    comments: [
      { id: 1, user: "현실주의자", text: "차용증 없으면 포기하는 게...", time: "4시간 전", likes: 67 },
      { id: 2, user: "돈돈돈", text: "100만원으로 친구 본 거다 생각해", time: "5시간 전", likes: 43 },
      { id: 3, user: "법대생", text: "카톡 내역도 증거 됩니다!", time: "6시간 전", likes: 91 },
    ],
    time: "3일 전",
    hearts: 156,
    isHot: false,
  },
];

// ─── 투표 바 컴포넌트 ───
const VoteBar = ({ agree, disagree, total, compact = false }) => {
  const pct = total > 0 ? Math.round((agree / total) * 100) : 50;
  const h = compact ? 6 : 10;

  return (
    <div style={{ width: "100%" }}>
      <div style={{
        display: "flex", justifyContent: "space-between", marginBottom: 6,
        fontFamily: "'JetBrains Mono', monospace", fontSize: compact ? 11 : 13,
      }}>
        <span style={{ color: NEON_GREEN }}>👍 동의 {pct}%</span>
        <span style={{ color: NEON_PINK }}>반대 {100 - pct}% 👎</span>
      </div>
      <div style={{
        width: "100%", height: h, background: "rgba(255,46,151,0.3)",
        borderRadius: 99, overflow: "hidden", position: "relative",
      }}>
        <div style={{
          width: `${pct}%`, height: "100%", borderRadius: 99,
          background: `linear-gradient(90deg, ${NEON_GREEN}, #00ff88)`,
          boxShadow: `0 0 12px rgba(57,255,20,0.5)`,
          animation: "barGrow 0.8s ease-out",
          transition: "width 0.5s ease",
        }} />
      </div>
      {!compact && (
        <div style={{
          textAlign: "center", marginTop: 6,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11, color: "#666",
        }}>
          총 {total.toLocaleString()}명 참여
        </div>
      )}
    </div>
  );
};

// ─── 투표 버튼 ───
const VoteButtons = ({ onVote, voted, compact = false }) => {
  const btnBase = {
    flex: 1, border: "none", borderRadius: 12, cursor: "pointer",
    fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 700,
    fontSize: compact ? 14 : 16, padding: compact ? "10px 0" : "14px 0",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    transition: "all 0.2s ease", position: "relative", overflow: "hidden",
  };

  return (
    <div style={{ display: "flex", gap: 10, marginTop: compact ? 8 : 12 }}>
      <button
        className="vote-btn"
        onClick={(e) => { e.stopPropagation(); onVote("agree"); }}
        style={{
          ...btnBase,
          background: voted === "agree"
            ? `linear-gradient(135deg, ${NEON_GREEN}, #00cc44)`
            : "rgba(57,255,20,0.08)",
          color: voted === "agree" ? "#000" : NEON_GREEN,
          border: `1.5px solid ${voted === "agree" ? NEON_GREEN : "rgba(57,255,20,0.25)"}`,
          animation: voted === "agree" ? "pulseGlow 2s infinite" : "none",
        }}
      >
        <ThumbUpIcon size={compact ? 16 : 18} />
        {voted === "agree" ? "동의함 ✓" : "동의"}
      </button>
      <button
        className="vote-btn"
        onClick={(e) => { e.stopPropagation(); onVote("disagree"); }}
        style={{
          ...btnBase,
          background: voted === "disagree"
            ? `linear-gradient(135deg, ${NEON_PINK}, #cc0044)`
            : "rgba(255,46,151,0.08)",
          color: voted === "disagree" ? "#fff" : NEON_PINK,
          border: `1.5px solid ${voted === "disagree" ? NEON_PINK : "rgba(255,46,151,0.25)"}`,
        }}
      >
        <ThumbDownIcon size={compact ? 16 : 18} />
        {voted === "disagree" ? "반대함 ✓" : "반대"}
      </button>
    </div>
  );
};

// ─── 댓글 아이템 ───
const CommentItem = ({ comment, onLike }) => {
  const [liked, setLiked] = useState(false);

  return (
    <div className="comment-item" style={{
      padding: "12px 16px", borderRadius: 10, transition: "background 0.2s",
      borderBottom: "1px solid rgba(255,255,255,0.04)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
          color: NEON_GREEN, opacity: 0.7,
        }}>
          {comment.user}
        </span>
        <span style={{
          display: "flex", alignItems: "center", gap: 4,
          fontSize: 11, color: "#555",
        }}>
          <ClockIcon /> {comment.time}
        </span>
      </div>
      <p style={{
        fontFamily: "'Noto Sans KR', sans-serif", fontSize: 14,
        color: "#ccc", lineHeight: 1.6, margin: 0,
      }}>
        {comment.text}
      </p>
      <button
        onClick={() => { setLiked(!liked); }}
        style={{
          background: "none", border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 4, marginTop: 8,
          fontSize: 12, color: liked ? NEON_PINK : "#555",
          fontFamily: "'JetBrains Mono', monospace",
          transition: "color 0.2s",
        }}
      >
        <HeartIcon size={14} filled={liked} />
        {comment.likes + (liked ? 1 : 0)}
      </button>
    </div>
  );
};

// ─── 댓글 섹션 (인라인) ───
const InlineComments = ({ comments, caseId }) => {
  const [text, setText] = useState("");
  const [localComments, setLocalComments] = useState(comments);
  const [expanded, setExpanded] = useState(false);

  const visibleComments = expanded ? localComments : localComments.slice(0, 2);

  const handleSubmit = () => {
    if (!text.trim()) return;
    setLocalComments([
      { id: Date.now(), user: "나", text: text.trim(), time: "방금", likes: 0 },
      ...localComments,
    ]);
    setText("");
  };

  return (
    <div style={{
      marginTop: 16, borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 12,
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 6, marginBottom: 12,
        fontFamily: "'Noto Sans KR', sans-serif", fontSize: 13,
        color: "#888", fontWeight: 500,
      }}>
        <ChatIcon size={14} />
        배심원 의견 {localComments.length}건
      </div>

      {/* 댓글 입력 */}
      <div style={{
        display: "flex", gap: 8, marginBottom: 12,
      }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="의견을 남겨주세요..."
          style={{
            flex: 1, background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 10, padding: "10px 14px",
            color: "#ddd", fontSize: 13,
            fontFamily: "'Noto Sans KR', sans-serif",
            outline: "none", transition: "border-color 0.2s",
          }}
          onFocus={(e) => e.target.style.borderColor = "rgba(57,255,20,0.4)"}
          onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
        />
        <button
          onClick={handleSubmit}
          style={{
            background: text.trim() ? NEON_GREEN : "rgba(255,255,255,0.06)",
            color: text.trim() ? "#000" : "#555",
            border: "none", borderRadius: 10, width: 42, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.2s",
          }}
        >
          <SendIcon size={16} />
        </button>
      </div>

      {/* 댓글 목록 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {visibleComments.map((c) => (
          <CommentItem key={c.id} comment={c} />
        ))}
      </div>

      {localComments.length > 2 && (
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: NEON_GREEN, fontSize: 13, padding: "8px 0",
            fontFamily: "'Noto Sans KR', sans-serif",
            opacity: 0.8, width: "100%", textAlign: "center",
          }}
        >
          {expanded ? "접기 ▲" : `${localComments.length - 2}개 더 보기 ▼`}
        </button>
      )}
    </div>
  );
};

// ─── 카드 컴포넌트 (리스트 뷰 - 개선: 투표+댓글 인라인) ───
const CaseCard = ({ caseData, index, onOpenDetail }) => {
  const [voted, setVoted] = useState(null);
  const [hearted, setHearted] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const judge = JUDGES[caseData.judge];

  return (
    <div style={{
      background: CARD_BG,
      border: `1px solid ${CARD_BORDER}`,
      borderRadius: 16, padding: 0, overflow: "hidden",
      animation: `slideUp 0.4s ease ${index * 0.08}s both`,
      transition: "border-color 0.3s",
    }}
      onMouseEnter={(e) => e.currentTarget.style.borderColor = `${judge.color}33`}
      onMouseLeave={(e) => e.currentTarget.style.borderColor = CARD_BORDER}
    >
      {/* 카드 헤더 */}
      <div style={{ padding: "18px 20px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: `${judge.color}15`, border: `1px solid ${judge.color}30`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18,
            }}>
              {judge.emoji}
            </div>
            <div>
              <div style={{
                fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 700,
                fontSize: 13, color: judge.color,
              }}>
                {judge.name}
              </div>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#555",
              }}>
                {caseData.time}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {caseData.isHot && (
              <span style={{
                background: "rgba(255,46,151,0.15)", color: NEON_PINK,
                padding: "3px 10px", borderRadius: 99, fontSize: 11,
                fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
                display: "flex", alignItems: "center", gap: 4,
                border: `1px solid rgba(255,46,151,0.2)`,
              }}>
                <FireIcon size={12} /> HOT
              </span>
            )}
          </div>
        </div>

        {/* 사연 */}
        <div style={{
          background: "rgba(255,255,255,0.03)", borderRadius: 10,
          padding: "12px 16px", marginBottom: 14,
        }}>
          <div style={{
            fontFamily: "'Black Han Sans', sans-serif", fontSize: 18,
            color: "#fff", marginBottom: 4, lineHeight: 1.4,
          }}>
            "{caseData.caseTitle}"
          </div>
          <p style={{
            fontFamily: "'Noto Sans KR', sans-serif", fontSize: 13,
            color: "#888", lineHeight: 1.6, margin: 0,
          }}>
            {caseData.description.length > 80
              ? caseData.description.slice(0, 80) + "..."
              : caseData.description}
          </p>
        </div>

        {/* 판결 */}
        <div style={{
          background: `${judge.color}08`,
          border: `1px solid ${judge.color}20`,
          borderRadius: 10, padding: "12px 16px", marginBottom: 14,
          position: "relative",
        }}>
          <div style={{
            position: "absolute", top: -8, left: 14,
            background: CARD_BG, padding: "0 8px",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10, color: judge.color, letterSpacing: 1,
          }}>
            VERDICT
          </div>
          <p style={{
            fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 700,
            fontSize: 15, color: "#eee", margin: 0, lineHeight: 1.5,
          }}>
            "{caseData.verdict}"
          </p>
        </div>

        {/* 투표 바 + 버튼 (리스트에서 바로 투표 가능) */}
        <VoteBar agree={caseData.agreeCount} disagree={caseData.disagreeCount} total={caseData.totalVotes} compact />
        <VoteButtons voted={voted} onVote={setVoted} compact />
      </div>

      {/* 카드 푸터 */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 20px", marginTop: 12,
        borderTop: "1px solid rgba(255,255,255,0.04)",
      }}>
        <div style={{ display: "flex", gap: 16 }}>
          <button
            onClick={() => setHearted(!hearted)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 5,
              color: hearted ? NEON_PINK : "#555", fontSize: 13,
              fontFamily: "'JetBrains Mono', monospace",
              transition: "color 0.2s",
            }}
          >
            <HeartIcon size={15} filled={hearted} />
            {caseData.hearts + (hearted ? 1 : 0)}
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 5,
              color: showComments ? NEON_GREEN : "#555", fontSize: 13,
              fontFamily: "'JetBrains Mono', monospace",
              transition: "color 0.2s",
            }}
          >
            <ChatIcon size={15} />
            {caseData.comments.length}
          </button>
        </div>
        <button
          onClick={() => onOpenDetail(caseData)}
          style={{
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 8, padding: "6px 14px", cursor: "pointer",
            color: "#aaa", fontSize: 12, fontFamily: "'Noto Sans KR', sans-serif",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => { e.target.style.borderColor = NEON_GREEN + "40"; e.target.style.color = NEON_GREEN; }}
          onMouseLeave={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; e.target.style.color = "#aaa"; }}
        >
          상세보기 →
        </button>
      </div>

      {/* 인라인 댓글 (토글) */}
      {showComments && (
        <div style={{ padding: "0 20px 16px", animation: "fadeIn 0.3s ease" }}>
          <InlineComments comments={caseData.comments} caseId={caseData.id} />
        </div>
      )}
    </div>
  );
};

// ─── 상세 페이지 ───
const DetailView = ({ caseData, onBack }) => {
  const [voted, setVoted] = useState(null);
  const [hearted, setHearted] = useState(false);
  const judge = JUDGES[caseData.judge];

  return (
    <div style={{ animation: "slideUp 0.3s ease", maxWidth: 680, margin: "0 auto" }}>
      {/* 뒤로가기 */}
      <button
        onClick={onBack}
        style={{
          background: "none", border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 6,
          color: "#777", fontSize: 14, padding: "0 0 20px",
          fontFamily: "'Noto Sans KR', sans-serif",
        }}
      >
        <ChevronLeft /> 재판소로 돌아가기
      </button>

      {/* 판사 정보 */}
      <div style={{
        display: "flex", alignItems: "center", gap: 14, marginBottom: 24,
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: `${judge.color}15`, border: `1.5px solid ${judge.color}40`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 26,
        }}>
          {judge.emoji}
        </div>
        <div>
          <div style={{
            fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 900,
            fontSize: 20, color: judge.color,
          }}>
            {judge.name}
          </div>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#555",
          }}>
            {caseData.time} · VERDICT_{String(caseData.id).padStart(6, "0")}
          </div>
        </div>
      </div>

      {/* 사연 */}
      <div style={{
        background: CARD_BG, border: `1px solid ${CARD_BORDER}`,
        borderRadius: 16, padding: 24, marginBottom: 20,
      }}>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
          color: "#555", letterSpacing: 1.5, marginBottom: 10,
        }}>
          CASE
        </div>
        <h2 style={{
          fontFamily: "'Black Han Sans', sans-serif", fontSize: 26,
          color: "#fff", margin: "0 0 14px", lineHeight: 1.3,
        }}>
          "{caseData.caseTitle}"
        </h2>
        <p style={{
          fontFamily: "'Noto Sans KR', sans-serif", fontSize: 15,
          color: "#999", lineHeight: 1.8, margin: 0,
        }}>
          {caseData.description}
        </p>
      </div>

      {/* 판결 */}
      <div style={{
        background: `${judge.color}06`,
        border: `1.5px solid ${judge.color}30`,
        borderRadius: 16, padding: 28, marginBottom: 20,
        position: "relative",
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8, marginBottom: 14,
        }}>
          <GavelIcon />
          <span style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
            color: NEON_YELLOW, letterSpacing: 1.5, fontWeight: 700,
          }}>
            AI 판결
          </span>
        </div>
        <p style={{
          fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 900,
          fontSize: 22, color: "#fff", margin: 0, lineHeight: 1.5,
        }}>
          "{caseData.verdict}"
        </p>
      </div>

      {/* 투표 */}
      <div style={{
        background: CARD_BG, border: `1px solid ${CARD_BORDER}`,
        borderRadius: 16, padding: 24, marginBottom: 20,
      }}>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
          color: "#555", letterSpacing: 1.5, marginBottom: 16,
        }}>
          JURY VOTE · 이 판결에 동의하시나요?
        </div>
        <VoteBar agree={caseData.agreeCount} disagree={caseData.disagreeCount} total={caseData.totalVotes} />
        <VoteButtons voted={voted} onVote={setVoted} />
      </div>

      {/* 좋아요 */}
      <div style={{
        display: "flex", justifyContent: "center", marginBottom: 24,
      }}>
        <button
          onClick={() => setHearted(!hearted)}
          style={{
            background: hearted ? "rgba(255,46,151,0.1)" : "rgba(255,255,255,0.03)",
            border: `1px solid ${hearted ? "rgba(255,46,151,0.3)" : "rgba(255,255,255,0.06)"}`,
            borderRadius: 99, padding: "10px 24px", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 8,
            color: hearted ? NEON_PINK : "#666", fontSize: 14,
            fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 500,
            transition: "all 0.2s",
          }}
        >
          <HeartIcon size={18} filled={hearted} />
          공감 {caseData.hearts + (hearted ? 1 : 0)}
        </button>
      </div>

      {/* 댓글 */}
      <div style={{
        background: CARD_BG, border: `1px solid ${CARD_BORDER}`,
        borderRadius: 16, padding: 24,
      }}>
        <InlineComments comments={caseData.comments} caseId={caseData.id} />
      </div>
    </div>
  );
};

// ─── 메인 앱 ───
export default function NeonsCourt() {
  const [view, setView] = useState("list");
  const [selectedCase, setSelectedCase] = useState(null);
  const [activeTab, setActiveTab] = useState("all");

  const tabs = [
    { id: "all", label: "전체", emoji: null },
    { id: "justice", label: "저스티스 제로", emoji: "⚖️" },
    { id: "heart", label: "하트 비트", emoji: "💗" },
    { id: "cyber", label: "사이버 렉카", emoji: "🤖" },
    { id: "neon", label: "형사 네온", emoji: "🔮" },
  ];

  const filtered = activeTab === "all"
    ? MOCK_CASES
    : MOCK_CASES.filter((c) => c.judge === activeTab);

  const openDetail = (c) => {
    setSelectedCase(c);
    setView("detail");
  };

  return (
    <div style={{
      minHeight: "100vh", background: DARK_BG, color: "#eee",
      fontFamily: "'Noto Sans KR', sans-serif",
    }}>
      <GlobalStyles />

      {/* 네비게이션 */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(10,10,15,0.85)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        padding: "0 24px", height: 56,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
            fontSize: 18, color: NEON_GREEN, cursor: "pointer",
            letterSpacing: 3,
          }}
          onClick={() => { setView("list"); setSelectedCase(null); }}
        >
          NEONS
        </div>
        <div style={{ display: "flex", gap: 20, fontSize: 13, color: "#777" }}>
          <span style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
            <GavelIcon size={14} /> 판결
          </span>
          <span style={{
            cursor: "pointer", color: NEON_PINK,
            display: "flex", alignItems: "center", gap: 4,
          }}>
            📢 공개 재판소
          </span>
          <span style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
            📋 내 기록
          </span>
        </div>
      </nav>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 16px 80px" }}>
        {view === "list" ? (
          <>
            {/* 헤더 */}
            <div style={{ textAlign: "center", marginBottom: 36 }}>
              <h1 style={{
                fontFamily: "'Black Han Sans', sans-serif", fontSize: 38,
                color: "#fff", margin: "0 0 8px", letterSpacing: -1,
              }}>
                공개 재판소
              </h1>
              <p style={{
                fontSize: 14, color: "#666", margin: 0,
                fontFamily: "'Noto Sans KR', sans-serif",
              }}>
                AI 판결에 투표하고, 배심원으로 참여하세요
              </p>
              <div style={{
                width: 60, height: 2, margin: "16px auto 0",
                background: `linear-gradient(90deg, ${NEON_PINK}, ${NEON_GREEN})`,
                borderRadius: 99,
              }} />
            </div>

            {/* 탭 */}
            <div style={{
              display: "flex", gap: 6, marginBottom: 28,
              overflowX: "auto", paddingBottom: 4,
            }}>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    background: activeTab === tab.id ? "rgba(57,255,20,0.1)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${activeTab === tab.id ? NEON_GREEN + "40" : "rgba(255,255,255,0.06)"}`,
                    borderRadius: 99, padding: "8px 18px",
                    color: activeTab === tab.id ? NEON_GREEN : "#777",
                    fontSize: 13, cursor: "pointer", whiteSpace: "nowrap",
                    fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 500,
                    transition: "all 0.2s",
                    display: "flex", alignItems: "center", gap: 6,
                  }}
                >
                  {tab.emoji && <span>{tab.emoji}</span>}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* 카드 리스트 */}
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {filtered.map((c, i) => (
                <CaseCard key={c.id} caseData={c} index={i} onOpenDetail={openDetail} />
              ))}
            </div>

            {/* 푸터 */}
            <div style={{
              textAlign: "center", padding: "48px 0 0",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11, color: "#333", letterSpacing: 1,
            }}>
              NEON COURT SYSTEM © 2026 — ALL JUDGMENTS ARE AI-GENERATED
            </div>
          </>
        ) : (
          <DetailView caseData={selectedCase} onBack={() => setView("list")} />
        )}
      </div>
    </div>
  );
}
