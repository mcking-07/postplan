import * as parse5 from 'parse5';
import { hash, safe } from '../common';
import type { PolicyIssueLevelType, PolicyIssueRegistryType, PolicyIssueType, PolicyNodeType, PolicyReportOptionsType, ValidatedPageType, ValidationContextType, ValidationInputType, ValidationResultType, WalkerEntryType } from '../types';

const MAX_DEPTH = 512;
const MAX_PATH_LENGTH = 200;
const MAX_PATH_SEGMENTS = 6;
const MAX_DESCRIPTION_LENGTH = 1000;

const PATH_SEGMENT = /^[A-Za-z0-9_-][A-Za-z0-9._-]*$/;
const RESERVED_ROOTS = new Set(['v', 'raw', 'version', 'versions', 'api', 'healthz', 'favicon.ico', 'favicon.png', 'favicon.svg']);

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/;
const DRAFT_ID_LENGTH = 12;
const RESERVED_SLUGS = new Set([
  'admin', 'api', 'app', 'assets', 'auth', 'blog', 'cdn', 'cli', 'd', 'dashboard', 'docs', 'files', 'help', 'login', 'mail', 'postplan', 'raw', 'signin', 'static', 'status', 'support', 'www',
]);

const BLOCKED_TAGS = new Map<string, string>([
  ['form', 'forms cannot submit. use inputs without a <form> wrapper.'],
  ['iframe', 'frames do not load. link to the page with <a target="_blank"> instead.'],
  ...['object', 'embed', 'applet'].map((tag): [string, string] => [tag, 'plugins do not load. use <img>, <video>, or <audio> with an https url, or link to the file.']),
]);
const ASSET_TAGS = new Set(['img', 'video', 'audio', 'source', 'track']);
const LINK_TAGS = new Set(['a', 'area']);
const LINK_RELS = new Set(['stylesheet', 'alternate', 'icon', 'shortcut', 'apple-touch-icon', 'preconnect', 'dns-prefetch']);

const EXECUTABLE_SCRIPT_TYPES = new Set(['', 'text/javascript', 'application/javascript', 'module']);
const DATA_SCRIPT_TYPES = new Set(['application/json', 'application/ld+json', 'text/plain', 'text/template', 'text/html', 'text/markdown', 'text/csv']);

const SANDBOX_APIS = [
  { code: 'sandbox-storage', pattern: /\b(localStorage|sessionStorage|indexedDB)\b/, message: 'scripts use browser storage, which throws in the sandbox.', fix: 'keep state in memory or in location.hash.' },
  { code: 'sandbox-cookie', pattern: /\bdocument\.cookie\b/, message: 'scripts use document.cookie, which throws in the sandbox.', fix: 'keep state in memory or in location.hash.' },
  { code: 'sandbox-network', pattern: /\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\b|\bEventSource\b/, message: 'scripts make network requests, which the sandbox blocks.', fix: 'inline the data in a <script type="application/json"> block.' },
  { code: 'sandbox-dialog', pattern: /\b(alert|confirm|prompt)\s*\(/, message: 'scripts use alert, confirm, or prompt, which do nothing in the sandbox.', fix: 'show messages in the page instead.' },
  { code: 'sandbox-worker', pattern: /\bnew\s+(Shared)?Worker\b/, message: 'scripts start workers, which the sandbox blocks.', fix: 'run the code on the main thread.' },
];

const URL_ATTRIBUTES = new Set(['href', 'src', 'action', 'formaction', 'poster', 'xlink:href']);
const BLOCKED_PROTOCOLS = ['javascript:', 'vbscript:', 'file:'];

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

const is_local = (value?: string) => !!value && !value.startsWith('#') && !/^(https?:|data:|blob:|\/\/)/i.test(value);

const format = ({ path, line, column, message, count, fix }: PolicyIssueType) => {
  const location = [path, line ? `line ${line}:${column}` : undefined].filter(Boolean).join(' ');
  const places = count > 1 ? ` (${count} places)` : '';

  return `${location ? `${location}: ` : ''}${message}${places}${fix ? ` fix: ${fix}` : ''}`;
};

const report = (issues: PolicyIssueRegistryType, level: PolicyIssueLevelType, code: string, message: string, { node, attribute, fix }: PolicyReportOptionsType = {}) => {
  const key = `${level}:${code}:${message}`;

  const existing = issues.get(key);
  if (existing) {
    existing.count += 1;
    return;
  }

  const location = node?.sourceCodeLocation;
  const start = (attribute ? location?.attrs?.[attribute] : undefined) ?? location;

  issues.set(key, { level, code, message, fix, line: start?.startLine, column: start?.startCol, count: 1 });
};

const scan = (context: ValidationContextType, issues: PolicyIssueRegistryType, node: PolicyNodeType, text: string, attribute?: string) => {
  context.has_inline_script = true;

  for (const { code, pattern, message, fix } of SANDBOX_APIS) {
    if (pattern.test(text)) report(issues, 'warning', code, message, { node, attribute, fix });
  }
};

const check_path = (path: string, seen: Set<string>) => {
  const segments = path.split('/');

  if (path.length > MAX_PATH_LENGTH || segments.length > MAX_PATH_SEGMENTS) return `page path "${path}" is too long.`;
  if (!path.endsWith('.html') || !segments.every(segment => PATH_SEGMENT.test(segment))) return `page path "${path}" must be a relative .html path of letters, numbers, ".", "_", and "-".`;

  const [first_segment = ''] = segments;
  const root = first_segment.replace(/\.html$/, '').toLowerCase();
  if (RESERVED_ROOTS.has(root)) return `page path "${path}" uses the reserved name "${root}".`;

  return seen.has(path) ? `page path "${path}" appears twice.` : undefined;
};

const normalize_slug = (slug: unknown) => {
  if (slug === undefined || slug === null) return undefined;

  return typeof slug === 'string' ? slug.trim().toLowerCase() : '';
};

const check_slug = (slug?: string) => {
  if (slug === undefined) return undefined;
  if (!SLUG_PATTERN.test(slug)) return 'custom urls are 3-40 characters of a-z, 0-9, and inner hyphens.';
  if (slug.slice(2, 4) === '--') return 'custom urls cannot have hyphens as the third and fourth characters.';
  if (slug.length === DRAFT_ID_LENGTH) return `custom urls cannot be ${DRAFT_ID_LENGTH} characters, that is the draft id length.`;

  return RESERVED_SLUGS.has(slug) ? `"${slug}" is reserved.` : undefined;
};

const inspect = (source: string, path: string, hosts: Set<string>) => {
  const context: ValidationContextType = { has_inline_script: false, title: undefined, too_deep: false, has_base: false, links: [] };
  const issues: PolicyIssueRegistryType = new Map();

  if (!source.trim()) report(issues, 'error', 'empty', 'html document is empty.');
  const size = new TextEncoder().encode(source).byteLength;

  const [error, document] = safe(() => parse5.parse(source, { scriptingEnabled: false, sourceCodeLocationInfo: true }) as PolicyNodeType)();
  if (error || !document) report(issues, 'error', 'parse-failed', 'html document could not be parsed.');

  const stack: WalkerEntryType[] = document ? [{ node: document, depth: 0 }] : [];

  while (stack.length) {
    const entry = stack.pop();
    if (!entry) break;

    const { node, depth } = entry;
    const tag = node.tagName?.toLowerCase();

    if (tag) {
      const values = new Map(attrs(node).map(({ name, value }) => [name.toLowerCase(), value.trim()]));

      const blocked = BLOCKED_TAGS.get(tag);
      if (blocked) report(issues, 'error', 'blocked-tag', `blocked <${tag}> tag.`, { node, fix: blocked });

      if (tag === 'script') {
        const type = (values.get('type') ?? '').toLowerCase();

        if (values.has('src')) report(issues, 'error', 'external-script', 'external script sources are not allowed.', { node, fix: 'inline the code in a <script> block.' });

        if (EXECUTABLE_SCRIPT_TYPES.has(type)) scan(context, issues, node, collect_text(node));
        else if (!DATA_SCRIPT_TYPES.has(type)) report(issues, 'error', 'script-type', `unsupported script type "${type}".`, { node, fix: 'use a classic or type="module" inline script, or type="application/json" for data.' });
      }

      if (tag === 'link') {
        const rels = (values.get('rel') ?? '').toLowerCase().split(/\s+/).filter(Boolean);
        const rel = rels.find(candidate => !LINK_RELS.has(candidate));

        if (!rels.length || rel) report(issues, 'error', 'link-rel', `<link rel="${rel ?? ''}"> is not allowed.`, { node, fix: 'only stylesheet, icon, and preconnect links are allowed.' });
        else if (!/^https:\/\//i.test(values.get('href') ?? '')) report(issues, 'error', 'link-href', 'linked stylesheets and icons must use https urls.', { node, fix: 'inline the css in a <style> block, or host the file and use its https url.' });
      }

      if (ASSET_TAGS.has(tag)) {
        const srcset = (values.get('srcset') ?? '').split(/,\s+/).map(candidate => ['srcset', candidate.trim().split(/\s+/)[0]]);
        const references = [['src', values.get('src')], ['poster', values.get('poster')], ...srcset];

        for (const [attribute, value] of references) {
          if (is_local(value)) report(issues, 'warning', 'relative-asset', `"${value}" will not load, only html pages are hosted.`, { node, attribute, fix: 'host the file elsewhere and use its https url, or inline it as a data: url.' });
        }
      }

      for (const { name, value } of attrs(node)) {
        const attribute = name.toLowerCase();
        const normalized = URL_ATTRIBUTES.has(attribute) ? value.replace(/[\s\p{Cc}]+/gu, '').toLowerCase() : '';

        const unsafe = BLOCKED_PROTOCOLS.some(protocol => normalized.startsWith(protocol));

        if (attribute.startsWith('on')) scan(context, issues, node, value, name);
        if (unsafe) report(issues, 'error', 'unsafe-url', `blocked unsafe url in "${attribute}" attribute.`, { node, attribute: name, fix: 'use an https link, or an event listener added from a <script> block.' });
      }

      if (LINK_TAGS.has(tag) && values.has('href')) context.links.push({ node, attribute: 'href', value: values.get('href') ?? '' });

      if (tag === 'base' && values.has('href')) context.has_base = true;
      if (tag === 'meta' && values.get('http-equiv')?.toLowerCase() === 'refresh') report(issues, 'error', 'meta-refresh', 'blocked meta refresh tag.', { node, fix: 'use a normal link.' });

      if (tag === 'img') {
        const host = external_host(values.get('src'));
        if (host) hosts.add(host);
      }

      if (tag === 'title' && !context.title) {
        const text = collect_text(node).trim().slice(0, 140);
        if (text) context.title = text;
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

  if (context.too_deep) report(issues, 'error', 'too-deep', `html is nested more than ${MAX_DEPTH} levels deep.`);
  if (source.trim() && !context.title) report(issues, 'warning', 'no-title', 'no <title> found, a generic title will be used.');

  const links = context.has_base ? [] : context.links;

  for (const { node, attribute, value } of links) {
    if (!value || /^(#|\/\/|[a-z][a-z0-9+.-]*:)/i.test(value)) continue;

    const [url_error, url] = safe(() => new URL(value, `https://draft.invalid/d/draft/${path}`))();
    if (url_error || !url) continue;

    if (!url.pathname.startsWith('/d/draft/')) {
      report(issues, 'warning', 'absolute-path', `"${value}" leaves the draft.`, { node, attribute, fix: 'use a relative path such as "docs/".' });
      continue;
    }

    const [root = ''] = url.pathname.slice('/d/draft/'.length).split('/');
    if (RESERVED_ROOTS.has(root.replace(/\.html$/, '').toLowerCase())) report(issues, 'warning', 'reserved-link', `"${value}" points to a postplan route, not a page.`, { node, attribute, fix: 'link to a page in this upload.' });
  }

  return { issues, html: source, title: context.title, bytes: size, has_inline_script: context.has_inline_script };
};

const validate = async (input: ValidationInputType, max_bytes: number, max_pages: number): Promise<ValidationResultType> => {
  const { pages } = input;

  const hosts = new Set<string>();
  const seen = new Set<string>();

  const issues: PolicyIssueRegistryType = new Map();
  const results: ValidatedPageType[] = [];

  if (pages.length > max_pages) report(issues, 'error', 'too-many-pages', `upload has ${pages.length} pages, the limit is ${max_pages}.`);

  for (const { path, html } of pages.map(page => page ?? {})) {
    if (typeof path !== 'string' || !path) {
      report(issues, 'error', 'page-path', 'page path is missing.');
      continue;
    }

    const path_error = check_path(path, seen);
    if (path_error) {
      report(issues, 'error', 'page-path', path_error);
      continue;
    }

    seen.add(path);
    const source = typeof html === 'string' ? html : '';

    const { issues: found, ...page } = inspect(source, path, hosts);
    for (const [key, issue] of found) issues.set(`${path}:${key}`, pages.length > 1 ? { path, ...issue } : issue);

    results.push({ path, ...page, content_hash: await hash(page.html) });
  }

  if (pages.length && !seen.has('index.html')) report(issues, 'error', 'missing-index', 'uploads need an index.html page.');

  const bytes = results.reduce((total, page) => total + page.bytes, 0);
  if (bytes > max_bytes) report(issues, 'error', 'too-large', `html is ${bytes} bytes, the limit for this upload is ${max_bytes} bytes.`);

  const slug = normalize_slug(input.slug);

  const slug_error = check_slug(slug);
  if (slug_error) report(issues, 'error', 'slug', slug_error);

  const description = typeof input.description === 'string' ? input.description.trim() : '';
  if (description.length > MAX_DESCRIPTION_LENGTH) report(issues, 'error', 'description', `description is ${description.length} characters, the limit is ${MAX_DESCRIPTION_LENGTH}.`);

  const reported = [...issues.values()];

  return {
    ok: !reported.some(issue => issue.level === 'error'),
    errors: reported.filter(issue => issue.level === 'error').map(format),
    warnings: reported.filter(issue => issue.level === 'warning').map(format),
    issues: reported,
    pages: results,
    title: results.find(page => page.path === 'index.html')?.title,
    slug: slug_error ? undefined : slug,
    bytes,
    stats: { has_inline_script: results.some(page => page.has_inline_script), external_image_hosts: [...hosts].sort() },
  };
};

export { validate };
