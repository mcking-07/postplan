import type { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { require_access, require_admin, require_bearer } from '../middlewares';
import type { ApplicationEnvironmentType } from '../types';
import { AdminController, AuthController, DashboardController, DraftController, HealthController, KeyController, PageController, UploadController, VersionController } from '../controllers';

const configure = (router: Hono<ApplicationEnvironmentType>) => {
  const controllers = {
    admin: new AdminController(),
    auth: new AuthController(),
    dashboard: new DashboardController(),
    drafts: new DraftController(),
    health: new HealthController(),
    keys: new KeyController(),
    pages: new PageController(),
    uploads: new UploadController(),
    versions: new VersionController(),
  };

  // well-known
  router.get('/.well-known/appspecific/com.chrome.devtools.json', (context) => context.body(null, 204));

  // public
  router.get('/', controllers.dashboard.hero);
  router.get('/healthz', controllers.health.check);
  router.get('/healthcheck', controllers.health.check);

  router.get('/d/:id/version/:number/raw', controllers.pages.version);
  router.get('/d/:id/version/:number', controllers.pages.version);
  router.get('/d/:id/raw', controllers.pages.serve);
  router.get('/d/:id', controllers.pages.serve);

  // cloudflare access
  router.get('/dashboard', require_access(), controllers.dashboard.serve);
  router.get('/cli/auth', require_access(), controllers.auth.serve);
  router.post('/cli/auth/generate', require_access(), controllers.auth.generate);
  router.post('/cli/auth/revoke/:id', require_access(), controllers.auth.revoke);
  router.get('/d/:id/versions', require_access(), controllers.versions.list);

  // admin
  router.get('/admin', require_access(), require_admin(), controllers.admin.serve);
  router.get('/admin/d/:id/version/:number', require_access(), require_admin(), controllers.admin.version);
  router.get('/admin/d/:id', require_access(), require_admin(), controllers.admin.preview);
  router.post('/admin/accounts/:id/promote', require_access(), require_admin(), controllers.admin.promote);
  router.post('/admin/d/:id/disable', require_access(), require_admin(), controllers.admin.disable);

  // bearer api
  router.get('/api/me', require_bearer(), controllers.auth.me);
  router.get('/api/drafts', require_bearer(), controllers.drafts.list);
  router.delete('/api/drafts/:id', require_bearer(), controllers.drafts.remove);
  router.get('/api/api-keys', require_bearer(), controllers.keys.list);
  router.post('/api/api-keys', require_bearer(), controllers.keys.create);
  router.post('/api/api-keys/:id/revoke', require_bearer(), controllers.keys.revoke);
  router.post('/api/uploads', require_bearer(), bodyLimit({ maxSize: 2 * 1024 * 1024 }), controllers.uploads.create);
};

export { configure };
