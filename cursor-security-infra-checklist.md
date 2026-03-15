# 네온즈 공개재판소 — 보안 / 모니터링 / 인프라 점검 가이드

---

## Part 1: 보안 점검

### 1-1. API 보호

```
아래 API 보안 항목들을 점검하고 적용해줘:

1. Rate Limiting (요청 제한)
   - 피드 조회: 분당 60회 제한
   - 리액션/투표: 분당 30회 제한
   - 댓글 작성: 분당 10회 제한
   - 새 재판 작성: 시간당 5회 제한
   - 제한 초과 시 429 Too Many Requests 응답
   - IP 기반 + 유저 기반 이중 제한

2. 입력 유효성 검증 (서버 사이드 필수)
   - 모든 API 입력값 서버에서 재검증 (클라이언트 검증만 믿지 않기)
   - 사연 텍스트: 최소 10자, 최대 2000자
   - 댓글 텍스트: 최소 1자, 최대 500자
   - 닉네임: 특수문자 제한, 최대 20자
   - SQL Injection 방지: ORM 사용 또는 parameterized query
   - XSS 방지: 모든 유저 입력 HTML 이스케이프 처리
   - 파일 업로드가 있다면 파일 타입/크기 검증

3. CORS 설정
   - 허용 도메인을 neons.app 관련 도메인만으로 제한
   - 와일드카드(*) 절대 사용 금지
   - credentials 포함 요청 시 특히 주의

4. API 키 / 시크릿 관리
   - .env 파일에 저장, 절대 코드에 하드코딩 금지
   - .gitignore에 .env 포함 확인
   - AI 판사 API 키가 클라이언트에 노출되지 않는지 확인
   - 모든 API 호출은 서버 사이드에서 (API Route / Server Action)
```

### 1-2. 인증 & 인가

```
인증/인가 보안을 점검해줘:

1. 인증 (Authentication)
   - JWT 토큰 만료 시간 설정 (access: 15분, refresh: 7일)
   - refresh 토큰은 httpOnly 쿠키에 저장 (localStorage 금지)
   - 로그아웃 시 서버에서 refresh 토큰 무효화
   - 비밀번호 저장: bcrypt 해싱 (최소 salt rounds 10)

2. 인가 (Authorization)
   - 본인 재판만 수정/삭제 가능한지
   - 본인 댓글만 수정/삭제 가능한지
   - 투표 조작 불가: 한 유저가 같은 재판에 중복 투표 못하는지
   - 관리자 API에 일반 유저 접근 차단되는지
   - API 응답에 다른 유저의 민감 정보 포함 안 되는지

3. 세션 보안
   - HTTPS 필수 (HTTP → HTTPS 리다이렉트)
   - 쿠키에 Secure, HttpOnly, SameSite=Strict 플래그
   - CSRF 토큰 적용 (POST/PUT/DELETE 요청)
```

### 1-3. 어뷰징 방지

```
어뷰징 방지 기능을 구현해줘:

1. 도배 방지
   - 같은 유저가 동일 내용 연속 작성 차단
   - 재판 작성: 최소 5분 간격
   - 댓글 작성: 최소 10초 간격
   - 리액션 연타: 1초 내 중복 탭 무시 (디바운스)

2. 악성 콘텐츠 필터링
   - 욕설/비속어 필터 적용 (작성 시 경고)
   - 스팸 링크 자동 차단
   - 신고 기능: 재판/댓글에 신고 버튼
   - 신고 N회 이상 누적 시 자동 블라인드 처리

3. 봇 방지
   - 재판 작성/회원가입에 reCAPTCHA v3 또는 Turnstile 적용
   - User-Agent 검증
   - 비정상 패턴 감지 (초당 N회 이상 API 호출)

4. 계정 보안
   - 로그인 실패 5회 시 10분 잠금
   - 비정상 로그인 시도 시 이메일 알림 (선택)
   - 계정 탈퇴 시 개인정보 즉시 삭제 또는 30일 유예
```

---

## Part 2: 모니터링 & 에러 추적

### 2-1. Sentry 에러 추적 세팅

```
Sentry를 프로젝트에 연동해줘:

1. 설치 및 초기화
   npm install @sentry/nextjs  (또는 해당 프레임워크용)

   // sentry.client.config.ts
   import * as Sentry from '@sentry/nextjs';
   
   Sentry.init({
     dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
     environment: process.env.NODE_ENV,
     tracesSampleRate: 1.0,        // 프로덕션에서는 0.1~0.2로 낮추기
     replaysSessionSampleRate: 0.1,
     replaysOnErrorSampleRate: 1.0,
   });

2. 에러 경계 설정
   - React Error Boundary 래핑
   - 에러 발생 시 "문제가 발생했어요" 폴백 UI 표시
   - Sentry에 자동 리포트

3. 커스텀 에러 추적 (이 이벤트들은 꼭 추적해줘)
   - API 호출 실패 (status code, endpoint, response time)
   - AI 판사 API 타임아웃 또는 에러
   - 투표/리액션 저장 실패
   - 무한 스크롤 데이터 로드 실패
   - 이미지/아바타 로드 실패
   - 웹소켓 연결 끊김 (실시간 기능 있을 경우)

4. 유저 컨텍스트
   Sentry.setUser({
     id: userId,
     username: anonymousName,
   });
   // 에러 발생 시 어떤 유저에게서 발생했는지 추적 가능
```

### 2-2. 로깅 시스템

```
서버 사이드 로깅을 구축해줘:

1. 로그 레벨 구분
   - ERROR: API 실패, DB 에러, 인증 실패
   - WARN: Rate limit 근접, 느린 쿼리 (>1초), 재시도
   - INFO: 재판 생성, 투표, 유저 가입/탈퇴
   - DEBUG: API 요청/응답 상세 (개발환경만)

2. 구조화된 로그 포맷
   {
     "timestamp": "2026-03-15T12:00:00Z",
     "level": "ERROR",
     "service": "neon-court",
     "message": "AI judge API timeout",
     "context": {
       "judge": "justice_zero",
       "caseId": "case_123",
       "responseTime": 5200,
       "userId": "user_456"
     }
   }

3. 로그 저장
   - 개발: 콘솔 출력
   - 프로덕션: 클라우드 로그 서비스 연동
     * Vercel → Vercel Logs (기본 제공)
     * AWS → CloudWatch
     * 또는 Datadog / LogRocket / Axiom 중 택 1

4. 핵심 로그 대시보드 항목
   - 시간당 에러 발생 수
   - API 응답 시간 평균/p95/p99
   - AI 판사별 API 성공률
   - 활성 유저 수 (실시간)
```

### 2-3. 알림 설정

```
심각한 상황에 즉시 알림 받을 수 있게 설정해줘:

1. 즉시 알림 (Slack 또는 Discord 웹훅)
   - 서버 500 에러 5분 내 10건 이상
   - AI 판사 API 전체 다운
   - DB 연결 실패
   - 배포 실패

2. 주의 알림 (이메일 또는 일일 리포트)
   - 일일 에러율 5% 초과
   - API 평균 응답시간 2초 초과
   - 디스크/메모리 사용률 80% 초과

3. 알림 채널 세팅 예시 (Slack)
   // Sentry에서 Slack 연동
   Sentry → Settings → Integrations → Slack
   
   // 또는 직접 웹훅
   async function sendAlert(message) {
     await fetch(process.env.SLACK_WEBHOOK_URL, {
       method: 'POST',
       body: JSON.stringify({ text: `🚨 [NEONS] ${message}` }),
     });
   }
```

### 2-4. 헬스체크 엔드포인트

```
서비스 상태를 외부에서 확인할 수 있는 헬스체크 API를 만들어줘:

// /api/health
export async function GET() {
  const checks = {
    server: 'ok',
    database: await checkDB(),      // DB 연결 확인
    aiJudge: await checkAIAPI(),    // AI API 연결 확인
    timestamp: new Date().toISOString(),
  };
  
  const allOk = Object.values(checks)
    .filter(v => typeof v === 'string')
    .every(v => v === 'ok');
  
  return Response.json(checks, { 
    status: allOk ? 200 : 503 
  });
}

// 응답 예시
{
  "server": "ok",
  "database": "ok",
  "aiJudge": "ok",
  "timestamp": "2026-03-15T12:00:00Z"
}

외부 모니터링 서비스(UptimeRobot, Better Stack 등)에서
이 엔드포인트를 1분 간격으로 체크하도록 설정.
다운 시 즉시 알림.
```

---

## Part 3: 인프라 점검

### 3-1. 도메인 & DNS

```
도메인 관련 점검:

- [ ] 도메인 등록 확인 (neons.app 또는 사용 중인 도메인)
- [ ] DNS 레코드 정확히 설정됐는지
      * A 레코드 또는 CNAME → 호스팅 서버
      * www 서브도메인 → 리다이렉트 또는 미러
- [ ] 도메인 자동 갱신 활성화 (만료 방지)
- [ ] 네임서버가 올바른 호스팅 제공자를 가리키는지
- [ ] 서브도메인 계획
      * neons.app → 메인 사이트
      * api.neons.app → API 서버 (분리 시)
      * admin.neons.app → 관리자 패널 (필요 시)
```

### 3-2. SSL / HTTPS

```
SSL 인증서 점검:

- [ ] HTTPS 정상 동작하는지
- [ ] HTTP → HTTPS 자동 리다이렉트 설정됐는지
- [ ] SSL 인증서 자동 갱신 설정됐는지
      * Vercel/Netlify: 자동 관리 (확인만)
      * 직접 호스팅: Let's Encrypt + certbot 자동 갱신
- [ ] SSL Labs 테스트 통과 (https://ssllabs.com)
      * 목표: A 등급 이상
- [ ] HSTS 헤더 설정
      Strict-Transport-Security: max-age=31536000; includeSubDomains
- [ ] Mixed Content 경고 없는지 (HTTP 리소스 로드 차단)
```

### 3-3. 배포 파이프라인 (CI/CD)

```
배포 자동화 파이프라인을 점검해줘:

1. Git 브랜치 전략
   main     → 프로덕션 (자동 배포)
   develop  → 스테이징 (자동 배포)
   feature/* → 기능 개발 (PR → develop 머지)
   hotfix/* → 긴급 수정 (PR → main 직접 머지)

2. CI 파이프라인 (PR 생성 시 자동 실행)
   - 린트 검사 (ESLint)
   - 타입 체크 (TypeScript)
   - 빌드 테스트 (빌드 실패 시 머지 차단)
   - 유닛 테스트 (있다면)
   - 번들 사이즈 체크 (급격한 증가 감지)

3. CD 파이프라인 (머지 시 자동 배포)
   - 스테이징 환경에 먼저 배포
   - 스테이징에서 스모크 테스트
   - 프로덕션 배포
   - 배포 후 헬스체크 자동 확인
   - 실패 시 자동 롤백

4. 환경별 설정 분리
   .env.local        → 로컬 개발
   .env.staging      → 스테이징
   .env.production   → 프로덕션
   
   각 환경별로 분리해야 할 값:
   - API URL
   - AI 판사 API 키
   - DB 연결 문자열
   - Sentry DSN
   - 분석 도구 키 (GA, Mixpanel 등)
```

### 3-4. 호스팅 & 스케일링

```
호스팅 환경을 점검해줘:

1. Vercel 사용 시
   - [ ] 프로젝트 연결 확인
   - [ ] 환경 변수 모두 설정됐는지
   - [ ] Edge/Serverless 함수 타임아웃 설정 (AI 판결 생성이 오래 걸릴 수 있음)
         * Hobby: 10초 / Pro: 60초 / Enterprise: 300초
   - [ ] 대역폭 제한 확인 (무료 플랜: 100GB/월)
   - [ ] Preview 배포 동작 확인 (PR마다 자동 미리보기)

2. DB 호스팅
   - [ ] 연결 풀 설정 (max connections)
   - [ ] 자동 백업 활성화 (일일 백업)
   - [ ] DB 리전이 서버 리전과 가까운지 (한국 서비스면 ap-northeast 권장)
   - [ ] 슬로우 쿼리 모니터링 설정

3. 스케일링 대비
   - [ ] 정적 자산(이미지, CSS, JS) CDN 배포 확인
   - [ ] 캐싱 전략 설정
         * 정적 파일: Cache-Control: public, max-age=31536000
         * API 응답: 상황별 캐시 (피드: 30초, 프로필: 5분)
         * ISR/SSG 활용 가능한 페이지 확인
   - [ ] 동시 접속 1000명 이상 시 병목 지점 예측
         * AI 판사 API 호출 큐잉 필요 여부
         * DB 커넥션 풀 충분한지
```

### 3-5. 백업 & 복구 계획

```
장애 대응 체크리스트:

1. 데이터 백업
   - [ ] DB 자동 백업: 일일 1회 이상
   - [ ] 백업 보관 기간: 최소 30일
   - [ ] 백업 복구 테스트: 실제로 복구해본 적 있는지
   - [ ] 유저 생성 콘텐츠(사연, 댓글) 별도 백업

2. 장애 시나리오별 대응
   
   AI 판사 API 다운 시:
   → 새 재판 작성 일시 중단
   → "AI 판사가 잠시 쉬고 있어요" 안내 메시지
   → 기존 판결 데이터는 정상 표시
   
   DB 다운 시:
   → 캐시된 피드 데이터라도 보여주기 (가능하다면)
   → "잠시 후 다시 시도해주세요" 에러 페이지
   → 자동 재연결 시도
   
   전체 서비스 다운 시:
   → 정적 점검 페이지 표시
   → 점검 예상 시간 안내
   → SNS 공지 (트위터/인스타)

3. 롤백 절차
   - Vercel: 이전 배포로 즉시 롤백 (대시보드에서 클릭 한 번)
   - DB 마이그레이션 롤백 스크립트 준비
   - 롤백 후 정상 동작 확인 체크리스트
```

### 3-6. 출시 전 최종 체크리스트

```
배포 당일 확인 사항:

- [ ] 프로덕션 환경 변수 모두 설정 확인
- [ ] 프로덕션 DB 마이그레이션 완료
- [ ] SSL 인증서 유효
- [ ] 도메인 DNS 전파 완료
- [ ] 헬스체크 엔드포인트 200 응답
- [ ] Sentry 에러 추적 연동 확인
- [ ] 모니터링 알림 채널 동작 확인 (테스트 알림 발송)
- [ ] OG 이미지 카카오톡/트위터에서 미리보기 확인
- [ ] Google Search Console 사이트맵 제출
- [ ] 로봇.txt 설정 확인
- [ ] 404 페이지 커스텀 디자인 적용
- [ ] 팀원 전체 긴급 연락처 공유
```

---

## 실행 순서

Cursor에게 순서대로 요청:

1. **Part 1** → 보안 점검 (API 보호, 인증, 어뷰징 방지 코드 적용)
2. **Part 2** → 모니터링 세팅 (Sentry 연동, 로깅, 알림, 헬스체크)
3. **Part 3** → 인프라 점검 (직접 확인할 항목 + Cursor에게 CI/CD 설정 요청)
