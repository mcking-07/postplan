import { createMiddleware } from 'hono/factory';
import { Unauthorized } from '../errors';
import { services } from '../services';
import type { AccessVariablesType, BearerVariablesType } from '../types';

const get_authentication_service = () => services.resolve('service:authentication');

const require_bearer = () => createMiddleware<BearerVariablesType>(async (context, next) => {
  const authorization = context.req.header('authorization');
  if (!authorization) throw new Unauthorized('missing authorization header.');

  const token = authorization.replace(/^Bearer\s+/i, '').trim();
  if (!token) throw new Unauthorized('missing or invalid token.');

  const authentication = get_authentication_service();
  const result = await authentication.verify_bearer(token);

  context.set('account', result.account);
  context.set('key', result.key);

  await next();
});

const require_access = () => createMiddleware<AccessVariablesType>(async (context, next) => {
  const authentication = get_authentication_service();

  const assertion = context.req.header('cf-access-jwt-assertion');
  const account = await authentication.verify_access(assertion);

  context.set('account', account);

  await next();
});

const require_admin = () => createMiddleware<AccessVariablesType>(async (context, next) => {
  const account = context.get('account');
  if (account?.role !== 'admin') throw new Unauthorized('admin access required.');

  await next();
});

export { require_access, require_admin, require_bearer };
