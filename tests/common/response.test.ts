import { describe, expect, it } from 'vitest';
import { cspify, responsify } from '../../src/common';

describe('responsify', () => {
  it('returns JSON with default headers', async () => {
    const response = responsify({ status: 201, body: { ok: true } });

    expect(response.status).toBe(201);
    expect(response.headers.get('content-type')).toBe('application/json');
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    await expect(response.json()).resolves.toEqual({ ok: true });
  });

  it('returns cached HTML with the supplied policy', async () => {
    const response = responsify({ html: '<h1>Plan</h1>' }, { cache: true, csp: 'default-src \'none\'' });

    expect(response.headers.get('cache-control')).toBe('public, max-age=300');
    expect(response.headers.get('content-security-policy')).toBe('default-src \'none\'');
    await expect(response.text()).resolves.toBe('<h1>Plan</h1>');
  });

  it('sets COOP only when asked', () => {
    expect(responsify({ html: 'x' }).headers.get('cross-origin-opener-policy')).toBeNull();
    expect(responsify({ html: 'x' }, { coop: true }).headers.get('cross-origin-opener-policy')).toBe('same-origin');
  });
});

describe('cspify', () => {
  it('locks the policy down when the document has no script', async () => {
    const policy = await cspify('<h1>Plan</h1>');

    expect(policy).toContain('script-src \'none\'');
    expect(policy).toContain('default-src \'none\'');
    expect(policy).toContain('connect-src \'none\'');
    expect(policy).toContain('form-action \'none\'');
  });

  it('admits each inline script by hash and never by unsafe-inline', async () => {
    const policy = await cspify('<script>alert(1)</script>');
    const script_src = policy.split('; ').find(directive => directive.startsWith('script-src')) ?? '';

    expect(script_src).toBe('script-src \'sha256-bhHHL3z2vDgxUt0W3dWQOrprscmda2Y5pLsLg4GF+pI=\'');
    expect(script_src).not.toContain('unsafe-inline');
  });

  it('hashes the text the browser hashes, not the raw bytes', async () => {
    const lf = await cspify('<script>\nvar a = 1;\n</script>');
    const crlf = await cspify('<script>\r\nvar a = 1;\r\n</script>');

    expect(crlf).toBe(lf);
  });

  it('does not hash markup quoted inside a comment', async () => {
    const policy = await cspify('<!-- <script>alert(1)</script> --><p>ok</p>');

    expect(policy).toContain('script-src \'none\'');
  });
});
