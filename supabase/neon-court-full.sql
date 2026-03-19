-- ============================================================
-- NEON COURT (네온즈) - 통합 SQL 스키마
-- Supabase SQL Editor에서 실행하세요
-- ※ 기존 테이블이 있어도 안전하게 재실행 가능
-- ============================================================

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 1. 메인 테이블: verdicts (판결)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS verdicts (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  judge_id       TEXT NOT NULL,
  judge_name     TEXT NOT NULL,
  story          TEXT NOT NULL,
  verdict        TEXT NOT NULL,
  likes          INTEGER NOT NULL DEFAULT 0,
  jury_agree     INTEGER NOT NULL DEFAULT 0,
  jury_disagree  INTEGER NOT NULL DEFAULT 0,
  image_url      TEXT,
  viral_quote    TEXT,
  tldr           TEXT,
  og_image_url   TEXT,
  author_nickname TEXT,
  author_icon    TEXT,
  delete_token   TEXT NOT NULL,
  category       TEXT DEFAULT '기타',
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- 기존 테이블에 누락된 컬럼 추가 (이미 있으면 무시)
ALTER TABLE verdicts ADD COLUMN IF NOT EXISTS jury_agree INTEGER NOT NULL DEFAULT 0;
ALTER TABLE verdicts ADD COLUMN IF NOT EXISTS jury_disagree INTEGER NOT NULL DEFAULT 0;
ALTER TABLE verdicts ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE verdicts ADD COLUMN IF NOT EXISTS viral_quote TEXT;
ALTER TABLE verdicts ADD COLUMN IF NOT EXISTS tldr TEXT;
ALTER TABLE verdicts ADD COLUMN IF NOT EXISTS og_image_url TEXT;
ALTER TABLE verdicts ADD COLUMN IF NOT EXISTS author_nickname TEXT;
ALTER TABLE verdicts ADD COLUMN IF NOT EXISTS author_icon TEXT;
ALTER TABLE verdicts ADD COLUMN IF NOT EXISTS category TEXT DEFAULT '기타';

-- 풀텍스트 검색 벡터 (story + verdict 기반 자동 생성)
ALTER TABLE verdicts ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('simple', coalesce(story, '') || ' ' || coalesce(verdict, ''))
  ) STORED;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 2. 댓글 테이블: verdict_comments
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS verdict_comments (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  verdict_id  UUID NOT NULL REFERENCES verdicts(id) ON DELETE CASCADE,
  nickname    TEXT NOT NULL,
  content     TEXT NOT NULL,
  likes       INTEGER NOT NULL DEFAULT 0,
  vote_stance TEXT,           -- 'agree' | 'disagree' | null
  parent_id   UUID,           -- 대댓글용
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 3. 트렌딩 키워드 추적 테이블
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS search_keywords (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  keyword     TEXT NOT NULL,
  searched_at TIMESTAMPTZ DEFAULT now()
);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 4. Rate Limiter 테이블
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS rate_limits (
  key       TEXT PRIMARY KEY,
  count     INTEGER NOT NULL DEFAULT 1,
  window_ms BIGINT NOT NULL,
  reset_at  TIMESTAMPTZ NOT NULL
);

ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
-- RLS 정책 없음 → service_role만 접근 가능

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 5. 인덱스
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- verdicts
CREATE INDEX IF NOT EXISTS idx_verdicts_created_at ON verdicts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_verdicts_likes ON verdicts(likes DESC);
CREATE INDEX IF NOT EXISTS idx_verdicts_category ON verdicts(category);
CREATE INDEX IF NOT EXISTS idx_verdicts_search ON verdicts USING GIN(search_vector);

-- verdict_comments
CREATE INDEX IF NOT EXISTS idx_verdict_comments_verdict_id ON verdict_comments(verdict_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_verdict_comments_parent_id ON verdict_comments(parent_id) WHERE parent_id IS NOT NULL;

-- search_keywords
CREATE INDEX IF NOT EXISTS idx_search_keywords_keyword ON search_keywords(keyword);
CREATE INDEX IF NOT EXISTS idx_search_keywords_time ON search_keywords(searched_at);

-- rate_limits
CREATE INDEX IF NOT EXISTS idx_rate_limits_reset_at ON rate_limits(reset_at);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 6. RPC 함수
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 6-1. increment_likes: 판결 좋아요 증감
CREATE OR REPLACE FUNCTION increment_likes(row_id UUID, delta INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_likes INTEGER;
BEGIN
  UPDATE verdicts
  SET likes = GREATEST(0, likes + delta)
  WHERE id = row_id
  RETURNING likes INTO new_likes;

  RETURN new_likes;
END;
$$;

-- 6-2. update_jury_votes: 배심원 투표 증감
DROP FUNCTION IF EXISTS update_jury_votes(UUID, INTEGER, INTEGER);
CREATE OR REPLACE FUNCTION update_jury_votes(
  row_id UUID,
  agree_delta INTEGER,
  disagree_delta INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_agree INTEGER;
  new_disagree INTEGER;
BEGIN
  UPDATE verdicts
  SET jury_agree = GREATEST(0, jury_agree + agree_delta),
      jury_disagree = GREATEST(0, jury_disagree + disagree_delta)
  WHERE id = row_id
  RETURNING jury_agree, jury_disagree INTO new_agree, new_disagree;

  RETURN json_build_object('jury_agree', new_agree, 'jury_disagree', new_disagree);
END;
$$;

-- 6-3. increment_comment_likes: 댓글 좋아요 증감
CREATE OR REPLACE FUNCTION increment_comment_likes(comment_id UUID, delta INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_likes INTEGER;
BEGIN
  UPDATE verdict_comments
  SET likes = GREATEST(0, likes + delta)
  WHERE id = comment_id
  RETURNING likes INTO new_likes;

  RETURN new_likes;
END;
$$;

-- 6-4. get_comment_counts: 여러 판결의 댓글 수 일괄 조회
DROP FUNCTION IF EXISTS get_comment_counts(UUID[]);
CREATE OR REPLACE FUNCTION get_comment_counts(entry_ids UUID[])
RETURNS TABLE(verdict_id UUID, count BIGINT)
LANGUAGE SQL
STABLE
AS $$
  SELECT vc.verdict_id, COUNT(*) as count
  FROM verdict_comments vc
  WHERE vc.verdict_id = ANY(entry_ids)
  GROUP BY vc.verdict_id;
$$;

-- 6-5. get_trending_keywords: 트렌딩 검색어 조회
CREATE OR REPLACE FUNCTION get_trending_keywords(since TIMESTAMPTZ)
RETURNS TABLE(keyword TEXT, count BIGINT)
LANGUAGE SQL
STABLE
AS $$
  SELECT keyword, COUNT(*) as count
  FROM search_keywords
  WHERE searched_at >= since
  GROUP BY keyword
  ORDER BY count DESC
  LIMIT 8;
$$;

-- 6-6. check_rate_limit: 원자적 카운트 증가 + 초과 여부 반환
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_key TEXT,
  p_limit INTEGER,
  p_window_ms BIGINT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_now TIMESTAMPTZ := now();
  v_reset_at TIMESTAMPTZ;
  v_count INTEGER;
  v_retry_after INTEGER;
BEGIN
  SELECT count, reset_at INTO v_count, v_reset_at
  FROM rate_limits
  WHERE key = p_key
  FOR UPDATE;

  IF NOT FOUND OR v_reset_at <= v_now THEN
    INSERT INTO rate_limits (key, count, window_ms, reset_at)
    VALUES (p_key, 1, p_window_ms, v_now + (p_window_ms || ' milliseconds')::interval)
    ON CONFLICT (key) DO UPDATE
    SET count = 1,
        window_ms = p_window_ms,
        reset_at = v_now + (p_window_ms || ' milliseconds')::interval;

    RETURN json_build_object('allowed', true);
  END IF;

  v_count := v_count + 1;

  UPDATE rate_limits
  SET count = v_count
  WHERE key = p_key;

  IF v_count > p_limit THEN
    v_retry_after := GREATEST(1, EXTRACT(EPOCH FROM (v_reset_at - v_now))::INTEGER);
    RETURN json_build_object('allowed', false, 'retry_after', v_retry_after);
  END IF;

  RETURN json_build_object('allowed', true);
END;
$$;

-- 6-7. cleanup_rate_limits: 만료된 항목 삭제
CREATE OR REPLACE FUNCTION cleanup_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM rate_limits WHERE reset_at <= now();
END;
$$;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 7. 기존 데이터 보정 (이미 verdicts 테이블이 있는 경우)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 카테고리 없는 기존 데이터에 기본값 설정
UPDATE verdicts SET category = '기타' WHERE category IS NULL;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 8. RLS 정책 (필요 시)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- verdicts: 누구나 읽기 가능, service_role만 쓰기
ALTER TABLE verdicts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "verdicts_select_all" ON verdicts;
CREATE POLICY "verdicts_select_all" ON verdicts
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "verdicts_insert_service" ON verdicts;
CREATE POLICY "verdicts_insert_service" ON verdicts
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "verdicts_update_service" ON verdicts;
CREATE POLICY "verdicts_update_service" ON verdicts
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "verdicts_delete_service" ON verdicts;
CREATE POLICY "verdicts_delete_service" ON verdicts
  FOR DELETE USING (true);

-- verdict_comments: 누구나 읽기 가능, service_role만 쓰기
ALTER TABLE verdict_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comments_select_all" ON verdict_comments;
CREATE POLICY "comments_select_all" ON verdict_comments
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "comments_insert_service" ON verdict_comments;
CREATE POLICY "comments_insert_service" ON verdict_comments
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "comments_update_service" ON verdict_comments;
CREATE POLICY "comments_update_service" ON verdict_comments
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "comments_delete_service" ON verdict_comments;
CREATE POLICY "comments_delete_service" ON verdict_comments
  FOR DELETE USING (true);

-- search_keywords: service_role만 접근
ALTER TABLE search_keywords ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 완료! 이 파일 하나로 네온즈 앱의 모든 DB 구성이 완성됩니다.
-- ============================================================
