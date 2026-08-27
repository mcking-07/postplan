import { nanoid } from 'nanoid';
import { safe } from '../../common';
import type { Database } from '../database';
import type { DatabaseParamType } from '../../types';

const resolve_page = (page: number, size: number, total: number) => {
  const pages = Math.max(1, Math.ceil(total / size));
  const clamped = Math.min(Math.max(1, page), pages);
  const offset = (clamped - 1) * size;

  return { pages, page: clamped, offset };
};

class Repository<Entity = Record<string, unknown>> {
  protected readonly database: Database;
  protected readonly table: string;
  constructor(database: Database, table: string) {
    this.database = database;
    this.table = table;
  }

  protected id = () => nanoid(12);

  protected timestamp = () => new Date().toISOString();

  protected nullable = (value?: DatabaseParamType) => value ?? null;

  read(): Promise<Entity[]>;
  read(id: string): Promise<Entity | null>;
  async read(id?: string): Promise<Entity | Entity[] | null> {
    if (!id) return this.database.query<Entity>(`SELECT * FROM ${this.table} ORDER BY updated_at DESC`);
    return this.database.get<Entity>(`SELECT * FROM ${this.table} WHERE id = ?`, [id]);
  }

  create = safe(async (payload: Partial<Entity>) => {
    const id = this.id();
    const timestamp = this.timestamp();

    const record = { id, ...payload, created_at: timestamp, updated_at: timestamp };

    const keys = Object.keys(record);
    const values = Object.values(record).map(this.nullable) as DatabaseParamType[];
    const placeholders = keys.map(() => '?').join(', ');

    await this.database.run(`INSERT INTO ${this.table} (${keys.join(', ')}) VALUES (${placeholders})`, values);
    return id;
  });

  update = safe(async (id: string, payload: Partial<Entity>) => {
    const keys = Object.keys(payload);
    const values = Object.values(payload) as DatabaseParamType[];
    const clause = keys.map(key => `${key} = ?`).join(', ');

    return this.database.run(`UPDATE ${this.table} SET ${clause}, updated_at = ? WHERE id = ?`, [...values, this.timestamp(), id]);
  });

  delete = safe(async (id: string) => {
    return this.database.run(`DELETE FROM ${this.table} WHERE id = ?`, [id]);
  });

  paginate = async (page: number, size: number, order_by = 'updated_at') => {
    const { count = 0 } = await this.database.get<{ count: number }>(`SELECT COUNT(*) AS count FROM ${this.table}`) ?? {};
    const { pages, page: clamped, offset } = resolve_page(page, size, count);

    const rows = await this.database.query<Entity>(`SELECT * FROM ${this.table} ORDER BY ${order_by} DESC LIMIT ? OFFSET ?`, [size, offset]);

    return { rows, page: clamped, pages, total: count };
  };
}

export { Repository };
