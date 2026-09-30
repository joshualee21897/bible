-- Flock: full database setup, safe to run even if some of this already
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

-- Each garden item can only be bought once per group ------------------------

alter table group_items drop constraint if exists group_items_group_id_item_key_key;
alter table group_items
  add constraint group_items_group_id_item_key_key unique (group_id, item_key);

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
  using (is_group_member(id));

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

-- Make sure Supabase's API layer picks up all of the above immediately ------

notify pgrst, 'reload schema';
