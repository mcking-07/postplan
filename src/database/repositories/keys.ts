import { safe } from '../../common';
import type { Database } from '../database';
import { Repository } from './repository';
import type { ApiKeyEntityType, ApiKeySummaryEntityType } from '../../types/api-key';

class KeysRepository extends Repository<ApiKeyEntityType> {
  constructor(database: Database) {
    super(database, 'api_keys');
  }

  find_by_hash = safe(async (hash: string) => {
    return this.database.get<ApiKeyEntityType>('SELECT * FROM api_keys WHERE key_hash = ? AND revoked_at IS NULL', [hash]);
  });

  find_by_account = safe(async (account_id: string) => {
    return this.database.query<ApiKeySummaryEntityType>('SELECT id, account_id, name, created_at, last_used_at, revoked_at FROM api_keys WHERE account_id = ? ORDER BY created_at DESC', [account_id]);
  });

  revoke = safe(async (id: string, account_id: string) => {
    const { meta } = await this.database.run('UPDATE api_keys SET revoked_at = ? WHERE id = ? AND account_id = ? AND revoked_at IS NULL', [this.timestamp(), id, account_id]);

    return meta.changes > 0;
  });

  touch = safe(async (id: string) => {
    return this.database.run('UPDATE api_keys SET last_used_at = ? WHERE id = ?', [this.timestamp(), id]);
  });
}

export { KeysRepository };
