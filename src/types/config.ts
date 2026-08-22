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
  team?: string;
  cloudflare: CloudflareAccessType | CloudflareDevelopmentType;
};

export type { ConfigType };
