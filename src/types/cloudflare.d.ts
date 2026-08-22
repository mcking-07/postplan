interface D1MigrationType {
  name: string;
  queries: string[];
}

declare namespace Cloudflare {
  interface GlobalProps {
    mainModule: typeof import('../worker');
  }

  interface Env {
    DATABASE: D1Database;
    STORAGE: R2Bucket;
    TEST_MIGRATIONS: D1MigrationType[];
  }
}
