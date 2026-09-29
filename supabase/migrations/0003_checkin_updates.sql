-- Lets someone add a reflection or photo to a check-in after marking a
-- chapter as read, since that step happens as a second, optional action.
-- Run this after 0001_init.sql and 0002_join_and_photos.sql.

create policy "Users can update their own check-ins"
  on checkins for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
