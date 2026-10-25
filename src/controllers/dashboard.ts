import type { Context } from 'hono';
import { loggerFor, responsify, schedule } from '../common';
import { config } from '../config';
import { services } from '../services';
import type { AccessVariablesType, DraftGroupType, DraftSummaryType, FavoriteNotificationType } from '../types';
import { render_dashboard, render_hero } from '../views';

const logger = loggerFor('controllers/dashboard');

class DashboardController {
  private get_drafts_service = () => services.resolve('service:drafts');
  private get_keys_service = () => services.resolve('service:keys');
  private get_audit_service = () => services.resolve('service:audit');

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

    const message = this.notification(context, drafts);

    return responsify({ status: 200, html: render_dashboard({ email, role, grouped, message, base: config.base, team: config.team, has_keys }) });
  };

  favorite = async (context: Context<AccessVariablesType>) => {
    const { id: account_id } = context.get('account');

    const draft_id = context.req.param('id');
    if (!draft_id) return context.redirect('/dashboard');

    const body = await context.req.parseBody();
    const favorite = body.favorite === 'true';

    const drafts_service = this.get_drafts_service();
    const audit_service = this.get_audit_service();

    logger.info(`setting favorite [${favorite}] on draft [${draft_id}] for account [${account_id}]`);
    const { id } = await drafts_service.favorite(draft_id, account_id, favorite);

    schedule(context, audit_service.record({
      account_id, action: 'draft.update', resource_type: 'draft', resource_id: id, metadata: { favorite },
      source_ip: context.req.header('x-real-ip') ?? context.req.header('cf-connecting-ip'), user_agent: context.req.header('user-agent'),
    }), 'draft favorite audit');

    return context.redirect(`/dashboard?favorited=${Number(favorite)}&draft=${id}`);
  };

  private group = (drafts: DraftSummaryType[]): DraftGroupType[] => {
    const grouped = new Map<string, DraftSummaryType[]>();

    for (const draft of drafts) {
      const label = this.classify(draft);

      const entries = grouped.get(label) ?? [];
      entries.push(draft);

      grouped.set(label, entries);
    }

    return Array.from(grouped, ([label, drafts]) => ({ label, drafts }));
  };

  private classify = (draft: DraftSummaryType) => {
    if (draft.favorite) return 'favorites';
    if (draft.repo_org && draft.repo_name) return `${draft.repo_org}/${draft.repo_name}`;

    return 'no repository';
  };

  private notification = (context: Context<AccessVariablesType>, drafts: DraftSummaryType[]): FavoriteNotificationType => {
    const favorited = context.req.query('favorited');
    const draft = drafts.find(entry => entry.id === context.req.query('draft'));

    if (favorited === '1') return { type: 'added', draft };
    if (favorited === '0') return { type: 'removed', draft };

    return undefined;
  };
}

export { DashboardController };
