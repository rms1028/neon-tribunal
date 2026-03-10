-- Supabase SQL Editor에서 실행하세요
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
    jury_agree = GREATEST(0, COALESCE(verdicts.jury_agree, 0) + agree_delta),
    jury_disagree = GREATEST(0, COALESCE(verdicts.jury_disagree, 0) + disagree_delta)
  WHERE id = row_id
  RETURNING verdicts.jury_agree, verdicts.jury_disagree;
$$ LANGUAGE sql;
