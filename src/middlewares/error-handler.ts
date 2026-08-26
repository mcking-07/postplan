import { loggerFor, responsify } from '../common';
import { BaseError } from '../errors';
import type { ErrorCodeType } from '../types';
import { render_error } from '../views';

const logger = loggerFor('middlewares/error-handler');

const status_codes = new Map<ErrorCodeType, number>([
  ['BAD_REQUEST', 400],
  ['UNAUTHORIZED', 401],
  ['NOT_FOUND', 404],
  ['CONFLICT', 409],
  ['VALIDATION_FAILED', 422],
  ['RATE_LIMITED', 429],
  ['SERVICE_NOT_REGISTERED', 500],
]);

const error_handler = (error: Error, context: { req: { path: string } }) => {
  logger.error('an error occurred:', error);

  const is_api = context.req.path.startsWith('/api/');

  if (error instanceof BaseError) {
    const { code, message, payload } = error;
    const status = status_codes.get(code) ?? 500;

    if (!is_api) return responsify({ status, html: render_error(status, message) });

    const body = { ok: false, code, error: message, errors: payload?.errors, warnings: payload?.warnings };
    return responsify({ status, body });
  }

  if (!is_api) return responsify({ status: 500, html: render_error(500, 'internal server error.') });

  return responsify({ status: 500, body: { ok: false, code: 'INTERNAL_ERROR', error: 'internal server error.' } });
};

export { error_handler };
