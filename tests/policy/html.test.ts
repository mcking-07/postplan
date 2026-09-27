import { describe, expect, it } from 'vitest';
import { validate } from '../../src/policy';

const MAX_BYTES = 2 * 1024 * 1024;

describe('html policy', () => {
  it('accepts a valid document', () => {
    const result = validate('<!doctype html><html><head><title>Plan</title></head><body><h1>Hello</h1></body></html>', MAX_BYTES);

    expect(result.ok).toBe(true);
    expect(result.title).toBe('Plan');
  });

  it.each([
    ['empty document', ''],
    ['whitespace document', '   '],
    ['nesting depth', '<div>'.repeat(513) + '</div>'.repeat(513)],
    ['meta refresh', '<meta http-equiv="refresh" content="0;url=https://example.com">'],
  ])('rejects %s', (_, html) => {
    expect(validate(html, MAX_BYTES).ok).toBe(false);
  });

  it.each([
    ['form', '<form action="/submit"><input></form>'],
    ['iframe', '<iframe src="https://example.com"></iframe>'],
    ['external script', '<script src="https://example.com/a.js"></script>'],
    ['event handler', '<div onclick="alert(1)"></div>'],
    ['javascript url', '<a href="javascript:alert(1)">x</a>'],
    ['css import', '<style>@import url("https://example.com/style.css");</style>'],
    ['inline style', '<div style="scroll-behavior: smooth"></div>'],
  ])('accepts %s (covered by csp)', (_, html) => {
    expect(validate(html, MAX_BYTES).ok).toBe(true);
  });

  it('rejects a document exceeding the size limit', () => {
    const result = validate('<p>x</p>', 1);

    expect(result.ok).toBe(false);
  });

  it('accepts an inline classic script and flags it', () => {
    const result = validate('<html><head><title>Plan</title></head><body><script>document.body.dataset.ready = "1";</script></body></html>', MAX_BYTES);

    expect(result.ok).toBe(true);
    expect(result.stats.has_inline_script).toBe(true);
  });

  it('accepts an inline module script', () => {
    const result = validate('<html><head><title>App</title></head><body><script type="module">const x = 1;</script></body></html>', MAX_BYTES);

    expect(result.ok).toBe(true);
    expect(result.stats.has_inline_script).toBe(true);
  });

  it('extracts unique sorted external image hosts', () => {
    const result = validate('<img src="https://B.example/a"><img src="https://a.example/b"><img src="https://b.example/c">', MAX_BYTES);

    expect(result.stats.external_image_hosts).toEqual(['a.example', 'b.example']);
  });

  it('reports a missing title as a warning', () => {
    const result = validate('<p>Plan</p>', MAX_BYTES);

    expect(result.ok).toBe(true);
    expect(result.warnings).toContain('no <title> found, a generic title will be used.');
  });
});
