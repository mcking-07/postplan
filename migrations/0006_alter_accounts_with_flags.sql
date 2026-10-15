alter table accounts add column flags text not null default '[]' check (json_valid(flags) and json_type(flags) = 'array');
