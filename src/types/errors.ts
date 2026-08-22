type ErrorCodeType = 'BAD_REQUEST' | 'CONFLICT' | 'NOT_FOUND' | 'RATE_LIMITED' | 'SERVICE_NOT_REGISTERED' | 'UNAUTHORIZED' | 'VALIDATION_FAILED';

type ErrorPayloadType = Record<string, unknown>;

export type { ErrorCodeType, ErrorPayloadType };
