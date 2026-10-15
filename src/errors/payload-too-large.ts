import { BaseError } from './base-error';
import type { ErrorPayloadType } from '../types';

class PayloadTooLarge extends BaseError {
  constructor(message: string, payload?: ErrorPayloadType) {
    super(message, 'PAYLOAD_TOO_LARGE', payload);
  }
}

export { PayloadTooLarge };
