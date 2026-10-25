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
    const created = await create_response.json() as { ok: boolean; draftId: string; versionId: string; versionNumber: number; requestId: string; publicUrl: string; rawUrl: string; versionUrl: string; title: string; warnings: string[]; pages: unknown[] };
    expect(created).toEqual(expect.objectContaining({ ok: true, created: true, unchanged: false, versionNumber: 1, title: 'Integration Plan', warnings: [], account: { id: account_id, name: 'upload-flow@example.com' }, contentHash: expect.stringMatching(/^[0-9a-f]{64}$/), totalBytes: new TextEncoder().encode(html).byteLength }));
    expect(created.draftId).toMatch(/^[0-9a-z]{12}$/);
    expect(created.versionId).toMatch(/^[A-Za-z0-9_-]{12}$/);
    expect(created.requestId).toMatch(/^[0-9a-f-]{36}$/);
    expect(created.publicUrl).toBe(`http://localhost:9057/d/${created.draftId}`);
    expect(created.rawUrl).toBe(`${created.publicUrl}/raw`);
    expect(created.versionUrl).toBe(`${created.publicUrl}/version/1`);
    expect(created.pages).toEqual([{ path: 'index.html', url: `${created.publicUrl}/index.html` }]);

    const updated_at = () => env.DATABASE.prepare('SELECT updated_at FROM drafts WHERE id = ?').bind(created.draftId).first('updated_at');
    const before = await updated_at();

    const retry_response = await exports.default.fetch('http://localhost/api/uploads', { method: 'POST', headers, body: JSON.stringify({ html, draftId: created.draftId }) });
    expect(retry_response.status).toBe(200);
    await expect(retry_response.json()).resolves.toMatchObject({ created: false, unchanged: true, versionNumber: 1, versionId: created.versionId });
    await expect(updated_at()).resolves.toBe(before);

    const public_response = await exports.default.fetch(created.publicUrl);
    expect(public_response.status).toBe(200);
    expect(public_response.headers.get('x-postplan-draft-version')).toBe('1');
    expect(public_response.headers.get('content-type')).toContain('text/html');
    await expect(public_response.text()).resolves.toBe(html);

    const slash_response = await exports.default.fetch(`${created.publicUrl}/`);
    expect(slash_response.status).toBe(200);
    await expect(slash_response.text()).resolves.toBe(html);

    const single_page_response = await exports.default.fetch(`${created.publicUrl}/about`);
    expect(single_page_response.status).toBe(404);

    const raw_response = await exports.default.fetch(created.rawUrl);
    expect(raw_response.status).toBe(200);
    await expect(raw_response.text()).resolves.toBe(html);

    const updated_html = '<!doctype html><html><head><title>Integration Plan</title></head><body><h1>Version two</h1></body></html>';
    const update_response = await exports.default.fetch('http://localhost/api/uploads', {
      method: 'POST', headers, body: JSON.stringify({ html: updated_html, draftId: created.draftId }),
    });
    expect(update_response.status).toBe(200);
    await expect(update_response.json()).resolves.toMatchObject({ created: false, unchanged: false, versionNumber: 2 });

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
    expect(disabled).toEqual({ id: created.draftId });

    const blocked_response = await exports.default.fetch('http://localhost/api/uploads', {
      method: 'POST', headers, body: JSON.stringify({ html: updated_html, draftId: created.draftId }),
    });
    expect(blocked_response.status).toBe(404);

    const [draft_error, draft] = await drafts.find_owned(created.draftId, account_id);
    expect(draft_error).toBeNull();
    expect(draft).toBeNull();
  });

  it('publishes, updates, renames, and guards custom urls', async () => {
    const { account_id, token } = await create_authentication('slug-owner@example.com');
    const { token: plain_token } = await create_authentication('slug-plain@example.com');
    const { account_id: rival_id, token: rival_token } = await create_authentication('slug-rival@example.com');
    await env.DATABASE.prepare('UPDATE accounts SET flags = ? WHERE id IN (?, ?)').bind('["custom-urls"]', account_id, rival_id).run();

    const upload = (key: string, payload: Record<string, unknown>) => exports.default.fetch('http://localhost/api/uploads', {
      method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
    const page = (heading: string) => `<!doctype html><html><head><title>Slug Plan</title></head><body><h1>${heading}</h1></body></html>`;

    const forbidden_response = await upload(plain_token, { html: page('one'), slug: 'my-plan' });
    expect(forbidden_response.status).toBe(403);
    await expect(forbidden_response.json()).resolves.toMatchObject({ code: 'FORBIDDEN', error: 'custom urls are not enabled for this account. upload without --slug.' });

    const invalid_response = await upload(token, { html: page('one'), slug: 'my_plan' });
    expect(invalid_response.status).toBe(422);
    await expect(invalid_response.json()).resolves.toMatchObject({ errors: ['custom urls are 3-40 characters of a-z, 0-9, and inner hyphens.'] });

    const create_response = await upload(token, { html: page('one'), slug: ' My-Plan ' });
    expect(create_response.status).toBe(201);
    const created = await create_response.json() as { draftId: string; slug: string; publicUrl: string; rawUrl: string; versionUrl: string; };
    expect(created).toMatchObject({ slug: 'my-plan', publicUrl: 'http://localhost:9057/d/my-plan', rawUrl: 'http://localhost:9057/d/my-plan/raw', versionUrl: `http://localhost:9057/d/${created.draftId}/version/1` });

    const slug_response = await exports.default.fetch('http://localhost/d/MY-PLAN');
    expect(slug_response.status).toBe(200);
    expect(slug_response.headers.get('x-postplan-draft-id')).toBe(created.draftId);
    await expect(slug_response.text()).resolves.toBe(page('one'));

    const update_response = await upload(token, { html: page('two'), slug: 'my-plan' });
    expect(update_response.status).toBe(200);
    await expect(update_response.json()).resolves.toMatchObject({ draftId: created.draftId, slug: 'my-plan', versionNumber: 2 });

    const other_response = await upload(token, { html: page('other') });
    const other = await other_response.json() as { draftId: string; };

    const mismatch_response = await upload(token, { html: page('three'), slug: 'my-plan', draftId: other.draftId });
    expect(mismatch_response.status).toBe(409);
    await expect(mismatch_response.json()).resolves.toMatchObject({ error: `the custom url "my-plan" already names draft ${created.draftId}. upload with --slug alone to update it.` });

    const rival_response = await upload(rival_token, { html: page('rival'), slug: 'my-plan' });
    expect(rival_response.status).toBe(409);
    await expect(rival_response.json()).resolves.toMatchObject({ error: 'the custom url "my-plan" belongs to another account.' });

    const rename_response = await upload(token, { html: page('two'), slug: 'new-plan', draftId: created.draftId });
    expect(rename_response.status).toBe(200);
    await expect(rename_response.json()).resolves.toMatchObject({ draftId: created.draftId, slug: 'new-plan', unchanged: true, publicUrl: 'http://localhost:9057/d/new-plan' });
    expect((await exports.default.fetch('http://localhost/d/my-plan')).status).toBe(404);
    expect((await exports.default.fetch('http://localhost/d/new-plan')).status).toBe(200);

    const list_response = await exports.default.fetch('http://localhost/api/drafts', { headers: { Authorization: `Bearer ${token}` } });
    const { drafts } = await list_response.json() as { drafts: { id: string; slug?: string; publicUrl: string; }[]; };
    expect(drafts.find(draft => draft.id === created.draftId)).toMatchObject({ slug: 'new-plan', publicUrl: 'http://localhost:9057/d/new-plan' });
    expect(drafts.find(draft => draft.id === other.draftId)?.slug).toBeNull();

    await env.DATABASE.prepare('UPDATE drafts SET disabled_at = ? WHERE id = ?').bind(new Date().toISOString(), created.draftId).run();
    const disabled_response = await upload(token, { html: page('three'), slug: 'new-plan' });
    expect(disabled_response.status).toBe(409);
    await expect(disabled_response.json()).resolves.toMatchObject({ error: 'the custom url "new-plan" names a disabled draft.' });

    const delete_response = await exports.default.fetch(`http://localhost/api/drafts/${created.draftId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    expect(delete_response.status).toBe(200);
    expect((await upload(rival_token, { html: page('rival'), slug: 'new-plan' })).status).toBe(201);

    const legacy = 'LegacyCase_1';
    const lower = legacy.toLowerCase();
    const timestamp = new Date().toISOString();
    await env.DATABASE.prepare('INSERT INTO drafts (id, account_id, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?)').bind(legacy, account_id, 'Legacy', timestamp, timestamp).run();
    await expect(env.DATABASE.prepare('INSERT INTO drafts (id, account_id, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?)').bind(lower, account_id, 'Clash', timestamp, timestamp).run()).rejects.toThrow();

    expect((await upload(token, { html: page('legacy one'), draftId: legacy })).status).toBe(200);
    const legacy_rename = await upload(token, { html: page('legacy two'), draftId: lower, slug: 'legacy-plan' });
    expect(legacy_rename.status).toBe(200);
    await expect(legacy_rename.json()).resolves.toMatchObject({ draftId: legacy, slug: 'legacy-plan', versionNumber: 2, versionUrl: `http://localhost:9057/d/${legacy}/version/2` });
    const legacy_update = await upload(token, { html: page('legacy three'), draftId: lower, slug: 'legacy-plan' });
    expect(legacy_update.status).toBe(200);
    await expect(legacy_update.json()).resolves.toMatchObject({ draftId: legacy, versionNumber: 3 });

    const { results: legacy_versions } = await env.DATABASE.prepare('SELECT draft_id, object_key FROM draft_versions WHERE draft_id = ? COLLATE NOCASE').bind(lower).all<{ draft_id: string; object_key: string; }>();
    expect(legacy_versions).toHaveLength(3);
    expect(legacy_versions.every(version => version.draft_id === legacy && version.object_key.startsWith(`drafts/${legacy}/`))).toBe(true);

    const legacy_response = await exports.default.fetch(`http://localhost/d/${lower}`);
    expect(legacy_response.status).toBe(200);
    expect(legacy_response.headers.get('x-postplan-draft-id')).toBe(legacy);
    await expect(legacy_response.text()).resolves.toBe(page('legacy three'));

    const legacy_delete = await exports.default.fetch(`http://localhost/api/drafts/${lower}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    expect(legacy_delete.status).toBe(200);
    expect((await exports.default.fetch(`http://localhost/d/${legacy}`)).status).toBe(404);
    await expect(env.DATABASE.prepare('SELECT resource_id FROM audit_log WHERE action = ? AND resource_id = ? COLLATE NOCASE').bind('draft.delete', lower).first('resource_id')).resolves.toBe(legacy);
  });

  it('checks uploads without writing', async () => {
    const { account_id, token } = await create_authentication('check-flow@example.com');
    const { account_id: rival_id, token: rival_token } = await create_authentication('check-rival@example.com');
    await env.DATABASE.prepare('UPDATE accounts SET flags = ? WHERE id IN (?, ?)').bind('["custom-urls"]', account_id, rival_id).run();

    const check = async (key: string, payload: Record<string, unknown>) => {
      const response = await exports.default.fetch('http://localhost/api/check', {
        method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      expect(response.status).toBe(200);

      return response.json() as Promise<Record<string, unknown>>;
    };
    const count = () => env.DATABASE.prepare('SELECT COUNT(*) AS total FROM drafts WHERE account_id = ?').bind(account_id).first('total');

    const ready = await check(token, {});
    expect(ready).toEqual({
      ok: true, account: { id: account_id, name: 'check-flow@example.com', apiKeyName: 'integration' }, flags: ['custom-urls'], limits: { maxBytes: 4 * 1024 * 1024, maxPages: 50 },
      capabilities: { inlineScripts: true, multiPage: true, customUrls: true, externalAssets: expect.any(String), blockedInSandbox: expect.arrayContaining(['forms', 'meta refresh']) },
      issues: [], errors: [], warnings: [],
    });

    const page = await check(token, { html: '<!doctype html><title>Check</title><script>1</script><p>ok</p>' });
    expect(page).toMatchObject({ ok: true, errors: [], warnings: [], pages: [{ path: 'index.html', title: 'Check', hasScripts: true }] });
    expect(page.totalBytes).toEqual(expect.any(Number));

    const folder = await check(token, { files: [{ path: 'index.html', html: '<title>Home</title>' }, { path: 'raw.html', html: '<title>Raw</title>' }] });
    expect(folder).toMatchObject({ ok: false, errors: ['page path "raw.html" uses the reserved name "raw".'] });

    const invalid = await check(token, { html: '<form></form>' });
    expect(invalid.ok).toBe(false);

    await expect(check(token, { slug: 'Check-Plan' })).resolves.toMatchObject({ ok: true, slug: { slug: 'check-plan', status: 'available' } });
    const reserved = await check(token, { slug: 'admin' });
    expect(reserved).toMatchObject({ ok: false, errors: ['"admin" is reserved.'] });
    expect(reserved.slug).toBeUndefined();

    await exports.default.fetch('http://localhost/api/uploads', {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ html: '<title>Claimed</title>', slug: 'check-plan' }),
    });

    await expect(check(token, { slug: 'check-plan' })).resolves.toMatchObject({ ok: true, slug: { status: 'yours' } });
    await expect(check(rival_token, { slug: 'check-plan' })).resolves.toMatchObject({ ok: false, slug: { status: 'taken', message: 'the custom url "check-plan" belongs to another account.' } });

    await env.DATABASE.prepare('UPDATE drafts SET disabled_at = ? WHERE slug = ?').bind(new Date().toISOString(), 'check-plan').run();
    await expect(check(token, { slug: 'check-plan' })).resolves.toMatchObject({ ok: false, slug: { status: 'unavailable', message: 'the custom url "check-plan" names a disabled draft.' } });

    await env.DATABASE.prepare('UPDATE accounts SET flags = ? WHERE id = ?').bind('[]', rival_id).run();
    await expect(check(rival_token, { slug: 'other-plan' })).resolves.toMatchObject({ ok: false, slug: { status: 'unavailable', message: 'custom urls are not enabled for this account. upload without --slug.' } });

    await expect(count()).resolves.toBe(1);
  });

  it('uploads and serves folders', async () => {
    const { token } = await create_authentication('upload-folder@example.com');
    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
    const files = [
      { path: 'about.html', html: '<!doctype html><title>About</title><a href="./">home</a>' },
      { path: 'docs/index.html', html: '<!doctype html><title>Docs</title><a href="../about">about</a>' },
      { path: 'index.html', html: '<!doctype html><title>Report</title><a href="about">about</a><a href="docs/">docs</a>' },
    ];

    const create_response = await exports.default.fetch('http://localhost/api/uploads', {
      method: 'POST', headers, body: JSON.stringify({ files, filename: 'report' }),
    });
    expect(create_response.status).toBe(201);
    const created = await create_response.json() as { draftId: string; publicUrl: string; versionUrl: string; pages: unknown[] };
    const root = `http://localhost:9057/d/${created.draftId}`;

    expect(created).toMatchObject({ title: 'Report', totalBytes: files.reduce((total, file) => total + file.html.length, 0), warnings: [] });
    expect(created.publicUrl).toBe(`${root}/`);
    expect(created.versionUrl).toBe(`${root}/version/1/`);
    expect(created.pages).toEqual(files.map(({ path }) => ({ path, url: `${root}/${path}` })));

    const retry_response = await exports.default.fetch('http://localhost/api/uploads', {
      method: 'POST', headers, body: JSON.stringify({ files: [...files].reverse(), draftId: created.draftId }),
    });
    await expect(retry_response.json()).resolves.toMatchObject({ unchanged: true, versionNumber: 1 });

    const draft = `http://localhost/d/${created.draftId}`;

    const root_response = await exports.default.fetch(`${draft}?tab=1`, { redirect: 'manual' });
    expect(root_response.status).toBe(302);
    expect(root_response.headers.get('location')).toBe(`/d/${created.draftId}/?tab=1`);

    const index_response = await exports.default.fetch(`${draft}/`);
    expect(index_response.status).toBe(200);
    await expect(index_response.text()).resolves.toBe(files[2]?.html);

    const about_response = await exports.default.fetch(`${draft}/about`);
    expect(about_response.status).toBe(200);
    await expect(about_response.text()).resolves.toBe(files[0]?.html);

    const about_html_response = await exports.default.fetch(`${draft}/about.html`);
    expect(about_html_response.status).toBe(200);

    const docs_response = await exports.default.fetch(`${draft}/docs`, { redirect: 'manual' });
    expect(docs_response.status).toBe(302);
    expect(docs_response.headers.get('location')).toBe(`/d/${created.draftId}/docs/`);

    const docs_slash_response = await exports.default.fetch(`${draft}/docs/`);
    expect(docs_slash_response.status).toBe(200);
    await expect(docs_slash_response.text()).resolves.toBe(files[1]?.html);

    const raw_response = await exports.default.fetch(`${draft}/raw`);
    expect(raw_response.status).toBe(200);
    await expect(raw_response.text()).resolves.toBe(files[2]?.html);

    const raw_slash_response = await exports.default.fetch(`${draft}/raw/`, { redirect: 'manual' });
    expect(raw_slash_response.status).toBe(302);
    expect(raw_slash_response.headers.get('location')).toBe(`/d/${created.draftId}/raw`);

    const version_response = await exports.default.fetch(`${draft}/version/1`, { redirect: 'manual' });
    expect(version_response.status).toBe(302);
    expect(version_response.headers.get('location')).toBe(`/d/${created.draftId}/version/1/`);

    const version_page_response = await exports.default.fetch(`${draft}/version/1/about`);
    expect(version_page_response.status).toBe(200);
    expect(version_page_response.headers.get('x-postplan-draft-version')).toBe('1');

    const missing_response = await exports.default.fetch(`${draft}/missing`);
    expect(missing_response.status).toBe(404);

    const list_response = await exports.default.fetch('http://localhost/api/drafts', { headers });
    const { drafts } = await list_response.json() as { drafts: { id: string; publicUrl: string }[] };
    expect(drafts.find(entry => entry.id === created.draftId)?.publicUrl).toBe(`${root}/`);

    const versions_response = await exports.default.fetch(`${draft}/versions`);
    expect(versions_response.status).toBe(200);
    await expect(versions_response.text()).resolves.toContain('version history');
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
        description: `  ${'d'.repeat(1000)}  `,
        metadata: {
          cliVersion: '0.0.4', gitBranch: 'main', gitCommitSha: 'abc123', gitCommitSubject: 'publish plan', gitDirty: true,
          ciRunUrl: 'https://ci.example/run/1', ciActor: 'ci@example.com', repoOrg: 'acme', repoName: 'plans', repoHost: 'github.com',
        },
      }),
    });
    expect(response.status).toBe(201);
    const created = await response.json() as { draftId: string; versionId: string; };

    const draft = await env.DATABASE.prepare('SELECT description, repo_org, repo_name, repo_host FROM drafts WHERE id = ?').bind(created.draftId).first<Record<string, unknown>>();
    expect(draft).toEqual({ description: 'd'.repeat(1000), repo_org: 'acme', repo_name: 'plans', repo_host: 'github.com' });

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
    const clean = await clean_response.json() as { versionId: string; };
    const clean_version = await env.DATABASE.prepare('SELECT git_dirty, has_inline_script, external_image_hosts, source_ip, user_agent, cli_version FROM draft_versions WHERE id = ?').bind(clean.versionId).first<Record<string, unknown>>();
    expect(clean_version).toEqual({ git_dirty: 0, has_inline_script: 0, external_image_hosts: '[]', source_ip: null, user_agent: null, cli_version: null });

    const omitted_response = await exports.default.fetch('http://localhost/api/uploads', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ html: '<html><head><title>Omitted</title></head><body>content</body></html>' }),
    });
    expect(omitted_response.status).toBe(201);
    const omitted = await omitted_response.json() as { versionId: string; };
    const omitted_version = await env.DATABASE.prepare('SELECT git_dirty FROM draft_versions WHERE id = ?').bind(omitted.versionId).first<{ git_dirty: number | null; }>();
    expect(omitted_version).toEqual({ git_dirty: null });
  });
});
