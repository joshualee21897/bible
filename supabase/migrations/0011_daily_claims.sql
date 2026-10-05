-- Tracks which "Daily drops" rows a person has already collected on a given
-- day, so each one can only be claimed once per day — even across devices.
-- Run this after the earlier migrations.

create table if not exists daily_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  claim_key text not null,
  claim_date date not null,
  created_at timestamptz not null default now(),
  unique (user_id, claim_key, claim_date)
);

alter table daily_claims enable row level security;

drop policy if exists "Users can view their own daily claims" on daily_claims;
create policy "Users can view their own daily claims"
  on daily_claims for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Users can add their own daily claims" on daily_claims;
create policy "Users can add their own daily claims"
  on daily_claims for insert
  to authenticated
  with check (user_id = auth.uid());

notify pgrst, 'reload schema';
