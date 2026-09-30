-- Lets the app fetch a person's name/color alongside their check-ins and
-- group membership in one query (PostgREST needs an actual foreign key to
-- do that "embedding" — referencing auth.users on both sides isn't enough,
-- since checkins/group_members and profiles aren't directly linked to each
-- other in the schema graph).
--
-- This is safe to add: profiles.id is always the same value as
-- auth.users.id, and everyone already has a profile row before they can
-- create a check-in or join a group (see the profile setup screen).
-- Run this after the earlier migrations.

alter table checkins
  add constraint checkins_user_id_profiles_fkey foreign key (user_id) references profiles (id);

alter table group_members
  add constraint group_members_user_id_profiles_fkey foreign key (user_id) references profiles (id);

alter table group_items
  add constraint group_items_bought_by_profiles_fkey foreign key (bought_by) references profiles (id);
