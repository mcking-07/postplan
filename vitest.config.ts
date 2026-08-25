import path from 'node:path';
import { cloudflareTest, readD1Migrations } from '@cloudflare/vitest-pool-workers';
import { defineConfig } from 'vitest/config';

const migrations = await readD1Migrations(path.join(import.meta.dirname, 'migrations'));

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: './wrangler.test.toml' },
      miniflare: {
        bindings: {
          TEST_MIGRATIONS: migrations,
          NODE_ENV: 'development',
          ADMIN_EMAILS: 'admin@example.com',
          DEVELOPER_EMAIL: 'developer@example.com',
          PUBLIC_BASE_URL: 'http://localhost:9057',
        },
      },
    }),
  ],
  test: {
    include: ['tests/**/*.test.ts'],
    setupFiles: ['./tests/setup/migrations.ts'],
  },
});
