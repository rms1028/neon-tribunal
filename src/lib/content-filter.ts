// ─── XSS Sanitization ───────────────────────────────────────────────────────

const SCRIPT_CONTENT_RE = /<script[\s>][\s\S]*?<\/script>/gi;
const HTML_TAG_RE = /<\/?[a-z][^>]*>/gi;
const EVENT_HANDLER_RE = /\bon\w+\s*=\s*["'][^"']*["']/gi;
const DATA_URI_RE = /data:\s*[^;]+;\s*base64/gi;
const JAVASCRIPT_URI_RE = /javascript\s*:/gi;
const EXPRESSION_RE = /expression\s*\(/gi;
const VB_SCRIPT_RE = /vbscript\s*:/gi;
const NULL_BYTE_RE = /\0/g;
const ENCODED_ANGLE_RE = /&(lt|gt|#0*60|#0*62|#x0*3c|#x0*3e);?/gi;

/**
 * 서버 사이드 XSS 방지를 위한 sanitization.
 * HTML 태그, 스크립트 패턴, 이벤트 핸들러, 위험 URI 등을 제거한다.
 */
export function sanitizeInput(raw: string): string {
  return raw
    .replace(NULL_BYTE_RE, "")
    .replace(SCRIPT_CONTENT_RE, "")
    .replace(HTML_TAG_RE, "")
    .replace(EVENT_HANDLER_RE, "")
    .replace(JAVASCRIPT_URI_RE, "")
    .replace(VB_SCRIPT_RE, "")
    .replace(DATA_URI_RE, "")
    .replace(EXPRESSION_RE, "")
    .replace(ENCODED_ANGLE_RE, "");
}

// ─── Profanity / Sensitive Content Filter ───────────────────────────────────

/**
 * 비속어·민감 콘텐츠 패턴 목록.
 * - 한국어 비속어 (변형 포함)
 * - 영어 비속어
 * - 성적·폭력·혐오 관련 표현
 *
 * 패턴은 단어 경계 없이 매칭되므로 substring 포함도 감지한다.
 * 지나치게 넓은 패턴은 의도적으로 제외하여 오탐(false positive)을 줄인다.
 */
const PROFANITY_PATTERNS: RegExp[] = [
  // ── 한국어 비속어 ──
  /시[이ㅣ]?발/i,
  /씨[이ㅣ]?발/i,
  /씨[이ㅣ]?팔/i,
  /씨[이ㅣ]?바[ㄹl]/i,
  /ㅅㅂ/,
  /ㅆㅂ/,
  /씹/,
  /좆/,
  /자[ㅣi]지/i,
  /보[ㅈz]이/i,
  /개[새세]끼/i,
  /개[새세]기/i,
  /ㄱㅅㄲ/,
  /병[시신]|ㅂㅅ/,
  /지[ㄹ랄]이/i,
  /미친[년놈]/,
  /느[금그]마/,
  /니[애에]미/,
  /니[애에]비/,
  /엠[창]/,
  /애[미]창/i,
  /닥[쳐쵸]/i,
  /꺼[져저]/i,
  /죽[여어을]/,
  /존[나]+/,

  // ── 영어 비속어 ──
  /\bf+u+c+k+/i,
  /\bs+h+i+t+\b/i,
  /\bb+i+t+c+h+/i,
  /\ba+s+s+h+o+l+e+/i,
  /\bd+i+c+k+\b/i,
  /\bc+u+n+t+\b/i,
  /\bn+i+g+g+/i,
  /\bf+a+g+\b/i,

  // ── 혐오·차별 표현 ──
  /[한][남녀]충/,
  /틀[딱]/,
  /맘[충]/,
  /재[기]해/,

  // ── 자해·자살 관련 (안전 우려) ──
  /자살\s*방법/,
  /자해\s*방법/,
  /목\s*매/i,
];

/**
 * 입력 텍스트에 비속어/민감 콘텐츠가 포함되어 있는지 검사한다.
 * @returns 감지된 경우 true
 */
export function containsProfanity(text: string): boolean {
  const normalized = text
    .replace(/\s+/g, " ")       // 공백 정규화
    .replace(/[.*_\-~]/g, "");  // 우회용 특수문자 제거
  return PROFANITY_PATTERNS.some((re) => re.test(normalized));
}

// 클라이언트에서도 동일 로직 재사용 가능하도록 export
export const PROFANITY_ERROR_MESSAGE =
  "부적절한 표현이 포함되어 있습니다. 내용을 수정해주세요.";
