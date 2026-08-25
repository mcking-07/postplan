import { describe, expect, it } from 'vitest';
import { hash, random } from '../../src/common';

describe('crypto', () => {
  it('creates a stable SHA-256 hash', async () => {
    await expect(hash('postplan')).resolves.toBe('4c7a502ea1c0d531c7c710ef8e8ce2c996b166553940990082ff87df56771173');
  });

  it('creates random hexadecimal values with the requested byte length', async () => {
    const value = await random(32);

    expect(value).toMatch(/^[0-9a-f]{64}$/);
  });

});
