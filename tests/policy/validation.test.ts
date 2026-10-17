import { describe, expect, it } from 'vitest';
import { validate } from '../../src/policy';
import type { UploadPageType } from '../../src/types';

const MAX_BYTES = 2 * 1024 * 1024;
const MAX_PAGES = 50;

const single = (html: string) => ({ pages: [{ path: 'index.html', html }] });
const codes = async (html: string) => (await validate(single(html), MAX_BYTES, MAX_PAGES)).issues.map(issue => issue.code);

describe('validation policy', () => {
  it('accepts a valid document', async () => {
    const result = await validate(single('<!doctype html><html><head><title>Plan</title></head><body><h1>Hello</h1></body></html>'), MAX_BYTES, MAX_PAGES);

    expect(result.ok).toBe(true);
    expect(result.title).toBe('Plan');
  });

  it.each([
    ['empty document', '', 'empty'],
    ['whitespace document', '   ', 'empty'],
    ['nesting depth', '<div>'.repeat(513) + '</div>'.repeat(513), 'too-deep'],
    ['meta refresh', '<meta http-equiv="refresh" content="0;url=https://example.com">', 'meta-refresh'],
    ['form', '<form action="/submit"><input></form>', 'blocked-tag'],
    ['iframe', '<iframe src="https://example.com"></iframe>', 'blocked-tag'],
    ['external script', '<script src="https://example.com/a.js"></script>', 'external-script'],
    ['unknown script type', '<script type="text/babel">x</script>', 'script-type'],
    ['javascript url', '<a href=" java\tscript:alert(1)">x</a>', 'unsafe-url'],
    ['link rel', '<link rel="preload" href="https://example.com/a.js">', 'link-rel'],
    ['relative stylesheet', '<link rel="stylesheet" href="/style.css">', 'link-href'],
  ])('rejects %s', async (_, html, code) => {
    const result = await validate(single(html), MAX_BYTES, MAX_PAGES);

    expect(result.ok).toBe(false);
    expect(result.issues.map(issue => issue.code)).toContain(code);
  });

  it.each([
    ['event handler', '<div onclick="this.hidden = true"></div>'],
    ['json data block', '<script type="application/json">{"a": 1}</script>'],
    ['https stylesheet', '<link rel="stylesheet" href="https://example.com/style.css">'],
    ['css import', '<style>@import url("https://example.com/style.css");</style>'],
    ['scroll behavior', '<div style="scroll-behavior: smooth"></div>'],
    ['base href', '<base href="https://example.com/">'],
  ])('accepts %s', async (_, html) => {
    expect((await validate(single(html), MAX_BYTES, MAX_PAGES)).ok).toBe(true);
  });

  it('rejects a document exceeding the size limit', async () => {
    const result = await validate(single('<p>x</p>'), 1, MAX_PAGES);

    expect(result.ok).toBe(false);
    expect(result.issues.map(issue => issue.code)).toContain('too-large');
  });

  it('reports the first location and counts repeats', async () => {
    const result = await validate(single('<title>Plan</title>\n<form></form>\n<form></form>'), MAX_BYTES, MAX_PAGES);

    expect(result.issues[0]).toMatchObject({ level: 'error', code: 'blocked-tag', line: 2, column: 1, count: 2 });
    expect((await validate(single('<title>Plan</title><form></form><form></form>'), MAX_BYTES, MAX_PAGES)).errors[0]).toContain('(2 places)');
  });

  it('warns about browser APIs the sandbox blocks', async () => {
    expect(await codes('<title>Plan</title><script>localStorage.x = 1; fetch("/a");</script><button onclick="alert(1)">x</button>')).toEqual(['sandbox-storage', 'sandbox-network', 'sandbox-dialog']);
    expect(await codes('<title>Plan</title><script type="application/json">{"alert(": 1}</script>')).toEqual([]);
  });

  it('warns about relative assets', async () => {
    expect(await codes('<title>Plan</title><img src="chart.png"><img src="https://example.com/a.png"><img src="data:image/png;base64,AA">')).toEqual(['relative-asset']);
  });

  it('accepts an inline classic script and flags it', async () => {
    const result = await validate(single('<html><head><title>Plan</title></head><body><script>document.body.dataset.ready = "1";</script></body></html>'), MAX_BYTES, MAX_PAGES);

    expect(result.ok).toBe(true);
    expect(result.stats.has_inline_script).toBe(true);
  });

  it('accepts an inline module script', async () => {
    const result = await validate(single('<html><head><title>App</title></head><body><script type="module">const x = 1;</script></body></html>'), MAX_BYTES, MAX_PAGES);

    expect(result.ok).toBe(true);
    expect(result.stats.has_inline_script).toBe(true);
  });

  it('extracts unique sorted external image hosts', async () => {
    const result = await validate(single('<img src="https://B.example/a"><img src="https://a.example/b"><img src="https://b.example/c">'), MAX_BYTES, MAX_PAGES);

    expect(result.stats.external_image_hosts).toEqual(['a.example', 'b.example']);
  });

  it('validates folders and tags issues with their page', async () => {
    const result = await validate({ pages: [
      { path: 'index.html', html: '<title>Home</title><a href="about.html">about</a>' },
      { path: 'about.html', html: '<title>About</title><form></form>' },
    ] }, MAX_BYTES, MAX_PAGES);

    expect(result.title).toBe('Home');
    expect(result.pages.map(page => page.path)).toEqual(['index.html', 'about.html']);
    expect(result.issues).toEqual([expect.objectContaining({ path: 'about.html', code: 'blocked-tag' })]);
    expect(result.errors[0]).toMatch(/^about\.html line 1:21: /);
  });

  it.each([
    ['a missing index', [{ path: 'about.html', html: '<title>About</title>' }], 'missing-index'],
    ['a reserved root', [{ path: 'index.html', html: '<title>Home</title>' }, { path: 'raw/x.html', html: '<title>X</title>' }], 'page-path'],
    ['a duplicate path', [{ path: 'index.html', html: '<title>Home</title>' }, { path: 'index.html', html: '<title>Again</title>' }], 'page-path'],
    ['a deep path', [{ path: 'index.html', html: '<title>Home</title>' }, { path: 'a/b/c/d/e/f/g.html', html: '<title>G</title>' }], 'page-path'],
    ['a non html path', [{ path: 'index.html', html: '<title>Home</title>' }, { path: 'notes.txt', html: 'x' }], 'page-path'],
    ['a null page', [null], 'page-path'],
    ['a non string path', [{ path: 5, html: '<title>X</title>' }], 'page-path'],
  ])('rejects %s', async (_, pages, code) => {
    const result = await validate({ pages: pages as UploadPageType[] }, MAX_BYTES, MAX_PAGES);

    expect(result.ok).toBe(false);
    expect(result.issues.map(issue => issue.code)).toContain(code);
  });

  it('limits the page count and the total size', async () => {
    const pages = [{ path: 'index.html', html: '<title>Home</title>' }, { path: 'about.html', html: '<title>About</title>' }];

    expect((await validate({ pages }, MAX_BYTES, 1)).issues.map(issue => issue.code)).toContain('too-many-pages');
    expect((await validate({ pages }, 30, MAX_PAGES)).issues.map(issue => issue.code)).toContain('too-large');
  });

  it('warns about links that leave the draft or point to postplan routes', async () => {
    expect(await codes('<title>Plan</title><a href="/docs">a</a><a href="versions">b</a><a href="raw/">c</a><a href="docs/">d</a><a href="#top">e</a><a href="https://example.com">f</a>')).toEqual(['absolute-path', 'reserved-link', 'reserved-link']);
    expect(await codes('<title>Plan</title><base href="https://example.com/"><a href="/docs">a</a>')).toEqual([]);

    const nested = await validate({ pages: [
      { path: 'index.html', html: '<title>Home</title>' },
      { path: 'docs/index.html', html: '<title>Docs</title><a href="../index.html">a</a><a href="../../x.html">b</a>' },
    ] }, MAX_BYTES, MAX_PAGES);

    expect(nested.issues).toEqual([expect.objectContaining({ path: 'docs/index.html', code: 'absolute-path' })]);
  });

  it('normalizes the slug', async () => {
    const page = single('<title>Plan</title>');

    expect(await validate({ ...page, slug: '  My-Plan ' }, MAX_BYTES, MAX_PAGES)).toMatchObject({ ok: true, slug: 'my-plan' });
    expect((await validate(page, MAX_BYTES, MAX_PAGES)).slug).toBeUndefined();
    expect(await validate({ ...page, slug: null as unknown as string }, MAX_BYTES, MAX_PAGES)).toMatchObject({ ok: true, slug: undefined });
  });

  it('limits the description length', async () => {
    const page = single('<title>Plan</title>');

    expect((await validate({ ...page, description: `  ${'a'.repeat(1000)}  ` }, MAX_BYTES, MAX_PAGES)).ok).toBe(true);
    expect((await validate({ ...page, description: 'a'.repeat(1001) }, MAX_BYTES, MAX_PAGES)).errors).toEqual(['description is 1001 characters, the limit is 1000.']);
  });

  it.each(['my-plan', 'abc', 'a1b2c3', 'q3-roadmap-2026', 'a'.repeat(40)])('accepts the slug %s', async (slug) => {
    expect((await validate({ ...single('<title>Plan</title>'), slug }, MAX_BYTES, MAX_PAGES)).ok).toBe(true);
  });

  it.each([
    ['too short', 'ab', 'custom urls are 3-40 characters of a-z, 0-9, and inner hyphens.'],
    ['too long', 'a'.repeat(41), 'custom urls are 3-40 characters of a-z, 0-9, and inner hyphens.'],
    ['an underscore', 'my_plan', 'custom urls are 3-40 characters of a-z, 0-9, and inner hyphens.'],
    ['a leading hyphen', '-plan', 'custom urls are 3-40 characters of a-z, 0-9, and inner hyphens.'],
    ['a trailing hyphen', 'plan-', 'custom urls are 3-40 characters of a-z, 0-9, and inner hyphens.'],
    ['a blank value', '   ', 'custom urls are 3-40 characters of a-z, 0-9, and inner hyphens.'],
    ['a non string value', 5 as unknown as string, 'custom urls are 3-40 characters of a-z, 0-9, and inner hyphens.'],
    ['a punycode prefix', 'xn--plan', 'custom urls cannot have hyphens as the third and fourth characters.'],
    ['the draft id length', 'abcdef-ghijk', 'custom urls cannot be 12 characters, that is the draft id length.'],
    ['a reserved name', 'Admin', '"admin" is reserved.'],
  ])('rejects a slug with %s', async (_, slug, message) => {
    const result = await validate({ ...single('<title>Plan</title>'), slug }, MAX_BYTES, MAX_PAGES);

    expect(result.ok).toBe(false);
    expect(result.issues).toEqual([expect.objectContaining({ code: 'slug', level: 'error', message })]);
  });

  it('reports a missing title as a warning', async () => {
    const result = await validate(single('<p>Plan</p>'), MAX_BYTES, MAX_PAGES);

    expect(result.ok).toBe(true);
    expect(result.warnings).toContain('no <title> found, a generic title will be used.');
  });
});
