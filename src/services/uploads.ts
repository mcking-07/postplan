import { nanoid } from 'nanoid';
import { hash, loggerFor, sanitize } from '../common';
import { config } from '../config';
import { NotFound } from '../errors';
import type { DraftsRepository, VersionsRepository } from '../database';
import type { Storage } from '../storage';
import type { AuditService } from './audit';
import type { UnknownPayloadType, UploadContextType, ValidationResultType } from '../types';

const logger = loggerFor('services/uploads');

class UploadsService {
  private readonly drafts: DraftsRepository;
  private readonly versions: VersionsRepository;
  private readonly storage: Storage;
  private readonly audit: AuditService;
  constructor(drafts: DraftsRepository, versions: VersionsRepository, storage: Storage, audit: AuditService) {
    this.drafts = drafts;
    this.versions = versions;
    this.storage = storage;
    this.audit = audit;
  }

  upload = async (context: UploadContextType, validation: ValidationResultType) => {
    const { request, account_id, api_key_id, source_ip, user_agent, request_id } = context;
    const { html, filename, draft_id, description, metadata = {} } = request;

    const size = new TextEncoder().encode(html).byteLength;
    const content_hash = await hash(html);

    const existing = await this.find_existing(draft_id, account_id);
    const title = validation.title ?? existing?.title ?? sanitize(filename) ?? 'Untitled Draft';

    const resolved = existing?.id ?? await this.create_draft(account_id, title, description, metadata);
    const version_id = nanoid(12);
    const object_key = this.storage.key(resolved, version_id);

    const [put_error] = await this.storage.put(object_key, html);
    if (put_error) throw put_error;

    const [version_error, version_number] = await this.versions.create_version({
      id: version_id, draft_id: resolved, object_key, content_hash, file_size: size, api_key_id, source_ip, user_agent, cli_version: sanitize(metadata.cli_version), git_branch: sanitize(metadata.git_branch),
      git_commit_sha: sanitize(metadata.git_commit_sha), git_commit_subject: sanitize(metadata.git_commit_subject), git_dirty: typeof metadata.git_dirty === 'boolean' ? (metadata.git_dirty ? 1 : 0) : undefined,
      original_filename: sanitize(filename), request_id, has_inline_script: validation.stats.has_inline_script ? 1 : 0, external_image_hosts: JSON.stringify(validation.stats.external_image_hosts),
      ci_run_url: sanitize(metadata.ci_run_url), ci_actor: sanitize(metadata.ci_actor),
    });
    if (version_error) throw version_error;

    const [set_error] = await this.drafts.set_version({
      id: resolved, version_id, title, description: sanitize(description, 1000), repo_org: sanitize(metadata.repo_org), repo_name: sanitize(metadata.repo_name), repo_host: sanitize(metadata.repo_host),
    });
    if (set_error) throw set_error;

    void this.audit.record({
      account_id, api_key_id, action: existing ? 'draft.update' : 'draft.create', resource_type: 'draft', resource_id: resolved, metadata: { version_id, version_number, file_size: size }, source_ip, user_agent,
    });

    logger.info(`uploaded draft [${resolved}] version [${version_number}]`);

    return {
      status: existing ? 200 : 201,
      body: {
        ok: true, draft_id: resolved, version_id, version_number, title, public_url: `${config.base}/d/${resolved}`, raw_url: `${config.base}/d/${resolved}/raw`, warnings: validation.warnings, request_id,
      },
    };
  };

  private find_existing = async (draft_id: string | undefined, account_id: string) => {
    if (!draft_id) return undefined;

    const [error, found] = await this.drafts.find_owned(draft_id, account_id);
    if (error || !found) throw new NotFound('draft not found.');

    return found;
  };

  private create_draft = async (account_id: string, title: string, description?: string, metadata: UnknownPayloadType = {}) => {
    const [error, id] = await this.drafts.create({
      account_id, title, description: sanitize(description, 1000), repo_org: sanitize(metadata.repo_org as string), repo_name: sanitize(metadata.repo_name as string), repo_host: sanitize(metadata.repo_host as string),
    });
    if (error) throw error;

    return id;
  };
}

export { UploadsService };
