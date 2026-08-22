import type { AccountType } from './account';
import type { AccountRoleType } from './shared';
import type { ApiKeySummaryType } from './api-key';
import type { AuditEntryType } from './audit';
import type { DraftGroupType, DraftType } from './draft';
import type { DraftVersionType } from './draft-version';

type ShellParamsType = {
  title: string;
  description?: string;
  email: string;
  role: AccountRoleType;
  team?: string;
  body: string;
};

type DashboardParamsType = {
  email: string;
  role: AccountRoleType;
  grouped: DraftGroupType[];
  base: string;
  team?: string;
  has_keys: boolean;
};

type KeyNotificationType =
  | { type: 'created'; token: string }
  | { type: 'revoked' }
  | undefined;

type KeysParamsType = {
  email: string;
  role: AccountRoleType;
  keys: ApiKeySummaryType[];
  message: KeyNotificationType;
  base: string;
  team?: string;
};

type AdminParamsType = {
  email: string;
  role: AccountRoleType;
  accounts: AccountType[];
  drafts: DraftType[];
  logs: AuditEntryType[];
  base: string;
  team?: string;
};

type VersionsParamsType = {
  id: string;
  title: string;
  description?: string;
  rows: DraftVersionType[];
  base: string;
  email: string;
  role: AccountRoleType;
  team?: string;
};

export type { AdminParamsType, DashboardParamsType, KeyNotificationType, KeysParamsType, ShellParamsType, VersionsParamsType };
