import type { Context } from 'hono';
import { loggerFor, responsify, sanitize, schedule } from '../common';
import { config } from '../config';
import { services } from '../services';
import type { AccessVariablesType } from '../types';
import { render_admin } from '../views';

const logger = loggerFor('controllers/admin');

class AdminController {
  private get_accounts_service = () => services.resolve('service:accounts');
  private get_drafts_service = () => services.resolve('service:drafts');
  private get_audit_service = () => services.resolve('service:audit');

  serve = async (context: Context<AccessVariablesType>) => {
    const { email, role } = context.get('account');

    const accounts_service = this.get_accounts_service();
    const drafts_service = this.get_drafts_service();
    const audit_service = this.get_audit_service();

    const page = {
      accounts: Math.max(1, Number(context.req.query('accounts_page')) || 1),
      drafts: Math.max(1, Number(context.req.query('drafts_page')) || 1),
      audit: Math.max(1, Number(context.req.query('audit_page')) || 1),
      size: 10
    };

    const accounts = await accounts_service.paginate(page.accounts, page.size);
    const drafts = await drafts_service.paginate(page.drafts, page.size);
    const logs = await audit_service.paginate(page.audit, page.size);

    logger.info('serving admin dashboard');
    return responsify({
      status: 200,
      html: render_admin({ email, role, accounts, drafts, logs, base: config.base, team: config.team }),
    });
  };

  preview = async (context: Context<AccessVariablesType>) => {
    const draft_id = context.req.param('id');
    if (!draft_id) return context.redirect('/admin');

    const drafts_service = this.get_drafts_service();
    logger.info(`admin previewing draft [${draft_id}]`);

    const { draft, version, html } = await drafts_service.resolve(draft_id, { unfiltered: true });
    const headers = { 'x-postplan-draft-id': draft.id, 'x-postplan-version': String(version.version_number) };

    return responsify({ status: 200, html, headers }, { csp: true });
  };

  version = async (context: Context<AccessVariablesType>) => {
    const draft_id = context.req.param('id');
    if (!draft_id) return context.redirect('/admin');

    const number = Number(context.req.param('number'));
    if (!Number.isInteger(number) || number < 1) return context.redirect('/admin');

    const drafts_service = this.get_drafts_service();
    logger.info(`admin previewing draft [${draft_id}] version [${number}]`);

    const { draft, version, html } = await drafts_service.resolve(draft_id, { version: number, unfiltered: true });
    const headers = { 'x-postplan-draft-id': draft.id, 'x-postplan-version': String(version.version_number) };

    return responsify({ status: 200, html, headers }, { csp: true });
  };

  promote = async (context: Context<AccessVariablesType>) => {
    const admin = context.get('account');
    const target = context.req.param('id');

    const body = await context.req.parseBody();
    const new_role = body.role as string;

    const is_valid = target && target !== admin.id && (new_role === 'admin' || new_role === 'member');
    if (!is_valid) return context.redirect('/admin');

    const accounts_service = this.get_accounts_service();
    const audit_service = this.get_audit_service();

    logger.info(`promoting account [${target}] to [${new_role}]`);
    await accounts_service.promote(target, new_role as 'admin' | 'member');

    schedule(context, audit_service.record({
      account_id: admin.id, action: 'account.role_change', resource_type: 'account', resource_id: target, metadata: { role: new_role },
      source_ip: context.req.header('x-real-ip') ?? context.req.header('cf-connecting-ip'), user_agent: context.req.header('user-agent'),
    }), 'account role audit');

    return context.redirect('/admin');
  };

  disable = async (context: Context<AccessVariablesType>) => {
    const admin = context.get('account');

    const draft_id = context.req.param('id');
    if (!draft_id) return context.redirect('/admin');

    const body = await context.req.parseBody();
    const reason = sanitize(body.reason, 50) ?? 'disabled by admin.';

    const drafts_service = this.get_drafts_service();
    const audit_service = this.get_audit_service();

    logger.info(`disabling draft [${draft_id}]`);
    await drafts_service.disable(draft_id, reason);

    schedule(context, audit_service.record({
      account_id: admin.id, action: 'draft.disable', resource_type: 'draft', resource_id: draft_id, metadata: { reason },
      source_ip: context.req.header('x-real-ip') ?? context.req.header('cf-connecting-ip'), user_agent: context.req.header('user-agent'),
    }), 'draft disable audit');

    return context.redirect('/admin');
  };
}

export { AdminController };
