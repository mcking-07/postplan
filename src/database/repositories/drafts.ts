import { customAlphabet as custom_nanoid } from 'nanoid';
import { safe } from '../../common';
import type { Database } from '../database';
import { Repository } from './repository';
import type { DraftEntityType, DraftSummaryRowType, SetVersionParamsType } from '../../types/draft';

class DraftsRepository extends Repository<DraftEntityType> {
  constructor(database: Database) {
    super(database, 'drafts');
  }

  protected override id = () => custom_nanoid('0123456789abcdefghijklmnopqrstuvwxyz')(12);

  find_by_id = safe(async (id: string) => {
    return this.database.get<DraftEntityType>('SELECT * FROM drafts WHERE id = ? COLLATE NOCASE', [id]);
  });

  find_public = safe(async (reference: string) => {
    return this.database.get<DraftEntityType>('SELECT * FROM drafts WHERE (id = ? COLLATE NOCASE OR slug = ?) AND deleted_at IS NULL AND disabled_at IS NULL', [reference, reference]);
  });

  find_by_slug = safe(async (slug: string) => {
    return this.database.get<DraftEntityType>('SELECT * FROM drafts WHERE slug = ?', [slug]);
  });

  find_owned = safe(async (id: string, account_id: string) => {
    return this.database.get<DraftEntityType>('SELECT * FROM drafts WHERE id = ? COLLATE NOCASE AND account_id = ? AND deleted_at IS NULL AND disabled_at IS NULL', [id, account_id]);
  });

  find_by_account = safe(async (account_id: string) => {
    return this.database.query<DraftEntityType>('SELECT * FROM drafts WHERE account_id = ? AND deleted_at IS NULL AND disabled_at IS NULL ORDER BY updated_at DESC', [account_id]);
  });

  set_version = safe(async (params: SetVersionParamsType) => {
    const query = `
      UPDATE drafts
      SET
        current_version_id = ?, slug = COALESCE(?, slug), title = ?, description = COALESCE(?, description), repo_org = COALESCE(?, repo_org),
        repo_name = COALESCE(?, repo_name), repo_host = COALESCE(?, repo_host), updated_at = COALESCE(?, updated_at)
      WHERE id = ?`;
    const values = [
      params.version_id, this.nullable(params.slug), params.title, this.nullable(params.description), this.nullable(params.repo_org),
      this.nullable(params.repo_name), this.nullable(params.repo_host), params.touch ? this.timestamp() : null, params.id,
    ];

    return this.database.run(query, values);
  });

  remove = safe(async (id: string, account_id: string) => {
    const timestamp = this.timestamp();

    return this.database.get<Pick<DraftEntityType, 'id'>>('UPDATE drafts SET deleted_at = ?, slug = NULL, updated_at = ? WHERE id = ? COLLATE NOCASE AND account_id = ? AND deleted_at IS NULL RETURNING id', [timestamp, timestamp, id, account_id]);
  });

  disable = safe(async (id: string, reason: string) => {
    const timestamp = this.timestamp();

    return this.database.get<Pick<DraftEntityType, 'id'>>('UPDATE drafts SET disabled_at = ?, disabled_reason = ?, updated_at = ? WHERE id = ? COLLATE NOCASE AND deleted_at IS NULL RETURNING id', [timestamp, reason, timestamp, id]);
  });

  list_with_stats = safe(async (account_id: string) => {
    const query = `
      SELECT
        drafts.id, drafts.slug, drafts.title, drafts.description, drafts.repo_org, drafts.repo_name, drafts.repo_host, drafts.created_at, drafts.updated_at, drafts.disabled_at,
        current_version.version_number AS latest_version_number, current_version.created_at AS latest_version_at, COALESCE(current_version.page_count, 1) AS page_count, COALESCE(version_counts.total, 0) AS version_count
      FROM drafts
      LEFT JOIN draft_versions AS current_version ON current_version.id = drafts.current_version_id
      LEFT JOIN (SELECT draft_id, COUNT(*) AS total FROM draft_versions GROUP BY draft_id) AS version_counts ON version_counts.draft_id = drafts.id
      WHERE drafts.account_id = ? AND drafts.deleted_at IS NULL AND drafts.disabled_at IS NULL
      ORDER BY drafts.updated_at DESC`;

    return this.database.query<DraftSummaryRowType>(query, [account_id]);
  });
}

export { DraftsRepository };
