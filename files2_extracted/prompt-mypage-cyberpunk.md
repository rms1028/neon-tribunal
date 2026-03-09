# 마이페이지 리디자인 — 사이버펑크 + HUD

프로젝트 루트에 있는 mypage-cyberpunk.jsx 파일을 참고해서 마이페이지를 리디자인해줘.

## 핵심 컨셉
메인페이지의 사이버펑크 감성을 유지하면서, 기존 메인 오른쪽에 있던 HUD를 마이페이지로 이동.
게이미피케이션 요소(배지, 스트릭, 랭크)는 마이페이지에서만 보여줌.

## 전체 레이아웃
- 2컬럼: 왼쪽(프로필+활동, flex: 1) | 오른쪽(HUD 패널, 340px 고정)
- maxWidth: 1200px, margin: 0 auto
- 오른쪽 패널: position sticky, top: 100px

## 헤더
- 왼쪽: ← 홈 버튼 + "MY PROFILE" 텍스트
- 오른쪽: 설정 버튼 + 프로필 수정 버튼 (초록 테두리)
- sticky, blur 배경

## 왼쪽: 프로필 + 활동

### 프로필 카드
- 큰 카드, borderRadius: 20px
- 배경: linear-gradient(135deg, rgba(0,228,165,0.03), rgba(192,132,252,0.02))
- 테두리: 1px solid rgba(0,228,165,0.08), 글로우 애니메이션
- 오른쪽 상단 코너에 보라색 그라데이션 장식
- 내부 구성:
  - 아바타 (72px, borderRadius 20px, 초록 그라데이션 배경, 이니셜 fontSize 28, 글로우 테두리 애니메이션)
  - 아바타 우하단에 초록 온라인 점 (14px)
  - 유저명 (fontSize 22, fontWeight 900)
  - 레벨 뱃지 (보라색, JetBrains Mono, rgba(192,132,252,0.12) 배경)
  - 칭호 (⚔️ + 칭호 텍스트, 보라색)
  - 가입일
  - 오른쪽에 XP 숫자 (금색 #ffd055, JetBrains Mono)
- 하단에 XP 프로그레스 바 (4px, 초록→보라 그라데이션, 글로우 shadow)

### 활동 요약 (3칸 가로 그리드)
- 각 카드: padding 18px, borderRadius 14px
- 큰 숫자 (fontSize 26, fontWeight 900, JetBrains Mono)
- 아이콘 + 라벨
- 컬러: 토론 #00e4a5, 댓글 #55b3ff, 좋아요 #ff4d8d
- 배경: rgba(255,255,255,0.015), hover 시 테두리 컬러 강조

### 탭 (내 토론 / 내 댓글)
- 선택된 탭: fontWeight 700, 하단 2px #00e4a5 바
- 미선택: color #555
- 북마크 탭은 제거 (메인 사이드바로 이동)

### 내 토론 리스트
- 각 아이템: 왼쪽에 타입 컬러 바 (3px, CLASH=#00e4a5, FREE=#55b3ff)
- 토론 제목 (fontSize 15, fontWeight 700) + 타입 뱃지 (JetBrains Mono)
- 찬성/반대 수 + 카테고리 태그 + 시간
- hover 시 테두리 밝아짐

### 내 댓글 리스트
- 각 아이템: 토론명 + 찬성/반대 뱃지 + 시간
- 댓글 본문 (fontSize 14, color #bbb)
- hover 시 테두리 밝아짐

## 오른쪽: HUD 패널

### 1. HUD 헤더 + 랭크 카드
- "HUD" 텍스트 (Orbitron 폰트, letterSpacing 1)
- "● ONLINE" 뱃지 (초록, 글로우 애니메이션)
- 내부에 CURRENT RANK 카드:
  - 배경 rgba(0,0,0,0.2)
  - 칭호 + 레벨 뱃지
  - "다음: [다음 칭호] (현재XP / 필요XP)"
  - XP 프로그레스 바 (초록→보라 그라데이션 + 글로우)
- 카드 배경: linear-gradient(135deg, rgba(0,228,165,0.04), rgba(192,132,252,0.03))
- 테두리: rgba(0,228,165,0.08)

### 2. BADGE COLLECTION
- 2x2 그리드
- 해금된 배지: 아이콘 + 이름 + 해당 컬러 배경
- 현재 배지: 더 진한 테두리 + "NOW" 뱃지
- 미해금: opacity 0.4 + 🔒 아이콘
- hover 시 테두리 강조

### 3. STREAK
- 🔥 이모지 + "N일 연속" (fontSize 24, fontWeight 900, #ffd055)
- "목표: 7일 연속"
- 7칸 프로그레스 바 (달성한 날은 금색, 미달성은 회색)

### 4. STANCE TENDENCY
- 찬성/반대 퍼센트 + 비율 바 (초록/핑크)
- 성향 라벨 (예: "🔥 불도저 같은 확신력")
- 라벨 배경: rgba(0,228,165,0.06)

## 배경 효과
- 페이지 상단에 radial-gradient 앰비언트 라이트
  - 왼쪽: rgba(0,228,165,0.04)
  - 오른쪽: rgba(192,132,252,0.03)
- pointer-events: none

## 제거할 기존 요소
- COMBAT STATS 7칸 그리드 (활동 요약 3칸으로 대체)
- 업적 18개 섹션
- 특별 뱃지 섹션 (BADGE COLLECTION에 통합)
- 마이페이지의 북마크 탭 (메인 사이드바로 이동)

## 메인페이지에서 제거할 것
- 오른쪽 HUD 패널 전체 (마이페이지로 이동했으므로)
- 메인에서는 토론 목록에만 집중하도록

## 폰트
- 일반 텍스트: Noto Sans KR
- 숫자/코드: JetBrains Mono
- HUD 라벨: Orbitron (없으면 JetBrains Mono로 대체)

## 컬러
- 메인 액센트: #00e4a5 (초록)
- 보조: #c084fc (보라), #ff4d8d (핑크), #55b3ff (파랑), #ffd055 (금색)
- 다크 테마 배경 유지

## 애니메이션
- fadeUp: 카드 등장 시 아래에서 올라오는 효과 (stagger delay)
- borderGlow: 아바타 테두리 글로우 (3s ease infinite)
- glow: ONLINE 표시 깜빡임

mypage-cyberpunk.jsx의 모든 컴포넌트 구조와 스타일을 최대한 따라가되, 기존 프로젝트의 유저 데이터와 API에 맞게 연동해줘.
