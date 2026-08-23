import { verifyWithJwks } from 'hono/jwt';
import { hash, loggerFor } from '../common';
import { config } from '../config';
import { Unauthorized } from '../errors';
import type { AccountsRepository, KeysRepository } from '../database';
import type { AccessClaimsType, AccountType } from '../types';

const logger = loggerFor('services/authentication');


class AuthenticationService {
  private readonly accounts: AccountsRepository;
  private readonly keys: KeysRepository;
  constructor(accounts: AccountsRepository, keys: KeysRepository) {
    this.accounts = accounts;
    this.keys = keys;
  }

  verify_bearer = async (token: string) => {
    const hashed = await hash(token);

    const [error, key] = await this.keys.find_by_hash(hashed);
    if (error || !key) throw new Unauthorized('invalid api key.');

    const account = await this.accounts.read(key.account_id);
    if (!account) throw new Unauthorized('account not found.');

    void this.keys.touch(key.id);
    logger.info(`bearer authenticated account [${account.id}] with key [${key.id}]`);

    return {
      account: { id: account.id, email: account.email, role: account.role },
      key: { id: key.id, name: key.name, account_id: key.account_id },
    };
  };

  verify_access = async (token?: string) => {
    const { cloudflare } = config;

    if ('developer' in cloudflare) {
      logger.info(`development mode, using developer email [${cloudflare.developer}]`);
      return this.find_or_create(cloudflare.developer);
    }

    if (!token) throw new Unauthorized('missing cloudflare access token.');

    const options = { jwks_uri: cloudflare.jwks_uri, allowedAlgorithms: cloudflare.algorithms, verification: { aud: cloudflare.audience } };
    const request_init = { cf: { cacheEverything: true, cacheTtl: 300 } };

    const claims = await verifyWithJwks(token, options, request_init).catch(() => {
      throw new Unauthorized('invalid or expired cloudflare access token.');
    }) as AccessClaimsType;

    if (!claims?.email) throw new Unauthorized('invalid or expired cloudflare access token.');
    logger.info(`access token verified for [${claims.email}]`);

    return this.find_or_create(claims.email);
  };

  private find_or_create = async (email: string): Promise<AccountType> => {
    const normalized = email.toLowerCase().trim();

    const [find_error, existing] = await this.accounts.find_by_email(normalized);
    if (find_error) throw find_error;

    if (existing) return this.reconcile(existing, normalized);

    const role = config.admins.includes(normalized) ? 'admin' : 'member';
    logger.info(`creating account for [${normalized}] with role [${role}]`);

    const [create_error, id] = await this.accounts.create({ email: normalized, role });
    if (create_error) throw create_error;

    const created = await this.accounts.read(id);
    if (!created) throw new Unauthorized('failed to provision account.');

    return created;
  };

  private reconcile = async (account: AccountType, email: string): Promise<AccountType> => {
    const { admins } = config;

    if (admins.includes(email) && account.role !== 'admin') {
      logger.info(`promoting account [${account.id}] to admin`);

      const [error] = await this.accounts.update(account.id, { role: 'admin' });
      if (error) throw error;

      const updated = await this.accounts.read(account.id);
      return updated ?? account;
    }

    return account;
  };
}

export { AuthenticationService };
