import type { Context } from 'hono';
import { loggerFor, outbound, responsify, sanitize } from '../common';
import { config } from '../config';
import { services } from '../services';
import type { AccessVariablesType, BearerVariablesType, KeyNotificationType } from '../types';
import { render_keys } from '../views';

const logger = loggerFor('controllers/auth');

class AuthController {
  private get_keys_service = () => services.resolve('service:keys');

  me = async (context: Context<BearerVariablesType>) => {
    const account = context.get('account');
    const key = context.get('key');

    return responsify({
      status: 200, body: outbound({ account_id: account.id, email: account.email, api_key_id: key.id, api_key_name: key.name })
    });
  };

  serve = async (context: Context<AccessVariablesType>) => {
    const { id, email, role } = context.get('account');

    const service = this.get_keys_service();
    const keys = await service.list(id);

    const message = this.notification(context);

    return responsify({ status: 200, html: render_keys({ email, role, keys, message, base: config.base, team: config.team }) });
  };

  private notification = (context: Context<AccessVariablesType>): KeyNotificationType => {
    const token = context.req.query('token');
    if (token) return { type: 'created', token };

    const revoked = context.req.query('revoked') === '1';
    if (revoked) return { type: 'revoked' };

    return undefined;
  };

  generate = async (context: Context<AccessVariablesType>) => {
    const { id } = context.get('account');

    const body = await context.req.parseBody();
    const name = sanitize(body.name, 100, /[^a-zA-Z0-9\s\-_]/g) ?? '';

    const service = this.get_keys_service();

    logger.info(`generating api key for account [${id}]`);
    const result = await service.mint(id, name);

    return context.redirect(`/cli/auth?token=${encodeURIComponent(result.token)}`);
  };

  revoke = async (context: Context<AccessVariablesType>) => {
    const { id: account_id } = context.get('account');
    const key_id = context.req.param('id');

    if (key_id) {
      const service = this.get_keys_service();

      logger.info(`revoking api key [${key_id}] for account [${account_id}]`);
      await service.revoke(key_id, account_id);
    }

    return context.redirect('/cli/auth?revoked=1');
  };
}

export { AuthController };
