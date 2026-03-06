import { useState } from "react";

/* ─────────────────────────────────────────────
   DATA
   ───────────────────────────────────────────── */
const OPINIONS = [
  {
    id: 1, author: "사이버네틱스", initial: "사", level: "Lv.4",
    text: "AI가 창작을 대체하는 게 아니라, 창작의 정의 자체가 바뀌고 있다고 봅니다. 과거에는 붓을 드는 행위가 창작이었지만, 이제는 프롬프트를 설계하는 것도 창작이 될 수 있어요. 중요한 건 도구가 아니라 의도입니다.",
    likes: 42, comments: 5, time: "3분 전",
  },
  {
    id: 2, author: "뮤직프로듀서", initial: "뮤", level: "Lv.2",
    text: "실제로 AI 작곡 도구를 매일 쓰고 있는 입장에서 말하자면, AI는 조수지 동료가 아닙니다. 멜로디 초안은 뽑아주지만 감정을 넣는 건 여전히 사람의 몫이에요.",
    likes: 31, comments: 8, time: "15분 전",
  },
  {
    id: 3, author: "윤리학도", initial: "윤", level: "Lv.5",
    text: "기술 발전 속도와 사회적 합의 속도의 격차가 문제입니다. AI가 할 수 있는 것과 해도 되는 것 사이에는 큰 차이가 있어요.",
    likes: 58, comments: 12, time: "32분 전",
  },
  {
    id: 4, author: "철학하는개발자", initial: "철", level: "Lv.3",
    text: "인간의 창작도 결국 경험의 재조합입니다. AI가 데이터를 조합하는 것과 본질적으로 다른가? 이 질문에 대한 답이 먼저 필요해요.",
    likes: 27, comments: 3, time: "1시간 전",
  },
  {
    id: 5, author: "아트히스토리안", initial: "아", level: "Lv.6",
    text: "역사적으로 새로운 기술이 등장할 때마다 기존 예술이 죽는다고 했지만, 매번 새로운 장르가 태어났습니다. 사진 → 인상주의, 영화 → 실험영화. AI도 마찬가지일 거예요.",
    likes: 45, comments: 7, time: "2시간 전",
  },
  {
    id: 6, author: "스타트업파운더", initial: "스", level: "Lv.1",
    text: "비용 관점에서 이미 게임은 끝났어요. AI로 마케팅 에셋 만드는 비용이 1/10입니다. 대기업은 이미 전환했고, 스타트업은 선택의 여지가 없어요.",
    likes: 36, comments: 15, time: "3시간 전",
  },
];

const COLORS = ["#00e4a5", "#ff4d8d", "#55b3ff", "#ffd055", "#c084fc", "#ff8a50"];
const getColor = (i) => COLORS[i % COLORS.length];

/* ─────────────────────────────────────────────
   PROFILE AVATAR
   ───────────────────────────────────────────── */
function Avatar({ initial, index, size = 40 }) {
  const c = getColor(index);
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.3, flexShrink: 0,
      background: `${c}15`, border: `1.5px solid ${c}30`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.38, fontWeight: 800, color: c,
    }}>{initial}</div>
  );
}

/* ═══════════════════════════════════════════════
   LAYOUT A: 세로 피드 (왓챠피디아 / 인스타)
   ═══════════════════════════════════════════════ */
function LayoutFeed() {
  const [liked, setLiked] = useState({});
  const [expanded, setExpanded] = useState({});

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "20px 16px 100px" }}>
      {OPINIONS.map((op, i) => {
        const c = getColor(i);
        const isLiked = liked[op.id];
        const isExpanded = expanded[op.id];
        const needsTruncate = op.text.length > 100;

        return (
          <div key={op.id} style={{
            marginBottom: 20,
            animation: `fadeUp 0.3s ease ${i * 0.05}s both`,
          }}>
            {/* Profile header */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <Avatar initial={op.initial} index={i} size={44} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: "#ddd" }}>{op.author}</span>
                  <span style={{ fontSize: 10, color: c, fontWeight: 700, background: `${c}12`, padding: "1px 7px", borderRadius: 8 }}>{op.level}</span>
                </div>
                <span style={{ fontSize: 11, color: "#444" }}>{op.time}</span>
              </div>
            </div>

            {/* Opinion text */}
            <div style={{
              padding: "18px 22px", borderRadius: 16,
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.04)",
              transition: "all 0.15s",
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.04)"}
            >
              <p style={{
                fontSize: 15, color: "#bbb", lineHeight: 1.8, margin: 0,
                wordBreak: "keep-all",
              }}>
                {needsTruncate && !isExpanded ? op.text.slice(0, 100) + "..." : op.text}
              </p>
              {needsTruncate && !isExpanded && (
                <button onClick={() => setExpanded(p => ({ ...p, [op.id]: true }))} style={{
                  background: "none", border: "none", color: "#666", fontSize: 13,
                  cursor: "pointer", padding: "4px 0", fontFamily: "inherit",
                }}>더 보기</button>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 10, paddingLeft: 4 }}>
              <button onClick={() => {
                setLiked(p => ({ ...p, [op.id]: !p[op.id] }));
              }} style={{
                display: "flex", alignItems: "center", gap: 5, background: "none", border: "none",
                color: isLiked ? "#ff4d8d" : "#555", fontSize: 13, cursor: "pointer", fontFamily: "inherit",
                fontWeight: isLiked ? 700 : 500, transition: "all 0.12s",
              }}>
                {isLiked ? "♥" : "♡"} {op.likes + (isLiked ? 1 : 0)}
              </button>
              <button style={{
                display: "flex", alignItems: "center", gap: 5, background: "none", border: "none",
                color: "#555", fontSize: 13, cursor: "pointer", fontFamily: "inherit",
              }}>
                💬 {op.comments}
              </button>
              <button style={{
                background: "none", border: "none",
                color: "#444", fontSize: 13, cursor: "pointer", fontFamily: "inherit",
                marginLeft: "auto",
              }}>공유</button>
            </div>

            {/* Divider */}
            {i < OPINIONS.length - 1 && (
              <div style={{ height: 1, background: "rgba(255,255,255,0.03)", marginTop: 20 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   LAYOUT B: 카드 그리드 2열 (Pinterest)
   ═══════════════════════════════════════════════ */
function LayoutGrid() {
  const [liked, setLiked] = useState({});

  return (
    <div style={{ padding: "20px 24px 100px" }}>
      <div style={{ columns: "2 320px", columnGap: 16 }}>
        {OPINIONS.map((op, i) => {
          const c = getColor(i);
          const isLiked = liked[op.id];

          return (
            <div key={op.id} style={{
              breakInside: "avoid", marginBottom: 16,
              borderRadius: 18, overflow: "hidden",
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.04)",
              transition: "all 0.2s", cursor: "pointer",
              animation: `fadeUp 0.35s ease ${i * 0.06}s both`,
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.2)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.04)"; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
            >
              <div style={{ padding: "18px 20px" }}>
                {/* Profile */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <Avatar initial={op.initial} index={i} size={36} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#ccc" }}>{op.author}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ fontSize: 9, color: c, fontWeight: 700 }}>{op.level}</span>
                      <span style={{ fontSize: 9, color: "#333" }}>· {op.time}</span>
                    </div>
                  </div>
                </div>

                {/* Text */}
                <p style={{
                  fontSize: 14, color: "#aaa", lineHeight: 1.75, margin: "0 0 16px",
                  wordBreak: "keep-all",
                }}>{op.text}</p>

                {/* Actions */}
                <div style={{
                  display: "flex", alignItems: "center", gap: 14,
                  paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.03)",
                }}>
                  <button onClick={(e) => {
                    e.stopPropagation();
                    setLiked(p => ({ ...p, [op.id]: !p[op.id] }));
                  }} style={{
                    display: "flex", alignItems: "center", gap: 4, background: "none", border: "none",
                    color: isLiked ? "#ff4d8d" : "#555", fontSize: 12, cursor: "pointer",
                    fontFamily: "inherit", fontWeight: isLiked ? 700 : 500,
                  }}>
                    {isLiked ? "♥" : "♡"} {op.likes + (isLiked ? 1 : 0)}
                  </button>
                  <button style={{
                    display: "flex", alignItems: "center", gap: 4, background: "none", border: "none",
                    color: "#555", fontSize: 12, cursor: "pointer", fontFamily: "inherit",
                  }}>💬 {op.comments}</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   LAYOUT C: 왼쪽 프로필 목록 + 오른쪽 의견 상세
   ═══════════════════════════════════════════════ */
function LayoutSplit() {
  const [selectedId, setSelectedId] = useState(OPINIONS[0].id);
  const [liked, setLiked] = useState({});
  const selected = OPINIONS.find(o => o.id === selectedId);

  return (
    <div style={{
      display: "grid", gridTemplateColumns: "340px 1fr",
      height: "calc(100vh - 110px)",
    }}>
      {/* Left: Profile list */}
      <div style={{
        borderRight: "1px solid rgba(255,255,255,0.04)",
        overflowY: "auto", padding: "8px 0",
      }}>
        {OPINIONS.map((op, i) => {
          const c = getColor(i);
          const isActive = selectedId === op.id;

          return (
            <div key={op.id} onClick={() => setSelectedId(op.id)} style={{
              display: "flex", gap: 12, padding: "14px 20px",
              cursor: "pointer", transition: "all 0.12s",
              background: isActive ? "rgba(255,255,255,0.04)" : "transparent",
              borderLeft: isActive ? `3px solid ${c}` : "3px solid transparent",
            }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
            >
              <Avatar initial={op.initial} index={i} size={40} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: isActive ? "#eee" : "#999" }}>{op.author}</span>
                  <span style={{ fontSize: 9, color: c, fontWeight: 700 }}>{op.level}</span>
                  <span style={{ fontSize: 10, color: "#333", marginLeft: "auto" }}>{op.time}</span>
                </div>
                <p style={{
                  fontSize: 12, color: "#555", lineHeight: 1.4, margin: 0,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>{op.text}</p>
                <div style={{ display: "flex", gap: 10, marginTop: 4, fontSize: 10, color: "#444" }}>
                  <span>♥ {op.likes}</span>
                  <span>💬 {op.comments}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Right: Opinion detail */}
      {selected && (
        <div style={{
          padding: "32px 40px", overflowY: "auto",
          animation: "fadeUp 0.2s ease",
        }}>
          {/* Profile header large */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
            <Avatar initial={selected.initial} index={OPINIONS.indexOf(selected)} size={56} />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 20, fontWeight: 800, color: "#eee" }}>{selected.author}</span>
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  color: getColor(OPINIONS.indexOf(selected)),
                  background: `${getColor(OPINIONS.indexOf(selected))}12`,
                  padding: "2px 10px", borderRadius: 10,
                }}>{selected.level}</span>
              </div>
              <span style={{ fontSize: 12, color: "#555", marginTop: 2, display: "block" }}>{selected.time}</span>
            </div>
          </div>

          {/* Opinion text large */}
          <p style={{
            fontSize: 17, color: "#ccc", lineHeight: 2,
            margin: "0 0 28px", wordBreak: "keep-all",
          }}>{selected.text}</p>

          {/* Actions */}
          <div style={{
            display: "flex", alignItems: "center", gap: 20,
            paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.04)",
          }}>
            <button onClick={() => setLiked(p => ({ ...p, [selected.id]: !p[selected.id] }))} style={{
              display: "flex", alignItems: "center", gap: 6, background: "none", border: "none",
              color: liked[selected.id] ? "#ff4d8d" : "#666", fontSize: 15, cursor: "pointer",
              fontFamily: "inherit", fontWeight: liked[selected.id] ? 700 : 500,
            }}>
              {liked[selected.id] ? "♥" : "♡"} {selected.likes + (liked[selected.id] ? 1 : 0)}
            </button>
            <button style={{
              display: "flex", alignItems: "center", gap: 6, background: "none", border: "none",
              color: "#666", fontSize: 15, cursor: "pointer", fontFamily: "inherit",
            }}>💬 {selected.comments}개 댓글</button>
            <button style={{
              background: "none", border: "none", color: "#444", fontSize: 14,
              cursor: "pointer", fontFamily: "inherit", marginLeft: "auto",
            }}>공유</button>
          </div>

          {/* Comments preview */}
          <div style={{ marginTop: 28 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#999", marginBottom: 14 }}>댓글 {selected.comments}개</div>
            {[
              { author: "디지털노마드", text: "이 관점 정말 공감합니다. 도구가 아니라 의도라는 말에 동의해요.", time: "2분 전" },
              { author: "코드위버", text: "그런데 의도도 AI가 학습할 수 있지 않을까요?", time: "5분 전" },
            ].map((c, ci) => (
              <div key={ci} style={{
                display: "flex", gap: 10, padding: "12px 0",
                borderBottom: "1px solid rgba(255,255,255,0.02)",
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                  background: "rgba(255,255,255,0.04)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700, color: "#666",
                }}>{c.author[0]}</div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#999" }}>{c.author}</span>
                    <span style={{ fontSize: 10, color: "#333" }}>{c.time}</span>
                  </div>
                  <p style={{ fontSize: 13, color: "#888", lineHeight: 1.6, margin: 0 }}>{c.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN — Tab Switcher
   ═══════════════════════════════════════════════ */
const LAYOUTS = [
  { id: "feed", icon: "📱", label: "피드", desc: "왓챠피디아 스타일" },
  { id: "grid", icon: "🧩", label: "그리드", desc: "Pinterest 스타일" },
  { id: "split", icon: "📖", label: "분할", desc: "프로필 + 상세" },
];

export default function FreeDiscussion() {
  const [layout, setLayout] = useState("feed");

  return (
    <div style={{
      minHeight: "100vh", background: "#0a0a0f", color: "#eee",
      fontFamily: "'Noto Sans KR', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.04); border-radius: 2px; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* Header */}
      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(10,10,15,0.9)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.03)",
      }}>
        <div style={{ padding: "16px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button style={{ background: "transparent", border: "none", color: "#444", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>← 홈</button>
              <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.05)" }} />
              <div>
                <h1 style={{ fontSize: 17, fontWeight: 900, color: "#eee", letterSpacing: -0.5 }}>
                  AI가 인간의 창작 영역을 대체할 수 있을까?
                </h1>
                <p style={{ fontSize: 11, color: "#444", marginTop: 2 }}>자유토론 · {OPINIONS.length}개 의견 · {OPINIONS.reduce((a, o) => a + o.comments, 0)}개 댓글</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 11, color: "#444" }}>🔥 {OPINIONS.reduce((a, o) => a + o.likes, 0)} 반응</span>
              <button style={{
                padding: "8px 20px", borderRadius: 12, border: "none",
                background: "rgba(255,255,255,0.06)", color: "#ccc",
                fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                transition: "all 0.15s",
              }}
                onMouseEnter={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#000"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#ccc"; }}
              >✍️ 의견 쓰기</button>
            </div>
          </div>

          {/* Layout tabs */}
          <div style={{ display: "flex", gap: 2, padding: 3, borderRadius: 12, background: "rgba(255,255,255,0.015)", width: "fit-content" }}>
            {LAYOUTS.map(l => (
              <button key={l.id} onClick={() => setLayout(l.id)} style={{
                padding: "7px 16px", borderRadius: 9, border: "none",
                background: layout === l.id ? "rgba(255,255,255,0.06)" : "transparent",
                cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit",
                display: "flex", alignItems: "center", gap: 5,
              }}>
                <span style={{ fontSize: 13 }}>{l.icon}</span>
                <span style={{ fontSize: 11.5, fontWeight: layout === l.id ? 700 : 500, color: layout === l.id ? "#ddd" : "#444" }}>{l.label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      <main>
        {layout === "feed" && <LayoutFeed />}
        {layout === "grid" && <LayoutGrid />}
        {layout === "split" && <LayoutSplit />}
      </main>
    </div>
  );
}
