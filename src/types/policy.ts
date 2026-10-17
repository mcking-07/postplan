import type { UploadPageType } from './http';

type PolicyAttributeType = {
  name: string;
  value: string;
};

type PolicyLocationType = {
  startLine: number;
  startCol: number;
  attrs?: Record<string, PolicyLocationType>;
};

type PolicyNodeType = {
  tagName?: string;
  attrs?: PolicyAttributeType[];
  childNodes?: PolicyNodeType[];
  nodeName?: string;
  value?: string;
  sourceCodeLocation?: PolicyLocationType;
};

type PolicyIssueLevelType = 'error' | 'warning';

type PolicyIssueType = {
  path?: string;
  level: PolicyIssueLevelType;
  code: string;
  message: string;
  fix?: string;
  line?: number;
  column?: number;
  count: number;
};

type PolicyIssueRegistryType = Map<string, PolicyIssueType>;

type PolicyReportOptionsType = {
  node?: PolicyNodeType;
  attribute?: string;
  fix?: string;
};

type WalkerEntryType = {
  node: PolicyNodeType;
  depth: number;
};

type PolicyLinkType = {
  node: PolicyNodeType;
  attribute: string;
  value: string;
};

type ValidationContextType = {
  has_inline_script: boolean;
  title: string | undefined;
  too_deep: boolean;
  has_base: boolean;
  links: PolicyLinkType[];
};

type ValidatedPageType = {
  path: string;
  html: string;
  title?: string;
  bytes: number;
  has_inline_script: boolean;
  content_hash: string;
};

type ValidationInputType = {
  pages: UploadPageType[];
  slug?: string;
  description?: string;
};

type ValidationResultType = {
  ok: boolean;
  errors: string[];
  warnings: string[];
  issues: PolicyIssueType[];
  pages: ValidatedPageType[];
  title?: string;
  slug?: string;
  bytes: number;
  stats: {
    has_inline_script: boolean;
    external_image_hosts: string[];
  };
};

export type { PolicyIssueLevelType, PolicyIssueRegistryType, PolicyIssueType, PolicyNodeType, PolicyReportOptionsType, ValidatedPageType, ValidationContextType, ValidationInputType, ValidationResultType, WalkerEntryType };
