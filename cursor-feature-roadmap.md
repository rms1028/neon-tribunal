# 공개재판소 기능 추가 로드맵

UI 폴리싱이 끝났으니 기능적인 부분을 추가할 차례야.
아래 기능들을 우선순위 순서대로 구현해줘. 한번에 다 하지 말고 Phase별로 나눠서 진행하자.

---

## Phase 1: 핵심 인터랙션 (필수)

### 1-1. 더블탭 🔥 리액션 애니메이션
카드 본문 영역을 더블탭하면 🔥 이모지가 화면 중앙에 크게 나타났다 사라지는 효과.

**동작**:
- 더블탭 감지 (300ms 이내 두 번 탭)
- 🔥 이모지가 scale 0 → 1.2 → 1 로 팝업
- 0.8초 후 fade out
- 동시에 해당 카드의 🔥 카운트 +1
- 이미 🔥 누른 상태면 중복 방지

```jsx
// 더블탭 감지 로직
const lastTap = useRef(0);

const handleDoubleTap = () => {
  const now = Date.now();
  if (now - lastTap.current < 300) {
    triggerFireReaction();
  }
  lastTap.current = now;
};
```

```css
@keyframes doubleTapPop {
  0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
  50% { transform: translate(-50%, -50%) scale(1.3); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
}

.double-tap-emoji {
  position: absolute;
  top: 50%;
  left: 50%;
  font-size: 64px;
  pointer-events: none;
  animation: doubleTapPop 0.8s ease forwards;
  filter: drop-shadow(0 0 20px rgba(255,100,0,0.5));
}
```

---

### 1-2. VERDICT 접기/펼치기 애니메이션
현재 VERDICT 상세가 뚝딱 나타나는데, 부드럽게 펼쳐지도록.

**동작**:
- 탭하면 높이 0 → auto 로 슬라이드 다운
- 화살표(▾) 180도 회전
- 다시 탭하면 접힘

```css
.verdict-detail {
  overflow: hidden;
  max-height: 0;
  opacity: 0;
  transition: max-height 0.35s ease, opacity 0.25s ease, padding 0.35s ease;
  padding: 0 14px;
}

.verdict-detail.open {
  max-height: 500px;    /* 충분히 큰 값 */
  opacity: 1;
  padding: 12px 14px;
}
```

---

### 1-3. 배심원 투표 (동의/반대) + 실시간 비율 바
VERDICT 펼쳤을 때 배심원 투표 기능.

**동작**:
- 👍 동의 / 👎 반대 버튼
- 투표하면 버튼이 선택 상태로 변하고
- 아래에 비율 프로그레스 바 표시: "동의 73% ━━━━━━━━━━░░░ 반대 27%"
- 투표 후 다시 탭하면 취소 가능
- 총 투표 수 표시: "142명 참여"

```jsx
// 투표 후 비율 바
<div className="vote-result">
  <div className="vote-bar">
    <div 
      className="vote-fill agree" 
      style={{ width: `${agreePercent}%` }}
    />
  </div>
  <div className="vote-labels">
    <span>👍 동의 {agreePercent}%</span>
    <span>{totalVotes}명 참여</span>
    <span>👎 반대 {disagreePercent}%</span>
  </div>
</div>
```

```css
.vote-bar {
  width: 100%;
  height: 6px;
  background: rgba(255,45,120,0.3);
  border-radius: 3px;
  overflow: hidden;
  margin: 8px 0;
}

.vote-fill.agree {
  height: 100%;
  background: linear-gradient(90deg, #00ffcc, #00cc99);
  border-radius: 3px;
  transition: width 0.5s ease;
}
```

---

### 1-4. 무한 스크롤 (Infinite Scroll)
피드가 끝에 도달하면 자동으로 다음 페이지 로드.

**동작**:
- 마지막 카드가 뷰포트에 들어오면 다음 데이터 fetch
- 로딩 중에는 스켈레톤 카드 표시
- 더 이상 데이터 없으면 "모든 재판을 확인했어요 ⚡" 메시지

```jsx
// IntersectionObserver 사용
const observerRef = useRef();
const lastCardRef = useCallback(node => {
  if (loading) return;
  if (observerRef.current) observerRef.current.disconnect();
  observerRef.current = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && hasMore) {
      loadMoreCases();
    }
  });
  if (node) observerRef.current.observe(node);
}, [loading, hasMore]);
```

스켈레톤 카드:
```jsx
function SkeletonCard() {
  return (
    <div className="feed-card skeleton">
      <div className="skeleton-header">
        <div className="skeleton-avatar pulse" />
        <div className="skeleton-lines">
          <div className="skeleton-line w60 pulse" />
          <div className="skeleton-line w40 pulse" />
        </div>
      </div>
      <div className="skeleton-body">
        <div className="skeleton-line w100 pulse" />
        <div className="skeleton-line w90 pulse" />
        <div className="skeleton-line w70 pulse" />
      </div>
    </div>
  );
}
```

---

## Phase 2: 탐색 & 발견 기능

### 2-1. 판사 스토리 탭 기능
상단 판사 아이콘 탭하면 해당 판사의 최근 판결 하이라이트를 스토리 형태로 보여줌.

**동작**:
- 판사 아이콘 탭 → 풀스크린 스토리 오버레이
- 좌우 탭으로 이전/다음 판결 넘기기
- 상단에 프로그레스 바 (인스타 스토리처럼)
- 5초 후 자동 넘김 (터치하면 일시정지)
- 아래에서 위로 스와이프하면 해당 재판 상세로 이동

```
┌─────────────────────────────┐
│ ▓▓▓▓▓▓░░░░░░ ░░░░░░░░░░░░  │ ← 프로그레스 바
│                              │
│  ⚖️ 저스티스 제로             │
│                              │
│  "사연 요약 텍스트..."        │
│                              │
│  ┌────────────────────┐      │
│  │  VERDICT: 유죄      │      │
│  │  판결 요약          │      │
│  └────────────────────┘      │
│                              │
│  🔥 1.2k   💬 89             │
│                              │
│  ↑ 스와이프하여 상세 보기     │
└─────────────────────────────┘
```

---

### 2-2. 필터 탭 전환 애니메이션
탭 전환 시 카드 리스트가 부드럽게 전환.

**동작**:
- 탭 클릭 → 현재 카드들 fade out (0.15s)
- 새 카드들 fade in + 아래에서 위로 stagger (각 카드 50ms 딜레이)

```css
@keyframes cardEnter {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.feed-card {
  animation: cardEnter 0.3s ease forwards;
}

.feed-card:nth-child(1) { animation-delay: 0ms; }
.feed-card:nth-child(2) { animation-delay: 50ms; }
.feed-card:nth-child(3) { animation-delay: 100ms; }
.feed-card:nth-child(4) { animation-delay: 150ms; }
.feed-card:nth-child(5) { animation-delay: 200ms; }
```

---

### 2-3. Pull to Refresh (당겨서 새로고침)
피드 최상단에서 아래로 당기면 새로고침.

**동작**:
- 당기는 동안 ⚡ 아이콘 회전 애니메이션
- "새로운 재판을 찾는 중..." 텍스트
- 데이터 로드 완료 후 자동 닫힘

---

## Phase 3: 소셜 기능

### 3-1. 댓글 시스템
카드의 💬 버튼 탭하면 하단 시트(Bottom Sheet)로 댓글 영역 올라옴.

**동작**:
- 바텀 시트: 화면 70% 높이까지 올라옴
- 드래그로 높이 조절 가능
- 댓글 입력창은 키보드 위에 고정
- 댓글에도 🔥 리액션 가능
- 대댓글 1depth까지 지원

```
┌─────────────────────────────┐
│  ━━━  (드래그 핸들)          │
│  💬 댓글 78개                │
│  ─────────────────────────  │
│                              │
│  👤 유저A · 30분 전          │
│  이건 진짜 유죄 맞음 ㅋㅋ     │
│  🔥 12   💬 답글 3개 보기     │
│                              │
│  👤 유저B · 1시간 전          │
│  좀 억울한데...               │
│  🔥 5    💬 답글 1개 보기     │
│                              │
├─────────────────────────────┤
│  [😀] 댓글을 입력하세요...  [전송] │
└─────────────────────────────┘
```

---

### 3-2. 공유 기능
카드의 🔗 버튼 탭하면 공유 옵션.

**동작**:
- 바텀 시트로 공유 옵션 표시
- 옵션: 링크 복사 / 카카오톡 / 인스타 스토리 / 트위터
- "링크 복사됨!" 토스트 메시지
- 공유 시 카드를 이미지로 캡처하는 기능 (선택)

---

### 3-3. 북마크(저장) 기능
카드의 🔖 버튼 탭하면 저장.

**동작**:
- 탭 → 아이콘이 빈 북마크 → 채워진 북마크로 변경
- 살짝 바운스 애니메이션
- 프로필 > 저장한 재판 탭에서 모아보기
- 저장 시 "저장됨" 토스트 메시지

---

## Phase 4: 게이미피케이션

### 4-1. 배심원 등급 시스템
투표 참여 횟수에 따라 등급 부여.

```
🌱 신입 배심원    (0~9회)
⚖️ 정식 배심원    (10~49회)
🔥 열혈 배심원    (50~99회)
👑 수석 배심원    (100~499회)
💎 전설의 배심원   (500회+)
```

- 프로필에 등급 배지 표시
- 댓글에도 등급 아이콘 표시
- 등급 올라갈 때 축하 모달 애니메이션

---

### 4-2. 판결 적중률
AI 판결과 다수 배심원 의견이 일치한 비율 추적.

```
"당신의 판결 적중률: 78% 🎯"
"연속 적중: 5회 🔥"
```

- 프로필에 통계 카드로 표시
- 적중률 높은 유저는 "명예 배심원" 배지

---

### 4-3. 일일 미션
매일 참여를 유도하는 미션 시스템.

```
📋 오늘의 미션
✅ 재판 3건 읽기          (2/3)
⬜ 배심원 투표 2회         (0/2)
⬜ 댓글 1개 남기기         (0/1)
🎁 보상: 특별 이모지 🌟 해금
```

---

## 구현 순서 요약

| 순서 | 기능 | 난이도 | 임팩트 |
|------|------|--------|--------|
| 1 | 더블탭 리액션 | ⭐⭐ | 높음 |
| 2 | VERDICT 애니메이션 | ⭐ | 중간 |
| 3 | 배심원 투표 + 비율 바 | ⭐⭐ | 높음 |
| 4 | 무한 스크롤 | ⭐⭐ | 높음 |
| 5 | 판사 스토리 | ⭐⭐⭐ | 높음 |
| 6 | 필터 전환 애니메이션 | ⭐ | 중간 |
| 7 | Pull to Refresh | ⭐⭐ | 중간 |
| 8 | 댓글 시스템 | ⭐⭐⭐ | 높음 |
| 9 | 공유 기능 | ⭐⭐ | 중간 |
| 10 | 북마크 | ⭐ | 중간 |
| 11 | 배심원 등급 | ⭐⭐ | 높음 |
| 12 | 판결 적중률 | ⭐⭐ | 중간 |
| 13 | 일일 미션 | ⭐⭐⭐ | 높음 |

Phase 1부터 시작하자. 먼저 1-1(더블탭 리액션)과 1-2(VERDICT 애니메이션)를 구현해줘.
