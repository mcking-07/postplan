import { tryGetContext } from 'hono/context-storage';
import type { AsyncContextStoreType } from '../types';

const context_store = {
  get: () => {
    const context = tryGetContext<AsyncContextStoreType>();

    return { request_id: context?.var.requestId };
  }
};

export { context_store };
