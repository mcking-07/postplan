import type { AccountRoleType } from './shared';

type AccountEntityType = {
  id: string;
  email: string;
  role: AccountRoleType;
  created_at: string;
  updated_at: string;
};

type AccountType = AccountEntityType;

type AccountContextType = {
  id: string;
  email: string;
  role: AccountRoleType;
};

export type { AccountContextType, AccountEntityType, AccountType };
