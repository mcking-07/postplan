import { exports } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';
import { hash } from '../../src/common';
import { create_repositories } from '../setup';

const create_key = async (email: string) => {
  const { accounts, keys } = create_repositories();
  const [account_error, account_id] = await accounts.create({ email, role: 'member' });
  if (account_error) throw account_error;
  if (!account_id) throw new Error('failed to create account');
  const token = `pp_routes_${email}`;
  const [key_error, key_id] = await keys.create({ account_id, name: 'routes', key_hash: await hash(token) });
  if (key_error) throw key_error;
  if (!key_id) throw new Error('failed to create key');
  return { account_id, key_id, token };
};

describe('worker routes', () => {
  it('serves health and public entry routes', async () => {
    const health = await exports.default.fetch('http://localhost/healthz');
    expect(health.status).toBe(200);
    await expect(health.json()).resolves.toMatchObject({ status: 'healthy' });

    const home = await exports.default.fetch('http://localhost/');
    expect(home.status).toBe(200);
    expect(home.headers.get('content-type')).toContain('text/html');

    const well_known = await exports.default.fetch('http://localhost/.well-known/appspecific/com.chrome.devtools.json');
    expect(well_known.status).toBe(204);
  });

  it('rejects malformed and invalid upload requests', async () => {
    const { token } = await create_key('invalid-upload@example.com');
    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

    const malformed = await exports.default.fetch('http://localhost/api/uploads', { method: 'POST', headers, body: '{' });
    expect(malformed.status).toBe(400);
    await expect(malformed.json()).resolves.toEqual({ ok: false, code: 'BAD_REQUEST', error: 'invalid request body.' });

    const missing_html = await exports.default.fetch('http://localhost/api/uploads', { method: 'POST', headers, body: JSON.stringify({ filename: 'plan.html' }) });
    expect(missing_html.status).toBe(400);
    await expect(missing_html.json()).resolves.toEqual({ ok: false, code: 'BAD_REQUEST', error: 'missing html field.' });

    const blocked = await exports.default.fetch('http://localhost/api/uploads', { method: 'POST', headers, body: JSON.stringify({ html: '<script>alert(1)</script>' }) });
    expect(blocked.status).toBe(422);
    await expect(blocked.json()).resolves.toEqual({ ok: false, code: 'VALIDATION_FAILED', error: 'html validation failed.', errors: ['blocked <script> tag.'], warnings: ['no <title> found, a generic title will be used.'] });

    const inline_event = await exports.default.fetch('http://localhost/api/uploads', { method: 'POST', headers, body: JSON.stringify({ html: '<div onclick="alert(1)">Plan</div>' }) });
    expect(inline_event.status).toBe(422);
    await expect(inline_event.json()).resolves.toMatchObject({ ok: false, code: 'VALIDATION_FAILED', errors: ['blocked inline event handler: onclick.'] });
  });

  it('deletes only an owned draft and hides it publicly', async () => {
    const owner = await create_key('delete-owner@example.com');
    const other = await create_key('delete-other@example.com');
    const html = '<html><head><title>Delete me</title></head><body>content</body></html>';
    const upload = await exports.default.fetch('http://localhost/api/uploads', { method: 'POST', headers: { Authorization: `Bearer ${owner.token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ html }) });
    expect(upload.status).toBe(201);
    const created = await upload.json() as { draftId: string; publicUrl: string };

    const forbidden = await exports.default.fetch(`http://localhost/api/drafts/${created.draftId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${other.token}` } });
    expect(forbidden.status).toBe(404);

    const removed = await exports.default.fetch(`http://localhost/api/drafts/${created.draftId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${owner.token}` } });
    expect(removed.status).toBe(200);

    const public_response = await exports.default.fetch(created.publicUrl);
    expect(public_response.status).toBe(404);
  });

  it('lists only the authenticated account drafts', async () => {
    const first = await create_key('list-first@example.com');
    const second = await create_key('list-second@example.com');
    const html = '<html><head><title>Listed</title></head><body>content</body></html>';
    await exports.default.fetch('http://localhost/api/uploads', { method: 'POST', headers: { Authorization: `Bearer ${first.token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ html }) });

    const response = await exports.default.fetch('http://localhost/api/drafts', { headers: { Authorization: `Bearer ${second.token}` } });
    expect(response.status).toBe(200);
    const body = await response.json() as { drafts: unknown[] };
    expect(body.drafts).toHaveLength(0);
  });
});
