import { loggerFor } from '../common';
import type { AccountsRepository } from '../database';
import type { AccountFlagType } from '../types';

const logger = loggerFor('services/accounts');

class AccountsService {
  private readonly accounts: AccountsRepository;
  constructor(accounts: AccountsRepository) {
    this.accounts = accounts;
  }

  paginate = async (page: number, size: number) => {
    logger.info(`paginating accounts, page [${page}] size [${size}]`);
    const result = await this.accounts.paginate(page, size);

    return { ...result, rows: result.rows.map(account => ({ ...account, flags: JSON.parse(account.flags) })) };
  };

  promote = async (id: string, role: 'admin' | 'member') => {
    logger.info(`promoting account [${id}] to [${role}]`);

    const [error] = await this.accounts.update(id, { role });
    if (error) throw error;
  };

  update_flags = async (id: string, flags: AccountFlagType[]) => {
    logger.info(`setting flags [${flags.join(', ')}] for account [${id}]`);

    const [error] = await this.accounts.update(id, { flags: JSON.stringify(flags) });
    if (error) throw error;
  };
}

export { AccountsService };
