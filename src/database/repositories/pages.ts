import { safe } from '../../common';
import type { Database } from '../database';
import { Repository } from './repository';
import type { CreatePageParamsType, DraftPageEntityType } from '../../types/draft-page';

class PagesRepository extends Repository<DraftPageEntityType> {
  constructor(database: Database) {
    super(database, 'draft_pages');
  }

  create_pages = safe(async (draft_version_id: string, pages: CreatePageParamsType[]) => {
    const timestamp = this.timestamp();
    const rows = pages.map(page => ({ id: this.id(), ...page }));

    const query = `
      INSERT INTO draft_pages (id, draft_version_id, path, object_key, content_hash, file_size, title, has_inline_script, created_at, updated_at)
      SELECT
        json_extract(value, '$.id'), ?, json_extract(value, '$.path'), json_extract(value, '$.object_key'), json_extract(value, '$.content_hash'),
        json_extract(value, '$.file_size'), json_extract(value, '$.title'), json_extract(value, '$.has_inline_script'), ?, ?
      FROM json_each(?)`;

    return this.database.run(query, [draft_version_id, timestamp, timestamp, JSON.stringify(rows)]);
  });

  find_by_version = safe(async (draft_version_id: string) => {
    return this.database.query<DraftPageEntityType>('SELECT * FROM draft_pages WHERE draft_version_id = ? ORDER BY path', [draft_version_id]);
  });
}

export { PagesRepository };
