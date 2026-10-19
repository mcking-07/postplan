import { nanoid } from 'nanoid';
import { hash, loggerFor, sanitize, settle } from '../common';
import { config } from '../config';
import { Conflict, Forbidden, NotFound, ServiceUnavailable } from '../errors';
import type { DraftsRepository, PagesRepository, VersionsRepository } from '../database';
import type { Storage } from '../storage';
import type { AccountFlagType, DraftEntityType, SlugAvailabilityType, UploadContextType, ValidatedPageType, ValidationResultType } from '../types';

const logger = loggerFor('services/uploads');

const ownership = (account_id: string, slug: string, draft: DraftEntityType): SlugAvailabilityType => {
  if (draft.account_id !== account_id) return { slug, status: 'taken', message: `the custom url "${slug}" belongs to another account.` };
  if (draft.disabled_at) return { slug, status: 'unavailable', message: `the custom url "${slug}" names a disabled draft.` };

  return { slug, status: 'yours' };
};

class UploadsService {
  private readonly drafts: DraftsRepository;
  private readonly versions: VersionsRepository;
  private readonly pages: PagesRepository;
  private readonly storage: Storage;
  constructor(drafts: DraftsRepository, versions: VersionsRepository, pages: PagesRepository, storage: Storage) {
    this.drafts = drafts;
    this.versions = versions;
    this.pages = pages;
    this.storage = storage;
  }

  upload = async (context: UploadContextType, validation: ValidationResultType) => {
    const { request, account_id, flags, request_id } = context;
    const { filename, draft_id, description, metadata = {} } = request;
    const { pages, slug } = validation;

    if (slug && !flags.includes(config.flags.custom_urls)) throw new Forbidden('custom urls are not enabled for this account. upload without --slug.');

    const content_hash = await hash(pages.map(page => `${page.path}\0${page.content_hash}`).sort().join('\n'));

    const existing = await this.find_existing(account_id, draft_id, slug);
    const current = existing?.current_version_id ? await this.versions.read(existing.current_version_id) : null;

    const unchanged = current?.content_hash === content_hash;
    const title = validation.title ?? existing?.title ?? sanitize(filename) ?? 'Untitled Draft';

    const resolved = existing?.id ?? await this.create_draft(account_id, title);
    const version = unchanged ? current : await this.store_version(resolved, context, validation, content_hash);

    const [set_error] = await this.drafts.set_version({
      id: resolved, version_id: version.id, slug, title, description: sanitize(description, 1000), repo_org: sanitize(metadata.repo_org), repo_name: sanitize(metadata.repo_name), repo_host: sanitize(metadata.repo_host), touch: !unchanged,
    });
    if (set_error) throw set_error;

    const draft_slug = slug ?? existing?.slug ?? null;
    logger.info(`uploaded draft [${resolved}] slug [${draft_slug ?? ''}] version [${version.version_number}] with [${pages.length}] pages`);

    const draft_url = `${config.base}/d/${draft_slug ?? resolved}`;
    const trailing_slash = pages.length > 1 ? '/' : '';

    return {
      ok: true, created: !existing, unchanged, draft_id: resolved, slug: draft_slug, version_id: version.id, version_number: version.version_number, title, request_id,
      content_hash, total_bytes: validation.bytes, warnings: validation.warnings, version_url: `${config.base}/d/${resolved}/version/${version.version_number}${trailing_slash}`,
      public_url: `${draft_url}${trailing_slash}`, raw_url: `${draft_url}/raw`, pages: pages.map(page => ({ path: page.path, url: `${draft_url}/${page.path}` })),
    };
  };

  private store_version = async (draft_id: string, context: UploadContextType, validation: ValidationResultType, content_hash: string) => {
    const { request, api_key_id, source_ip, user_agent, request_id } = context;
    const { filename, metadata = {} } = request;
    const { pages } = validation;

    const id = nanoid(12);
    const page_key = (page: ValidatedPageType) => this.storage.key(draft_id, id, page.path);

    const upload_page = async (page: ValidatedPageType) => {
      const [error] = await this.storage.put(page_key(page), page.html);
      if (error) throw error;
    };

    const { errors } = await settle(pages, upload_page);
    if (errors.length) throw new ServiceUnavailable(`${errors.length} of ${pages.length} pages failed to upload. try again.`);

    const [version_error, version_number] = await this.versions.create_version({
      id, draft_id, object_key: this.storage.key(draft_id, id), content_hash, file_size: validation.bytes, api_key_id, source_ip, user_agent, cli_version: sanitize(metadata.cli_version), git_branch: sanitize(metadata.git_branch),
      git_commit_sha: sanitize(metadata.git_commit_sha), git_commit_subject: sanitize(metadata.git_commit_subject), git_dirty: typeof metadata.git_dirty === 'boolean' ? (metadata.git_dirty ? 1 : 0) : undefined,
      original_filename: sanitize(filename), request_id, has_inline_script: validation.stats.has_inline_script ? 1 : 0, external_image_hosts: JSON.stringify(validation.stats.external_image_hosts),
      ci_run_url: sanitize(metadata.ci_run_url), ci_actor: sanitize(metadata.ci_actor), page_count: pages.length,
    });
    if (version_error) throw version_error;

    const [pages_error] = await this.pages.create_pages(id, pages.map(page => ({
      path: page.path, object_key: page_key(page), content_hash: page.content_hash, file_size: page.bytes, title: page.title, has_inline_script: page.has_inline_script ? 1 : 0,
    })));
    if (pages_error) throw pages_error;

    return { id, version_number };
  };

  check = async (account_id: string, flags: AccountFlagType[], validation: ValidationResultType, has_pages: boolean) => {
    const { bytes, pages, slug, issues, errors, warnings } = validation;

    const availability = slug ? await this.find_slug_availability(account_id, flags, slug) : undefined;
    logger.info(`checked upload for account [${account_id}] with [${pages.length}] pages`);

    const ok = validation.ok && availability?.status !== 'taken' && availability?.status !== 'unavailable';
    const page_report = has_pages ? { total_bytes: bytes, pages: pages.map(page => ({ path: page.path, bytes: page.bytes, title: page.title, has_scripts: page.has_inline_script })) } : {};

    return {
      ok, flags, limits: { max_bytes: config.bytes.maximum, max_pages: config.pages.maximum },
      capabilities: { ...config.capabilities, multi_page: config.pages.maximum > 1, custom_urls: flags.includes(config.flags.custom_urls) },
      ...page_report, issues, errors, warnings, slug: availability,
    };
  };

  private find_slug_availability = async (account_id: string, flags: AccountFlagType[], slug: string): Promise<SlugAvailabilityType> => {
    logger.info(`checking slug [${slug}] for account [${account_id}]`);

    if (!flags.includes(config.flags.custom_urls)) return { slug, status: 'unavailable', message: 'custom urls are not enabled for this account. upload without --slug.' };

    const draft = await this.find_draft_by_slug(slug);
    if (!draft) return { slug, status: 'available' };

    return ownership(account_id, slug, draft);
  };

  private find_existing = async (account_id: string, draft_id?: string, slug?: string) => {
    const draft_by_slug = slug ? await this.find_draft_by_slug(slug) : undefined;
    if (!slug || !draft_by_slug) return this.find_draft_by_id(account_id, draft_id);

    const { status, message = '' } = ownership(account_id, slug, draft_by_slug);

    if (status !== 'yours') throw new Conflict(message);
    if (draft_id && draft_by_slug.id !== draft_id) throw new Conflict(`the custom url "${slug}" already names draft ${draft_by_slug.id}. upload with --slug alone to update it.`);

    return draft_by_slug;
  };

  private find_draft_by_slug = async (slug: string) => {
    const [error, draft] = await this.drafts.find_by_slug(slug);
    if (error) throw error;

    return draft;
  };

  private find_draft_by_id = async (account_id: string, draft_id?: string) => {
    if (!draft_id) return undefined;

    const [error, draft] = await this.drafts.find_owned(draft_id, account_id);
    if (error || !draft) throw new NotFound('draft not found.');

    return draft;
  };

  private create_draft = async (account_id: string, title: string) => {
    const [error, id] = await this.drafts.create({ account_id, title });
    if (error) throw error;

    return id;
  };
}

export { UploadsService };
