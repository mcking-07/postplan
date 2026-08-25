import { env } from 'cloudflare:workers';
import { AccountsRepository, AuditRepository, Database, DraftsRepository, KeysRepository, VersionsRepository } from '../../src/database';

type TestRepositoriesType = {
  accounts: AccountsRepository;
  audit: AuditRepository;
  drafts: DraftsRepository;
  keys: KeysRepository;
  versions: VersionsRepository;
};

const create_repositories = (): TestRepositoriesType => {
  const database = new Database(env.DATABASE);

  return {
    accounts: new AccountsRepository(database),
    audit: new AuditRepository(database),
    drafts: new DraftsRepository(database),
    keys: new KeysRepository(database),
    versions: new VersionsRepository(database),
  };
};

export type { TestRepositoriesType };
export { create_repositories };
