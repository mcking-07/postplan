import { Hono } from 'hono';
import { contextStorage } from 'hono/context-storage';
import { requestId } from 'hono/request-id';
import { responsify } from './common';
import { bootstrap as bootstrap_config } from './config';
import { error_handler } from './middlewares';
import { configure } from './routes';
import { bootstrap as bootstrap_services } from './services';
import type { ApplicationEnvironmentType, EnvironmentType } from './types';
import { render_not_found } from './views';

const state = { router: undefined } as { router?: Hono<ApplicationEnvironmentType>; };

const bootstrap = (env: EnvironmentType) => {
  if (state.router) return state.router;

  bootstrap_config(env);
  bootstrap_services(env);

  state.router = new Hono<ApplicationEnvironmentType>();
  const { router } = state;

  router.use(contextStorage());
  router.use(requestId());

  router.onError(error_handler);
  router.notFound(() => responsify({ status: 404, html: render_not_found() }));

  configure(router);
  return router;
};

export default {
  async fetch(request: Request, env: EnvironmentType, context: ExecutionContext): Promise<Response> {
    const router = bootstrap(env);
    return router.fetch(request, env, context);
  },
};
