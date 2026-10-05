-- A check-in is now a written reflection, not a photo — the photo step is
-- removed for now (storage costs), but photo_path and the checkin-photos
-- bucket are left exactly as they are, just unused, so nothing is lost.
-- Run this after the earlier migrations.

alter table checkins add column if not exists kind text not null default 'reflection';

alter table checkins drop constraint if exists checkins_kind_check;
alter table checkins
  add constraint checkins_kind_check check (kind in ('reflection', 'revelation', 'action'));

notify pgrst, 'reload schema';
