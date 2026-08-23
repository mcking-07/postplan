import type { AccountType, AdminParamsType, AuditEntryType, DraftType } from '../types';
import { dim, heading, tag } from './fragments';
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
  if (draft.disabled_at) return '';

  return `<button class="danger" onclick="this.nextElementSibling.style.display='flex';this.style.display='none';this.nextElementSibling.querySelector('input').focus()">disable</button>
  <form method="post" action="/admin/drafts/${draft.id}/disable" class="disable-pop" style="display:none">
    <input type="text" name="reason" placeholder="reason (optional)">
    <button type="submit" class="danger">confirm</button>
    <button type="button" onclick="this.parentElement.style.display='none';this.parentElement.previousElementSibling.style.display=''">cancel</button>
  </form>`;
};

const resource_cell = (log: AuditEntryType) => {
  if (!log.resource_type) return '';

  const id = (log.resource_id ?? '').slice(0, 8);

  return `${escape(log.resource_type)}:${escape(id)}`;
};

const account_item = (account: AccountType, current_email: string) => `<tr>
  <td>${escape(account.email)}</td>
  <td>${tag(account.role)}</td>
  <td>${format_date(account.created_at)}</td>
  <td>${promote_cell(account, current_email)}</td>
</tr>`;

const draft_item = (draft: DraftType, base: string) => `<tr>
  <td><a href="${base}/d/${draft.id}" target="_blank" rel="noopener noreferrer">${escape(draft.title)}</a></td>
  <td class="dim">${escape(draft.account_id.slice(0, 8))}</td>
  <td>${format_date(draft.updated_at)}</td>
  <td>${draft.disabled_at ? tag('disabled') : tag('active')}</td>
  <td style="position:relative">${disable_cell(draft)}</td>
</tr>`;

const audit_item = (log: AuditEntryType) => `<tr>
  <td>${escape(log.action)}</td>
  <td class="dim">${escape((log.account_id ?? '').slice(0, 8))}</td>
  <td class="dim">${resource_cell(log)}</td>
  <td>${format_date(log.created_at)}</td>
  <td class="log-meta">${escape(log.metadata !== '{}' ? log.metadata : '')}</td>
</tr>`;

const render_admin = ({ email, role, accounts, drafts, logs, base, team }: AdminParamsType) => {
  const title = 'postplan admin';
  const description = 'system administration.';

  const accounts_table = `<table>
    <thead><tr><th>Email</th><th>Role</th><th>Created</th><th></th></tr></thead>
    <tbody>${accounts.map(account => account_item(account, email)).join('')}</tbody>
  </table>`;

  const drafts_table = `<table>
    <thead><tr><th>Title</th><th>Owner</th><th>Updated</th><th>Status</th><th></th></tr></thead>
    <tbody>${drafts.map(draft => draft_item(draft, base)).join('')}</tbody>
  </table>`;

  const audit_table = `<table>
    <thead><tr><th>Action</th><th>Account</th><th>Resource</th><th>When</th><th>Details</th></tr></thead>
    <tbody>${logs.map(audit_item).join('')}</tbody>
  </table>`;

  const body = `
    ${heading('Accounts', accounts.length)}
    ${accounts_table}
    ${heading('Drafts', drafts.length)}
    ${drafts_table}
    ${heading('Audit Log', logs.length)}
    ${audit_table}
  `;

  return shell({ title, description, email, role, team, body });
};

export { render_admin };
