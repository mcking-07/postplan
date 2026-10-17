import type { ConfigType } from './config';
import type { AccountRoleType } from './shared';

type AccountFlagType = ConfigType['flags'][keyof ConfigType['flags']];

type AccountEntityType = {
  id: string;
  email: string;
  role: AccountRoleType;
  flags: string;
  created_at: string;
  updated_at: string;
};

type AccountType = {
  id: string;
  email: string;
  role: AccountRoleType;
  flags: AccountFlagType[];
  created_at: string;
  updated_at: string;
};

type AccountContextType = {
  id: string;
  email: string;
  role: AccountRoleType;
};

type BearerAccountContextType = AccountContextType & {
  flags: AccountFlagType[];
};

export type { AccountContextType, AccountEntityType, AccountFlagType, AccountType, BearerAccountContextType };
