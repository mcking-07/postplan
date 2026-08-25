import { describe, expect, it } from 'vitest';
import { Unauthorized, ValidationFailed } from '../../src/errors';
import { error_handler } from '../../src/middlewares';

describe('error handler', () => {
  it('returns CLI-compatible API errors', async () => {
    const response = error_handler(new Unauthorized('invalid api key.'), { req: { path: '/api/me' } });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ ok: false, code: 'UNAUTHORIZED', error: 'invalid api key.' });
  });

  it('returns validation errors and warnings', async () => {
    const response = error_handler(new ValidationFailed('html validation failed.', { errors: ['blocked tag.'], warnings: [] }), { req: { path: '/api/uploads' } });

    await expect(response.json()).resolves.toEqual({ ok: false, code: 'VALIDATION_FAILED', error: 'html validation failed.', errors: ['blocked tag.'], warnings: [] });
  });

  it('does not expose details for internal payloads', async () => {
    const response = error_handler(new Error('database secret'), { req: { path: '/api/me' } });

    await expect(response.json()).resolves.toEqual({ ok: false, code: 'INTERNAL_ERROR', error: 'internal server error.' });
  });
});
