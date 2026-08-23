create table accounts (
  id text primary key,
  email text not null collate nocase unique,
  role text not null default 'member' check (role in ('admin', 'member')),
  created_at text not null,
  updated_at text not null
);
