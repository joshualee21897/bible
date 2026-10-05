-- Sprout: full database setup, safe to run even if some of this already
-- ran before (it won't error on things that already exist).

create extension if not exists pgcrypto;

-- Tables -----------------------------------------------------------------

create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  avatar_color text not null default '#6DAA45',
  created_at timestamptz not null default now()
);

create table if not exists groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  book text not null,
  start_date date not null,
  weekly_target int not null default 5,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now()
);

create table if not exists group_members (
  group_id uuid not null references groups (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table if not exists checkins (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  book text not null,
  chapter int not null,
  reflection text,
  photo_path text,
  created_at timestamptz not null default now(),
  unique (group_id, user_id, book, chapter)
);

create table if not exists group_items (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups (id) on delete cascade,
  item_key text not null,
  bought_by uuid not null references auth.users (id),
  created_at timestamptz not null default now()
);

-- Row-level security -------------------------------------------------------

alter table profiles enable row level security;
alter table groups enable row level security;
alter table group_members enable row level security;
alter table checkins enable row level security;
alter table group_items enable row level security;

drop policy if exists "Profiles are viewable by signed-in users" on profiles;
create policy "Profiles are viewable by signed-in users"
  on profiles for select
  to authenticated
  using (true);

drop policy if exists "Users can insert their own profile" on profiles;
create policy "Users can insert their own profile"
  on profiles for insert
  to authenticated
  with check (id = auth.uid());

drop policy if exists "Users can update their own profile" on profiles;
create policy "Users can update their own profile"
  on profiles for update
  to authenticated
  using (id = auth.uid());

drop policy if exists "Members can view their groups" on groups;
create policy "Members can view their groups"
  on groups for select
  to authenticated
  using (
    exists (
      select 1 from group_members
      where group_members.group_id = groups.id
        and group_members.user_id = auth.uid()
    )
  );

drop policy if exists "Signed-in users can create a group" on groups;
create policy "Signed-in users can create a group"
  on groups for insert
  to authenticated
  with check (created_by = auth.uid());

drop policy if exists "Members can update their groups" on groups;
create policy "Members can update their groups"
  on groups for update
  to authenticated
  using (
    exists (
      select 1 from group_members
      where group_members.group_id = groups.id
        and group_members.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from group_members
      where group_members.group_id = groups.id
        and group_members.user_id = auth.uid()
    )
  );

drop policy if exists "Members can view their group's membership" on group_members;
create policy "Members can view their group's membership"
  on group_members for select
  to authenticated
  using (
    exists (
      select 1 from group_members as gm
      where gm.group_id = group_members.group_id
        and gm.user_id = auth.uid()
    )
  );

drop policy if exists "Users can add themselves to a group" on group_members;
create policy "Users can add themselves to a group"
  on group_members for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Users can remove themselves from a group" on group_members;
create policy "Users can remove themselves from a group"
  on group_members for delete
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Members can view their group's check-ins" on checkins;
create policy "Members can view their group's check-ins"
  on checkins for select
  to authenticated
  using (
    exists (
      select 1 from group_members
      where group_members.group_id = checkins.group_id
        and group_members.user_id = auth.uid()
    )
  );

drop policy if exists "Users can create their own check-ins" on checkins;
create policy "Users can create their own check-ins"
  on checkins for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from group_members
      where group_members.group_id = checkins.group_id
        and group_members.user_id = auth.uid()
    )
  );

drop policy if exists "Users can update their own check-ins" on checkins;
create policy "Users can update their own check-ins"
  on checkins for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Members can view their group's items" on group_items;
create policy "Members can view their group's items"
  on group_items for select
  to authenticated
  using (
    exists (
      select 1 from group_members
      where group_members.group_id = group_items.group_id
        and group_members.user_id = auth.uid()
    )
  );

drop policy if exists "Members can add items to their group" on group_items;
create policy "Members can add items to their group"
  on group_items for insert
  to authenticated
  with check (
    bought_by = auth.uid()
    and exists (
      select 1 from group_members
      where group_members.group_id = group_items.group_id
        and group_members.user_id = auth.uid()
    )
  );

-- Joining a group by invite code -------------------------------------------

create or replace function join_group_by_code(p_invite_code text)
returns groups
language plpgsql
security definer
set search_path = public
as $$
declare
  target_group groups;
begin
  select * into target_group
  from groups
  where invite_code = upper(p_invite_code);

  if target_group.id is null then
    raise exception 'No group found with that invite code';
  end if;

  insert into group_members (group_id, user_id, role)
  values (target_group.id, auth.uid(), 'member')
  on conflict (group_id, user_id) do nothing;

  return target_group;
end;
$$;

grant execute on function join_group_by_code(text) to authenticated;

-- Private photo storage ------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('checkin-photos', 'checkin-photos', false)
on conflict (id) do nothing;

drop policy if exists "Members can view their group's check-in photos" on storage.objects;
create policy "Members can view their group's check-in photos"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'checkin-photos'
    and exists (
      select 1 from group_members
      where group_members.group_id::text = (storage.foldername(name))[1]
        and group_members.user_id = auth.uid()
    )
  );

drop policy if exists "Members can upload their own check-in photos" on storage.objects;
create policy "Members can upload their own check-in photos"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'checkin-photos'
    and (storage.foldername(name))[2] = auth.uid()::text
    and exists (
      select 1 from group_members
      where group_members.group_id::text = (storage.foldername(name))[1]
        and group_members.user_id = auth.uid()
    )
  );

-- Garden items can be bought more than once per group — several people
-- (or the same person) can each add their own lion, so no uniqueness rule
-- on (group_id, item_key). -------------------------------------------------

alter table group_items drop constraint if exists group_items_group_id_item_key_key;

-- Links needed so the app can fetch a person's name/color alongside their
-- check-ins or group membership in one query --------------------------------

alter table checkins drop constraint if exists checkins_user_id_profiles_fkey;
alter table checkins
  add constraint checkins_user_id_profiles_fkey foreign key (user_id) references profiles (id);

alter table group_members drop constraint if exists group_members_user_id_profiles_fkey;
alter table group_members
  add constraint group_members_user_id_profiles_fkey foreign key (user_id) references profiles (id);

alter table group_items drop constraint if exists group_items_bought_by_profiles_fkey;
alter table group_items
  add constraint group_items_bought_by_profiles_fkey foreign key (bought_by) references profiles (id);

-- Fix infinite recursion in the membership-check policies ------------------
-- (several policies checked group_members from within a query against
-- group_members itself, which has its own policy doing the same check —
-- an endless loop. This SECURITY DEFINER function bypasses RLS for its own
-- internal lookup, breaking the cycle.)

drop function if exists is_group_member(uuid) cascade;

create or replace function is_group_member(p_group_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from group_members
    where group_id = p_group_id and user_id = auth.uid()
  );
$$;

grant execute on function is_group_member(uuid) to authenticated;

drop policy if exists "Members can view their groups" on groups;
create policy "Members can view their groups"
  on groups for select
  to authenticated
  using (is_group_member(id) or created_by = auth.uid());

drop policy if exists "Members can update their groups" on groups;
create policy "Members can update their groups"
  on groups for update
  to authenticated
  using (is_group_member(id))
  with check (is_group_member(id));

drop policy if exists "Members can view their group's membership" on group_members;
create policy "Members can view their group's membership"
  on group_members for select
  to authenticated
  using (is_group_member(group_id));

drop policy if exists "Members can view their group's check-ins" on checkins;
create policy "Members can view their group's check-ins"
  on checkins for select
  to authenticated
  using (is_group_member(group_id));

drop policy if exists "Users can create their own check-ins" on checkins;
create policy "Users can create their own check-ins"
  on checkins for insert
  to authenticated
  with check (user_id = auth.uid() and is_group_member(group_id));

drop policy if exists "Members can view their group's items" on group_items;
create policy "Members can view their group's items"
  on group_items for select
  to authenticated
  using (is_group_member(group_id));

drop policy if exists "Members can add items to their group" on group_items;
create policy "Members can add items to their group"
  on group_items for insert
  to authenticated
  with check (bought_by = auth.uid() and is_group_member(group_id));

drop policy if exists "Members can view their group's check-in photos" on storage.objects;
create policy "Members can view their group's check-in photos"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'checkin-photos'
    and is_group_member(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "Members can upload their own check-in photos" on storage.objects;
create policy "Members can upload their own check-in photos"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'checkin-photos'
    and (storage.foldername(name))[2] = auth.uid()::text
    and is_group_member(((storage.foldername(name))[1])::uuid)
  );

-- Prayer requests and reactions ("Amen" on reflections, "Praying for you"
-- on prayers) ----------------------------------------------------------

create table if not exists prayers (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  text text not null,
  show_name boolean not null default true,
  answered boolean not null default false,
  created_at timestamptz not null default now()
);

alter table prayers drop constraint if exists prayers_user_id_profiles_fkey;
alter table prayers
  add constraint prayers_user_id_profiles_fkey foreign key (user_id) references profiles (id);

create table if not exists reactions (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('checkin', 'prayer')),
  target_id uuid not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (target_type, target_id, user_id)
);

alter table prayers enable row level security;
alter table reactions enable row level security;

drop function if exists is_reaction_target_group_member(text, uuid) cascade;
create or replace function is_reaction_target_group_member(p_target_type text, p_target_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select case p_target_type
    when 'checkin' then exists (
      select 1 from checkins where id = p_target_id and is_group_member(group_id)
    )
    when 'prayer' then exists (
      select 1 from prayers where id = p_target_id and is_group_member(group_id)
    )
    else false
  end;
$$;

grant execute on function is_reaction_target_group_member(text, uuid) to authenticated;

drop policy if exists "Members can view their group's prayers" on prayers;
create policy "Members can view their group's prayers"
  on prayers for select
  to authenticated
  using (is_group_member(group_id));

drop policy if exists "Users can create their own prayers" on prayers;
create policy "Users can create their own prayers"
  on prayers for insert
  to authenticated
  with check (user_id = auth.uid() and is_group_member(group_id));

drop policy if exists "Users can update their own prayers" on prayers;
create policy "Users can update their own prayers"
  on prayers for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Members can view reactions in their groups" on reactions;
create policy "Members can view reactions in their groups"
  on reactions for select
  to authenticated
  using (is_reaction_target_group_member(target_type, target_id));

drop policy if exists "Users can add their own reactions" on reactions;
create policy "Users can add their own reactions"
  on reactions for insert
  to authenticated
  with check (user_id = auth.uid() and is_reaction_target_group_member(target_type, target_id));

drop policy if exists "Users can remove their own reactions" on reactions;
create policy "Users can remove their own reactions"
  on reactions for delete
  to authenticated
  using (user_id = auth.uid());

-- Personal Bible highlights and notes for the Read tab (private per person,
-- not shared with any group) ------------------------------------------

create table if not exists bible_annotations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  book text not null,
  chapter int not null,
  verse int not null,
  highlighted boolean not null default false,
  note text,
  updated_at timestamptz not null default now(),
  unique (user_id, book, chapter, verse)
);

alter table bible_annotations enable row level security;

drop policy if exists "Users can view their own annotations" on bible_annotations;
create policy "Users can view their own annotations"
  on bible_annotations for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Users can create their own annotations" on bible_annotations;
create policy "Users can create their own annotations"
  on bible_annotations for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Users can update their own annotations" on bible_annotations;
create policy "Users can update their own annotations"
  on bible_annotations for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Users can delete their own annotations" on bible_annotations;
create policy "Users can delete their own annotations"
  on bible_annotations for delete
  to authenticated
  using (user_id = auth.uid());

-- Tracks which "Daily drops" rows a person has already collected on a given
-- day, so each one can only be claimed once per day — even across devices.
-- -----------------------------------------------------------------------

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

-- A check-in is now a written reflection, not a photo — the photo step is
-- removed for now (storage costs), but photo_path and the checkin-photos
-- bucket are left exactly as they are, just unused. --------------------

alter table checkins add column if not exists kind text not null default 'reflection';

alter table checkins drop constraint if exists checkins_kind_check;
alter table checkins
  add constraint checkins_kind_check check (kind in ('reflection', 'revelation', 'action'));

-- Remembers which missions (Missions tab, not Daily drops) a person has
-- collected, so a finished mission shows a one-tap "Collect" button instead
-- of auto-crediting drops, and doesn't show it again until it's earnable
-- again. period_key is '' for one-time count/books missions, a period
-- identifier (e.g. "week:2026-10-05") for weekly/monthly missions, and an
-- occurrence number (e.g. "1", "2") for the repeatable Prodigal Returns
-- mission — one small table covers all three cases, like daily_claims. ----

create table if not exists mission_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mission_key text not null,
  period_key text not null default '',
  created_at timestamptz not null default now(),
  unique (user_id, mission_key, period_key)
);

alter table mission_claims enable row level security;

drop policy if exists "Users can view their own mission claims" on mission_claims;
create policy "Users can view their own mission claims"
  on mission_claims for select
  using (user_id = auth.uid());

drop policy if exists "Users can insert their own mission claims" on mission_claims;
create policy "Users can insert their own mission claims"
  on mission_claims for insert
  with check (user_id = auth.uid());

-- Lets a highlight remember which color was picked for it, instead of
-- always being the one fixed yellow. Null means "yellow" (every highlight
-- made before this migration), so nothing already saved needs backfilling.

alter table bible_annotations add column if not exists color text;

-- The Storehouse: a shared pool of water drops per group (Genesis 41:56).
-- Members give drops from their own balance into it; once it crosses a
-- threshold the group's garden grows to the next level (see
-- lib/garden-levels.ts). Deposits can't be withdrawn.
--
-- To make sure nobody can give more drops than they actually have — checked
-- by the database itself, not just the app — this also adds three small
-- reference tables mirroring the reward/price numbers in
-- lib/mission-config.ts and lib/garden-items.ts. IMPORTANT: if you ever
-- change a reward or price in those files, update the matching row here too
-- (see CLAUDE.md). ----------------------------------------------------------

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

-- Make sure Supabase's API layer picks up all of the above immediately ------

notify pgrst, 'reload schema';
