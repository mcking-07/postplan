create table audit_log (
  id text primary key,
  account_id text references accounts(id),
  api_key_id text references api_keys(id),
  action text not null,
  resource_type text,
  resource_id text,
  metadata text not null default '{}',
  source_ip text,
  user_agent text,
  created_at text not null,
  updated_at text not null
);

create index idx_audit_log_account on audit_log(account_id, created_at);
create index idx_audit_log_action on audit_log(action, created_at);
