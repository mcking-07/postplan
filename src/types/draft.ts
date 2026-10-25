import type { DraftPageEntityType } from './draft-page';
import type { DraftVersionType } from './draft-version';
import type { NullableType } from './shared';

type DraftEntityType = {
  id: string;
  account_id: string;
  slug: NullableType<string>;
  title: string;
  description: NullableType<string>;
  current_version_id: NullableType<string>;
  repo_org: NullableType<string>;
  repo_name: NullableType<string>;
  repo_host: NullableType<string>;
  created_at: string;
  updated_at: string;
  deleted_at: NullableType<string>;
  disabled_at: NullableType<string>;
  disabled_reason: NullableType<string>;
  favorited_at: NullableType<string>;
};

type DraftType = {
  id: string;
  account_id: string;
  slug?: string;
  title: string;
  description?: string;
  current_version_id?: string;
  repo_org?: string;
  repo_name?: string;
  repo_host?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  disabled_at?: string;
  disabled_reason?: string;
  favorited_at?: string;
};

type DraftSummaryRowType = {
  id: string;
  slug: NullableType<string>;
  title: string;
  description: NullableType<string>;
  repo_org: NullableType<string>;
  repo_name: NullableType<string>;
  repo_host: NullableType<string>;
  created_at: string;
  updated_at: string;
  disabled_at: NullableType<string>;
  favorited_at: NullableType<string>;
  latest_version_number: NullableType<number>;
  latest_version_at: NullableType<string>;
  page_count: number;
  version_count: number;
};

type DraftSummaryType = {
  id: string;
  slug: NullableType<string>;
  title: string;
  description?: string;
  repo_org?: string;
  repo_name?: string;
  repo_host?: string;
  latest_version_number?: number;
  latest_version_at?: string;
  version_count: number;
  disabled: boolean;
  favorite: boolean;
  created_at: string;
  updated_at: string;
  public_url: string;
  raw_url: string;
};

type DraftGroupType = {
  label: string;
  drafts: DraftSummaryType[];
};

type ResolvedDraftType = {
  draft: DraftType;
  version: DraftVersionType;
  page: DraftPageEntityType;
  redirect?: string;
};

type SetVersionParamsType = {
  id: string;
  version_id: string;
  slug?: string;
  title: string;
  description?: string;
  repo_org?: string;
  repo_name?: string;
  repo_host?: string;
  touch: boolean;
};

type ResolveOptionsType = {
  version?: number;
  unfiltered?: boolean;
};

export type { DraftEntityType, DraftGroupType, DraftSummaryRowType, DraftSummaryType, DraftType, ResolvedDraftType, ResolveOptionsType, SetVersionParamsType };
