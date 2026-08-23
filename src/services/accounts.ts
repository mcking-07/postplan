import { loggerFor } from '../common';
import type { AccountsRepository } from '../database';

const logger = loggerFor('services/accounts');

class AccountsService {
  private readonly accounts: AccountsRepository;
  constructor(accounts: AccountsRepository) {
    this.accounts = accounts;
  }

  list = async () => {
    logger.info('listing all accounts');
    return this.accounts.read();
  };

  promote = async (id: string, role: 'admin' | 'member') => {
    logger.info(`promoting account [${id}] to [${role}]`);

    const [error] = await this.accounts.update(id, { role });
    if (error) throw error;
  };
}

export { AccountsService };
