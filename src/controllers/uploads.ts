import type { Context } from 'hono';
import { inbound, loggerFor, outbound, responsify } from '../common';
import { config } from '../config';
import { BadRequest, ValidationFailed } from '../errors';
import { validate } from '../policy';
import { services } from '../services';
import type { BearerVariablesType, UploadRequestType } from '../types';

const logger = loggerFor('controllers/uploads');

class UploadController {
  private get_uploads_service = () => services.resolve('service:uploads');

  create = async (context: Context<BearerVariablesType>) => {
    const raw = await context.req.json().catch(() => {
      throw new BadRequest('invalid request body.');
    });

    if (typeof raw.html !== 'string') throw new BadRequest('missing html field.');

    const body = inbound<UploadRequestType>(raw);
    const validation = validate(body.html, config.bytes.maximum);

    if (!validation.ok) throw new ValidationFailed('html validation failed.', { errors: validation.errors, warnings: validation.warnings });

    const account = context.get('account');
    const key = context.get('key');

    const service = this.get_uploads_service();
    logger.info(`uploading draft for account [${account.id}]`);

    const result = await service.upload({
      request: body, account_id: account.id, api_key_id: key.id, source_ip: context.req.header('x-real-ip') ?? context.req.header('cf-connecting-ip'), user_agent: context.req.header('user-agent'), request_id: context.get('requestId'),
    }, validation);

    return responsify({ status: result.status, body: outbound(result.body) });
  };
}

export { UploadController };
