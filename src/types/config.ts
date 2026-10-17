import type { AsymmetricAlgorithm } from 'hono/utils/jwt/jwa';

type CloudflareAccessType = {
  team: string;
  audience: string;
  jwks_uri: string;
  algorithms: AsymmetricAlgorithm[];
};

type CloudflareDevelopmentType = {
  developer: string;
};

type ConfigType = {
  environment: string;
  admins: string[];
  base: string;
  bytes: { maximum: number };
  pages: { maximum: number };
  flags: { custom_urls: 'custom-urls' };
  capabilities: { inline_scripts: boolean; external_assets: string; blocked_in_sandbox: string[] };
  team?: string;
  cloudflare: CloudflareAccessType | CloudflareDevelopmentType;
};

export type { ConfigType };
