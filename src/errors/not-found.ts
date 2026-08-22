import { BaseError } from './base-error';
import type { ErrorPayloadType } from '../types';

class NotFound extends BaseError {
  constructor(message: string, payload?: ErrorPayloadType) {
    super(message, 'NOT_FOUND', payload);
  }
}

export { NotFound };
