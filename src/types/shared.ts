type NullableType<Value> = Value | null;

type DatabaseParamType = string | number | null | ArrayBuffer;

type UnknownPayloadType = Record<string, unknown>;

type AccountRoleType = 'admin' | 'member';

type PageType<Value> = {
  rows: Value[];
  page: number;
  pages: number;
  total: number;
};

export type { AccountRoleType, NullableType, DatabaseParamType, PageType, UnknownPayloadType };
