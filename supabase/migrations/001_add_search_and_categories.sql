-- =====================================================
-- 네온즈 마이그레이션: 검색 & 카테고리 시스템
-- Supabase SQL Editor에서 실행하세요
-- =====================================================

-- 1. 카테고리 컬럼 추가
ALTER TABLE verdicts ADD COLUMN IF NOT EXISTS category TEXT DEFAULT NULL;

-- 2. 카테고리 인덱스
CREATE INDEX IF NOT EXISTS idx_verdicts_category ON verdicts(category);

-- 3. 풀텍스트 검색 벡터 (story + verdict 기반 자동 생성)
ALTER TABLE verdicts ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('simple', coalesce(story, '') || ' ' || coalesce(verdict, ''))
  ) STORED;

-- 4. GIN 인덱스 (풀텍스트 검색 성능)
CREATE INDEX IF NOT EXISTS idx_verdicts_search ON verdicts USING GIN(search_vector);

-- 5. 기존 데이터 카테고리 일괄 설정
UPDATE verdicts SET category = '기타' WHERE category IS NULL;

-- 6. 트렌딩 키워드 추적 테이블
CREATE TABLE IF NOT EXISTS search_keywords (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  keyword TEXT NOT NULL,
  searched_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_search_keywords_keyword ON search_keywords(keyword);
CREATE INDEX IF NOT EXISTS idx_search_keywords_time ON search_keywords(searched_at);

-- 7. 트렌딩 키워드 RPC 함수
CREATE OR REPLACE FUNCTION get_trending_keywords(since TIMESTAMPTZ)
RETURNS TABLE(keyword TEXT, count BIGINT) AS $$
  SELECT keyword, COUNT(*) as count
  FROM search_keywords
  WHERE searched_at >= since
  GROUP BY keyword
  ORDER BY count DESC
  LIMIT 8;
$$ LANGUAGE SQL;
