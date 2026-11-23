-- ============================================================================
-- KAIZEN AWARD 5x5 JIGSAW PUZZLE — SUPABASE SCHEMA (Copy & Run in SQL Editor)
-- ============================================================================

-- 1) Public Hall of Fame Leaderboard (Player-submitted scores)
create table if not exists public.kaizen_scores (
  id uuid primary key default gen_random_uuid(),
  player_name text not null check (char_length(trim(player_name)) between 1 and 40),
  department text not null default '' check (char_length(department) <= 40),
  category_id text not null check (category_id in ('cat01','cat02','cat03','cat04','cat05','cat06','cat07')),
  grid_size smallint not null default 5 check (grid_size in (3, 4, 5)),
  elapsed_seconds integer not null check (elapsed_seconds >= 1 and elapsed_seconds <= 7200),
  hints_used smallint not null default 0 check (hints_used >= 0 and hints_used <= 100),
  max_combo smallint not null default 1 check (max_combo >= 1 and max_combo <= 50),
  stars smallint not null default 1 check (stars between 1 and 3),
  quiz_bonus boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_kaizen_scores_ranking
  on public.kaizen_scores (grid_size desc, elapsed_seconds asc, hints_used asc);

create index if not exists idx_kaizen_scores_category
  on public.kaizen_scores (category_id, grid_size, elapsed_seconds asc);

-- 2) Anonymous Event Analytics Log (Auto-logged whenever ANY puzzle is completed)
create table if not exists public.kaizen_play_logs (
  id uuid primary key default gen_random_uuid(),
  category_id text not null check (category_id in ('cat01','cat02','cat03','cat04','cat05','cat06','cat07')),
  grid_size smallint not null default 5 check (grid_size in (3, 4, 5)),
  elapsed_seconds integer not null check (elapsed_seconds >= 1 and elapsed_seconds <= 7200),
  hints_used smallint not null default 0 check (hints_used >= 0 and hints_used <= 100),
  max_combo smallint not null default 1 check (max_combo >= 1 and max_combo <= 50),
  stars smallint not null default 1 check (stars between 1 and 3),
  created_at timestamptz not null default now()
);

create index if not exists idx_kaizen_play_logs_created
  on public.kaizen_play_logs (created_at desc);

-- 3) Row Level Security (RLS) & Table Privileges: Safe public read/insert, NO public delete/update
grant usage on schema public to anon, authenticated;
grant select, insert on public.kaizen_scores to anon, authenticated;
grant select, insert on public.kaizen_play_logs to anon, authenticated;

alter table public.kaizen_scores enable row level security;
alter table public.kaizen_play_logs enable row level security;

drop policy if exists "Public can read scores" on public.kaizen_scores;
create policy "Public can read scores"
  on public.kaizen_scores for select
  using (true);

drop policy if exists "Public can insert scores" on public.kaizen_scores;
create policy "Public can insert scores"
  on public.kaizen_scores for insert
  with check (true);

drop policy if exists "Public can insert play logs" on public.kaizen_play_logs;
create policy "Public can insert play logs"
  on public.kaizen_play_logs for insert
  with check (true);

drop policy if exists "Public can read play logs" on public.kaizen_play_logs;
create policy "Public can read play logs"
  on public.kaizen_play_logs for select
  using (true);

-- 4) Enable Realtime Broadcast for Live Booth TV Leaderboard!
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'kaizen_scores'
  ) then
    alter publication supabase_realtime add table public.kaizen_scores;
  end if;
end $$;
