alter table notes add column if not exists pinned boolean not null default false;
create index if not exists notes_pinned_idx on notes (pinned desc, updated_at desc);
