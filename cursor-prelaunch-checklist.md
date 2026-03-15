# 네온즈 공개재판소 — 출시 전 종합 점검 가이드

---

## Part 1: QA 테스트 체크리스트

### 1-1. 핵심 기능 테스트

**피드**
- [ ] 피드 최초 로딩 시 카드가 정상 표시되는지
- [ ] 무한 스크롤: 하단 도달 시 다음 페이지 로드되는지
- [ ] 무한 스크롤: 더 이상 데이터 없을 때 "모든 재판을 확인했어요" 표시되는지
- [ ] Pull to Refresh: 당겨서 새로고침 동작하는지
- [ ] 필터 탭(전체/저스티스/하트빗/벵카/형사네온) 전환 시 카드 필터링 정상인지
- [ ] 필터 전환 애니메이션이 부드러운지
- [ ] 최신순/인기순 정렬 전환이 정상 동작하는지

**리액션**
- [ ] 더블탭 시 🔥 애니메이션이 나타나는지
- [ ] 더블탭 중복 방지: 이미 🔥 누른 카드에서 중복 카운트 안 되는지
- [ ] 리액션 4종(🔥💀❤️🤔) 각각 탭/해제 정상 동작하는지
- [ ] 리액션 하나만 선택 가능한지 (다른 거 누르면 이전 거 해제)
- [ ] 리액션 카운트가 실시간으로 반영되는지

**VERDICT**
- [ ] VERDICT 탭 시 부드럽게 펼쳐지는지
- [ ] 다시 탭 시 접히는지
- [ ] 화살표(▾) 회전 애니메이션 정상인지

**배심원 투표**
- [ ] 동의/반대 버튼 탭 동작하는지
- [ ] 투표 후 비율 바가 정상 표시되는지
- [ ] 재탭 시 투표 취소되는지
- [ ] 투표 수가 정확히 카운트되는지

**댓글**
- [ ] 💬 버튼 탭 시 바텀 시트 올라오는지
- [ ] 바텀 시트 드래그로 높이 조절 가능한지
- [ ] 댓글 입력 후 전송 동작하는지
- [ ] 대댓글(1depth) 동작하는지
- [ ] 댓글에 🔥 리액션 가능한지
- [ ] 키보드 올라왔을 때 입력창이 가려지지 않는지

**공유 & 북마크**
- [ ] 🔗 공유 버튼 탭 시 공유 옵션 바텀 시트 나오는지
- [ ] 링크 복사 시 "링크 복사됨" 토스트 표시되는지
- [ ] 카카오톡/인스타/트위터 공유 연동 정상인지
- [ ] 🔖 북마크 탭/해제 동작하는지
- [ ] 북마크한 재판이 프로필 > 저장 탭에 나오는지

**판사 스토리**
- [ ] 판사 아이콘 탭 시 풀스크린 스토리 오버레이 열리는지
- [ ] 좌우 탭으로 이전/다음 판결 넘어가는지
- [ ] 상단 프로그레스 바가 진행되는지
- [ ] 5초 후 자동 넘김 동작하는지
- [ ] 터치 시 자동 넘김 일시정지 되는지
- [ ] 스와이프 업으로 상세 페이지 이동하는지
- [ ] 스토리 닫기(X 또는 아래로 스와이프) 동작하는지

**게이미피케이션**
- [ ] 배심원 등급이 투표 횟수에 따라 정확히 부여되는지
- [ ] 등급 업 시 축하 모달이 나오는지
- [ ] 판결 적중률이 정확히 계산되는지
- [ ] 일일 미션 진행도가 실시간 반영되는지
- [ ] 미션 완료 시 보상이 지급되는지

**새 재판 작성**
- [ ] FAB 버튼(⚡ 새 재판) 탭 시 작성 화면 열리는지
- [ ] 사연 입력 → 제출 플로우가 정상인지
- [ ] 제출 후 피드에 내 재판이 나타나는지
- [ ] MY 배지가 내 글에 정상 표시되는지

---

### 1-2. 엣지 케이스 & 에러 처리

**빈 상태 (Empty States)**
- [ ] 피드에 데이터 0건일 때 빈 상태 화면 표시되는지
- [ ] 필터 결과 0건일 때 "해당 카테고리에 재판이 없어요" 표시되는지
- [ ] 댓글 0건일 때 "첫 댓글을 남겨보세요!" 표시되는지
- [ ] 북마크 0건일 때 빈 상태 화면 표시되는지

**네트워크 에러**
- [ ] 오프라인 상태에서 적절한 에러 메시지 표시되는지
- [ ] API 실패 시 재시도 버튼이 나오는지
- [ ] 로딩 중 네트워크 끊겼을 때 크래시 안 나는지

**입력 예외**
- [ ] 댓글에 빈 값 전송 방지되는지
- [ ] 사연 작성 시 최소/최대 글자 수 제한 동작하는지
- [ ] 특수문자/이모지 입력 시 깨지지 않는지
- [ ] XSS 공격 방지: 스크립트 태그 입력 시 이스케이프 처리되는지

---

### 1-3. 디바이스 & 브라우저 호환성

**모바일 (필수)**
- [ ] iPhone SE (375px) — 최소 너비
- [ ] iPhone 14/15 (390px)
- [ ] iPhone 14/15 Pro Max (430px) — 최대 너비
- [ ] Galaxy S23 (360px)
- [ ] Galaxy Z Fold (unfolded 내부 화면)

**브라우저 (필수)**
- [ ] Safari (iOS 16+)
- [ ] Chrome (Android)
- [ ] Samsung Internet

**추가 확인**
- [ ] 노치/다이나믹 아일랜드 영역 침범하지 않는지 (safe-area-inset)
- [ ] 가로 모드(landscape)에서 레이아웃 깨지지 않는지
- [ ] 다크모드 강제 설정 시 색상 깨지지 않는지
- [ ] 폰트 크기 설정(접근성)을 키웠을 때 레이아웃 깨지지 않는지

---

## Part 2: 성능 최적화

### 2-1. 로딩 속도

Cursor에게 아래 항목 점검 및 수정 요청:

```
다음 성능 최적화를 적용해줘:

1. 이미지 최적화
   - 판사 아이콘, 유저 아바타에 next/image 또는 lazy loading 적용
   - WebP 포맷 사용
   - 적절한 width/height 명시하여 CLS(Cumulative Layout Shift) 방지

2. 코드 스플리팅
   - 댓글 바텀 시트 → dynamic import (열 때만 로드)
   - 판사 스토리 오버레이 → dynamic import
   - 공유 바텀 시트 → dynamic import
   
3. 번들 사이즈
   - 사용하지 않는 import 제거
   - tree-shaking 확인
   - lodash 사용 시 개별 함수만 import

4. API 최적화
   - 피드 최초 로드: 10건만 fetch
   - 무한 스크롤: 10건씩 추가 fetch
   - 리액션/투표: optimistic update (API 응답 기다리지 않고 UI 먼저 반영)
   - SWR 또는 React Query로 캐싱 적용
```

### 2-2. 렌더링 성능

```
렌더링 성능을 개선해줘:

1. 불필요한 리렌더 방지
   - 각 FeedCard를 React.memo()로 감싸기
   - 리액션 상태 변경 시 해당 카드만 리렌더되는지 확인
   - useCallback/useMemo 적절히 적용

2. 리스트 가상화 (카드 50개 이상일 때)
   - react-window 또는 @tanstack/virtual 적용 검토
   - 뷰포트 밖 카드는 DOM에서 제거

3. 애니메이션 성능
   - transform, opacity만 사용하여 GPU 가속
   - will-change 속성은 애니메이션 직전에만 적용
   - contain: content로 레이아웃 격리

4. 스크롤 성능
   - IntersectionObserver 사용 (scroll 이벤트 대신)
   - passive event listener 적용
   - 디바운스/스로틀 적용
```

### 2-3. 성능 측정 목표

```
Lighthouse 모바일 기준 목표:
- Performance: 90+
- FCP (First Contentful Paint): < 1.5초
- LCP (Largest Contentful Paint): < 2.5초
- CLS (Cumulative Layout Shift): < 0.1
- TTI (Time to Interactive): < 3초
```

---

## Part 3: SEO / 메타태그 / OG 이미지

### 3-1. 기본 메타태그

```
아래 메타태그들을 적용해줘:

<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  
  <title>네온즈 공개재판소 — AI 판결에 투표하고 배심원이 되세요</title>
  <meta name="description" content="4명의 AI 판사가 내리는 판결, 당신은 동의하시나요? 네온즈에서 다양한 사연을 읽고 배심원으로 참여하세요." />
  
  <!-- Open Graph -->
  <meta property="og:type" content="website" />
  <meta property="og:title" content="네온즈 공개재판소" />
  <meta property="og:description" content="AI 판결에 투표하고 배심원이 되세요 ⚡" />
  <meta property="og:image" content="https://neons.app/og-image.png" />
  <meta property="og:url" content="https://neons.app/court" />
  <meta property="og:site_name" content="NEONS" />
  <meta property="og:locale" content="ko_KR" />
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="네온즈 공개재판소" />
  <meta name="twitter:description" content="AI 판결에 투표하고 배심원이 되세요 ⚡" />
  <meta name="twitter:image" content="https://neons.app/og-image.png" />
  
  <!-- 카카오톡 -->
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  
  <!-- 테마 컬러 (브라우저 주소창) -->
  <meta name="theme-color" content="#0a0a0f" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  
  <!-- 파비콘 -->
  <link rel="icon" href="/favicon.ico" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
</head>
```

### 3-2. 개별 재판 페이지 동적 OG 태그

```
각 재판 상세 페이지는 동적 OG 태그를 생성해줘:

// Next.js 예시 (app router)
export async function generateMetadata({ params }) {
  const caseData = await getCaseById(params.id);
  
  return {
    title: `${caseData.verdict.summary} — 네온즈 공개재판소`,
    description: caseData.story.slice(0, 100) + '...',
    openGraph: {
      title: caseData.verdict.summary,
      description: caseData.story.slice(0, 100) + '...',
      images: [`/api/og?caseId=${params.id}`],
    },
  };
}
```

### 3-3. OG 이미지 디자인 가이드

카카오톡/인스타/트위터에서 공유했을 때 보이는 이미지. 사이즈: 1200x630px

```
┌──────────────────────────────────────────┐
│                                          │
│  ⚡ NEON COURT                           │
│                                          │
│  "친구와 돈 문제로 다투고 있어요         │
│   친구가 돈을 갚지 않아요"               │
│                                          │
│  ┌──────────────────────┐                │
│  │ VERDICT: 유죄         │                │
│  │ 💗 깨진 우정, 냉정히 대처 │            │
│  └──────────────────────┘                │
│                                          │
│  🔥 1.2k  💬 89  ⚖️ 배심원 투표 참여하기  │
│                                          │
│  배경: 다크(#0a0a0f) + 네온 그라디언트    │
└──────────────────────────────────────────┘
```

동적 OG 이미지 생성: @vercel/og 또는 satori 라이브러리 활용

### 3-4. 구조화된 데이터 (Schema.org)

```json
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "네온즈 공개재판소",
  "description": "AI 판결에 투표하고 배심원이 되세요",
  "url": "https://neons.app/court",
  "applicationCategory": "EntertainmentApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0"
  }
}
```

---

## 실행 순서

Cursor에게 순서대로 요청:

1. **먼저**: Part 2 (성능 최적화) → 코드 레벨 개선
2. **그 다음**: Part 3 (SEO/메타태그) → 검색/공유 대비
3. **마지막**: Part 1 (QA 체크리스트) → 하나씩 직접 테스트하면서 버그 잡기
