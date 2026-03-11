-- ============================================================
-- NEONS - Supabase Database Schema (통합본)
-- 전국민 고민 재판소: 네온즈
-- 최종 업데이트: 2026-03-12
-- ============================================================

-- ============================================================
-- 1. Extensions
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 2. Tables
-- ============================================================

-- verdicts: 공개 재판소에 등록된 AI 판결
CREATE TABLE IF NOT EXISTS verdicts (
  id              uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  judge_id        text        NOT NULL,
  judge_name      text        NOT NULL,
  story           text        NOT NULL CHECK (char_length(story) <= 2000),
  verdict         text        NOT NULL CHECK (char_length(verdict) <= 5000),
  likes           integer     NOT NULL DEFAULT 0 CHECK (likes >= 0),
  jury_agree      integer     NOT NULL DEFAULT 0 CHECK (jury_agree >= 0),
  jury_disagree   integer     NOT NULL DEFAULT 0 CHECK (jury_disagree >= 0),
  image_url       text,
  viral_quote     text,
  tldr            text,
  og_image_url    text,
  delete_token    text,
  author_nickname text,
  author_icon     text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  verdicts                IS '공개 재판소 판결 기록';
COMMENT ON COLUMN verdicts.judge_id       IS '판사 식별자 (justice-zero, heart-beat, cyber-rekka, detective-neon)';
COMMENT ON COLUMN verdicts.judge_name     IS '판사 표시 이름';
COMMENT ON COLUMN verdicts.story          IS '사용자가 입력한 사연 (최대 2000자)';
COMMENT ON COLUMN verdicts.verdict        IS 'AI가 생성한 판결문 (최대 5000자)';
COMMENT ON COLUMN verdicts.likes          IS '좋아요 수';
COMMENT ON COLUMN verdicts.jury_agree     IS '배심원 찬성 투표 수';
COMMENT ON COLUMN verdicts.jury_disagree  IS '배심원 반대 투표 수';
COMMENT ON COLUMN verdicts.image_url      IS '증거 사진 URL (Supabase Storage)';
COMMENT ON COLUMN verdicts.viral_quote    IS 'SNS 공유용 한 줄 바이럴 문구';
COMMENT ON COLUMN verdicts.tldr           IS 'AI 판결 한줄평 (이모지 + 짧은 태그라인)';
COMMENT ON COLUMN verdicts.og_image_url   IS 'OG 이미지 URL (SNS 공유 미리보기)';
COMMENT ON COLUMN verdicts.delete_token   IS '사연 삭제용 토큰 (작성자만 보유)';
COMMENT ON COLUMN verdicts.author_nickname IS '작성자 익명 닉네임 (익명의 배심원 #1234)';
COMMENT ON COLUMN verdicts.author_icon    IS '작성자 프로필 이모지 아이콘';
COMMENT ON COLUMN verdicts.created_at     IS '등록 일시';

-- verdict_comments: 판결 댓글
CREATE TABLE IF NOT EXISTS verdict_comments (
  id          uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  verdict_id  uuid        NOT NULL REFERENCES verdicts(id) ON DELETE CASCADE,
  nickname    text        NOT NULL CHECK (char_length(nickname) BETWEEN 1 AND 20),
  content     text        NOT NULL CHECK (char_length(content) BETWEEN 1 AND 500),
  likes       integer     NOT NULL DEFAULT 0 CHECK (likes >= 0),
  vote_stance text        CHECK (vote_stance IS NULL OR vote_stance IN ('agree', 'disagree')),
  parent_id   uuid        REFERENCES verdict_comments(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  verdict_comments             IS '판결 댓글';
COMMENT ON COLUMN verdict_comments.verdict_id  IS '판결 FK';
COMMENT ON COLUMN verdict_comments.nickname    IS '작성자 닉네임 (1~20자, 익명 자동생성)';
COMMENT ON COLUMN verdict_comments.content     IS '댓글 내용 (1~500자)';
COMMENT ON COLUMN verdict_comments.likes       IS '댓글 좋아요 수';
COMMENT ON COLUMN verdict_comments.vote_stance IS '투표 입장 (agree/disagree, 선택사항)';
COMMENT ON COLUMN verdict_comments.parent_id   IS '답글 대상 댓글 ID (NULL이면 최상위 댓글)';
COMMENT ON COLUMN verdict_comments.created_at  IS '작성 일시';

-- ============================================================
-- 3. Indexes
-- ============================================================

-- verdicts: 최신순 정렬
CREATE INDEX IF NOT EXISTS idx_verdicts_created_at
  ON verdicts (created_at DESC);

-- verdicts: 인기순 정렬
CREATE INDEX IF NOT EXISTS idx_verdicts_likes
  ON verdicts (likes DESC, created_at DESC);

-- verdicts: 판사별 필터링
CREATE INDEX IF NOT EXISTS idx_verdicts_judge_id
  ON verdicts (judge_id);

-- verdict_comments: 판결별 댓글 조회
CREATE INDEX IF NOT EXISTS idx_verdict_comments_verdict
  ON verdict_comments (verdict_id, created_at DESC);

-- verdict_comments: 인기순 정렬
CREATE INDEX IF NOT EXISTS idx_verdict_comments_likes
  ON verdict_comments (verdict_id, likes DESC, created_at DESC);

-- verdict_comments: 답글 조회
CREATE INDEX IF NOT EXISTS idx_verdict_comments_parent
  ON verdict_comments (parent_id);

-- ============================================================
-- 4. Row Level Security
-- ============================================================

-- ── verdicts ──
ALTER TABLE verdicts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "verdicts_select_all"    ON verdicts;
DROP POLICY IF EXISTS "verdicts_insert_service" ON verdicts;
DROP POLICY IF EXISTS "verdicts_update_service" ON verdicts;
DROP POLICY IF EXISTS "verdicts_delete_service" ON verdicts;

CREATE POLICY "verdicts_select_all"
  ON verdicts FOR SELECT USING (true);

CREATE POLICY "verdicts_insert_service"
  ON verdicts FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "verdicts_update_service"
  ON verdicts FOR UPDATE
  USING (auth.role() = 'service_role');

CREATE POLICY "verdicts_delete_service"
  ON verdicts FOR DELETE
  USING (auth.role() = 'service_role');

-- ── verdict_comments ──
ALTER TABLE verdict_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "verdict_comments_select_all"    ON verdict_comments;
DROP POLICY IF EXISTS "verdict_comments_insert_service" ON verdict_comments;
DROP POLICY IF EXISTS "verdict_comments_update_service" ON verdict_comments;
DROP POLICY IF EXISTS "verdict_comments_delete_service" ON verdict_comments;

CREATE POLICY "verdict_comments_select_all"
  ON verdict_comments FOR SELECT USING (true);

CREATE POLICY "verdict_comments_insert_service"
  ON verdict_comments FOR INSERT
  WITH CHECK (true);

CREATE POLICY "verdict_comments_update_service"
  ON verdict_comments FOR UPDATE
  USING (auth.role() = 'service_role');

CREATE POLICY "verdict_comments_delete_service"
  ON verdict_comments FOR DELETE
  USING (auth.role() = 'service_role');

-- ============================================================
-- 5. Storage Buckets
-- ============================================================

-- 증거 사진 저장용 버킷
INSERT INTO storage.buckets (id, name, public)
VALUES ('evidence', 'evidence', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "evidence_select_all"    ON storage.objects;
DROP POLICY IF EXISTS "evidence_insert_service" ON storage.objects;

CREATE POLICY "evidence_select_all"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'evidence');

CREATE POLICY "evidence_insert_service"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'evidence' AND auth.role() = 'service_role');

-- OG 이미지 저장용 버킷
INSERT INTO storage.buckets (id, name, public)
VALUES ('og-images', 'og-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "og_images_select_all"    ON storage.objects;
DROP POLICY IF EXISTS "og_images_insert_service" ON storage.objects;
DROP POLICY IF EXISTS "Public read og-images"   ON storage.objects;
DROP POLICY IF EXISTS "Service insert og-images" ON storage.objects;

CREATE POLICY "og_images_select_all"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'og-images');

CREATE POLICY "og_images_insert_service"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'og-images' AND auth.role() = 'service_role');

-- ============================================================
-- 6. RPC Functions
-- ============================================================

-- 좋아요 atomic increment
CREATE OR REPLACE FUNCTION increment_likes(row_id uuid, delta int)
RETURNS int AS $$
  UPDATE verdicts
  SET likes = GREATEST(0, COALESCE(likes, 0) + delta)
  WHERE id = row_id
  RETURNING likes;
$$ LANGUAGE sql;

-- 배심원 투표 atomic increment
CREATE OR REPLACE FUNCTION update_jury_votes(
  row_id uuid,
  agree_delta int DEFAULT 0,
  disagree_delta int DEFAULT 0
)
RETURNS TABLE(jury_agree int, jury_disagree int) AS $$
  UPDATE verdicts
  SET
    jury_agree    = GREATEST(0, COALESCE(verdicts.jury_agree, 0) + agree_delta),
    jury_disagree = GREATEST(0, COALESCE(verdicts.jury_disagree, 0) + disagree_delta)
  WHERE id = row_id
  RETURNING verdicts.jury_agree, verdicts.jury_disagree;
$$ LANGUAGE sql;

-- 댓글 좋아요 atomic increment
CREATE OR REPLACE FUNCTION increment_comment_likes(comment_id uuid, delta int)
RETURNS int AS $$
  UPDATE verdict_comments
  SET likes = GREATEST(0, COALESCE(likes, 0) + delta)
  WHERE id = comment_id
  RETURNING likes;
$$ LANGUAGE sql;

-- 배치 댓글 수 조회
CREATE OR REPLACE FUNCTION get_comment_counts(entry_ids uuid[])
RETURNS TABLE(verdict_id uuid, comment_count bigint) AS $$
  SELECT vc.verdict_id, COUNT(*)
  FROM verdict_comments vc
  WHERE vc.verdict_id = ANY(entry_ids)
  GROUP BY vc.verdict_id;
$$ LANGUAGE sql;

-- ============================================================
-- 7. 기존 DB 마이그레이션 (이미 테이블이 있는 경우)
-- ============================================================
-- 아래 구문은 기존 DB에 누락된 컬럼을 추가할 때 사용합니다.
-- 새로 세팅하는 경우 위 CREATE TABLE로 자동 포함되므로 무시해도 됩니다.

-- verdicts: og_image_url
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='verdicts' AND column_name='og_image_url')
  THEN ALTER TABLE verdicts ADD COLUMN og_image_url text;
  END IF;
END $$;

-- verdicts: tldr
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='verdicts' AND column_name='tldr')
  THEN ALTER TABLE verdicts ADD COLUMN tldr text;
  END IF;
END $$;

-- verdicts: delete_token
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='verdicts' AND column_name='delete_token')
  THEN ALTER TABLE verdicts ADD COLUMN delete_token text;
  END IF;
END $$;

-- verdicts: author_nickname
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='verdicts' AND column_name='author_nickname')
  THEN ALTER TABLE verdicts ADD COLUMN author_nickname text;
  END IF;
END $$;

-- verdicts: author_icon
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='verdicts' AND column_name='author_icon')
  THEN ALTER TABLE verdicts ADD COLUMN author_icon text;
  END IF;
END $$;

-- verdict_comments: likes
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='verdict_comments' AND column_name='likes')
  THEN ALTER TABLE verdict_comments ADD COLUMN likes integer NOT NULL DEFAULT 0 CHECK (likes >= 0);
  END IF;
END $$;

-- verdict_comments: vote_stance
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='verdict_comments' AND column_name='vote_stance')
  THEN ALTER TABLE verdict_comments ADD COLUMN vote_stance text CHECK (vote_stance IS NULL OR vote_stance IN ('agree', 'disagree'));
  END IF;
END $$;

-- verdict_comments: parent_id
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='verdict_comments' AND column_name='parent_id')
  THEN ALTER TABLE verdict_comments ADD COLUMN parent_id uuid REFERENCES verdict_comments(id) ON DELETE CASCADE;
  END IF;
END $$;
