alter table notes add column if not exists deleted_at timestamptz;
create index if not exists notes_deleted_at_idx on notes (deleted_at);
