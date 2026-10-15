import { BaseError } from './base-error';
import type { ErrorPayloadType } from '../types';

class ServiceUnavailable extends BaseError {
  constructor(message: string, payload?: ErrorPayloadType) {
    super(message, 'SERVICE_UNAVAILABLE', payload);
  }
}

export { ServiceUnavailable };
