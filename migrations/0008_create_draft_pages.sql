create table draft_pages (
  id text primary key,
  draft_version_id text not null references draft_versions(id),
  path text not null,
  object_key text not null unique,
  content_hash text not null,
  file_size integer not null check (file_size >= 0),
  title text,
  has_inline_script integer not null default 0 check (has_inline_script in (0, 1)),
  created_at text not null,
  updated_at text not null,
  unique (draft_version_id, path)
);
