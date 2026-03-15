# 공개재판소 UI 마무리 수정 요청

전체적으로 잘 나왔어. 아래 4가지만 마무리하면 돼.

---

## 1. 스토리 행 ↔ 필터 탭 순서 변경

현재: 필터 탭 → 스토리 행
변경: **스토리 행 → 필터 탭** (인스타그램과 동일한 순서)

```
┌─────────────────────────┐
│ NEON COURT 헤더          │
├─────────────────────────┤
│ 🔵🔴🟢🟡🏆 스토리 행     │  ← 먼저
├─────────────────────────┤
│ ⚡전체  ⚖️저스티스  💗하트 │  ← 그 다음 (sticky)
├─────────────────────────┤
│ 피드 카드들...            │
└─────────────────────────┘
```

스토리 행은 스크롤 시 올라가고, 필터 탭만 sticky로 고정되게 해줘.

---

## 2. 판사 이름 잘림 수정

현재 "하트 비", "형사 네" 처럼 이름이 잘리고 있어.

**방법 A (권장)**: 표시 이름을 축약형으로 변경
```
저스티스 제로 → "저스티스"
하트 비트    → "하트빗"
사이버 벵카  → "벵카"
형사 네온    → "형사네온"
명예의전당   → "명예전당"
```

**방법 B**: 스토리 아이템 너비를 넓히기
```css
.story-item {
  width: 72px;        /* 기존 64px → 72px */
  flex-shrink: 0;
}

.story-name {
  font-size: 10px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 72px;
  text-align: center;
}
```

둘 다 적용해도 좋아. 이름을 축약하면서 너비도 살짝 넓혀줘.

---

## 3. 리액션 바 개선

현재 🔥0 💬0 이 너무 작고 밋밋해. 터치 영역도 부족함.

**수정사항**:
- 아이콘 크기: 18px → 22px
- 버튼 최소 터치 영역: 44x44px (모바일 접근성 기준)
- 리액션 간 간격 넓히기
- 숫자가 0이면 숫자 숨기고 아이콘만 표시

```css
.reaction-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 10px;        /* 터치 영역 확보 */
  min-height: 44px;
  border-radius: 20px;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.reaction-btn:active {
  transform: scale(0.92);    /* 터치 피드백 */
  background: rgba(255,255,255,0.08);
}

.reaction-emoji {
  font-size: 22px;           /* 기존 18px에서 키움 */
}

.reaction-count {
  font-size: 12px;
  font-weight: 600;
  color: rgba(255,255,255,0.5);
}
```

```jsx
// 숫자 0이면 숨기기
<span className="reaction-count">
  {count > 0 ? formatCount(count) : ''}
</span>
```

리액션 바 전체 레이아웃:
```css
.reaction-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 8px 12px;
}

.reaction-left {
  display: flex;
  gap: 2px;            /* 아이콘끼리 간격 */
}

.reaction-right {
  display: flex;
  align-items: center;
  gap: 4px;
}
```

---

## 4. MY 배지 강조

현재 본인 글의 "MY" 배지가 너무 안 보여. 네온 컬러로 강조해줘.

```css
.my-badge {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1px;
  padding: 2px 8px;
  border-radius: 8px;
  background: rgba(0, 255, 204, 0.15);
  color: #00ffcc;
  border: 1px solid rgba(0, 255, 204, 0.3);
  text-transform: uppercase;
}
```

카드 헤더 우측에 위치하되, ⋯(더보기) 버튼 왼쪽에 배치:
```
│ 👤 유저명  ⚖️판사태그  시간     [MY] ⋯ │
```

---

## 체크리스트
수정 후 확인해줘:
- [ ] 스토리 행이 필터 탭 위에 있는지
- [ ] 필터 탭만 sticky로 고정되는지
- [ ] 판사 이름이 잘리지 않는지
- [ ] 리액션 아이콘이 충분히 크고 터치하기 쉬운지
- [ ] 숫자 0인 리액션은 숫자 없이 아이콘만 나오는지
- [ ] MY 배지가 네온 그린으로 잘 보이는지
- [ ] 기존 기능(투표, 더보기, 필터링 등) 정상 동작하는지
