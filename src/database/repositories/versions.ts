import { safe } from '../../common';
import { NotFound } from '../../errors';
import type { Database } from '../database';
import { Repository } from './repository';
import type { CreateVersionParamsType, DraftVersionEntityType } from '../../types/draft-version';

class VersionsRepository extends Repository<DraftVersionEntityType> {
  constructor(database: Database) {
    super(database, 'draft_versions');
  }

  create_version = safe(async (params: CreateVersionParamsType) => {
    const query = `
      INSERT INTO draft_versions (
        id, draft_id, version_number, object_key, content_hash, file_size, created_at, updated_at, created_by_api_key_id, source_ip, user_agent, cli_version,
        git_branch, git_commit_sha, git_commit_subject, git_dirty, original_filename, request_id, has_inline_script, external_image_hosts, ci_run_url, ci_actor
      ) VALUES (?, ?, (SELECT COALESCE(MAX(version_number), 0) + 1 FROM draft_versions WHERE draft_id = ?), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING version_number`;

    const values = [
      params.id, params.draft_id, params.draft_id, params.object_key,
      params.content_hash, params.file_size, this.timestamp(), this.timestamp(), params.api_key_id,
      this.nullable(params.source_ip), this.nullable(params.user_agent), this.nullable(params.cli_version),
      this.nullable(params.git_branch), this.nullable(params.git_commit_sha), this.nullable(params.git_commit_subject),
      this.nullable(params.git_dirty), this.nullable(params.original_filename), this.nullable(params.request_id),
      params.has_inline_script, params.external_image_hosts,
      this.nullable(params.ci_run_url), this.nullable(params.ci_actor),
    ];

    const rows = await this.database.query<{ version_number: number }>(query, values);
    if (!rows[0]) throw new NotFound('failed to create version');

    return rows[0].version_number;
  });

  find_by_number = safe(async (draft_id: string, number: number) => {
    return this.database.get<DraftVersionEntityType>('SELECT * FROM draft_versions WHERE draft_id = ? AND version_number = ?', [draft_id, number]);
  });

  find_by_draft = safe(async (draft_id: string) => {
    return this.database.query<DraftVersionEntityType>('SELECT * FROM draft_versions WHERE draft_id = ? ORDER BY version_number DESC', [draft_id]);
  });
}

export { VersionsRepository };
