-- Personal Bible highlights and notes for the Read tab. These are private
-- to each person — not shared with any group.
-- Run this after the earlier migrations.

create table if not exists bible_annotations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  book text not null,
  chapter int not null,
  verse int not null,
  highlighted boolean not null default false,
  note text,
  updated_at timestamptz not null default now(),
  unique (user_id, book, chapter, verse)
);

alter table bible_annotations enable row level security;

drop policy if exists "Users can view their own annotations" on bible_annotations;
create policy "Users can view their own annotations"
  on bible_annotations for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Users can create their own annotations" on bible_annotations;
create policy "Users can create their own annotations"
  on bible_annotations for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Users can update their own annotations" on bible_annotations;
create policy "Users can update their own annotations"
  on bible_annotations for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Users can delete their own annotations" on bible_annotations;
create policy "Users can delete their own annotations"
  on bible_annotations for delete
  to authenticated
  using (user_id = auth.uid());

notify pgrst, 'reload schema';
