import { BaseError } from './base-error';
import type { ErrorPayloadType } from '../types';

class Conflict extends BaseError {
  constructor(message: string, payload?: ErrorPayloadType) {
    super(message, 'CONFLICT', payload);
  }
}

export { Conflict };
