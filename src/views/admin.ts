import type { AccountType, AdminParamsType, AuditEntryType, DraftType } from '../types';
import { dim, heading, pagination, tag } from './fragments';
import { escape, format_date } from './helpers';
import { shell } from './layout';

const promote_cell = (account: AccountType, current_email: string) => {
  if (account.email === current_email) return dim('you');

  const target_role = account.role === 'admin' ? 'member' : 'admin';
  const label = account.role === 'admin' ? 'demote' : 'promote';

  return `<form method="post" action="/admin/accounts/${account.id}/promote" style="display:inline">
    <input type="hidden" name="role" value="${target_role}">
    <button type="submit">${label}</button>
  </form>`;
};

const disable_cell = (draft: DraftType) => {
  if (draft.deleted_at || draft.disabled_at) return '<button class="danger" disabled>disable</button>';

  return `<button class="danger" onclick="this.nextElementSibling.style.display='flex';this.style.display='none';this.nextElementSibling.querySelector('input').focus()">disable</button>
  <form method="post" action="/admin/d/${draft.id}/disable" class="disable-pop" style="display:none">
    <input type="text" name="reason" placeholder="reason (optional)">
    <button type="submit" class="danger">confirm</button>
    <button type="button" onclick="this.parentElement.style.display='none';this.parentElement.previousElementSibling.style.display=''">cancel</button>
  </form>`;
};

const resource_cell = (log: AuditEntryType) => {
  if (!log.resource_type) return '';
  return `${escape(log.resource_type)}:${escape(log.resource_id ?? '')}`;
};

const account_item = (account: AccountType, current_email: string) => `<tr>
  <td>${escape(account.email)}</td>
  <td class="dim">${escape(account.id)}</td>
  <td>${tag(account.role)}</td>
  <td>${format_date(account.created_at)}</td>
  <td>${promote_cell(account, current_email)}</td>
</tr>`;

const draft_item = (draft: DraftType, base: string) => `<tr>
  <td data-tip="${escape(draft.title)}"><a href="${base}/admin/d/${draft.id}" target="_blank" rel="noopener noreferrer"><span class="tip">${escape(draft.title)}</span></a></td>
  <td class="dim">${escape(draft.account_id)}</td>
  <td>${format_date(draft.updated_at)}</td>
  <td>${draft.deleted_at ? tag('deleted') : draft.disabled_at ? tag('disabled') : tag('active')}</td>
  <td style="position:relative">${disable_cell(draft)}</td>
</tr>`;

const audit_item = (log: AuditEntryType) => `<tr>
  <td>${escape(log.action)}</td>
  <td class="dim">${escape(log.account_id ?? '')}</td>
  <td class="dim">${resource_cell(log)}</td>
  <td>${format_date(log.created_at)}</td>
  <td class="log-meta"${log.metadata !== '{}' ? ` data-tip="${escape(log.metadata)}"` : ''}><span class="tip">${escape(log.metadata !== '{}' ? log.metadata : '')}</span></td>
</tr>`;

const render_admin = ({ email, role, accounts, drafts, logs, base, team }: AdminParamsType) => {
  const title = 'postplan admin';
  const description = 'system administration.';

  const page_params = { accounts_page: accounts.page, drafts_page: drafts.page, audit_page: logs.page };

  const accounts_table = `<table>
    <thead><tr><th>Email</th><th>ID</th><th>Role</th><th>Created</th><th></th></tr></thead>
    <tbody>${accounts.rows.map(account => account_item(account, email)).join('')}</tbody>
  </table>`;

  const drafts_table = `<table class="drafts">
    <thead><tr><th>Title</th><th>Owner</th><th>Updated</th><th>Status</th><th></th></tr></thead>
    <tbody>${drafts.rows.map(draft => draft_item(draft, base)).join('')}</tbody>
  </table>`;

  const audit_table = `<table>
    <thead><tr><th>Action</th><th>Account</th><th>Resource</th><th>When</th><th>Details</th></tr></thead>
    <tbody>${logs.rows.map(audit_item).join('')}</tbody>
  </table>`;

  const body = `
    ${heading('Accounts', accounts.total, 'accounts')}
    ${accounts_table}
    ${pagination('accounts', accounts.page, accounts.pages, page_params)}
    ${heading('Drafts', drafts.total, 'drafts')}
    ${drafts_table}
    ${pagination('drafts', drafts.page, drafts.pages, page_params)}
    ${heading('Audit Log', logs.total, 'audit')}
    ${audit_table}
    ${pagination('audit', logs.page, logs.pages, page_params)}
  `;

  return shell({ title, description, email, role, team, body });
};

export { render_admin };
