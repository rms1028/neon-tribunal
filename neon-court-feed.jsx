import { useState, useRef, useEffect } from "react";

const JUDGES = {
  justice_zero: { name: "저스티스 제로", emoji: "⚖️", color: "#00ffcc" },
  heartbeat: { name: "하트 비트", emoji: "💗", color: "#ff2d78" },
  cyber_venka: { name: "사이버 벵카", emoji: "🤖", color: "#7b5cff" },
  neon_criminal: { name: "형사 네온", emoji: "🔥", color: "#ffe14d" },
};

const MOCK_CASES = [
  {
    id: 1,
    user: "익명의 시민 #2847",
    avatar: "😎",
    time: "32분 전",
    category: "justice_zero",
    story: "룸메이트가 내 넷플릭스 계정을 몰래 가족 5명한테 공유하고 있었어요. 3개월째 요금은 제가 다 내고 있었는데, 따지니까 '어차피 동시접속 가능하잖아'라고 하네요.",
    verdict: {
      status: "guilty",
      summary: "디지털 자산 무단 사용, 유죄",
      detail: "계정 소유자의 동의 없는 공유는 신뢰 위반입니다. 추가 비용이 발생한 만큼 정산이 필요합니다.",
    },
    reactions: { fire: 234, skull: 89, heart: 167, think: 45 },
    comments: 78,
    shares: 23,
    tags: ["#디지털범죄", "#넷플릭스", "#룸메"],
    voted: null,
  },
  {
    id: 2,
    user: "익명의 시민 #9102",
    avatar: "🦊",
    time: "1시간 전",
    category: "heartbeat",
    story: "3년 사귄 여자친구가 제 절친이랑 몰래 만나고 있었어요. 둘 다 '그냥 친구로 만난 거'라고 하는데, 카톡 보니까 하트 이모지 범벅이더라고요. 제가 과민반응인 건가요?",
    verdict: {
      status: "not_guilty",
      summary: "감정적 배신, 경계 위반 인정",
      detail: "물리적 불륜이 아니더라도 정서적 외도는 관계의 신뢰를 심각하게 훼손합니다. 과민반응이 아닙니다.",
    },
    reactions: { fire: 567, skull: 234, heart: 89, think: 123 },
    comments: 203,
    shares: 67,
    tags: ["#연애법정", "#정서적외도", "#절친배신"],
    voted: null,
  },
  {
    id: 3,
    user: "익명의 시민 #4455",
    avatar: "🐱",
    time: "2시간 전",
    category: "cyber_venka",
    story: "회사 슬랙에서 팀장이 제 아이디어를 자기 것처럼 발표했어요. 제가 올린 메시지 타임스탬프가 2주 전인데, 팀장 발표자료엔 '본인 아이디어'라고 적혀있더라고요.",
    verdict: {
      status: "guilty",
      summary: "지적 재산 도용, 유죄",
      detail: "슬랙 기록이라는 명확한 증거가 존재합니다. 디지털 기록은 거짓말하지 않습니다.",
    },
    reactions: { fire: 892, skull: 445, heart: 56, think: 201 },
    comments: 341,
    shares: 129,
    tags: ["#직장내범죄", "#아이디어도용", "#슬랙증거"],
    voted: null,
  },
  {
    id: 4,
    user: "익명의 시민 #7788",
    avatar: "🎮",
    time: "3시간 전",
    category: "neon_criminal",
    story: "중고거래로 PS5 샀는데 박스만 보내놓고 잠수탔어요. 15만원 날렸는데 경찰은 '소액이라 힘들다'고 하네요. 이거 사기 맞죠?",
    verdict: {
      status: "guilty",
      summary: "명백한 사기, 유죄",
      detail: "물건 대신 빈 박스를 보낸 것은 명백한 기망행위입니다. 금액과 무관하게 사기죄 구성요건을 충족합니다.",
    },
    reactions: { fire: 1023, skull: 567, heart: 34, think: 89 },
    comments: 456,
    shares: 198,
    tags: ["#중고사기", "#PS5", "#잠수사기꾼"],
    voted: null,
  },
  {
    id: 5,
    user: "익명의 시민 #3366",
    avatar: "🌙",
    time: "5시간 전",
    category: "heartbeat",
    story: "부모님이 제 통장에서 매달 50만원씩 빼가고 계셨어요. '키워준 은혜'라고 하시는데, 전 사회초년생이라 월급이 200도 안 됩니다. 효도인지 착취인지 모르겠어요.",
    verdict: {
      status: "guilty",
      summary: "경제적 착취, 경계 필요",
      detail: "부모의 사랑과 경제적 착취는 별개입니다. 동의 없는 인출은 가족 간이라도 정당화될 수 없습니다.",
    },
    reactions: { fire: 2341, skull: 123, heart: 1567, think: 890 },
    comments: 892,
    shares: 445,
    tags: ["#가족법정", "#경제적학대", "#사회초년생"],
    voted: null,
  },
];

const REACTION_EMOJIS = { fire: "🔥", skull: "💀", heart: "❤️", think: "🤔" };

const STATUS_MAP = {
  guilty: { label: "유죄", color: "#ff2d78", bg: "rgba(255,45,120,0.15)" },
  not_guilty: { label: "무죄", color: "#00ffcc", bg: "rgba(0,255,204,0.15)" },
  insufficient: { label: "판결 불가", color: "#ffe14d", bg: "rgba(255,225,77,0.15)" },
};

function formatCount(n) {
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return n;
}

function StoryCard({ c, onVote }) {
  const [expanded, setExpanded] = useState(false);
  const [showVerdict, setShowVerdict] = useState(false);
  const [reactions, setReactions] = useState(c.reactions);
  const [activeReaction, setActiveReaction] = useState(null);
  const [saved, setSaved] = useState(false);
  const [doubleTap, setDoubleTap] = useState(false);
  const lastTap = useRef(0);
  const judge = JUDGES[c.category];
  const status = STATUS_MAP[c.verdict.status];

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      setDoubleTap(true);
      if (!activeReaction) {
        setActiveReaction("fire");
        setReactions((r) => ({ ...r, fire: r.fire + 1 }));
      }
      setTimeout(() => setDoubleTap(false), 800);
    }
    lastTap.current = now;
  };

  const toggleReaction = (key) => {
    if (activeReaction === key) {
      setActiveReaction(null);
      setReactions((r) => ({ ...r, [key]: r[key] - 1 }));
    } else {
      if (activeReaction) {
        setReactions((r) => ({ ...r, [activeReaction]: r[activeReaction] - 1 }));
      }
      setActiveReaction(key);
      setReactions((r) => ({ ...r, [key]: r[key] + 1 }));
    }
  };

  const needsTruncate = c.story.length > 80;
  const displayStory = !expanded && needsTruncate ? c.story.slice(0, 80) + "..." : c.story;

  return (
    <div style={styles.card}>
      {/* Header */}
      <div style={styles.cardHeader}>
        <div style={styles.headerLeft}>
          <div style={{ ...styles.avatarRing, borderColor: judge.color }}>
            <span style={styles.avatarEmoji}>{c.avatar}</span>
          </div>
          <div>
            <div style={styles.userName}>{c.user}</div>
            <div style={styles.metaRow}>
              <span style={{ ...styles.judgeBadge, background: judge.color + "22", color: judge.color }}>
                {judge.emoji} {judge.name}
              </span>
              <span style={styles.timeText}>{c.time}</span>
            </div>
          </div>
        </div>
        <button style={styles.moreBtn}>⋯</button>
      </div>

      {/* Story Body */}
      <div style={styles.storyBody} onClick={handleDoubleTap}>
        <p style={styles.storyText}>
          "{displayStory}"
          {needsTruncate && !expanded && (
            <span onClick={(e) => { e.stopPropagation(); setExpanded(true); }} style={styles.moreLink}> 더보기</span>
          )}
        </p>

        {/* Tags */}
        <div style={styles.tagRow}>
          {c.tags.map((t) => (
            <span key={t} style={styles.tag}>{t}</span>
          ))}
        </div>

        {/* Double Tap Animation */}
        {doubleTap && (
          <div style={styles.doubleTapOverlay}>
            <span style={styles.doubleTapEmoji}>🔥</span>
          </div>
        )}
      </div>

      {/* Verdict Section */}
      <div style={styles.verdictSection}>
        <button
          onClick={() => setShowVerdict(!showVerdict)}
          style={{ ...styles.verdictToggle, borderColor: status.color + "66" }}
        >
          <div style={styles.verdictToggleInner}>
            <span style={styles.verdictLabel}>VERDICT</span>
            <span style={{ ...styles.verdictStatus, color: status.color, background: status.bg }}>
              {status.label}
            </span>
          </div>
          <span style={{ ...styles.verdictSummary, color: status.color }}>{c.verdict.summary}</span>
          <span style={{ ...styles.chevron, transform: showVerdict ? "rotate(180deg)" : "rotate(0)" }}>▾</span>
        </button>
        {showVerdict && (
          <div style={{ ...styles.verdictDetail, borderColor: status.color + "33" }}>
            <p style={styles.verdictDetailText}>{c.verdict.detail}</p>
            {/* Jury Vote */}
            <div style={styles.juryVote}>
              <span style={styles.juryLabel}>배심원 투표</span>
              <div style={styles.voteButtons}>
                <button
                  onClick={() => onVote(c.id, "agree")}
                  style={{
                    ...styles.voteBtn,
                    ...(c.voted === "agree" ? styles.voteBtnActiveAgree : {}),
                  }}
                >
                  👍 동의
                </button>
                <button
                  onClick={() => onVote(c.id, "disagree")}
                  style={{
                    ...styles.voteBtn,
                    ...(c.voted === "disagree" ? styles.voteBtnActiveDisagree : {}),
                  }}
                >
                  👎 반대
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reaction Bar */}
      <div style={styles.reactionBar}>
        <div style={styles.reactionLeft}>
          {Object.entries(REACTION_EMOJIS).map(([key, emoji]) => (
            <button
              key={key}
              onClick={() => toggleReaction(key)}
              style={{
                ...styles.reactionBtn,
                ...(activeReaction === key ? { background: "rgba(255,255,255,0.12)", transform: "scale(1.1)" } : {}),
              }}
            >
              <span style={styles.reactionEmoji}>{emoji}</span>
              <span style={{
                ...styles.reactionCount,
                color: activeReaction === key ? "#fff" : "rgba(255,255,255,0.5)",
              }}>{formatCount(reactions[key])}</span>
            </button>
          ))}
        </div>
        <div style={styles.reactionRight}>
          <button style={styles.iconBtn}>
            <span style={styles.commentIcon}>💬</span>
            <span style={styles.reactionCount}>{formatCount(c.comments)}</span>
          </button>
          <button style={styles.iconBtn} onClick={() => setSaved(!saved)}>
            <span style={{ fontSize: 18, filter: saved ? "none" : "grayscale(1) opacity(0.5)" }}>
              {saved ? "🔖" : "📑"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function NeonCourtFeed() {
  const [activeTab, setActiveTab] = useState("all");
  const [cases, setCases] = useState(MOCK_CASES);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleVote = (id, vote) => {
    setCases((prev) =>
      prev.map((c) => (c.id === id ? { ...c, voted: c.voted === vote ? null : vote } : c))
    );
  };

  const tabs = [
    { key: "all", label: "전체", emoji: "⚡" },
    { key: "justice_zero", label: "저스티스", emoji: "⚖️" },
    { key: "heartbeat", label: "하트비트", emoji: "💗" },
    { key: "cyber_venka", label: "벵카", emoji: "🤖" },
    { key: "neon_criminal", label: "형사네온", emoji: "🔥" },
  ];

  const filtered = activeTab === "all" ? cases : cases.filter((c) => c.category === activeTab);

  return (
    <div style={styles.root}>
      {/* Background Effects */}
      <div style={styles.bgGlow1} />
      <div style={styles.bgGlow2} />

      {/* Sticky Header */}
      <header style={{ ...styles.header, ...(scrolled ? styles.headerScrolled : {}) }}>
        <div style={styles.headerContent}>
          <div style={styles.logoArea}>
            <span style={styles.logoIcon}>⚡</span>
            <span style={styles.logoText}>NEON COURT</span>
          </div>
          <div style={styles.headerActions}>
            <button style={styles.headerBtn}>🔔</button>
            <button style={styles.headerBtn}>⚙️</button>
          </div>
        </div>
      </header>

      {/* Filter Tabs - Sticky */}
      <div style={styles.tabBar}>
        <div style={styles.tabScroll}>
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={{
                ...styles.tab,
                ...(activeTab === t.key ? styles.tabActive : {}),
                ...(activeTab === t.key && t.key !== "all"
                  ? { borderColor: JUDGES[t.key]?.color, color: JUDGES[t.key]?.color }
                  : {}),
              }}
            >
              <span>{t.emoji}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Stories Row (like IG Stories) */}
      <div style={styles.storiesRow}>
        {Object.entries(JUDGES).map(([key, j]) => (
          <div key={key} style={styles.storyCircle}>
            <div style={{ ...styles.storyRing, background: `linear-gradient(135deg, ${j.color}, ${j.color}88)` }}>
              <div style={styles.storyInner}>
                <span style={{ fontSize: 22 }}>{j.emoji}</span>
              </div>
            </div>
            <span style={styles.storyName}>{j.name.slice(0, 4)}</span>
          </div>
        ))}
        <div style={styles.storyCircle}>
          <div style={{ ...styles.storyRing, background: "linear-gradient(135deg, #444, #666)" }}>
            <div style={styles.storyInner}>
              <span style={{ fontSize: 18 }}>🏆</span>
            </div>
          </div>
          <span style={styles.storyName}>명예의전당</span>
        </div>
      </div>

      {/* Feed */}
      <div style={styles.feed}>
        {filtered.map((c) => (
          <StoryCard key={c.id} c={c} onVote={handleVote} />
        ))}
      </div>

      {/* FAB */}
      <button style={styles.fab}>
        <span style={styles.fabIcon}>⚡</span>
        <span style={styles.fabText}>새 재판</span>
      </button>

      {/* Bottom Nav */}
      <nav style={styles.bottomNav}>
        <button style={styles.navItem}>
          <span style={styles.navIcon}>🏠</span>
          <span style={{ ...styles.navLabel, color: "#00ffcc" }}>홈</span>
        </button>
        <button style={styles.navItem}>
          <span style={styles.navIcon}>🔍</span>
          <span style={styles.navLabel}>탐색</span>
        </button>
        <button style={styles.navItem}>
          <span style={styles.navIcon}>📊</span>
          <span style={styles.navLabel}>랭킹</span>
        </button>
        <button style={styles.navItem}>
          <span style={styles.navIcon}>👤</span>
          <span style={styles.navLabel}>프로필</span>
        </button>
      </nav>
    </div>
  );
}

const styles = {
  root: {
    minHeight: "100vh",
    background: "#0a0a0f",
    color: "#fff",
    fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif",
    position: "relative",
    overflow: "hidden",
    maxWidth: 430,
    margin: "0 auto",
    paddingBottom: 140,
  },
  bgGlow1: {
    position: "fixed",
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(0,255,204,0.06) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  bgGlow2: {
    position: "fixed",
    bottom: -50,
    left: -50,
    width: 250,
    height: 250,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(255,45,120,0.05) 0%, transparent 70%)",
    pointerEvents: "none",
  },

  // Header
  header: {
    position: "sticky",
    top: 0,
    zIndex: 100,
    padding: "12px 16px",
    transition: "all 0.3s ease",
    background: "rgba(10,10,15,0.85)",
    backdropFilter: "blur(20px)",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  },
  headerScrolled: {
    borderBottom: "1px solid rgba(0,255,204,0.15)",
  },
  headerContent: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logoArea: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  logoIcon: { fontSize: 20 },
  logoText: {
    fontSize: 18,
    fontWeight: 800,
    letterSpacing: 2,
    background: "linear-gradient(135deg, #00ffcc, #7b5cff)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  headerActions: {
    display: "flex",
    gap: 8,
  },
  headerBtn: {
    background: "rgba(255,255,255,0.06)",
    border: "none",
    borderRadius: 12,
    width: 36,
    height: 36,
    fontSize: 16,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  // Tabs
  tabBar: {
    position: "sticky",
    top: 60,
    zIndex: 99,
    background: "rgba(10,10,15,0.9)",
    backdropFilter: "blur(16px)",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    padding: "8px 0",
  },
  tabScroll: {
    display: "flex",
    gap: 6,
    padding: "0 12px",
    overflowX: "auto",
    scrollbarWidth: "none",
  },
  tab: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    padding: "6px 14px",
    borderRadius: 20,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "transparent",
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "all 0.2s",
    flexShrink: 0,
  },
  tabActive: {
    border: "1px solid #00ffcc",
    color: "#00ffcc",
    background: "rgba(0,255,204,0.08)",
  },

  // Stories Row
  storiesRow: {
    display: "flex",
    gap: 14,
    padding: "14px 16px",
    overflowX: "auto",
    scrollbarWidth: "none",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
  },
  storyCircle: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    flexShrink: 0,
  },
  storyRing: {
    width: 56,
    height: 56,
    borderRadius: "50%",
    padding: 2.5,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  storyInner: {
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    background: "#14141f",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  storyName: {
    fontSize: 10,
    color: "rgba(255,255,255,0.6)",
    fontWeight: 500,
  },

  // Feed
  feed: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },

  // Card
  card: {
    background: "rgba(255,255,255,0.02)",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    paddingBottom: 4,
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px 8px",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  avatarRing: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    border: "2px solid",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(255,255,255,0.04)",
  },
  avatarEmoji: { fontSize: 20 },
  userName: {
    fontSize: 14,
    fontWeight: 700,
    color: "#fff",
  },
  metaRow: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  judgeBadge: {
    fontSize: 10,
    fontWeight: 700,
    padding: "2px 8px",
    borderRadius: 10,
    letterSpacing: 0.3,
  },
  timeText: {
    fontSize: 11,
    color: "rgba(255,255,255,0.3)",
  },
  moreBtn: {
    background: "none",
    border: "none",
    color: "rgba(255,255,255,0.4)",
    fontSize: 20,
    cursor: "pointer",
    padding: 8,
  },

  // Story Body
  storyBody: {
    padding: "0 16px 10px",
    position: "relative",
    cursor: "pointer",
    userSelect: "none",
  },
  storyText: {
    fontSize: 15,
    lineHeight: 1.65,
    color: "rgba(255,255,255,0.92)",
    margin: 0,
    letterSpacing: -0.2,
  },
  moreLink: {
    color: "rgba(255,255,255,0.35)",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
  },
  tagRow: {
    display: "flex",
    gap: 6,
    marginTop: 10,
    flexWrap: "wrap",
  },
  tag: {
    fontSize: 12,
    color: "#7b5cff",
    fontWeight: 500,
  },
  doubleTapOverlay: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%,-50%)",
    animation: "doubleTapPop 0.8s ease forwards",
    pointerEvents: "none",
    zIndex: 10,
  },
  doubleTapEmoji: { fontSize: 64, filter: "drop-shadow(0 0 20px rgba(255,100,0,0.5))" },

  // Verdict
  verdictSection: {
    padding: "0 16px 8px",
  },
  verdictToggle: {
    width: "100%",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid",
    borderRadius: 12,
    padding: "10px 14px",
    cursor: "pointer",
    textAlign: "left",
    display: "flex",
    flexDirection: "column",
    gap: 4,
    position: "relative",
  },
  verdictToggleInner: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  verdictLabel: {
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: 2,
    color: "rgba(255,255,255,0.3)",
  },
  verdictStatus: {
    fontSize: 11,
    fontWeight: 800,
    padding: "2px 10px",
    borderRadius: 8,
  },
  verdictSummary: {
    fontSize: 13,
    fontWeight: 600,
  },
  chevron: {
    position: "absolute",
    right: 14,
    top: 12,
    fontSize: 14,
    color: "rgba(255,255,255,0.3)",
    transition: "transform 0.2s",
  },
  verdictDetail: {
    marginTop: 6,
    padding: "12px 14px",
    background: "rgba(255,255,255,0.02)",
    border: "1px solid",
    borderRadius: 10,
  },
  verdictDetailText: {
    fontSize: 13,
    lineHeight: 1.6,
    color: "rgba(255,255,255,0.7)",
    margin: 0,
  },

  // Jury Vote
  juryVote: {
    marginTop: 12,
    paddingTop: 10,
    borderTop: "1px solid rgba(255,255,255,0.06)",
  },
  juryLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: "rgba(255,255,255,0.4)",
    letterSpacing: 1,
  },
  voteButtons: {
    display: "flex",
    gap: 8,
    marginTop: 8,
  },
  voteBtn: {
    flex: 1,
    padding: "8px 0",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.04)",
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.2s",
  },
  voteBtnActiveAgree: {
    background: "rgba(0,255,204,0.15)",
    borderColor: "#00ffcc",
    color: "#00ffcc",
  },
  voteBtnActiveDisagree: {
    background: "rgba(255,45,120,0.15)",
    borderColor: "#ff2d78",
    color: "#ff2d78",
  },

  // Reactions
  reactionBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "4px 12px 8px",
  },
  reactionLeft: {
    display: "flex",
    gap: 2,
  },
  reactionBtn: {
    display: "flex",
    alignItems: "center",
    gap: 3,
    padding: "5px 8px",
    borderRadius: 20,
    background: "transparent",
    border: "none",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  reactionEmoji: { fontSize: 18 },
  reactionCount: {
    fontSize: 12,
    fontWeight: 600,
    color: "rgba(255,255,255,0.5)",
  },
  reactionRight: {
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  iconBtn: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    padding: "5px 8px",
    background: "transparent",
    border: "none",
    cursor: "pointer",
  },
  commentIcon: { fontSize: 18 },

  // FAB
  fab: {
    position: "fixed",
    bottom: 76,
    right: 16,
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "12px 20px",
    borderRadius: 50,
    border: "none",
    background: "linear-gradient(135deg, #00ffcc, #00cc99)",
    color: "#0a0a0f",
    fontSize: 14,
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 4px 24px rgba(0,255,204,0.3)",
    zIndex: 90,
  },
  fabIcon: { fontSize: 16 },
  fabText: { letterSpacing: 0.5 },

  // Bottom Nav
  bottomNav: {
    position: "fixed",
    bottom: 0,
    left: "50%",
    transform: "translateX(-50%)",
    width: "100%",
    maxWidth: 430,
    display: "flex",
    justifyContent: "space-around",
    alignItems: "center",
    padding: "8px 0 12px",
    background: "rgba(10,10,15,0.95)",
    backdropFilter: "blur(20px)",
    borderTop: "1px solid rgba(255,255,255,0.06)",
    zIndex: 100,
  },
  navItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "4px 12px",
  },
  navIcon: { fontSize: 20 },
  navLabel: {
    fontSize: 10,
    fontWeight: 600,
    color: "rgba(255,255,255,0.4)",
  },
};
