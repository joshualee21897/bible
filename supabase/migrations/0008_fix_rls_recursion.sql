-- Fixes "infinite recursion detected in policy for relation group_members".
--
-- Several policies check "is the current user a member of this group?" by
-- running a subquery against group_members. But group_members has its own
-- RLS policy that does the exact same thing — so checking membership
-- re-triggers the membership check, forever.
--
-- The fix: a SECURITY DEFINER function runs as the table owner, which
-- bypasses row-level security for its own queries. Every policy that needs
-- "is this user a member of this group?" now calls this function instead
-- of querying group_members directly, breaking the loop.
--
-- Run this after the earlier migrations.

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

notify pgrst, 'reload schema';
