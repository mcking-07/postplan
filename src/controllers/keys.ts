import type { Context } from 'hono';
import { loggerFor, outbound, responsify, sanitize, schedule } from '../common';
import { BadRequest, NotFound } from '../errors';
import { services } from '../services';
import type { BearerVariablesType } from '../types';

const logger = loggerFor('controllers/keys');

class KeyController {
  private get_keys_service = () => services.resolve('service:keys');
  private get_audit_service = () => services.resolve('service:audit');

  list = async (context: Context<BearerVariablesType>) => {
    const { id } = context.get('account');
    const service = this.get_keys_service();

    logger.info(`listing api keys for account [${id}]`);
    const results = await service.list(id);

    return responsify({ status: 200, body: outbound({ ok: true, api_keys: results }) });
  };

  create = async (context: Context<BearerVariablesType>) => {
    const account = context.get('account');
    const body = await context.req.json().catch(() => {
      throw new BadRequest('invalid request body.');
    });

    const name = sanitize(body.name, 100, /[^a-zA-Z0-9\s\-_]/g) ?? '';

    const service = this.get_keys_service();
    const audit = this.get_audit_service();

    logger.info(`creating api key [${name}] for account [${account.id}]`);
    const result = await service.mint(account.id, name);

    schedule(context, audit.record({
      account_id: account.id, action: 'key.create', resource_type: 'api_key', resource_id: result.id, metadata: { name },
      source_ip: context.req.header('x-real-ip') ?? context.req.header('cf-connecting-ip'), user_agent: context.req.header('user-agent'),
    }), 'key creation audit');

    return responsify({ status: 201, body: outbound({ ok: true, api_key: { id: result.id, name }, token: result.token }) });
  };

  revoke = async (context: Context<BearerVariablesType>) => {
    const account = context.get('account');

    const key_id = context.req.param('id');
    if (!key_id) throw new NotFound('api key not found.');

    const service = this.get_keys_service();
    const audit = this.get_audit_service();

    logger.info(`revoking api key [${key_id}] for account [${account.id}]`);
    const revoked = await service.revoke(key_id, account.id);
    if (!revoked) throw new NotFound('api key not found.');

    schedule(context, audit.record({
      account_id: account.id, action: 'key.revoke', resource_type: 'api_key', resource_id: key_id,
      source_ip: context.req.header('x-real-ip') ?? context.req.header('cf-connecting-ip'), user_agent: context.req.header('user-agent'),
    }), 'key revocation audit');

    return responsify({ status: 200, body: { ok: true } });
  };
}

export { KeyController };
