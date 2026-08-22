import type { NullableType } from './shared';

type ApiKeyEntityType = {
  id: string;
  account_id: string;
  name: string;
  key_hash: string;
  created_at: string;
  updated_at: string;
  last_used_at: NullableType<string>;
  revoked_at: NullableType<string>;
};

type ApiKeyType = {
  id: string;
  account_id: string;
  name: string;
  created_at: string;
  updated_at: string;
  last_used_at?: string;
  revoked_at?: string;
};

type ApiKeySummaryEntityType = {
  id: string;
  account_id: string;
  name: string;
  created_at: string;
  last_used_at: NullableType<string>;
  revoked_at: NullableType<string>;
};

type ApiKeySummaryType = {
  id: string;
  account_id: string;
  name: string;
  created_at: string;
  last_used_at?: string;
  revoked_at?: string;
};

type ApiKeyContextType = {
  id: string;
  name: string;
  account_id: string;
};

export type { ApiKeyContextType, ApiKeyEntityType, ApiKeySummaryEntityType, ApiKeySummaryType, ApiKeyType };
