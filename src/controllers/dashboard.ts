import type { Context } from 'hono';
import { loggerFor, responsify } from '../common';
import { config } from '../config';
import { services } from '../services';
import type { AccessVariablesType, DraftGroupType, DraftSummaryType } from '../types';
import { render_dashboard, render_hero } from '../views';

const logger = loggerFor('controllers/dashboard');

class DashboardController {
  private get_drafts_service = () => services.resolve('service:drafts');
  private get_keys_service = () => services.resolve('service:keys');

  hero = async () => {
    return responsify({ status: 200, html: render_hero() });
  };

  serve = async (context: Context<AccessVariablesType>) => {
    const { id, email, role } = context.get('account');

    const drafts_service = this.get_drafts_service();
    const keys_service = this.get_keys_service();

    logger.info(`serving dashboard for account [${id}]`);
    const drafts = await drafts_service.list(id);
    const grouped = this.group(drafts);

    const keys = await keys_service.list(id);
    const has_keys = keys.some(key => !key.revoked_at);

    return responsify({ status: 200, html: render_dashboard({ email, role, grouped, base: config.base, team: config.team, has_keys }) });
  };

  private group = (drafts: DraftSummaryType[]): DraftGroupType[] => {
    const grouped = new Map<string, DraftSummaryType[]>();

    for (const draft of drafts) {
      const label = draft.repo_org && draft.repo_name ? `${draft.repo_org}/${draft.repo_name}` : 'no repository';

      const entries = grouped.get(label) ?? [];
      entries.push(draft);
      grouped.set(label, entries);
    }

    return Array.from(grouped, ([label, drafts]) => ({ label, drafts }));
  };
}

export { DashboardController };
