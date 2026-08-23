import { safe } from '../../common';
import type { Database } from '../database';
import { Repository } from './repository';
import type { AccountEntityType } from '../../types/account';

class AccountsRepository extends Repository<AccountEntityType> {
  constructor(database: Database) {
    super(database, 'accounts');
  }

  find_by_email = safe(async (email: string) => {
    return this.database.get<AccountEntityType>('SELECT * FROM accounts WHERE email = ? COLLATE NOCASE', [email]);
  });
}

export { AccountsRepository };
