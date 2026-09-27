import * as parse5 from 'parse5';
import { safe } from '../common';
import type { PolicyNodeType, ValidationContextType, ValidationResultType, WalkerEntryType } from '../types';

const MAX_DEPTH = 512;

const attrs = (node: PolicyNodeType) => node.attrs ?? [];
const children = (node: PolicyNodeType) => node.childNodes ?? [];

const collect_text = (node: PolicyNodeType): string => {
  const parts: string[] = [];

  for (const child of children(node)) {
    if (child.nodeName === '#text') parts.push(child.value ?? '');
    parts.push(collect_text(child));
  }

  return parts.join('');
};

const external_host = (value?: string): string | undefined => {
  if (!value) return undefined;

  const raw = value.trim();
  if (!raw) return undefined;

  const candidate = raw.startsWith('//') ? `https:${raw}` : raw;
  const [error, url] = safe(() => new URL(candidate))();
  if (error || !url) return undefined;

  return (url.protocol === 'http:' || url.protocol === 'https:') ? url.hostname.toLowerCase() : undefined;
};

const check_meta_refresh = (node: PolicyNodeType): boolean => {
  const http_equiv = attrs(node).find(a => a.name.toLowerCase() === 'http-equiv');
  return http_equiv?.value.trim().toLowerCase() === 'refresh';
};

const empty_result = (errors: string[]): ValidationResultType => ({
  ok: false, errors, warnings: [], stats: { has_inline_script: false, external_image_hosts: [] },
});

const validate = (html: string, max_bytes: number): ValidationResultType => {
  if (typeof html !== 'string' || !html.trim()) return empty_result(['empty html document.']);

  const errors: string[] = [];
  const warnings: string[] = [];

  const hosts = new Set<string>();
  const context: ValidationContextType = { has_inline_script: false, title: undefined, too_deep: false };

  const size = new TextEncoder().encode(html).byteLength;
  if (size > max_bytes) errors.push(`html document is ${size} bytes, maximum allowed is ${max_bytes}.`);

  const [error, document] = safe(() => parse5.parse(html, { scriptingEnabled: false }) as PolicyNodeType)();
  if (error || !document) return empty_result([...errors, 'html document could not be parsed.']);

  const stack: WalkerEntryType[] = [{ node: document, depth: 0 }];

  while (stack.length) {
    const entry = stack.pop();
    if (!entry) break;

    const { node, depth } = entry;
    const tag = node.tagName?.toLowerCase();

    if (tag) {
      if (tag === 'script') context.has_inline_script = true;

      if (tag === 'title' && !context.title) {
        const text = collect_text(node).trim().slice(0, 140);
        if (text) context.title = text;
      }

      if (tag === 'meta' && check_meta_refresh(node)) errors.push('blocked meta refresh.');

      if (tag === 'img') {
        const src = attrs(node).find(attribute => attribute.name.toLowerCase() === 'src');
        const host = external_host(src?.value);
        if (host) hosts.add(host);
      }
    }

    if (depth >= MAX_DEPTH) {
      context.too_deep = true;
      continue;
    }

    for (const child of [...children(node)].reverse()) {
      stack.push({ node: child, depth: depth + 1 });
    }
  }

  if (context.too_deep) errors.push(`html exceeds maximum nesting depth of ${MAX_DEPTH}.`);
  if (!context.title) warnings.push('no <title> found, a generic title will be used.');

  return {
    ok: errors.length === 0,
    errors: [...new Set(errors)],
    warnings: [...new Set(warnings)],
    title: context.title,
    stats: { has_inline_script: context.has_inline_script, external_image_hosts: [...hosts].sort() },
  };
};

export { validate };
