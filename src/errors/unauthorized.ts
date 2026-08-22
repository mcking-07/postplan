import { BaseError } from './base-error';
import type { ErrorPayloadType } from '../types';

class Unauthorized extends BaseError {
  constructor(message: string, payload?: ErrorPayloadType) {
    super(message, 'UNAUTHORIZED', payload);
  }
}

export { Unauthorized };
