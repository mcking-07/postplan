import type { Context } from 'hono';
import { loggerFor, outbound, responsify, schedule } from '../common';
import { BadRequest, NotFound } from '../errors';
import { services } from '../services';
import type { BearerVariablesType } from '../types';

const logger = loggerFor('controllers/drafts');

class DraftController {
  private get_drafts_service = () => services.resolve('service:drafts');
  private get_audit_service = () => services.resolve('service:audit');

  list = async (context: Context<BearerVariablesType>) => {
    const { id } = context.get('account');
    const service = this.get_drafts_service();

    logger.info(`listing drafts for account [${id}]`);
    const results = await service.list(id);

    return responsify({ status: 200, body: outbound({ ok: true, drafts: results }) });
  };

  favorite = async (context: Context<BearerVariablesType>) => {
    const account = context.get('account');
    const key = context.get('key');

    const reference = context.req.param('id');
    if (!reference) throw new NotFound('draft not found on your account.');

    const { favorite } = await context.req.json().catch(() => {
      throw new BadRequest('invalid request body.');
    });
    if (typeof favorite !== 'boolean') throw new BadRequest('favorite must be true or false.');

    const service = this.get_drafts_service();
    const audit = this.get_audit_service();

    logger.info(`setting favorite [${favorite}] on draft [${reference}] for account [${account.id}]`);
    const { id } = await service.favorite(reference, account.id, favorite);

    schedule(context, audit.record({
      account_id: account.id, api_key_id: key.id, action: 'draft.update', resource_type: 'draft', resource_id: id, metadata: { favorite },
      source_ip: context.req.header('x-real-ip') ?? context.req.header('cf-connecting-ip'), user_agent: context.req.header('user-agent'),
    }), 'draft favorite audit');

    return responsify({ status: 200, body: outbound({ ok: true, draft_id: id, favorite }) });
  };

  remove = async (context: Context<BearerVariablesType>) => {
    const account = context.get('account');
    const key = context.get('key');

    const draft_id = context.req.param('id');
    if (!draft_id) throw new NotFound('draft not found.');

    const service = this.get_drafts_service();
    const audit = this.get_audit_service();

    logger.info(`removing draft [${draft_id}] for account [${account.id}]`);
    const removed = await service.remove(draft_id, account.id);
    if (!removed) throw new NotFound('draft not found.');

    schedule(context, audit.record({
      account_id: account.id, api_key_id: key.id, action: 'draft.delete', resource_type: 'draft', resource_id: removed.id,
      source_ip: context.req.header('x-real-ip') ?? context.req.header('cf-connecting-ip'), user_agent: context.req.header('user-agent'),
    }), 'draft deletion audit');

    return responsify({ status: 200, body: { ok: true } });
  };
}

export { DraftController };
