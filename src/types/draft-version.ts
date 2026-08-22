import type { NullableType } from './shared';

type DraftVersionEntityType = {
  id: string;
  draft_id: string;
  version_number: number;
  object_key: string;
  content_hash: string;
  file_size: number;
  created_at: string;
  updated_at: string;
  created_by_api_key_id: string;
  source_ip: NullableType<string>;
  user_agent: NullableType<string>;
  cli_version: NullableType<string>;
  git_branch: NullableType<string>;
  git_commit_sha: NullableType<string>;
  git_commit_subject: NullableType<string>;
  git_dirty: NullableType<0 | 1>;
  original_filename: NullableType<string>;
  request_id: NullableType<string>;
  has_inline_script: 0 | 1;
  external_image_hosts: string;
  ci_run_url: NullableType<string>;
  ci_actor: NullableType<string>;
};

type DraftVersionType = {
  id: string;
  draft_id: string;
  version_number: number;
  object_key: string;
  content_hash: string;
  file_size: number;
  created_at: string;
  updated_at: string;
  created_by_api_key_id: string;
  source_ip?: string;
  user_agent?: string;
  cli_version?: string;
  git_branch?: string;
  git_commit_sha?: string;
  git_commit_subject?: string;
  git_dirty?: 0 | 1;
  original_filename?: string;
  request_id?: string;
  has_inline_script: 0 | 1;
  external_image_hosts: string;
  ci_run_url?: string;
  ci_actor?: string;
};

type CreateVersionParamsType = {
  id: string;
  draft_id: string;
  object_key: string;
  content_hash: string;
  file_size: number;
  api_key_id: string;
  source_ip?: string;
  user_agent?: string;
  cli_version?: string;
  git_branch?: string;
  git_commit_sha?: string;
  git_commit_subject?: string;
  git_dirty?: 0 | 1;
  original_filename?: string;
  request_id?: string;
  has_inline_script: 0 | 1;
  external_image_hosts: string;
  ci_run_url?: string;
  ci_actor?: string;
};

export type { CreateVersionParamsType, DraftVersionEntityType, DraftVersionType };
