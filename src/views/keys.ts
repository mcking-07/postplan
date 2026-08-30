import type { ApiKeySummaryType, KeysParamsType } from '../types';
import { banner, copyable, dim, heading } from './fragments';
import { escape, format_date } from './helpers';
import { shell } from './layout';

const key_item = (key: ApiKeySummaryType) => `<tr>
  <td data-tip="${escape(key.name)}"><span class="tip">${escape(key.name)}</span></td>
  <td>${format_date(key.created_at)}</td>
  <td>${key.last_used_at ? format_date(key.last_used_at) : dim('never')}</td>
  <td><form method="post" action="/cli/auth/revoke/${key.id}" style="display:inline"><button type="submit" class="danger">revoke</button></form></td>
</tr>`;

const keys_table = (active: ApiKeySummaryType[]) => `<table class="keys">
  <thead><tr><th>Name</th><th>Created</th><th>Last used</th><th></th></tr></thead>
  <tbody>${active.map(key_item).join('')}</tbody>
</table>`;

const render_keys = ({ email, role, keys, message, base, team }: KeysParamsType) => {
  const title = 'postplan keys';
  const description = 'manage your postplan api keys.';
  const active = keys.filter(key => !key.revoked_at);

  const notification = message?.type === 'created'
    ? banner('success', `shown once. copy it now; it won't be shown again.${copyable(message.token)}`)
    : message?.type === 'revoked'
      ? banner('neutral', 'api key revoked.')
      : '';

  const body = `
    ${notification}
    ${heading('Generate')}
    <form class="row" method="post" action="/cli/auth/generate">
      <input type="text" name="name" placeholder="key name (laptop, ci, work mac)" autocomplete="off">
      <button type="submit" class="primary">generate</button>
    </form>
    ${heading('Keys')}
    ${keys_table(active)}
    ${heading('Setup')}
    <div class="setup">
      after generating a key, run:
      ${copyable(`postplan auth login --api-url ${base}`)}
    </div>
  `;

  return shell({ title, description, email, role, team, body });
};

export { render_keys };
