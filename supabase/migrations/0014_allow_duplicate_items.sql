-- Lets more than one person (or the same person) buy the same animal or
-- item for a group's garden — e.g. two people can each add their own lion.
-- Run this after the earlier migrations.

alter table group_items drop constraint if exists group_items_group_id_item_key_key;

notify pgrst, 'reload schema';
