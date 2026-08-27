import { escape } from './helpers';

const copy_handler = 'navigator.clipboard.writeText(this.previousElementSibling.value).then(() => { this.textContent = \'copied\'; setTimeout(() => this.textContent = \'copy\', 2000) })';

const heading = (label: string, count?: number, id?: string) => `<h2${id ? ` id="${escape(id)}"` : ''}>${escape(label)}${count !== undefined ? ` <span class="dim">(${count})</span>` : ''}</h2>`;

const tag = (value: string) => `<span class="tag ${escape(value)}">${escape(value)}</span>`;

const dim = (text: string) => `<span class="dim">${escape(text)}</span>`;

const empty = (content: string) => `<p class="empty">${content}</p>`;

const copyable = (value: string) => `<div class="token-row">
  <input type="text" class="token-display" value="${escape(value)}" readonly>
  <button type="button" class="copy" onclick="${copy_handler}">copy</button>
</div>`;

const banner = (variant: string, content: string) => `<div class="banner ${escape(variant)}">${content}</div>`;

const pagination = (label: string, page: number, pages: number, params: Record<string, number>) => {
  if (pages <= 1) return '';

  const page_url = (target: number) => {
    const query = Object.entries({ ...params, [`${label}_page`]: target }).map(([key, value]) => `${key}=${value}`).join('&');
    return `/admin?${query}#${label}`;
  };

  const prev = page > 1 ? `<a href="${page_url(page - 1)}">prev</a>` : '<span class="dim">prev</span>';
  const next = page < pages ? `<a href="${page_url(page + 1)}">next</a>` : '<span class="dim">next</span>';

  return `<div class="pagination">${prev} <span class="dim">page ${page} of ${pages}</span> ${next}</div>`;
};

export { banner, copyable, dim, empty, heading, pagination, tag };
