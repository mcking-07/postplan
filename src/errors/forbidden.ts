import { BaseError } from './base-error';
import type { ErrorPayloadType } from '../types';

class Forbidden extends BaseError {
  constructor(message: string, payload?: ErrorPayloadType) {
    super(message, 'FORBIDDEN', payload);
  }
}

export { Forbidden };
