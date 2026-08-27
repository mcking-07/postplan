import { loggerFor } from '../common';
import type { AuditRepository } from '../database';
import type { AuditEntityType, AuditEntryType, AuditParamsType } from '../types';

const logger = loggerFor('services/audit');

const normalize_audit = (entry: AuditEntityType): AuditEntryType => ({
  ...entry,
  account_id: entry.account_id ?? undefined,
  api_key_id: entry.api_key_id ?? undefined,
  resource_type: entry.resource_type ?? undefined,
  resource_id: entry.resource_id ?? undefined,
  source_ip: entry.source_ip ?? undefined,
  user_agent: entry.user_agent ?? undefined,
});

class AuditService {
  private readonly audit: AuditRepository;
  constructor(audit: AuditRepository) {
    this.audit = audit;
  }

  record = async (params: AuditParamsType) => {
    logger.info(`recording audit event [${params.action}] for account [${params.account_id}]`);

    const [error, id] = await this.audit.record(params);
    if (error) throw error;

    return id;
  };

  paginate = async (page: number, size: number) => {
    logger.info(`paginating audit entries, page [${page}] size [${size}]`);
    const result = await this.audit.paginate(page, size, 'created_at');

    return { ...result, rows: result.rows.map(normalize_audit) };
  };
}

export { AuditService };
