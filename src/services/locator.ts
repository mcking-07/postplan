import { loggerFor } from '../common';
import { ServiceNotRegistered } from '../errors';
import { AccountsRepository, AuditRepository, Database, DraftsRepository, KeysRepository, VersionsRepository } from '../database';
import { Storage } from '../storage';
import { AccountsService } from './accounts';
import { AuditService } from './audit';
import { AuthenticationService } from './authentication';
import { DraftsService } from './drafts';
import { HealthService } from './health';
import { KeysService } from './keys';
import { UploadsService } from './uploads';
import type { EnvironmentType } from '../types';

const logger = loggerFor('services/locator');

type RegistryType = {
  'database': Database;
  'storage': Storage;
  'database:accounts': AccountsRepository;
  'database:audit': AuditRepository;
  'database:drafts': DraftsRepository;
  'database:keys': KeysRepository;
  'database:versions': VersionsRepository;
  'service:accounts': AccountsService;
  'service:authentication': AuthenticationService;
  'service:health': HealthService;
  'service:audit': AuditService;
  'service:drafts': DraftsService;
  'service:keys': KeysService;
  'service:uploads': UploadsService;
};

class ServiceRegistry {
  private readonly registry: Map<string, RegistryType[keyof RegistryType]>;
  private ready: boolean;
  constructor() {
    this.registry = new Map();
    this.ready = false;
  }

  register = <Key extends keyof RegistryType>(name: Key, instance: RegistryType[Key]) => {
    if (this.registry.has(name)) {
      logger.warn(`service [${name}] is already registered`);
    }

    this.registry.set(name, instance);
  };

  resolve = <Key extends keyof RegistryType>(name: Key) => {
    const service = this.registry.get(name);
    if (!service) throw new ServiceNotRegistered(`service [${name}] is not registered`, { service: name });

    return service as RegistryType[Key];
  };

  reset = () => {
    this.registry.clear();
    this.ready = false;
  };

  initialized = () => this.ready;

  seal = () => { this.ready = true; };
}

const services = new ServiceRegistry();

const bootstrap = (env: EnvironmentType) => {
  if (services.initialized()) return;

  services.register('database', new Database(env.DATABASE));
  services.register('storage', new Storage(env.STORAGE));

  services.register('database:accounts', new AccountsRepository(services.resolve('database')));
  services.register('database:audit', new AuditRepository(services.resolve('database')));
  services.register('database:drafts', new DraftsRepository(services.resolve('database')));
  services.register('database:keys', new KeysRepository(services.resolve('database')));
  services.register('database:versions', new VersionsRepository(services.resolve('database')));

  services.register('service:accounts', new AccountsService(services.resolve('database:accounts')));
  services.register('service:audit', new AuditService(services.resolve('database:audit')));
  services.register('service:health', new HealthService(services.resolve('database')));
  services.register('service:authentication', new AuthenticationService(services.resolve('database:accounts'), services.resolve('database:keys')));
  services.register('service:drafts', new DraftsService(services.resolve('database:drafts'), services.resolve('database:versions'), services.resolve('storage')));
  services.register('service:keys', new KeysService(services.resolve('database:keys')));
  services.register('service:uploads', new UploadsService(services.resolve('database:drafts'), services.resolve('database:versions'), services.resolve('storage')));

  services.seal();
  logger.info('services initialized');
};

export { bootstrap, services, ServiceRegistry };
