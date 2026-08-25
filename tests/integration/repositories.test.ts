import { env } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';
import { create_repositories } from '../setup';

const require_value = <Value>(value: Value | null | undefined): Value => {
  if (value === null || value === undefined) throw new Error('expected value');

  return value;
};

describe('D1 repositories', () => {
  it('creates and finds accounts case-insensitively', async () => {
    const { accounts } = create_repositories();

    const [create_error, account_id] = await accounts.create({ email: 'repo-test@example.com', role: 'member' });
    expect(create_error).toBeNull();
    const account = require_value(account_id);

    const [find_error, found] = await accounts.find_by_email('REPO-TEST@EXAMPLE.COM');
    expect(find_error).toBeNull();
    expect(found?.id).toBe(account);

    const [duplicate_error] = await accounts.create({ email: 'REPO-TEST@example.com', role: 'member' });
    expect(duplicate_error).toBeDefined();
  });

  it('does not expose API-key hashes in account listings', async () => {
    const { accounts, keys } = create_repositories();

    const [account_error, account_id] = await accounts.create({ email: 'keys-test@example.com', role: 'member' });
    expect(account_error).toBeNull();
    const account = require_value(account_id);

    const [create_error, key_id] = await keys.create({ account_id: account, name: 'test', key_hash: 'hash-for-list-test' });
    expect(create_error).toBeNull();
    const key = require_value(key_id);

    const [list_error, listed] = await keys.find_by_account(account);
    expect(list_error).toBeNull();
    const entries = require_value(listed);
    expect(entries).toHaveLength(1);
    expect(entries[0]?.id).toBe(key);
    expect(entries[0]).not.toHaveProperty('key_hash');
  });

  it('does not return disabled drafts as owned upload targets', async () => {
    const { accounts, drafts } = create_repositories();

    const [account_error, account_id] = await accounts.create({ email: 'draft-test@example.com', role: 'member' });
    expect(account_error).toBeNull();
    const account = require_value(account_id);

    const [create_error, draft_id] = await drafts.create({ account_id: account, title: 'Disabled draft' });
    expect(create_error).toBeNull();
    const draft = require_value(draft_id);

    const [disable_error, disabled] = await drafts.disable(draft, 'moderation');
    expect(disable_error).toBeNull();
    expect(disabled).toBe(true);

    const [find_error, found] = await drafts.find_owned(draft, account);
    expect(find_error).toBeNull();
    expect(found).toBeNull();

    const [public_error, public_draft] = await drafts.find_public(draft);
    expect(public_error).toBeNull();
    expect(public_draft).toBeNull();
  });

  it('allocates version one and rejects duplicate version numbers', async () => {
    const { accounts, drafts, keys, versions } = create_repositories();

    const [account_error, account_id] = await accounts.create({ email: 'version-test@example.com', role: 'member' });
    expect(account_error).toBeNull();
    const account = require_value(account_id);

    const [key_error, api_key_id] = await keys.create({ account_id: account, name: 'test', key_hash: 'hash-for-version-test' });
    expect(key_error).toBeNull();
    const api_key = require_value(api_key_id);

    const [draft_error, draft_id] = await drafts.create({ account_id: account, title: 'Versioned draft' });
    expect(draft_error).toBeNull();
    const draft = require_value(draft_id);

    const params = {
      id: 'version-one', draft_id: draft, object_key: 'drafts/version-one.html', content_hash: 'hash', file_size: 10,
      api_key_id: api_key, has_inline_script: 0 as const, external_image_hosts: '[]',
    };
    const [version_error, version_number] = await versions.create_version(params);
    expect(version_error).toBeNull();
    expect(version_number).toBe(1);

    await expect(env.DATABASE.prepare('INSERT INTO draft_versions (id, draft_id, version_number, object_key, content_hash, file_size, created_at, updated_at, created_by_api_key_id, has_inline_script, external_image_hosts) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').bind('version-two', draft, 1, 'drafts/version-two.html', 'hash', 10, new Date().toISOString(), new Date().toISOString(), api_key, 0, '[]').run()).rejects.toThrow();
  });
});
