import type { NullableType, UnknownPayloadType } from './shared';

type AuditActionType = 'auth.login' | 'account.create' | 'account.role_change' | 'key.create' | 'key.revoke' | 'draft.create' | 'draft.update' | 'draft.delete' | 'draft.disable';

type AuditEntityType = {
  id: string;
  account_id: NullableType<string>;
  api_key_id: NullableType<string>;
  action: string;
  resource_type: NullableType<string>;
  resource_id: NullableType<string>;
  metadata: string;
  source_ip: NullableType<string>;
  user_agent: NullableType<string>;
  created_at: string;
  updated_at: string;
};

type AuditEntryType = {
  id: string;
  account_id?: string;
  api_key_id?: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  metadata: string;
  source_ip?: string;
  user_agent?: string;
  created_at: string;
  updated_at: string;
};

type AuditParamsType = {
  account_id: string;
  action: AuditActionType;
  resource_type: string;
  resource_id: string;
  source_ip?: string;
  user_agent?: string;
  api_key_id?: string;
  metadata?: UnknownPayloadType;
};

export type { AuditActionType, AuditEntityType, AuditEntryType, AuditParamsType };
