import { describe, expect, it } from 'vitest';
import { responsify } from '../../src/common';

describe('responsify', () => {
  it('returns JSON with default headers', async () => {
    const response = responsify({ status: 201, body: { ok: true } });

    expect(response.status).toBe(201);
    expect(response.headers.get('content-type')).toBe('application/json');
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    await expect(response.json()).resolves.toEqual({ ok: true });
  });

  it('returns cached HTML with CSP', async () => {
    const response = responsify({ html: '<h1>Plan</h1>' }, { cache: true, csp: true });

    expect(response.headers.get('cache-control')).toBe('public, max-age=300');
    expect(response.headers.get('content-security-policy')).toContain('script-src \'none\'');
    await expect(response.text()).resolves.toBe('<h1>Plan</h1>');
  });
});
