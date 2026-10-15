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

  it('returns cached HTML', async () => {
    const response = responsify({ html: '<h1>Plan</h1>' }, { cache: true });

    expect(response.headers.get('cache-control')).toBe('public, max-age=300');
    await expect(response.text()).resolves.toBe('<h1>Plan</h1>');
  });

  it('sets COOP only when asked', () => {
    expect(responsify({ html: 'x' }).headers.get('cross-origin-opener-policy')).toBeNull();
    expect(responsify({ html: 'x' }, { coop: true }).headers.get('cross-origin-opener-policy')).toBe('same-origin');
  });

  it('sets CSP only when asked', () => {
    expect(responsify({ html: 'x' }).headers.get('content-security-policy')).toBeNull();
    expect(responsify({ html: 'x' }, { csp: true }).headers.get('content-security-policy')).toContain('default-src \'none\'');
  });

  it('sandboxes drafts without network, forms, or frames', () => {
    const policy = responsify({ html: 'x' }, { csp: true }).headers.get('content-security-policy');

    expect(policy).toContain('sandbox allow-scripts allow-popups allow-popups-to-escape-sandbox allow-downloads');
    expect(policy).not.toContain('allow-same-origin');
    expect(policy).toContain('connect-src \'none\'');
    expect(policy).toContain('form-action \'none\'');
    expect(policy).toContain('frame-src \'none\'');
  });
});
