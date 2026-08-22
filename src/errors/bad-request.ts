import { BaseError } from './base-error';
import type { ErrorPayloadType } from '../types';

class BadRequest extends BaseError {
  constructor(message: string, payload?: ErrorPayloadType) {
    super(message, 'BAD_REQUEST', payload);
  }
}

export { BadRequest };
