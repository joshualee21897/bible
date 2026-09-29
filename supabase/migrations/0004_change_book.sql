-- Lets any member update their group's book/start date/weekly target,
-- e.g. picking a new book after finishing the current one.
-- Run this after the earlier migrations.

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
