-- ============================================================
-- NEON COURT - Supabase Database Schema
-- 전국민 고민 재판소: 네온즈
-- ============================================================

-- 1. Extensions
-- ============================================================
create extension if not exists "uuid-ossp";

-- 2. Tables
-- ============================================================

-- verdicts: 공개 재판소에 등록된 AI 판결 저장
create table if not exists verdicts (
  id            uuid primary key default uuid_generate_v4(),
  judge_id      text    not null,
  judge_name    text    not null,
  story         text    not null check (char_length(story) <= 2000),
  verdict       text    not null check (char_length(verdict) <= 5000),
  likes         integer not null default 0 check (likes >= 0),
  jury_agree    integer not null default 0 check (jury_agree >= 0),
  jury_disagree integer not null default 0 check (jury_disagree >= 0),
  image_url     text,
  viral_quote   text,
  created_at    timestamptz not null default now()
);

comment on table  verdicts              is '공개 재판소 판결 기록';
comment on column verdicts.judge_id     is '판사 식별자 (justice-zero, heart-beat, cyber-rekka, detective-neon)';
comment on column verdicts.judge_name   is '판사 표시 이름';
comment on column verdicts.story        is '사용자가 입력한 사연 (최대 2000자)';
comment on column verdicts.verdict      is 'AI가 생성한 판결문 (최대 5000자)';
comment on column verdicts.likes        is '좋아요 수';
comment on column verdicts.jury_agree   is '배심원 찬성 투표 수';
comment on column verdicts.jury_disagree is '배심원 반대 투표 수';
comment on column verdicts.image_url    is '증거 사진 URL (Supabase Storage)';
comment on column verdicts.viral_quote  is 'SNS 공유용 한 줄 바이럴 문구';
comment on column verdicts.created_at   is '등록 일시';

-- 3. Indexes
-- ============================================================

-- 최신순 정렬 (기본 목록)
create index if not exists idx_verdicts_created_at
  on verdicts (created_at desc);

-- 인기순 정렬
create index if not exists idx_verdicts_likes
  on verdicts (likes desc, created_at desc);

-- 판사별 필터링
create index if not exists idx_verdicts_judge_id
  on verdicts (judge_id);

-- 4. Row Level Security
-- ============================================================

alter table verdicts enable row level security;

-- 기존 정책 제거 후 재생성 (멱등성 보장)
drop policy if exists "verdicts_select_all"    on verdicts;
drop policy if exists "verdicts_insert_service" on verdicts;
drop policy if exists "verdicts_update_service" on verdicts;
drop policy if exists "verdicts_delete_service" on verdicts;

-- 누구나 읽기 가능
create policy "verdicts_select_all"
  on verdicts for select
  using (true);

-- service_role 키로만 삽입/수정/삭제 가능 (서버 API 전용)
create policy "verdicts_insert_service"
  on verdicts for insert
  with check (auth.role() = 'service_role');

create policy "verdicts_update_service"
  on verdicts for update
  using (auth.role() = 'service_role');

create policy "verdicts_delete_service"
  on verdicts for delete
  using (auth.role() = 'service_role');

-- 5. Storage Bucket
-- ============================================================

-- 증거 사진 저장용 버킷
insert into storage.buckets (id, name, public)
values ('evidence', 'evidence', true)
on conflict (id) do nothing;

-- 기존 정책 제거 후 재생성
drop policy if exists "evidence_select_all"    on storage.objects;
drop policy if exists "evidence_insert_service" on storage.objects;

-- 누구나 증거 사진 조회 가능
create policy "evidence_select_all"
  on storage.objects for select
  using (bucket_id = 'evidence');

-- service_role 키로만 업로드 가능
create policy "evidence_insert_service"
  on storage.objects for insert
  with check (bucket_id = 'evidence' and auth.role() = 'service_role');
