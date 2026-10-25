import type { DashboardParamsType, DraftSummaryType, FavoriteNotificationType } from '../types';
import { banner, copyable, empty, heading } from './fragments';
import { escape, format_date, plural } from './helpers';
import { shell } from './layout';

const toggle = (draft: DraftSummaryType, variant: string, button: string) => `<form method="post" action="/d/${draft.id}/favorite" class="${variant}">
  <input type="hidden" name="favorite" value="${!draft.favorite}">
  ${button}
</form>`;

const bookmark = (draft: DraftSummaryType) => {
  const label = draft.favorite ? 'remove from favorites' : 'add to favorites';
  const icon = '<svg viewBox="0 0 24 24" aria-hidden="true"><use href="/icons/bookmark.svg#bookmark"/></svg>';

  return toggle(draft, 'favorite', `<button type="submit" class="${draft.favorite ? 'on' : ''}" title="${label}" aria-label="${label}">${icon}</button>`);
};

const notices = { added: 'added to favorites.', removed: 'removed from favorites.' };

const clear_handler = 'history.replaceState(null, \'\', location.pathname)';

const notice = ({ type, draft }: NonNullable<FavoriteNotificationType>) => {
  const content = draft ? `"${escape(draft.title)}" ${notices[type]}${toggle(draft, 'undo', '<button type="submit">undo</button>')}` : notices[type];

  return banner('neutral', content, 4 * 1000);
};

const draft_item = (draft: DraftSummaryType) => `<div class="item">
  <div class="item-head">
    <a class="title" href="${escape(draft.public_url)}" target="_blank" rel="noopener noreferrer">${escape(draft.title)}</a>
    <span class="when">${bookmark(draft)}<span class="dim">${format_date(draft.updated_at)}</span></span>
  </div>
  ${draft.description ? `<div class="desc">${escape(draft.description)}</div>` : ''}
  <div class="meta"><a href="/d/${draft.id}/versions">${plural(draft.version_count, 'version')}</a></div>
</div>`;

const render_dashboard = ({ email, role, grouped, message, base, team, has_keys }: DashboardParamsType) => {
  const title = 'postplan drafts';
  const description = 'your published drafts.';

  if (grouped.length === 0) {
    const hint = has_keys ? 'uploaded plans will show up here.' : '<a href="/cli/auth">generate an api key</a> to get started.';

    const body = `
      ${empty(`no drafts yet. ${hint}`)}
      <p class="empty" style="padding-bottom: 0">publish a plan:</p>
      ${copyable(`npx postplan upload ./index.html --api-url ${base}`)}
    `;

    return shell({ title, description, email, role, team, body });
  }

  const notification = message ? notice(message) : '';
  const cleanup = message ? `<script>${clear_handler}</script>` : '';

  const body = notification + grouped.map(group => `
    ${heading(group.label, group.drafts.length)}
    ${group.drafts.map(draft_item).join('')}
  `).join('') + cleanup;

  return shell({ title, description, email, role, team, body });
};

export { render_dashboard };
