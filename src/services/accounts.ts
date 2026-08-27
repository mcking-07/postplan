import { loggerFor } from '../common';
import type { AccountsRepository } from '../database';

const logger = loggerFor('services/accounts');

class AccountsService {
  private readonly accounts: AccountsRepository;
  constructor(accounts: AccountsRepository) {
    this.accounts = accounts;
  }

  paginate = async (page: number, size: number) => {
    logger.info(`paginating accounts, page [${page}] size [${size}]`);
    return this.accounts.paginate(page, size);
  };

  promote = async (id: string, role: 'admin' | 'member') => {
    logger.info(`promoting account [${id}] to [${role}]`);

    const [error] = await this.accounts.update(id, { role });
    if (error) throw error;
  };
}

export { AccountsService };
