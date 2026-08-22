import type { Context } from 'hono';
import { loggerFor } from './logger';

const logger = loggerFor('common/schedule');

const schedule = (context: Context, task: Promise<unknown>, label: string) => {
  context.executionCtx.waitUntil(task.catch(error => logger.error(`background task [${label}] failed with:`, error)));
};

export { schedule };
