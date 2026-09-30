-- Lets someone remove themselves from a group they're a member of.
-- Run this after the earlier migrations.

create policy "Users can remove themselves from a group"
  on group_members for delete
  to authenticated
  using (user_id = auth.uid());
