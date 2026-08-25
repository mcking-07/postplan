import { exports } from 'cloudflare:workers';
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
    await expect(me.json()).resolves.toMatchObject({ email: 'keys-flow@example.com', apiKeyName: 'integration' });
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

  it('enforces account ownership for key revocation', async () => {
    const first = await create_account_key('owner-one@example.com');
    const second = await create_account_key('owner-two@example.com');
    const response = await exports.default.fetch(`http://localhost/api/api-keys/${first.key_id}/revoke`, { method: 'POST', headers: { Authorization: `Bearer ${second.token}` } });
    expect(response.status).toBe(404);
  });

  it('allows development Access identity and protects admin pages by role', async () => {
    const dashboard = await exports.default.fetch('http://localhost/dashboard');
    expect(dashboard.status).toBe(200);
    const admin = await exports.default.fetch('http://localhost/admin');
    expect(admin.status).toBe(401);
  });
});
