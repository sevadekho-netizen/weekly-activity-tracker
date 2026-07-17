-- Weekly Activity Tracker — Supabase schema
-- Run this once in your Supabase project's SQL Editor.

create extension if not exists pgcrypto;

create table if not exists weekly_tasks (
  id uuid primary key default gen_random_uuid(),
  week_start date not null,
  day text not null check (day in ('Mon','Tue','Wed','Thu','Fri','Sat')),
  slot integer not null check (slot in (1, 2, 3)),
  task_name text not null default '',
  insights text not null default '',
  actions text not null default '',
  is_done boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (week_start, day, slot)
);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_weekly_tasks_updated_at on weekly_tasks;
create trigger trg_weekly_tasks_updated_at
before update on weekly_tasks
for each row execute function set_updated_at();

-- Single-user app, no auth: allow the anon key full access to this table.
alter table weekly_tasks enable row level security;

drop policy if exists "Allow all for anon" on weekly_tasks;
create policy "Allow all for anon" on weekly_tasks
  for all
  using (true)
  with check (true);
