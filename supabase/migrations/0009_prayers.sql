-- Adds prayer requests and a shared "reaction" table used for both:
--   - "Amen" on a check-in's reflection
--   - "Praying for you" on a prayer request
-- Run this after the earlier migrations.

create table if not exists prayers (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  text text not null,
  show_name boolean not null default true,
  answered boolean not null default false,
  created_at timestamptz not null default now()
);

-- Second foreign key purely so the app can fetch the poster's name/color
-- alongside a prayer in one query (same pattern as checkins/group_members).
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

-- Is the reaction's target (a check-in or a prayer) inside a group the
-- current user belongs to? A SECURITY DEFINER function so checking this
-- doesn't get tangled in the target table's own RLS policy.
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

notify pgrst, 'reload schema';
