import { ValidationFailed } from '../errors';
import type { ConfigType, EnvironmentType } from '../types';

const config = {} as ConfigType;

const required = (value: unknown, key: string): string => {
  if (typeof value !== 'string' || !value.trim()) throw new ValidationFailed(`missing required config: ${key}`);

  return value.trim();
};

const cloudflare = (env: EnvironmentType, is_development: boolean): ConfigType['cloudflare'] => {
  if (is_development) return { developer: required(env.DEVELOPER_EMAIL, 'DEVELOPER_EMAIL') };

  const team = required(env.CF_ACCESS_TEAM_DOMAIN, 'CF_ACCESS_TEAM_DOMAIN');
  const audience = required(env.CF_ACCESS_AUDIENCE, 'CF_ACCESS_AUDIENCE');

  return {
    team, audience, jwks_uri: `https://${team}/cdn-cgi/access/certs`, algorithms: ['RS256'],
  };
};

const bootstrap = (env: EnvironmentType) => {
  const environment = env.NODE_ENV ?? 'development';

  const cf = cloudflare(env, environment === 'development');

  Object.assign(config, {
    environment,
    admins: required(env.ADMIN_EMAILS, 'ADMIN_EMAILS').split(',').map(email => email.trim().toLowerCase()).filter(Boolean),
    base: required(env.PUBLIC_BASE_URL, 'PUBLIC_BASE_URL'),
    bytes: { maximum: 4 * 1024 * 1024 },
    pages: { maximum: 50 },
    flags: { custom_urls: 'custom-urls' },
    capabilities: {
      inline_scripts: true,
      external_assets: 'https images, video, audio, fonts, and stylesheets',
      blocked_in_sandbox: [
        'script src (external scripts)', 'fetch, XHR, WebSocket, and EventSource', 'localStorage, sessionStorage, indexedDB, and cookies', 'alert, confirm, and prompt', 'workers', 'forms', 'iframes, embeds, and objects', 'meta refresh',
      ],
    },
    team: 'team' in cf ? cf.team : undefined,
    cloudflare: cf,
  });

  return config;
};

export { bootstrap, config };
