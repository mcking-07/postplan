import { env, exports } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';
import { hash } from '../../src/common';
import { create_repositories } from '../setup';

const create_authentication = async (email: string) => {
  const { accounts, keys } = create_repositories();
  const [account_error, account_id] = await accounts.create({ email, role: 'member' });
  if (account_error) throw account_error;
  if (!account_id) throw new Error('failed to create test account');

  const token = `pp_test_${email}`;
  const [key_error, key_id] = await keys.create({ account_id, name: 'integration', key_hash: await hash(token) });
  if (key_error) throw key_error;
  if (!key_id) throw new Error('failed to create test key');

  return { account_id, token };
};

describe('worker uploads', () => {
  it('uploads, serves, updates, and blocks disabled drafts', async () => {
    const { account_id, token } = await create_authentication('upload-flow@example.com');
    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
    const html = '<!doctype html><html><head><title>Integration Plan</title></head><body><h1>Version one</h1></body></html>';

    const create_response = await exports.default.fetch('http://localhost/api/uploads', {
      method: 'POST', headers, body: JSON.stringify({ html, filename: 'plan.html', metadata: { cliVersion: '0.0.4' } }),
    });
    expect(create_response.status).toBe(201);
    const created = await create_response.json() as { ok: boolean; draftId: string; versionId: string; versionNumber: number; requestId: string; publicUrl: string; rawUrl: string; title: string; warnings: string[] };
    expect(created).toEqual(expect.objectContaining({ ok: true, versionNumber: 1, title: 'Integration Plan', warnings: [] }));
    expect(created.draftId).toMatch(/^[A-Za-z0-9_-]{12}$/);
    expect(created.versionId).toMatch(/^[A-Za-z0-9_-]{12}$/);
    expect(created.requestId).toMatch(/^[0-9a-f-]{36}$/);
    expect(created.publicUrl).toBe(`http://localhost:9057/d/${created.draftId}`);
    expect(created.rawUrl).toBe(`${created.publicUrl}/raw`);

    const public_response = await exports.default.fetch(created.publicUrl);
    expect(public_response.status).toBe(200);
    expect(public_response.headers.get('content-type')).toContain('text/html');
    await expect(public_response.text()).resolves.toBe(html);

    const raw_response = await exports.default.fetch(created.rawUrl);
    expect(raw_response.status).toBe(200);
    await expect(raw_response.text()).resolves.toBe(html);

    const updated_html = '<!doctype html><html><head><title>Integration Plan</title></head><body><h1>Version two</h1></body></html>';
    const update_response = await exports.default.fetch('http://localhost/api/uploads', {
      method: 'POST', headers, body: JSON.stringify({ html: updated_html, draftId: created.draftId }),
    });
    expect(update_response.status).toBe(200);
    const updated = await update_response.json() as { versionNumber: number };
    expect(updated.versionNumber).toBe(2);

    const version_one_response = await exports.default.fetch(`http://localhost/d/${created.draftId}/version/1`);
    expect(version_one_response.status).toBe(200);
    await expect(version_one_response.text()).resolves.toBe(html);

    const raw_version_one_response = await exports.default.fetch(`http://localhost/d/${created.draftId}/version/1/raw`);
    expect(raw_version_one_response.status).toBe(200);
    await expect(raw_version_one_response.text()).resolves.toBe(html);

    const version_two_response = await exports.default.fetch(`http://localhost/d/${created.draftId}/version/2`);
    expect(version_two_response.status).toBe(200);
    await expect(version_two_response.text()).resolves.toBe(updated_html);

    const raw_version_two_response = await exports.default.fetch(`http://localhost/d/${created.draftId}/version/2/raw`);
    expect(raw_version_two_response.status).toBe(200);
    await expect(raw_version_two_response.text()).resolves.toBe(updated_html);

    const invalid_zero_response = await exports.default.fetch(`http://localhost/d/${created.draftId}/version/0`);
    expect(invalid_zero_response.status).toBe(404);

    const invalid_text_response = await exports.default.fetch(`http://localhost/d/${created.draftId}/version/nope`);
    expect(invalid_text_response.status).toBe(404);

    const missing_version_response = await exports.default.fetch(`http://localhost/d/${created.draftId}/version/999`);
    expect(missing_version_response.status).toBe(404);

    const { drafts } = create_repositories();
    const [disable_error, disabled] = await drafts.disable(created.draftId, 'integration test');
    expect(disable_error).toBeNull();
    expect(disabled).toBe(true);

    const blocked_response = await exports.default.fetch('http://localhost/api/uploads', {
      method: 'POST', headers, body: JSON.stringify({ html: updated_html, draftId: created.draftId }),
    });
    expect(blocked_response.status).toBe(404);

    const [draft_error, draft] = await drafts.find_owned(created.draftId, account_id);
    expect(draft_error).toBeNull();
    expect(draft).toBeNull();
  });

  it('persists upload metadata and flags', async () => {
    const { account_id, token } = await create_authentication('upload-metadata@example.com');
    const html = '<html><head><title>Metadata</title></head><body><img src="https://cdn.example.com/image.png"><img src="https://assets.example.com/image.png"></body></html>';
    const response = await exports.default.fetch('http://localhost/api/uploads', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        html,
        filename: 'metadata.html',
        metadata: {
          cliVersion: '0.0.4', gitBranch: 'main', gitCommitSha: 'abc123', gitCommitSubject: 'publish plan', gitDirty: true,
          ciRunUrl: 'https://ci.example/run/1', ciActor: 'ci@example.com',
        },
      }),
    });
    expect(response.status).toBe(201);
    const created = await response.json() as { versionId: string };

    const version = await env.DATABASE.prepare('SELECT * FROM draft_versions WHERE id = ? AND created_by_api_key_id IN (SELECT id FROM api_keys WHERE account_id = ?)').bind(created.versionId, account_id).first<Record<string, unknown>>();
    expect(version).toMatchObject({
      id: created.versionId, cli_version: '0.0.4', git_branch: 'main', git_commit_sha: 'abc123', git_commit_subject: 'publish plan',
      git_dirty: 1, original_filename: 'metadata.html', has_inline_script: 0, external_image_hosts: '["assets.example.com","cdn.example.com"]', ci_run_url: 'https://ci.example/run/1', ci_actor: 'ci@example.com',
    });
    expect(version?.request_id).toEqual(expect.any(String));
    expect(version?.content_hash).toEqual(expect.any(String));
    expect(version?.file_size).toBe(new TextEncoder().encode(html).byteLength);

    const clean_response = await exports.default.fetch('http://localhost/api/uploads', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ html: '<html><head><title>Clean</title></head><body>content</body></html>', metadata: { gitDirty: false } }),
    });
    expect(clean_response.status).toBe(201);
    const clean = await clean_response.json() as { versionId: string };
    const clean_version = await env.DATABASE.prepare('SELECT git_dirty, has_inline_script, external_image_hosts, source_ip, user_agent, cli_version FROM draft_versions WHERE id = ?').bind(clean.versionId).first<Record<string, unknown>>();
    expect(clean_version).toEqual({ git_dirty: 0, has_inline_script: 0, external_image_hosts: '[]', source_ip: null, user_agent: null, cli_version: null });

    const omitted_response = await exports.default.fetch('http://localhost/api/uploads', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ html: '<html><head><title>Omitted</title></head><body>content</body></html>' }),
    });
    expect(omitted_response.status).toBe(201);
    const omitted = await omitted_response.json() as { versionId: string };
    const omitted_version = await env.DATABASE.prepare('SELECT git_dirty FROM draft_versions WHERE id = ?').bind(omitted.versionId).first<{ git_dirty: number | null }>();
    expect(omitted_version).toEqual({ git_dirty: null });
  });
});
