-- The Storehouse: a shared pool of water drops per group (Genesis 41:56).
-- Members give drops from their own balance into it; once it crosses a
-- threshold the group's garden grows to the next level (see
-- lib/garden-levels.ts). Deposits can't be withdrawn.
--
-- To make sure nobody can give more drops than they actually have — checked
-- by the database itself, not just the app — this migration also adds three
-- small reference tables mirroring the reward/price numbers in
-- lib/mission-config.ts and lib/garden-items.ts. IMPORTANT: if you ever
-- change a reward or price in those files, update the matching row here too
-- (see CLAUDE.md).

create table if not exists daily_drop_rewards (
  claim_key text primary key,
  reward int not null
);

insert into daily_drop_rewards (claim_key, reward) values
  ('morning_manna', 2),
  ('daily_bread', 10),
  ('iron_sharpens_iron', 2),
  ('second_mile', 5),
  ('stand_in_the_gap', 2)
on conflict (claim_key) do update set reward = excluded.reward;

create table if not exists mission_rewards (
  mission_key text primary key,
  reward int not null
);

insert into mission_rewards (mission_key, reward) values
  ('daily_bread', 15),
  ('manna_month', 30),
  ('mustard_seed', 10),
  ('ten_talents', 20),
  ('twelve_tribes', 40),
  ('year_of_jubilee', 75),
  ('morning_by_morning', 20),
  ('the_lords_day', 20),
  ('forty_days', 60),
  ('seventy_times_seven', 300),
  ('good_and_faithful_servant', 50),
  ('faithful_in_little', 80),
  ('seven_lampstands', 120),
  ('wisdom_seeker', 60),
  ('gospel_road', 100),
  ('song_for_every_season', 150),
  ('law_of_moses', 150),
  ('every_word', 300),
  ('alpha_and_omega', 1000),
  ('ask_seek_knock', 10),
  ('iron_sharpens_iron', 10),
  ('bear_one_anothers_burdens', 15),
  ('ebenezer', 15),
  ('two_or_three_gathered', 10),
  ('cheerful_giver', 10),
  ('laborers_together', 30),
  ('two_by_two', 10),
  ('prodigal_returns', 20)
on conflict (mission_key) do update set reward = excluded.reward;

create table if not exists garden_item_prices (
  item_key text primary key,
  price int not null
);

insert into garden_item_prices (item_key, price) values
  ('dove', 50),
  ('sparrow', 50),
  ('fish', 80),
  ('raven', 80),
  ('donkey', 120),
  ('eagle', 150),
  ('lion', 250),
  ('well', 60),
  ('bench', 40),
  ('lanterns', 70)
on conflict (item_key) do update set price = excluded.price;

-- A person's drops balance, worked out the same way the app does (earned
-- from daily drops and missions, minus spent in any shop, minus given to
-- any Storehouse) — used below to block a deposit that would overdraw.
create or replace function fn_personal_balance(p_user_id uuid)
returns integer
language sql
stable
as $$
  select
    coalesce((
      select sum(r.reward) from daily_claims c
      join daily_drop_rewards r on r.claim_key = c.claim_key
      where c.user_id = p_user_id
    ), 0)
    +
    coalesce((
      select sum(r.reward) from mission_claims c
      join mission_rewards r on r.mission_key = c.mission_key
      where c.user_id = p_user_id
    ), 0)
    -
    coalesce((
      select sum(r.price) from group_items gi
      join garden_item_prices r on r.item_key = gi.item_key
      where gi.bought_by = p_user_id
    ), 0)
    -
    coalesce((
      select sum(sd.amount) from storehouse_deposits sd
      where sd.user_id = p_user_id
    ), 0);
$$;

create table if not exists storehouse_deposits (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  amount int not null check (amount > 0),
  created_at timestamptz not null default now()
);

create or replace function fn_check_storehouse_deposit()
returns trigger
language plpgsql
as $$
begin
  if fn_personal_balance(new.user_id) < new.amount then
    raise exception 'Insufficient drops balance for this deposit';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_check_storehouse_deposit on storehouse_deposits;
create trigger trg_check_storehouse_deposit
  before insert on storehouse_deposits
  for each row execute function fn_check_storehouse_deposit();

alter table storehouse_deposits enable row level security;

drop policy if exists "Members can view their group's storehouse deposits" on storehouse_deposits;
create policy "Members can view their group's storehouse deposits"
  on storehouse_deposits for select
  to authenticated
  using (is_group_member(group_id));

drop policy if exists "Members can give to their group's storehouse" on storehouse_deposits;
create policy "Members can give to their group's storehouse"
  on storehouse_deposits for insert
  to authenticated
  with check (user_id = auth.uid() and is_group_member(group_id));

-- One row per group per level ever reached — lets the app post the
-- "Our garden became a [Level]!" feed message exactly once, even if two
-- people's devices notice the threshold was crossed at the same moment.
create table if not exists group_level_events (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups (id) on delete cascade,
  level_index int not null,
  reached_at timestamptz not null default now(),
  unique (group_id, level_index)
);

alter table group_level_events enable row level security;

drop policy if exists "Members can view their group's level events" on group_level_events;
create policy "Members can view their group's level events"
  on group_level_events for select
  to authenticated
  using (is_group_member(group_id));

drop policy if exists "Members can record their group's level events" on group_level_events;
create policy "Members can record their group's level events"
  on group_level_events for insert
  to authenticated
  with check (is_group_member(group_id));

notify pgrst, 'reload schema';
