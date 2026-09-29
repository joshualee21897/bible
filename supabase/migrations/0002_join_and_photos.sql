-- Joining a group by invite code, and private photo storage.
-- Run this in the Supabase SQL editor after 0001_init.sql.

-- Looking up a group by invite code has to happen before you're a member,
-- so it can't go through the normal "members can view their groups" rule.
-- This function runs with elevated rights just for that one lookup, and
-- only ever adds the calling user (never anyone else) as a member.
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

-- Private bucket for check-in photos, one folder per group and member:
-- checkin-photos/<group_id>/<user_id>/<filename>
insert into storage.buckets (id, name, public)
values ('checkin-photos', 'checkin-photos', false)
on conflict (id) do nothing;

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
