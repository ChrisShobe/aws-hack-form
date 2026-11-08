-- Run this once in your Supabase project's SQL editor
-- (supabase.com → your project → SQL Editor → New query)

create table if not exists sessions (
  code text primary key,
  created_at timestamptz default now()
);

create table if not exists players (
  id bigserial primary key,
  session_code text references sessions(code) on delete cascade,
  name text not null,
  score integer not null default 0,
  created_at timestamptz default now(),
  unique (session_code, name)
);

create table if not exists responses (
  id bigserial primary key,
  session_code text references sessions(code) on delete cascade,
  player text not null,
  question_id text not null,
  question_text text,
  answer text,
  points_earned integer default 0,
  cumulative_score integer default 0,
  created_at timestamptz default now()
);

-- Enable Row Level Security (keeps data safe with public anon key)
alter table sessions  enable row level security;
alter table players   enable row level security;
alter table responses enable row level security;

-- Allow anyone to read and write (this is a public feedback form)
create policy "public read sessions"    on sessions  for select using (true);
create policy "public insert sessions"  on sessions  for insert with check (true);

create policy "public read players"     on players   for select using (true);
create policy "public insert players"   on players   for insert with check (true);
create policy "public update players"   on players   for update using (true);

create policy "public read responses"   on responses for select using (true);
create policy "public insert responses" on responses for insert with check (true);

-- Enable real-time for the leaderboard
alter publication supabase_realtime add table players;
