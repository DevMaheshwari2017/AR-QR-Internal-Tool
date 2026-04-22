-- ════════════════════════════════════════════════════════════
--  Supabase SQL Setup — paste this into the SQL Editor
--  (Supabase Dashboard → SQL Editor → "New Query" → paste → Run)
-- ════════════════════════════════════════════════════════════

-- 1. The experiences table — one row per QR code
create table if not exists experiences (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,         -- short ID used in /ar/<slug>
  title       text,                          -- shown on viewer splash
  mind_url    text not null,                 -- public URL of the .mind file
  video_url   text not null,                 -- public URL of the video
  is_active   boolean default true,          -- pause/resume without deleting
  created_at  timestamptz default now()
);

-- Index for fast lookup by slug (the viewer queries this on every QR scan)
create index if not exists experiences_slug_idx on experiences (slug);

-- 2. Enable Row Level Security (Supabase requires this for the anon key)
alter table experiences enable row level security;

-- 3. Policies:
--    a) Anyone (anon) can READ active experiences — needed for the public viewer
--    b) Anyone (anon) can INSERT/UPDATE/DELETE — because we use simple
--       username/password admin auth (not Supabase Auth). The anon key is
--       public anyway; anyone determined could call the API directly.
--       This is OK for an internal/agency tool. If you later add real auth,
--       tighten these policies.

drop policy if exists "public read active" on experiences;
create policy "public read active" on experiences
  for select using (true);

drop policy if exists "anon write" on experiences;
create policy "anon write" on experiences
  for all using (true) with check (true);
