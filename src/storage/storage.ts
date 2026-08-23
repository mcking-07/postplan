import { loggerFor, safe } from '../common';
import { NotFound } from '../errors';

const logger = loggerFor('storage/storage');

const HTTP_METADATA: R2HTTPMetadata = { contentType: 'text/html; charset=utf-8' };

class Storage {
  private readonly bucket: R2Bucket;
  constructor(bucket: R2Bucket) {
    this.bucket = bucket;
  }

  key = (draft_id: string, version_id: string) => `drafts/${draft_id}/versions/${version_id}.html`;

  put = safe(async (key: string, content: string) => {
    logger.info(`storing object for key [${key}]`);
    await this.bucket.put(key, content, { httpMetadata: HTTP_METADATA });
  });

  get = safe(async (key: string) => {
    logger.info(`fetching object for key [${key}]`);

    const object = await this.bucket.get(key);
    if (!object) throw new NotFound(`object not found for key [${key}]`);

    return object.text();
  });

  remove = safe(async (key: string) => {
    logger.info(`removing object for key [${key}]`);
    await this.bucket.delete(key);
  });
}

export { Storage };
