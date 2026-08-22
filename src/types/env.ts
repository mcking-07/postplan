import type { AccountContextType } from './account';
import type { ApiKeyContextType } from './api-key';

type EnvironmentType = {
  DATABASE: D1Database;
  STORAGE: R2Bucket;
  NODE_ENV: string;
  ADMIN_EMAILS: string;
  PUBLIC_BASE_URL: string;
  CF_ACCESS_TEAM_DOMAIN?: string;
  CF_ACCESS_AUDIENCE?: string;
  DEVELOPER_EMAIL?: string;
};

type ApplicationEnvironmentType = {
  Bindings: EnvironmentType;
};

type AccessVariablesType = {
  Variables: {
    account: AccountContextType;
  };
};

type BearerVariablesType = {
  Variables: {
    account: AccountContextType;
    key: ApiKeyContextType;
  };
};

export type { AccessVariablesType, ApplicationEnvironmentType, BearerVariablesType, EnvironmentType };
