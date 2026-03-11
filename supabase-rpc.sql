-- Supabase SQL Editor에서 실행하세요

-- 1) OG 이미지 URL 컬럼 추가
ALTER TABLE verdicts ADD COLUMN IF NOT EXISTS og_image_url text;

-- 2) OG 이미지 Storage 버킷 생성 (public 읽기 허용)
INSERT INTO storage.buckets (id, name, public) VALUES ('og-images', 'og-images', true)
ON CONFLICT (id) DO NOTHING;

-- 3) OG 이미지 Storage 정책: 누구나 읽기 가능
DROP POLICY IF EXISTS "Public read og-images" ON storage.objects;
CREATE POLICY "Public read og-images" ON storage.objects
  FOR SELECT USING (bucket_id = 'og-images');

-- 4) OG 이미지 Storage 정책: service_role만 업로드 가능
DROP POLICY IF EXISTS "Service role upload og-images" ON storage.objects;
CREATE POLICY "Service role upload og-images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'og-images');

-- 5) 좋아요 atomic increment
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
    jury_agree = GREATEST(0, COALESCE(verdicts.jury_agree, 0) + agree_delta),
    jury_disagree = GREATEST(0, COALESCE(verdicts.jury_disagree, 0) + disagree_delta)
  WHERE id = row_id
  RETURNING verdicts.jury_agree, verdicts.jury_disagree;
$$ LANGUAGE sql;
