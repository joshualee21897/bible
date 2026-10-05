-- Lets a highlight remember which color was picked for it, instead of
-- always being the one fixed yellow. Null means "yellow" (every highlight
-- made before this migration), so nothing already saved needs backfilling.

alter table bible_annotations add column if not exists color text;

notify pgrst, 'reload schema';
