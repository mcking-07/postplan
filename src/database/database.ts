import { loggerFor, safe } from '../common';
import type { DatabaseParamType } from '../types';

const logger = loggerFor('database/database');

class Database {
  private readonly database: D1Database;
  constructor(database: D1Database) {
    this.database = database;
  }

  ping = safe(async () => {
    return this.database.prepare('SELECT 1').first();
  });

  get = async <Entity>(sql: string, params: DatabaseParamType[] = []) => {
    logger.info(`get: ${sql}`);
    return this.database.prepare(sql).bind(...params).first<Entity>();
  };

  query = async <Entity>(sql: string, params: DatabaseParamType[] = []) => {
    logger.info(`query: ${sql}`);
    const result = await this.database.prepare(sql).bind(...params).all<Entity>();
    return result.results;
  };

  run = async (sql: string, params: DatabaseParamType[] = []) => {
    logger.info(`run: ${sql}`);
    return this.database.prepare(sql).bind(...params).run();
  };
}

export { Database };
