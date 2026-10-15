alter table drafts add column slug text collate nocase;

create unique index idx_drafts_slug on drafts(slug);
