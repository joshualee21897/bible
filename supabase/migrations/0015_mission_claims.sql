-- Remembers which missions (Missions tab, not Daily drops) a person has
-- collected, so a finished mission shows a one-tap "Collect" button instead
-- of auto-crediting drops, and doesn't show it again until it's earnable
-- again. period_key is '' for one-time count/books missions, a period
-- identifier (e.g. "week:2026-10-05") for weekly/monthly missions, and an
-- occurrence number (e.g. "1", "2") for the repeatable Prodigal Returns
-- mission — one small table covers all three cases, like daily_claims.

create table if not exists mission_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mission_key text not null,
  period_key text not null default '',
  created_at timestamptz not null default now(),
  unique (user_id, mission_key, period_key)
);

alter table mission_claims enable row level security;

create policy "Users can view their own mission claims"
  on mission_claims for select
  using (user_id = auth.uid());

create policy "Users can insert their own mission claims"
  on mission_claims for insert
  with check (user_id = auth.uid());

notify pgrst, 'reload schema';
