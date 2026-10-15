alter table draft_versions add column page_count integer not null default 1 check (page_count >= 1);
