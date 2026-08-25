import { describe, expect, it } from 'vitest';
import { validate } from '../../src/policy';

describe('html policy', () => {
  it('accepts a valid static document', () => {
    const result = validate('<!doctype html><html><head><title>Plan</title></head><body><h1>Hello</h1></body></html>');

    expect(result.ok).toBe(true);
    expect(result.title).toBe('Plan');
  });

  it.each([
    ['script tag', '<script>alert(1)</script>'],
    ['form tag', '<form action="/capture"></form>'],
    ['event handler', '<div onclick="alert(1)"></div>'],
    ['javascript URL', '<a href="javascript:alert(1)">x</a>'],
    ['meta refresh', '<meta http-equiv="refresh" content="0;url=https://evil.example">'],
  ])('rejects %s', (_, html) => {
    expect(validate(html).ok).toBe(false);
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
