import { bodyLimit } from 'hono/body-limit';
import { config } from '../config';
import { PayloadTooLarge } from '../errors';

const limit_upload = () => bodyLimit({ maxSize: config.bytes.maximum * 2, onError: () => { throw new PayloadTooLarge('upload is too large.'); } });

export { limit_upload };
