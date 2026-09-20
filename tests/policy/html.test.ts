import { describe, expect, it } from 'vitest';
import { validate } from '../../src/policy';

describe('html policy', () => {
  it('accepts a valid document', () => {
    const result = validate('<!doctype html><html><head><title>Plan</title></head><body><h1>Hello</h1></body></html>');

    expect(result.ok).toBe(true);
    expect(result.title).toBe('Plan');
  });

  it.each([
    ['form tag', '<form action="/capture"></form>'],
    ['iframe tag', '<iframe src="https://example.com"></iframe>'],
    ['external script source', '<script src="https://example.com/a.js"></script>'],
    ['importmap script', '<script type="importmap">{"imports":{}}</script>'],
    ['event handler', '<div onclick="alert(1)"></div>'],
    ['javascript URL', '<a href="javascript:alert(1)">x</a>'],
    ['meta refresh', '<meta http-equiv="refresh" content="0;url=https://evil.example">'],
  ])('rejects %s', (_, html) => {
    expect(validate(html).ok).toBe(false);
  });

  it('accepts an inline classic script and flags it', () => {
    const result = validate('<html><head><title>Plan</title></head><body><script>document.body.dataset.ready = "1";</script></body></html>');

    expect(result.ok).toBe(true);
    expect(result.stats.has_inline_script).toBe(true);
  });

  it('accepts an inline module script', () => {
    const result = validate('<html><head><title>App</title></head><body><script type="module">const x = 1;</script></body></html>');

    expect(result.ok).toBe(true);
    expect(result.stats.has_inline_script).toBe(true);
  });

  it('extracts unique sorted external image hosts', () => {
    const result = validate('<img src="https://B.example/a"><img src="https://a.example/b"><img src="https://b.example/c">');

    expect(result.stats.external_image_hosts).toEqual(['a.example', 'b.example']);
  });

  it('reports a missing title as a warning', () => {
    const result = validate('<p>Plan</p>');

    expect(result.ok).toBe(true);
    expect(result.warnings).toContain('no <title> found, a generic title will be used.');
  });
});
