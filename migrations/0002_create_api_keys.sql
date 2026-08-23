create table api_keys (
  id text primary key,
  account_id text not null references accounts(id),
  name text not null,
  key_hash text not null unique,
  created_at text not null,
  updated_at text not null,
  last_used_at text,
  revoked_at text
);

create index idx_api_keys_account on api_keys(account_id);
create index idx_api_keys_hash on api_keys(key_hash);
