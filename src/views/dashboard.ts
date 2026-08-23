import type { DashboardParamsType, DraftSummaryType } from '../types';
import { copyable, empty, heading } from './fragments';
import { escape, format_date, plural } from './helpers';
import { shell } from './layout';

const draft_item = (draft: DraftSummaryType) => `<div class="item">
  <div class="item-head">
    <a class="title" href="${escape(draft.public_url)}" target="_blank" rel="noopener noreferrer">${escape(draft.title)}</a>
    <span class="dim">${format_date(draft.updated_at)}</span>
  </div>
  ${draft.description ? `<div class="desc">${escape(draft.description)}</div>` : ''}
  <div class="meta"><a href="/d/${draft.id}/versions">${plural(draft.version_count, 'version')}</a></div>
</div>`;

const render_dashboard = ({ email, role, grouped, base, team, has_keys }: DashboardParamsType) => {
  const title = 'postplan drafts';
  const description = 'your published drafts.';

  if (grouped.length === 0) {
    const message = has_keys ? 'uploaded plans will show up here.' : '<a href="/cli/auth">generate an api key</a> to get started.';

    const body = `
      ${empty(`no drafts yet. ${message}`)}
      <p class="empty" style="padding-bottom: 0">publish a plan:</p>
      ${copyable(`npx postplan upload ./plan.html --api-url ${base}`)}
    `;

    return shell({ title, description, email, role, team, body });
  }

  const body = grouped.map(group => `
    ${heading(group.label, group.drafts.length)}
    ${group.drafts.map(draft_item).join('')}
  `).join('');

  return shell({ title, description, email, role, team, body });
};

export { render_dashboard };
