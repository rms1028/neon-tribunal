import { useState } from "react";

/* ─────────────────────────────────────────────
   DATA
   ───────────────────────────────────────────── */
const USER = {
  name: "철학하는사람",
  initial: "철",
  level: "Lv.2",
  title: "사이버 용병",
  xp: 305,
  nextXp: 601,
  joinDate: "2026.03.05",
  stats: { debates: 12, comments: 31, likes: 47 },
  streak: 2,
};

const BADGES = [
  { name: "네온 뉴비", icon: "🛡️", color: "#55b3ff", unlocked: true },
  { name: "사이버 용병", icon: "⚔️", color: "#c084fc", unlocked: true, current: true },
  { name: "엘리트 해커", icon: "💎", color: "#00e4a5", unlocked: true },
  { name: "아고라 지배자", icon: "👑", color: "#ffd055", unlocked: false },
];

const DEBATES = [
  { id: 1, title: "찬반테스트", type: "CLASH", category: "환경", pro: 3, con: 2, date: "5시간 전" },
  { id: 2, title: "ㅎㅎ", type: "FREE", category: "토론", pro: 0, con: 0, date: "6시간 전" },
  { id: 3, title: "테스트1", type: "CLASH", category: "교육", pro: 1, con: 2, date: "6시간 전" },
  { id: 4, title: "AI가 실제 법정의 판사를 대체할 수 있는가?", type: "CLASH", category: "AI", pro: 5, con: 3, date: "21시간 전" },
];

const COMMENTS = [
  { debate: "찬반테스트", text: "도배방지 시스템1", side: "찬성", time: "5시간 전" },
  { debate: "찬반테스트", text: "테스트1", side: "찬성", time: "6시간 전" },
  { debate: "AI 판사 토론", text: "법적 판단에는 인간의 윤리적 감수성이 필수입니다", side: "반대", time: "21시간 전" },
];

/* ═══════════════════════════════════════════════
   MAIN
   ═══════════════════════════════════════════════ */
export default function CyberpunkMyPage() {
  const [tab, setTab] = useState("debates");
  const pct = Math.round((USER.xp / USER.nextXp) * 100);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0f",
      color: "#eee",
      fontFamily: "'Noto Sans KR', sans-serif",
      position: "relative",
      overflow: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700;900&family=JetBrains+Mono:wght@400;700;800&family=Orbitron:wght@700;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.04); border-radius: 2px; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes glow { 0%,100% { opacity: 0.6; } 50% { opacity: 1; } }
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        @keyframes borderGlow {
          0%,100% { border-color: rgba(0,228,165,0.15); }
          50% { border-color: rgba(0,228,165,0.3); }
        }
      `}</style>

      {/* Ambient background effects */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, height: 400,
        background: "radial-gradient(ellipse at 30% 0%, rgba(0,228,165,0.04) 0%, transparent 60%), radial-gradient(ellipse at 70% 0%, rgba(192,132,252,0.03) 0%, transparent 60%)",
        pointerEvents: "none",
      }} />

      {/* Header */}
      <header style={{
        padding: "16px 32px",
        borderBottom: "1px solid rgba(255,255,255,0.03)",
        background: "rgba(10,10,15,0.8)",
        backdropFilter: "blur(20px)",
        position: "sticky", top: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button style={{
            background: "transparent", border: "1px solid rgba(255,255,255,0.06)",
            color: "#666", fontSize: 13, cursor: "pointer", fontFamily: "inherit",
            padding: "6px 16px", borderRadius: 8,
          }}>← 홈</button>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#888" }}>MY PROFILE</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{
            padding: "7px 18px", borderRadius: 8, fontSize: 12, fontWeight: 600,
            border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)",
            color: "#999", cursor: "pointer", fontFamily: "inherit",
          }}>⚙️ 설정</button>
          <button style={{
            padding: "7px 18px", borderRadius: 8, fontSize: 12, fontWeight: 600,
            border: "1px solid rgba(0,228,165,0.2)", background: "rgba(0,228,165,0.06)",
            color: "#00e4a5", cursor: "pointer", fontFamily: "inherit",
          }}>✏️ 프로필 수정</button>
        </div>
      </header>

      {/* Content: 2 column */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 340px",
        gap: 28, padding: "32px 32px 60px",
        maxWidth: 1200, margin: "0 auto",
        position: "relative",
      }}>
        {/* ─── LEFT: Profile + Activity ─── */}
        <div>
          {/* Profile Card */}
          <div style={{
            padding: "32px",
            borderRadius: 20,
            background: "linear-gradient(135deg, rgba(0,228,165,0.03) 0%, rgba(192,132,252,0.02) 100%)",
            border: "1px solid rgba(0,228,165,0.08)",
            marginBottom: 24,
            position: "relative",
            overflow: "hidden",
            animation: "fadeUp 0.4s ease",
          }}>
            {/* Decorative corner */}
            <div style={{
              position: "absolute", top: 0, right: 0, width: 120, height: 120,
              background: "radial-gradient(circle at top right, rgba(192,132,252,0.06), transparent 70%)",
            }} />

            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              {/* Avatar */}
              <div style={{
                width: 72, height: 72, borderRadius: 20,
                background: "linear-gradient(135deg, rgba(0,228,165,0.15), rgba(0,200,255,0.1))",
                border: "2px solid rgba(0,228,165,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 28, fontWeight: 900, color: "#00e4a5",
                animation: "borderGlow 3s ease infinite",
                position: "relative",
              }}>
                {USER.initial}
                {/* Online indicator */}
                <div style={{
                  position: "absolute", bottom: -2, right: -2,
                  width: 14, height: 14, borderRadius: "50%",
                  background: "#00e4a5", border: "3px solid #0a0a0f",
                }} />
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <span style={{ fontSize: 22, fontWeight: 900, color: "#eee" }}>{USER.name}</span>
                  <span style={{
                    fontSize: 11, fontWeight: 800, color: "#c084fc",
                    background: "rgba(192,132,252,0.12)", padding: "3px 10px", borderRadius: 8,
                    border: "1px solid rgba(192,132,252,0.2)",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}>{USER.level}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12, color: "#c084fc", fontWeight: 600 }}>⚔️ {USER.title}</span>
                  <span style={{ fontSize: 11, color: "#444" }}>· {USER.joinDate} 가입</span>
                </div>
              </div>

              {/* XP */}
              <div style={{ textAlign: "right" }}>
                <div style={{
                  fontSize: 13, fontWeight: 800, color: "#ffd055",
                  fontFamily: "'JetBrains Mono', monospace",
                  display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end",
                }}>⚡ {USER.xp} XP</div>
                <div style={{ fontSize: 10, color: "#555", marginTop: 2 }}>다음: {USER.nextXp} XP</div>
              </div>
            </div>

            {/* XP Bar */}
            <div style={{ marginTop: 18 }}>
              <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.04)" }}>
                <div style={{
                  height: "100%", borderRadius: 2, width: `${pct}%`,
                  background: "linear-gradient(90deg, #00e4a5, #c084fc)",
                  transition: "width 0.5s",
                  boxShadow: "0 0 10px rgba(0,228,165,0.3)",
                }} />
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
            gap: 12, marginBottom: 24,
            animation: "fadeUp 0.4s ease 0.1s both",
          }}>
            {[
              { label: "토론", value: USER.stats.debates, color: "#00e4a5", icon: "⚔️" },
              { label: "댓글", value: USER.stats.comments, color: "#55b3ff", icon: "💬" },
              { label: "받은 좋아요", value: USER.stats.likes, color: "#ff4d8d", icon: "♥" },
            ].map((s, i) => (
              <div key={i} style={{
                padding: "18px 16px", borderRadius: 14, textAlign: "center",
                background: "rgba(255,255,255,0.015)",
                border: `1px solid ${s.color}10`,
                transition: "all 0.15s",
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = `${s.color}30`}
                onMouseLeave={e => e.currentTarget.style.borderColor = `${s.color}10`}
              >
                <div style={{ fontSize: 12, marginBottom: 6 }}>{s.icon}</div>
                <div style={{
                  fontSize: 26, fontWeight: 900, color: s.color,
                  fontFamily: "'JetBrains Mono', monospace", lineHeight: 1,
                }}>{s.value}</div>
                <div style={{ fontSize: 11, color: "#555", marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{
            display: "flex", gap: 0, marginBottom: 20,
            borderBottom: "1px solid rgba(255,255,255,0.04)",
            animation: "fadeUp 0.4s ease 0.15s both",
          }}>
            {[
              { id: "debates", label: "내 토론", count: USER.stats.debates },
              { id: "comments", label: "내 댓글", count: USER.stats.comments },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                padding: "12px 20px", border: "none", background: "transparent",
                fontSize: 14, fontWeight: tab === t.id ? 700 : 500,
                color: tab === t.id ? "#eee" : "#555",
                cursor: "pointer", fontFamily: "inherit",
                borderBottom: tab === t.id ? "2px solid #00e4a5" : "2px solid transparent",
                transition: "all 0.15s",
              }}>{t.label} <span style={{ color: tab === t.id ? "#00e4a5" : "#444", fontSize: 12 }}>{t.count}</span></button>
            ))}
          </div>

          {/* Tab Content */}
          {tab === "debates" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {DEBATES.map((d, i) => {
                const isClash = d.type === "CLASH";
                const accent = isClash ? "#00e4a5" : "#55b3ff";
                return (
                  <div key={d.id} style={{
                    padding: "16px 20px", borderRadius: 14,
                    background: "rgba(255,255,255,0.015)",
                    border: "1px solid rgba(255,255,255,0.04)",
                    display: "flex", alignItems: "center", gap: 14,
                    cursor: "pointer", transition: "all 0.15s",
                    animation: `fadeUp 0.3s ease ${i * 0.05}s both`,
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = `${accent}25`; e.currentTarget.style.background = "rgba(255,255,255,0.025)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.04)"; e.currentTarget.style.background = "rgba(255,255,255,0.015)"; }}
                  >
                    {/* Type bar */}
                    <div style={{ width: 3, height: 36, borderRadius: 2, background: accent, flexShrink: 0 }} />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: "#ccc", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.title}</span>
                        <span style={{
                          fontSize: 9, fontWeight: 800, color: accent,
                          background: `${accent}12`, padding: "2px 8px", borderRadius: 6,
                          fontFamily: "'JetBrains Mono', monospace", flexShrink: 0,
                        }}>{d.type}</span>
                      </div>
                      <div style={{ fontSize: 11, color: "#555", display: "flex", gap: 8 }}>
                        {isClash && <span>찬성 {d.pro} · 반대 {d.con}</span>}
                        <span>#{d.category}</span>
                        <span>{d.date}</span>
                      </div>
                    </div>

                    <span style={{ fontSize: 14, color: "#333" }}>→</span>
                  </div>
                );
              })}
            </div>
          )}

          {tab === "comments" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {COMMENTS.map((c, i) => (
                <div key={i} style={{
                  padding: "16px 20px", borderRadius: 14,
                  background: "rgba(255,255,255,0.015)",
                  border: "1px solid rgba(255,255,255,0.04)",
                  cursor: "pointer", transition: "all 0.15s",
                  animation: `fadeUp 0.3s ease ${i * 0.05}s both`,
                }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.04)"}
                >
                  <div style={{ fontSize: 11, color: "#555", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                    <span>{c.debate}</span>
                    <span style={{
                      fontSize: 9, fontWeight: 700,
                      color: c.side === "찬성" ? "#00e4a5" : "#ff4d8d",
                      background: c.side === "찬성" ? "rgba(0,228,165,0.1)" : "rgba(255,77,141,0.1)",
                      padding: "1px 6px", borderRadius: 6,
                    }}>{c.side}</span>
                    <span style={{ marginLeft: "auto" }}>{c.time}</span>
                  </div>
                  <p style={{ fontSize: 14, color: "#bbb", lineHeight: 1.6, margin: 0 }}>{c.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── RIGHT: HUD Panel ─── */}
        <div style={{ position: "sticky", top: 100, alignSelf: "start" }}>

          {/* HUD Header */}
          <div style={{
            padding: "18px 20px", borderRadius: 16,
            background: "linear-gradient(135deg, rgba(0,228,165,0.04), rgba(192,132,252,0.03))",
            border: "1px solid rgba(0,228,165,0.08)",
            marginBottom: 12,
            animation: "fadeUp 0.4s ease 0.1s both",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{
                  fontSize: 11, fontWeight: 800, color: "#00e4a5",
                  fontFamily: "'Orbitron', sans-serif", letterSpacing: 1,
                }}>HUD</span>
                <span style={{
                  fontSize: 9, color: "#00e4a5", background: "rgba(0,228,165,0.1)",
                  padding: "2px 6px", borderRadius: 6, fontWeight: 700,
                  animation: "glow 2s ease infinite",
                }}>● ONLINE</span>
              </div>
            </div>

            {/* Rank */}
            <div style={{
              padding: "14px 16px", borderRadius: 12,
              background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.03)",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: "#666" }}>CURRENT RANK</span>
                <span style={{
                  fontSize: 12, fontWeight: 800, color: "#ffd055",
                  fontFamily: "'JetBrains Mono', monospace",
                }}>⚡ {USER.xp} XP</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: "#eee" }}>{USER.title}</span>
                <span style={{
                  fontSize: 10, fontWeight: 800, color: "#c084fc",
                  background: "rgba(192,132,252,0.12)", padding: "2px 8px", borderRadius: 6,
                  fontFamily: "'JetBrains Mono', monospace",
                }}>{USER.level}</span>
              </div>
              <div style={{ fontSize: 10, color: "#555", marginBottom: 6 }}>
                다음: 아고라 지배자 ({USER.xp} / {USER.nextXp} XP)
              </div>
              <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.04)" }}>
                <div style={{
                  height: "100%", borderRadius: 2, width: `${pct}%`,
                  background: "linear-gradient(90deg, #00e4a5, #c084fc)",
                  boxShadow: "0 0 8px rgba(0,228,165,0.3)",
                }} />
              </div>
            </div>
          </div>

          {/* Badge Collection */}
          <div style={{
            padding: "18px 20px", borderRadius: 16,
            background: "rgba(255,255,255,0.015)",
            border: "1px solid rgba(255,255,255,0.04)",
            marginBottom: 12,
            animation: "fadeUp 0.4s ease 0.15s both",
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#888", marginBottom: 14 }}>BADGE COLLECTION</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {BADGES.map((b, i) => (
                <div key={i} style={{
                  padding: "12px", borderRadius: 12, textAlign: "center",
                  background: b.unlocked ? `${b.color}06` : "rgba(255,255,255,0.01)",
                  border: b.current ? `1.5px solid ${b.color}44` : "1px solid rgba(255,255,255,0.03)",
                  opacity: b.unlocked ? 1 : 0.4,
                  position: "relative",
                  transition: "all 0.15s",
                }}
                  onMouseEnter={e => { if (b.unlocked) e.currentTarget.style.borderColor = `${b.color}66`; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = b.current ? `${b.color}44` : "rgba(255,255,255,0.03)"; }}
                >
                  {b.current && (
                    <div style={{
                      position: "absolute", top: 6, right: 6,
                      fontSize: 7, fontWeight: 800, color: b.color,
                      background: `${b.color}18`, padding: "1px 5px", borderRadius: 4,
                    }}>NOW</div>
                  )}
                  <div style={{ fontSize: 22, marginBottom: 4 }}>{b.unlocked ? b.icon : "🔒"}</div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: b.unlocked ? b.color : "#444" }}>{b.name}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Streak */}
          <div style={{
            padding: "18px 20px", borderRadius: 16,
            background: "rgba(255,255,255,0.015)",
            border: "1px solid rgba(255,255,255,0.04)",
            marginBottom: 12,
            animation: "fadeUp 0.4s ease 0.2s both",
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#888", marginBottom: 10 }}>STREAK</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 28 }}>🔥</span>
              <div>
                <div style={{
                  fontSize: 24, fontWeight: 900, color: "#ffd055",
                  fontFamily: "'JetBrains Mono', monospace", lineHeight: 1,
                }}>{USER.streak}일 연속</div>
                <div style={{ fontSize: 10, color: "#555", marginTop: 2 }}>목표: 7일 연속</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 4, marginTop: 12 }}>
              {[1, 2, 3, 4, 5, 6, 7].map(d => (
                <div key={d} style={{
                  flex: 1, height: 4, borderRadius: 2,
                  background: d <= USER.streak ? "#ffd055" : "rgba(255,255,255,0.04)",
                  transition: "all 0.3s",
                }} />
              ))}
            </div>
          </div>

          {/* Stance Tendency */}
          <div style={{
            padding: "18px 20px", borderRadius: 16,
            background: "rgba(255,255,255,0.015)",
            border: "1px solid rgba(255,255,255,0.04)",
            animation: "fadeUp 0.4s ease 0.25s both",
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#888", marginBottom: 12 }}>STANCE TENDENCY</div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 11 }}>
              <span style={{ color: "#00e4a5", fontWeight: 700 }}>찬성 70%</span>
              <span style={{ color: "#ff4d8d", fontWeight: 700 }}>반대 30%</span>
            </div>
            <div style={{ display: "flex", height: 4, borderRadius: 2, gap: 2 }}>
              <div style={{ width: "70%", background: "#00e4a5", borderRadius: 2 }} />
              <div style={{ width: "30%", background: "#ff4d8d", borderRadius: 2 }} />
            </div>
            <div style={{
              marginTop: 10, padding: "8px 12px", borderRadius: 8,
              background: "rgba(0,228,165,0.06)", textAlign: "center",
              fontSize: 11, color: "#00e4a5", fontWeight: 600,
            }}>🔥 불도저 같은 확신력</div>
          </div>
        </div>
      </div>
    </div>
  );
}
