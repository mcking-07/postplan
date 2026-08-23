import type { Context } from 'hono';
import { loggerFor, responsify } from '../common';
import { config } from '../config';
import { NotFound } from '../errors';
import { services } from '../services';
import type { AccessVariablesType } from '../types';
import { render_versions } from '../views';

const logger = loggerFor('controllers/versions');

class VersionController {
  private get_service = () => services.resolve('service:drafts');

  list = async (context: Context<AccessVariablesType>) => {
    const id = context.req.param('id');
    if (!id) throw new NotFound('draft not found.');

    const { email, role } = context.get('account');
    const service = this.get_service();

    logger.info(`listing versions for draft [${id}]`);
    const { draft, rows } = await service.list_versions(id);

    return responsify({
      status: 200,
      html: render_versions({ id: draft.id, title: draft.title, description: draft.description ?? undefined, rows, base: config.base, email, role, team: config.team }),
    });
  };
}

export { VersionController };
