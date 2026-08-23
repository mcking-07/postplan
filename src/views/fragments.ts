import { escape } from './helpers';

const copy_handler = 'navigator.clipboard.writeText(this.previousElementSibling.value).then(() => { this.textContent = \'copied\'; setTimeout(() => this.textContent = \'copy\', 2000) })';

const heading = (label: string, count?: number) => `<h2>${escape(label)}${count !== undefined ? ` <span class="dim">(${count})</span>` : ''}</h2>`;

const tag = (value: string) => `<span class="tag ${escape(value)}">${escape(value)}</span>`;

const dim = (text: string) => `<span class="dim">${escape(text)}</span>`;

const empty = (content: string) => `<p class="empty">${content}</p>`;

const copyable = (value: string) => `<div class="token-row">
  <input type="text" class="token-display" value="${escape(value)}" readonly>
  <button type="button" class="copy" onclick="${copy_handler}">copy</button>
</div>`;

const banner = (variant: string, content: string) => `<div class="banner ${escape(variant)}">${content}</div>`;

export { banner, copyable, dim, empty, heading, tag };
