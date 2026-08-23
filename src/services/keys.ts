import { hash, loggerFor, random } from '../common';
import type { KeysRepository } from '../database';
import type { ApiKeySummaryEntityType, ApiKeySummaryType } from '../types';

const logger = loggerFor('services/keys');

const normalize_api_key = (key: ApiKeySummaryEntityType): ApiKeySummaryType => ({ ...key, last_used_at: key.last_used_at ?? undefined, revoked_at: key.revoked_at ?? undefined });

class KeysService {
  private readonly keys: KeysRepository;
  constructor(keys: KeysRepository) {
    this.keys = keys;
  }

  mint = async (account_id: string, name: string) => {
    const token = `pp_${await random(32)}`;

    const hashed = await hash(token);
    const resolved = name || 'cli-api-key';

    logger.info(`minting api key [${resolved}] for account [${account_id}]`);

    const [error, id] = await this.keys.create({ account_id, name: resolved, key_hash: hashed });
    if (error) throw error;

    return { id, token };
  };

  revoke = async (id: string, account_id: string) => {
    logger.info(`revoking api key [${id}] for account [${account_id}]`);

    const [error, revoked] = await this.keys.revoke(id, account_id);
    if (error) throw error;

    return revoked;
  };

  list = async (account_id: string) => {
    logger.info(`listing api keys for account [${account_id}]`);

    const [error, keys] = await this.keys.find_by_account(account_id);
    if (error) throw error;

    return (keys ?? []).map(normalize_api_key);
  };
}

export { KeysService };
