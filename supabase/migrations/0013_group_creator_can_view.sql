-- Creating a group inserts the group row, then asks the database to hand
-- it straight back, and only afterwards adds the creator to group_members.
-- In that brief gap the creator isn't a member yet, so the old "members
-- only" view policy blocked the hand-back and the whole create failed.
-- Letting the creator always see their own group closes that gap.
-- Run this after the earlier migrations.

drop policy if exists "Members can view their groups" on groups;
create policy "Members can view their groups"
  on groups for select
  to authenticated
  using (is_group_member(id) or created_by = auth.uid());

notify pgrst, 'reload schema';
