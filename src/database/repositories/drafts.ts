import { safe } from '../../common';
import type { Database } from '../database';
import { Repository } from './repository';
import type { DraftEntityType, DraftSummaryRowType, SetVersionParamsType } from '../../types/draft';

class DraftsRepository extends Repository<DraftEntityType> {
  constructor(database: Database) {
    super(database, 'drafts');
  }

  find_by_id = safe(async (id: string) => {
    return this.database.get<DraftEntityType>('SELECT * FROM drafts WHERE id = ?', [id]);
  });

  find_public = safe(async (id: string) => {
    return this.database.get<DraftEntityType>('SELECT * FROM drafts WHERE id = ? AND deleted_at IS NULL AND disabled_at IS NULL', [id]);
  });

  find_owned = safe(async (id: string, account_id: string) => {
    return this.database.get<DraftEntityType>('SELECT * FROM drafts WHERE id = ? AND account_id = ? AND deleted_at IS NULL AND disabled_at IS NULL', [id, account_id]);
  });

  find_by_account = safe(async (account_id: string) => {
    return this.database.query<DraftEntityType>('SELECT * FROM drafts WHERE account_id = ? AND deleted_at IS NULL AND disabled_at IS NULL ORDER BY updated_at DESC', [account_id]);
  });

  set_version = safe(async (params: SetVersionParamsType) => {
    const query = 'UPDATE drafts SET current_version_id = ?, title = ?, description = COALESCE(?, description), repo_org = COALESCE(?, repo_org), repo_name = COALESCE(?, repo_name), repo_host = COALESCE(?, repo_host), updated_at = ? WHERE id = ?';
    const values = [params.version_id, params.title, this.nullable(params.description), this.nullable(params.repo_org), this.nullable(params.repo_name), this.nullable(params.repo_host), this.timestamp(), params.id];

    return this.database.run(query, values);
  });

  remove = safe(async (id: string, account_id: string) => {
    const timestamp = this.timestamp();

    const { meta } = await this.database.run('UPDATE drafts SET deleted_at = ?, updated_at = ? WHERE id = ? AND account_id = ? AND deleted_at IS NULL', [timestamp, timestamp, id, account_id]);
    return meta.changes > 0;
  });

  disable = safe(async (id: string, reason: string) => {
    const timestamp = this.timestamp();

    const { meta } = await this.database.run('UPDATE drafts SET disabled_at = ?, disabled_reason = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL', [timestamp, reason, timestamp, id]);
    return meta.changes > 0;
  });

  list_with_stats = safe(async (account_id: string) => {
    const query = `
      SELECT
        drafts.id, drafts.title, drafts.description, drafts.repo_org, drafts.repo_name, drafts.repo_host, drafts.created_at, drafts.updated_at, drafts.disabled_at,
        current_version.version_number AS latest_version_number, current_version.created_at AS latest_version_at, COALESCE(version_counts.total, 0) AS version_count
      FROM drafts
      LEFT JOIN draft_versions AS current_version ON current_version.id = drafts.current_version_id
      LEFT JOIN (SELECT draft_id, COUNT(*) AS total FROM draft_versions GROUP BY draft_id) AS version_counts ON version_counts.draft_id = drafts.id
      WHERE drafts.account_id = ? AND drafts.deleted_at IS NULL AND drafts.disabled_at IS NULL
      ORDER BY drafts.updated_at DESC`;

    return this.database.query<DraftSummaryRowType>(query, [account_id]);
  });
}

export { DraftsRepository };
