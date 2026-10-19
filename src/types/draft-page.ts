import type { NullableType } from './shared';

type DraftPageEntityType = {
  id: string;
  draft_version_id: string;
  path: string;
  object_key: string;
  content_hash: string;
  file_size: number;
  title: NullableType<string>;
  has_inline_script: 0 | 1;
  created_at: string;
  updated_at: string;
};

type CreatePageParamsType = {
  path: string;
  object_key: string;
  content_hash: string;
  file_size: number;
  title?: string;
  has_inline_script: 0 | 1;
};

export type { CreatePageParamsType, DraftPageEntityType };
