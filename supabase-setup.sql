-- ════════════════════════════════════════════════════════════
--  Supabase SQL Setup — Full Schema
--  Safe to re-run on an existing project.
-- ════════════════════════════════════════════════════════════

-- 1. The experiences table — one row per QR code
create table if not exists experiences (
  id             uuid primary key default gen_random_uuid(),
  slug           text unique not null,         -- short ID used in /ar/<slug>
  title          text,                          -- shown on viewer splash
  mind_url       text not null,                 -- public URL of the .mind file
  video_url      text not null,                 -- public URL of the video
  target_aspect  double precision,              -- target image width/height (for video cover-fit)
  is_active      boolean default true,          -- pause/resume without deleting
  created_at     timestamptz default now()
);

-- If table already existed without target_aspect, add it now
alter table experiences
  add column if not exists target_aspect double precision;

-- Index for fast lookup by slug (viewer queries this on every QR scan)
create index if not exists experiences_slug_idx on experiences (slug);

-- 2. Enable Row Level Security
alter table experiences enable row level security;

-- 3. Table policies
drop policy if exists "public read active" on experiences;
create policy "public read active" on experiences
  for select using (true);

drop policy if exists "anon write" on experiences;
create policy "anon write" on experiences
  for all using (true) with check (true);

-- 4. Storage policies for the ar-assets bucket
drop policy if exists "anon read ar-assets" on storage.objects;
create policy "anon read ar-assets"
  on storage.objects for select
  using (bucket_id = 'ar-assets');

drop policy if exists "anon insert ar-assets" on storage.objects;
create policy "anon insert ar-assets"
  on storage.objects for insert
  with check (bucket_id = 'ar-assets');

drop policy if exists "anon update ar-assets" on storage.objects;
create policy "anon update ar-assets"
  on storage.objects for update
  using (bucket_id = 'ar-assets');

drop policy if exists "anon delete ar-assets" on storage.objects;
create policy "anon delete ar-assets"
  on storage.objects for delete
  using (bucket_id = 'ar-assets');