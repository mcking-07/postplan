import { loggerFor } from '../common';
import { config } from '../config';
import { NotFound } from '../errors';
import type { DraftsRepository, VersionsRepository } from '../database';
import type { Storage } from '../storage';
import type { DraftEntityType, DraftType, DraftVersionEntityType, DraftVersionType, ResolveOptionsType, ResolvedDraftType } from '../types';

const logger = loggerFor('services/drafts');

const normalize_draft = (draft: DraftEntityType): DraftType => ({
  ...draft,
  description: draft.description ?? undefined,
  current_version_id: draft.current_version_id ?? undefined,
  repo_org: draft.repo_org ?? undefined,
  repo_name: draft.repo_name ?? undefined,
  repo_host: draft.repo_host ?? undefined,
  deleted_at: draft.deleted_at ?? undefined,
  disabled_at: draft.disabled_at ?? undefined,
  disabled_reason: draft.disabled_reason ?? undefined,
});

const normalize_version = (version: DraftVersionEntityType): DraftVersionType => ({
  ...version,
  source_ip: version.source_ip ?? undefined,
  user_agent: version.user_agent ?? undefined,
  cli_version: version.cli_version ?? undefined,
  git_branch: version.git_branch ?? undefined,
  git_commit_sha: version.git_commit_sha ?? undefined,
  git_commit_subject: version.git_commit_subject ?? undefined,
  git_dirty: version.git_dirty ?? undefined,
  original_filename: version.original_filename ?? undefined,
  request_id: version.request_id ?? undefined,
  ci_run_url: version.ci_run_url ?? undefined,
  ci_actor: version.ci_actor ?? undefined,
});

class DraftsService {
  private readonly drafts: DraftsRepository;
  private readonly versions: VersionsRepository;
  private readonly storage: Storage;
  constructor(drafts: DraftsRepository, versions: VersionsRepository, storage: Storage) {
    this.drafts = drafts;
    this.versions = versions;
    this.storage = storage;
  }

  resolve = async (id: string, options: ResolveOptionsType = {}): Promise<ResolvedDraftType> => {
    const [draft_error, draft] = options.unfiltered ? await this.drafts.find_by_id(id) : await this.drafts.find_public(id);
    if (draft_error || !draft) throw new NotFound('draft not found.');

    const version = await this.find_version_entity(draft, options.version);

    const [storage_error, html] = await this.storage.get(version.object_key);
    if (storage_error || !html) throw new NotFound('version content not found.');

    logger.info(`resolved draft [${id}] version [${version.version_number}]`);
    return { draft: normalize_draft(draft), version: normalize_version(version), html };
  };

  list = async (account_id: string) => {
    logger.info(`listing drafts for account [${account_id}]`);

    const [error, rows] = await this.drafts.list_with_stats(account_id);
    if (error) throw error;

    return (rows ?? []).map(row => ({
      id: row.id, title: row.title, description: row.description ?? undefined, repo_org: row.repo_org ?? undefined, repo_name: row.repo_name ?? undefined, repo_host: row.repo_host ?? undefined,
      latest_version_number: row.latest_version_number ?? undefined, latest_version_at: row.latest_version_at ?? undefined, version_count: Number(row.version_count),
      disabled: !!row.disabled_at, created_at: row.created_at, updated_at: row.updated_at, public_url: `${config.base}/d/${row.id}`, raw_url: `${config.base}/d/${row.id}/raw`,
    }));
  };

  list_versions = async (draft_id: string) => {
    logger.info(`listing versions for draft [${draft_id}]`);

    const [draft_error, draft] = await this.drafts.find_public(draft_id);
    if (draft_error || !draft) throw new NotFound('draft not found.');

    const [versions_error, rows] = await this.versions.find_by_draft(draft.id);
    if (versions_error) throw versions_error;

    return { draft: normalize_draft(draft), rows: (rows ?? []).map(normalize_version) };
  };

  paginate = async (page: number, size: number) => {
    logger.info(`paginating drafts, page [${page}] size [${size}]`);
    const result = await this.drafts.paginate(page, size);

    return { ...result, rows: result.rows.map(normalize_draft) };
  };

  remove = async (id: string, account_id: string) => {
    logger.info(`removing draft [${id}] for account [${account_id}]`);

    const [error, removed] = await this.drafts.remove(id, account_id);
    if (error) throw error;

    return removed;
  };

  disable = async (id: string, reason: string) => {
    logger.info(`disabling draft [${id}]`);

    const [error, disabled] = await this.drafts.disable(id, reason);
    if (error) throw error;

    return disabled;
  };

  private find_version_entity = async (draft: DraftEntityType, version?: number): Promise<DraftVersionEntityType> => {
    if (version) return this.find_version_by_number(draft.id, version);
    return this.find_current_version(draft);
  };

  private find_version_by_number = async (draft_id: string, version: number): Promise<DraftVersionEntityType> => {
    const [error, found] = await this.versions.find_by_number(draft_id, version);
    if (error || !found) throw new NotFound('version not found.');

    return found;
  };

  private find_current_version = async (draft: DraftEntityType): Promise<DraftVersionEntityType> => {
    if (!draft.current_version_id) throw new NotFound('draft has no published version.');

    const version = await this.versions.read(draft.current_version_id);
    if (!version) throw new NotFound('version not found.');

    return version;
  };
}

export { DraftsService };
