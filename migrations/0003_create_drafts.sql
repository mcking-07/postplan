create table drafts (
  id text primary key,
  account_id text not null references accounts(id),
  title text not null,
  description text,
  current_version_id text,
  repo_org text,
  repo_name text,
  repo_host text,
  created_at text not null,
  updated_at text not null,
  deleted_at text,
  disabled_at text,
  disabled_reason text
);

create index idx_drafts_account_active on drafts(account_id, deleted_at, updated_at);
