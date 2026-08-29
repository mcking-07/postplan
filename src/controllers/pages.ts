import type { Context } from 'hono';
import { loggerFor, responsify } from '../common';
import { NotFound } from '../errors';
import { services } from '../services';
import type { ApplicationEnvironmentType } from '../types';

const logger = loggerFor('controllers/pages');

class PageController {
  private get_drafts_service = () => services.resolve('service:drafts');

  serve = async (context: Context<ApplicationEnvironmentType>) => {
    const id = context.req.param('id');
    if (!id) throw new NotFound('draft not found.');

    const service = this.get_drafts_service();
    logger.info(`serving draft [${id}]`);

    const { draft, version, html } = await service.resolve(id);
    const headers = { 'x-postplan-draft-id': draft.id, 'x-postplan-version': String(version.version_number) };

    return responsify({ status: 200, html, headers }, { cache: true, csp: true });
  };

  version = async (context: Context<ApplicationEnvironmentType>) => {
    const id = context.req.param('id');
    if (!id) throw new NotFound('draft not found.');

    const number = Number(context.req.param('number'));
    if (!Number.isInteger(number) || number < 1) throw new NotFound('invalid version number.');

    const service = this.get_drafts_service();
    logger.info(`serving draft [${id}] version [${number}]`);

    const { draft, version, html } = await service.resolve(id, { version: number });
    const headers = { 'x-postplan-draft-id': draft.id, 'x-postplan-version': String(version.version_number) };

    return responsify({ status: 200, html, headers }, { cache: true, csp: true });
  };
}

export { PageController };
