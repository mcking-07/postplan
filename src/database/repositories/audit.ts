import { safe } from '../../common';
import type { Database } from '../database';
import { Repository } from './repository';
import type { AuditEntityType, AuditParamsType } from '../../types/audit';

class AuditRepository extends Repository<AuditEntityType> {
  constructor(database: Database) {
    super(database, 'audit_log');
  }

  record = safe(async (params: AuditParamsType) => {
    const id = this.id();

    const query = 'INSERT INTO audit_log (id, account_id, api_key_id, action, resource_type, resource_id, metadata, source_ip, user_agent, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const values = [
      id, params.account_id, this.nullable(params.api_key_id), params.action, params.resource_type, params.resource_id,
      JSON.stringify(params.metadata ?? {}), this.nullable(params.source_ip), this.nullable(params.user_agent), this.timestamp(), this.timestamp(),
    ];

    await this.database.run(query, values);
    return id;
  });

  recent = safe(async (limit: number = 100) => {
    return this.database.query<AuditEntityType>('SELECT * FROM audit_log ORDER BY created_at DESC LIMIT ?', [limit]);
  });
}

export { AuditRepository };
