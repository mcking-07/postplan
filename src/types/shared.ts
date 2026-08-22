type NullableType<Value> = Value | null;

type DatabaseParamType = string | number | null | ArrayBuffer;

type UnknownPayloadType = Record<string, unknown>;

type AccountRoleType = 'admin' | 'member';

export type { AccountRoleType, NullableType, DatabaseParamType, UnknownPayloadType };
