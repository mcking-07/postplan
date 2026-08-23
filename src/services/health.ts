import { loggerFor } from '../common';
import type { Database } from '../database';

const logger = loggerFor('services/health');

class HealthService {
  private readonly database: Database;
  constructor(database: Database) {
    this.database = database;
  }

  check = async () => {
    const [error] = await this.database.ping();
    const status = error ? 'unhealthy' : 'healthy';

    logger.info(`health check: ${status}`);
    return { status, timestamp: new Date().toISOString() };
  };
}

export { HealthService };
