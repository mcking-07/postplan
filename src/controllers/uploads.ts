import type { Context } from 'hono';
import { inbound, loggerFor, outbound, responsify, schedule } from '../common';
import { config } from '../config';
import { BadRequest, ValidationFailed } from '../errors';
import { validate } from '../policy';
import { services } from '../services';
import type { AuditActionType, BearerVariablesType, UploadPageType, UploadRequestType, ValidationInputType } from '../types';

const logger = loggerFor('controllers/uploads');

class UploadController {
  private get_uploads_service = () => services.resolve('service:uploads');
  private get_audit_service = () => services.resolve('service:audit');

  private audit_action = (created: boolean, unchanged: boolean): AuditActionType => {
    if (created) return 'draft.create';

    return unchanged ? 'draft.unchanged' : 'draft.update';
  };

  private parse_request = async (context: Context<BearerVariablesType>) => {
    const raw = await context.req.json().catch(() => {
      throw new BadRequest('invalid request body.');
    });

    return inbound<UploadRequestType>(raw);
  };

  private extract_pages = (body?: UploadRequestType) => Array.isArray(body?.files) && body?.files?.length ? body.files : [{ path: 'index.html', html: body?.html }];

  private extract_input = (pages: UploadPageType[], body?: UploadRequestType): ValidationInputType => ({ pages, slug: body?.slug, description: body?.description });

  create = async (context: Context<BearerVariablesType>) => {
    const body = await this.parse_request(context);

    const validation = await validate(this.extract_input(this.extract_pages(body), body), config.bytes.maximum, config.pages.maximum);
    if (!validation.ok) throw new ValidationFailed('upload validation failed.', { errors: validation.errors, warnings: validation.warnings, issues: validation.issues });

    const account = context.get('account');
    const key = context.get('key');

    const service = this.get_uploads_service();
    logger.info(`uploading draft for account [${account.id}]`);

    const receipt = await service.upload({
      request: body, account_id: account.id, flags: account.flags, api_key_id: key.id, request_id: context.get('requestId'),
      source_ip: context.req.header('x-real-ip') ?? context.req.header('cf-connecting-ip'), user_agent: context.req.header('user-agent'),
    }, validation);

    const audit = this.get_audit_service();
    schedule(context, audit.record({
      account_id: account.id, api_key_id: key.id, action: this.audit_action(receipt.created, receipt.unchanged),
      resource_type: 'draft', resource_id: receipt.draft_id,
      metadata: { version_id: receipt.version_id, version_number: receipt.version_number, file_size: receipt.total_bytes },
      source_ip: context.req.header('x-real-ip') ?? context.req.header('cf-connecting-ip'), user_agent: context.req.header('user-agent'),
    }), 'upload audit');

    return responsify({ status: receipt.created ? 201 : 200, body: outbound({ ...receipt, account: { id: account.id, name: account.email } }) });
  };

  check = async (context: Context<BearerVariablesType>) => {
    const body = await this.parse_request(context);

    const has_pages = body?.html !== undefined || body?.files !== undefined;
    const pages = has_pages ? this.extract_pages(body) : [];

    const validation = await validate(this.extract_input(pages, body), config.bytes.maximum, config.pages.maximum);
    const service = this.get_uploads_service();

    const account = context.get('account');
    const key = context.get('key');

    logger.info(`checking upload for account [${account.id}]`);
    const report = await service.check(account.id, account.flags, validation, has_pages);

    return responsify({ status: 200, body: outbound({ ...report, account: { id: account.id, name: account.email, api_key_name: key.name } }) });
  };
}

export { UploadController };
