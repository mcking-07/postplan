import type { RequestIdVariables } from 'hono/request-id';

type AsyncContextStoreType = {
  Variables: RequestIdVariables;
};

type ResponseOptionsType = {
  cache?: boolean;
  csp?: boolean;
};

type HandlerResponseType = {
  status?: number;
  headers?: Record<string, string>;
  body?: unknown;
  html?: string;
};

type KeyTransformerType = (key: string) => string;

type UploadMetadataType = {
  repo_org?: string;
  repo_name?: string;
  repo_host?: string;
  git_branch?: string;
  git_commit_sha?: string;
  git_commit_subject?: string;
  git_dirty?: boolean;
  ci_run_url?: string;
  ci_actor?: string;
  cli_version?: string;
  file_sha256?: string;
};

type UploadRequestType = {
  html: string;
  filename?: string;
  draft_id?: string;
  description?: string;
  metadata?: UploadMetadataType;
};

type UploadContextType = {
  request: UploadRequestType;
  account_id: string;
  api_key_id: string;
  source_ip?: string;
  user_agent?: string;
  request_id: string;
};

export type { AsyncContextStoreType, HandlerResponseType, KeyTransformerType, ResponseOptionsType, UploadContextType, UploadMetadataType, UploadRequestType };
