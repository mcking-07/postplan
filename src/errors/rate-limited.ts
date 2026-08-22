import { BaseError } from './base-error';
import type { ErrorPayloadType } from '../types';

class RateLimited extends BaseError {
  constructor(message = 'Too many requests.', payload?: ErrorPayloadType) {
    super(message, 'RATE_LIMITED', payload);
  }
}

export { RateLimited };
