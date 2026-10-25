import { env, exports } from 'cloudflare:workers';
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
    expect(missing_html.status).toBe(422);
    await expect(missing_html.json()).resolves.toMatchObject({ ok: false, code: 'VALIDATION_FAILED', issues: [{ code: 'empty' }] });

    const empty_files = await exports.default.fetch('http://localhost/api/uploads', { method: 'POST', headers, body: JSON.stringify({ files: [] }) });
    expect(empty_files.status).toBe(422);
    await expect(empty_files.json()).resolves.toMatchObject({ ok: false, code: 'VALIDATION_FAILED', errors: ['html document is empty.'] });

    const invalid_files = await exports.default.fetch('http://localhost/api/uploads', { method: 'POST', headers, body: JSON.stringify({ files: 'index.html' }) });
    expect(invalid_files.status).toBe(422);
    await expect(invalid_files.json()).resolves.toMatchObject({ ok: false, code: 'VALIDATION_FAILED', errors: ['html document is empty.'] });

    const all_problems = await exports.default.fetch('http://localhost/api/uploads', { method: 'POST', headers, body: JSON.stringify({ html: '<title>Plan</title><form></form>', slug: 'admin', description: 'x'.repeat(1001) }) });
    expect(all_problems.status).toBe(422);
    await expect(all_problems.json()).resolves.toMatchObject({
      errors: [expect.stringContaining('blocked <form> tag'), '"admin" is reserved.', 'description is 1001 characters, the limit is 1000.'],
    });

    const with_iframe = await exports.default.fetch('http://localhost/api/uploads', { method: 'POST', headers, body: JSON.stringify({ html: '<iframe src="https://evil.example"></iframe>' }) });
    expect(with_iframe.status).toBe(422);
    await expect(with_iframe.json()).resolves.toMatchObject({ issues: [{ code: 'blocked-tag' }, { code: 'no-title' }] });

    const accepted = await exports.default.fetch('http://localhost/api/uploads', { method: 'POST', headers, body: JSON.stringify({ html: '<html><head><title>Scripted</title></head><body><script>document.title = "x";</script></body></html>' }) });
    expect(accepted.status).toBe(201);

    const inline_event = await exports.default.fetch('http://localhost/api/uploads', { method: 'POST', headers, body: JSON.stringify({ html: '<div onclick="alert(1)">Plan</div>' }) });
    expect(inline_event.status).toBe(201);

    const oversized = await exports.default.fetch('http://localhost/api/uploads', { method: 'POST', headers, body: JSON.stringify({ html: 'x'.repeat(10 * 1024 * 1024) }) });
    expect(oversized.status).toBe(413);
    await expect(oversized.json()).resolves.toMatchObject({ ok: false, code: 'PAYLOAD_TOO_LARGE', error: 'upload is too large.' });

    const oversized_check = await exports.default.fetch('http://localhost/api/check', { method: 'POST', headers, body: JSON.stringify({ html: 'x'.repeat(10 * 1024 * 1024) }) });
    expect(oversized_check.status).toBe(413);
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
    expect((await exports.default.fetch(`http://localhost/api/drafts/${created.draftId}/favorite`, { method: 'POST', headers: { Authorization: `Bearer ${owner.token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ favorite: true }) })).status).toBe(404);
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

    const newer = await exports.default.fetch('http://localhost/api/uploads', { method: 'POST', headers: { Authorization: `Bearer ${first.token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ html: html.replace('content', 'newer') }) });
    const { draftId: newer_id } = await newer.json() as { draftId: string };
    const list = async () => (await (await exports.default.fetch('http://localhost/api/drafts', { headers: { Authorization: `Bearer ${first.token}` } })).json() as { drafts: { id: string; favorite: boolean; updatedAt: string }[] }).drafts;
    const [latest, older] = await list();
    expect(latest).toMatchObject({ id: newer_id, favorite: false });
    if (!older) throw new Error('expected an older draft');

    const favorite = (token: string, reference: string, payload: unknown) => exports.default.fetch(`http://localhost/api/drafts/${reference}/favorite`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });

    const malformed = await exports.default.fetch(`http://localhost/api/drafts/${older.id}/favorite`, { method: 'POST', headers: { Authorization: `Bearer ${first.token}`, 'Content-Type': 'application/json' }, body: 'not json' });
    expect(malformed.status).toBe(400);
    await expect(malformed.json()).resolves.toMatchObject({ error: 'invalid request body.' });

    const invalid = await favorite(first.token, older.id, { favorite: 'yes' });
    expect(invalid.status).toBe(400);
    await expect(invalid.json()).resolves.toMatchObject({ error: 'favorite must be true or false.' });

    const foreign = await favorite(second.token, older.id, { favorite: true });
    expect(foreign.status).toBe(404);
    await expect(foreign.json()).resolves.toMatchObject({ error: 'draft not found on your account.' });

    const starred = await favorite(first.token, older.id.toUpperCase(), { favorite: true });
    expect(starred.status).toBe(200);
    await expect(starred.json()).resolves.toEqual({ ok: true, draftId: older.id, favorite: true });
    const [top, next] = await list();
    expect(top).toMatchObject({ id: older.id, favorite: true, updatedAt: older.updatedAt });
    expect(next?.id).toBe(newer_id);
    await expect(env.DATABASE.prepare('SELECT metadata FROM audit_log WHERE action = ? AND resource_id = ?').bind('draft.update', older.id).first('metadata')).resolves.toBe('{"favorite":true}');

    const unstarred = await favorite(first.token, older.id, { favorite: false });
    expect(unstarred.status).toBe(200);
    expect((await list()).map(draft => draft.id)).toEqual([newer_id, older.id]);

    await env.DATABASE.prepare('UPDATE drafts SET disabled_at = ? WHERE id = ?').bind(new Date().toISOString(), newer_id).run();
    expect((await favorite(first.token, newer_id, { favorite: true })).status).toBe(404);
  });
});
