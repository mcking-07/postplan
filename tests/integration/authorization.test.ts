import { env, exports } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';
import { hash } from '../../src/common';
import { create_repositories } from '../setup';

const create_account_key = async (email: string, role: 'admin' | 'member' = 'member') => {
  const { accounts, keys } = create_repositories();
  const [account_error, account_id] = await accounts.create({ email, role });
  if (account_error) throw account_error;
  const token = `pp_auth_${email}`;
  const [key_error, key_id] = await keys.create({ account_id, name: 'integration', key_hash: await hash(token) });
  if (key_error) throw key_error;
  return { account_id, key_id, token };
};

describe('worker authorization', () => {
  it('rejects missing and invalid bearer credentials', async () => {
    const missing = await exports.default.fetch('http://localhost/api/me');
    expect(missing.status).toBe(401);
    await expect(missing.json()).resolves.toMatchObject({ ok: false, code: 'UNAUTHORIZED' });
    const invalid = await exports.default.fetch('http://localhost/api/me', { headers: { Authorization: 'Bearer invalid-token' } });
    expect(invalid.status).toBe(401);
    await expect(invalid.json()).resolves.toMatchObject({ ok: false, code: 'UNAUTHORIZED' });
  });

  it('supports API-key lifecycle operations', async () => {
    const { token } = await create_account_key('keys-flow@example.com');
    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
    const me = await exports.default.fetch('http://localhost/api/me', { headers });
    expect(me.status).toBe(200);
    await expect(me.json()).resolves.toMatchObject({ accountName: 'keys-flow@example.com', email: 'keys-flow@example.com', apiKeyName: 'integration', flags: [] });
    const created_response = await exports.default.fetch('http://localhost/api/api-keys', { method: 'POST', headers, body: JSON.stringify({ name: 'new key!' }) });
    expect(created_response.status).toBe(201);
    const created = await created_response.json() as { apiKey: { id: string; name: string }; token: string };
    expect(created.apiKey.name).toBe('new key');
    expect(created.token).toMatch(/^pp_[0-9a-f]{64}$/);
    const list_response = await exports.default.fetch('http://localhost/api/api-keys', { headers });
    expect(list_response.status).toBe(200);
    const listed = await list_response.json() as { apiKeys: Array<Record<string, unknown>> };
    expect(listed.apiKeys).toHaveLength(2);
    expect(listed.apiKeys.every(key => !('keyHash' in key))).toBe(true);
    const revoke = await exports.default.fetch(`http://localhost/api/api-keys/${created.apiKey.id}/revoke`, { method: 'POST', headers });
    expect(revoke.status).toBe(200);
    const revoked = await exports.default.fetch('http://localhost/api/me', { headers: { Authorization: `Bearer ${created.token}` } });
    expect(revoked.status).toBe(401);
  });

  it('returns the account flags', async () => {
    const { account_id, token } = await create_account_key('flags@example.com');
    const { accounts } = create_repositories();
    await accounts.update(account_id, { flags: '["custom-urls"]' });

    const me = await exports.default.fetch('http://localhost/api/me', { headers: { Authorization: `Bearer ${token}` } });
    await expect(me.json()).resolves.toMatchObject({ flags: ['custom-urls'] });
  });

  it('enforces account ownership for key revocation', async () => {
    const first = await create_account_key('owner-one@example.com');
    const second = await create_account_key('owner-two@example.com');
    const response = await exports.default.fetch(`http://localhost/api/api-keys/${first.key_id}/revoke`, { method: 'POST', headers: { Authorization: `Bearer ${second.token}` } });
    expect(response.status).toBe(404);
  });

  it('allows development Access identity and protects admin pages by role', async () => {
    const { token } = await create_account_key('developer@example.com');
    const upload = async (title: string) => {
      const response = await exports.default.fetch('http://localhost/api/uploads', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ html: `<html><head><title>${title}</title></head><body>${title}</body></html>` }) });
      return (await response.json() as { draftId: string }).draftId;
    };
    const starred = await upload('Starred Plan');
    await upload('Plain Plan');
    await exports.default.fetch(`http://localhost/api/drafts/${starred}/favorite`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ favorite: true }) });

    const dashboard = await exports.default.fetch('http://localhost/dashboard');
    expect(dashboard.status).toBe(200);
    const page = await dashboard.text();
    expect(page.split('Starred Plan')).toHaveLength(2);
    expect(page.indexOf('<h2>favorites')).toBeGreaterThan(-1);
    expect(page.indexOf('<h2>favorites')).toBeLessThan(page.indexOf('Starred Plan'));
    expect(page.indexOf('Starred Plan')).toBeLessThan(page.indexOf('<h2>no repository'));
    expect(page.indexOf('<h2>no repository')).toBeLessThan(page.indexOf('Plain Plan'));
    expect(page).toContain(`action="/d/${starred}/favorite" class="favorite">\n  <input type="hidden" name="favorite" value="false">`);

    const { token: other_token } = await create_account_key('dashboard-other@example.com');
    const other = await exports.default.fetch('http://localhost/api/uploads', { method: 'POST', headers: { Authorization: `Bearer ${other_token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ html: '<html><head><title>Other Plan</title></head><body>x</body></html>' }) });
    const { draftId: other_draft } = await other.json() as { draftId: string };

    const toggle = (draft: string, favorite: boolean) => exports.default.fetch(`http://localhost/d/${draft}/favorite`, { method: 'POST', body: new URLSearchParams({ favorite: String(favorite) }), redirect: 'manual' });
    expect((await toggle(other_draft, true)).status).toBe(404);

    const unstarred = await toggle(starred, false);
    expect(unstarred.status).toBe(302);
    expect(unstarred.headers.get('location')).toBe(`/dashboard?favorited=0&draft=${starred}`);
    const removed = await (await exports.default.fetch(`http://localhost/dashboard?favorited=0&draft=${starred}`)).text();
    expect(removed).not.toContain('<h2>favorites');
    expect(removed).toContain(`<div class="banner neutral">"Starred Plan" removed from favorites.<form method="post" action="/d/${starred}/favorite" class="undo">\n  <input type="hidden" name="favorite" value="true">`);
    expect(removed).toContain('</form><script>{ const notice = document.currentScript.parentElement;');
    expect(removed).toContain('setTimeout(() => notice.classList.add(\'fading\'), 4000) }</script></div>');
    expect(removed.indexOf('<script>history.replaceState(null, \'\', location.pathname)</script>')).toBeGreaterThan(removed.lastIndexOf('<div class="item">'));
    expect(await (await exports.default.fetch('http://localhost/dashboard?favorited=0&draft=unknown')).text()).toContain('<div class="banner neutral">removed from favorites.<script>');

    expect((await toggle(starred.toUpperCase(), true)).headers.get('location')).toBe(`/dashboard?favorited=1&draft=${starred}`);
    const restarred = await (await exports.default.fetch(`http://localhost/dashboard?favorited=1&draft=${starred}`)).text();
    expect(restarred).toContain(`<div class="banner neutral">"Starred Plan" added to favorites.<form method="post" action="/d/${starred}/favorite" class="undo">\n  <input type="hidden" name="favorite" value="false">`);
    expect(restarred.indexOf('<h2>favorites')).toBeLessThan(restarred.indexOf('>Starred Plan</a>'));
    expect(restarred).toContain('class="on" title="remove from favorites"');
    await expect(env.DATABASE.prepare('SELECT COUNT(*) AS total FROM audit_log WHERE action = ? AND resource_id = ? AND metadata = ?').bind('draft.update', starred, '{"favorite":true}').first('total')).resolves.toBe(2);

    expect(await (await exports.default.fetch('http://localhost/cli/auth?revoked=1')).text()).toContain('<div class="banner neutral">api key revoked.<script>{ const notice = document.currentScript.parentElement;');
    const created = await (await exports.default.fetch('http://localhost/cli/auth?token=pp_shown_once')).text();
    expect(created).toContain('<div class="banner success">shown once.');
    expect(created).not.toContain('document.currentScript');
    const admin = await exports.default.fetch('http://localhost/admin');
    expect(admin.status).toBe(401);
  });
});
