type ErrorCodeType = 'BAD_REQUEST' | 'CONFLICT' | 'FORBIDDEN' | 'NOT_FOUND' | 'PAYLOAD_TOO_LARGE' | 'RATE_LIMITED' | 'SERVICE_NOT_REGISTERED' | 'SERVICE_UNAVAILABLE' | 'UNAUTHORIZED' | 'VALIDATION_FAILED';

type ErrorPayloadType = Record<string, unknown>;

export type { ErrorCodeType, ErrorPayloadType };
