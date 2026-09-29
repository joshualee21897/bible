-- Flock database setup.
-- Run this once in the Supabase dashboard: Project > SQL Editor > New query,
-- paste this whole file, and click Run.

create extension if not exists pgcrypto;

-- One row per signed-in person.
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  avatar_color text not null default '#6DAA45',
  created_at timestamptz not null default now()
);

-- A group of friends reading together.
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

-- Who belongs to which group.
create table if not exists group_members (
  group_id uuid not null references groups (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

-- One check-in per person, per chapter, per group.
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

-- Garden animals and items a group has bought.
create table if not exists group_items (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups (id) on delete cascade,
  item_key text not null,
  bought_by uuid not null references auth.users (id),
  created_at timestamptz not null default now()
);

-- Row-level security: turn it on for every table, so people can only see
-- data for groups they belong to.

alter table profiles enable row level security;
alter table groups enable row level security;
alter table group_members enable row level security;
alter table checkins enable row level security;
alter table group_items enable row level security;

-- profiles: anyone signed in can see names (needed to show who posted a
-- check-in in a shared feed), but you can only create or edit your own.
create policy "Profiles are viewable by signed-in users"
  on profiles for select
  to authenticated
  using (true);

create policy "Users can insert their own profile"
  on profiles for insert
  to authenticated
  with check (id = auth.uid());

create policy "Users can update their own profile"
  on profiles for update
  to authenticated
  using (id = auth.uid());

-- groups: only members can view a group's details.
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

create policy "Signed-in users can create a group"
  on groups for insert
  to authenticated
  with check (created_by = auth.uid());

-- group_members: only members can see who else is in the group.
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

create policy "Users can add themselves to a group"
  on group_members for insert
  to authenticated
  with check (user_id = auth.uid());

-- checkins: only members can view a group's check-ins; you can only ever
-- create a check-in for yourself, in a group you belong to.
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

-- group_items: only members can view a group's garden; any member can buy
-- an item for the shared garden.
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
