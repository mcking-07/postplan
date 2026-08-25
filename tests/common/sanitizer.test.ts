import { describe, expect, it } from 'vitest';
import { sanitize } from '../../src/common';

describe('sanitize', () => {
  it('trims and limits strings', () => {
    expect(sanitize('  hello  ', 4)).toBe('hell');
  });

  it('returns undefined for non-values and empty results', () => {
    expect(sanitize(undefined)).toBeUndefined();
    expect(sanitize('   ')).toBeUndefined();
    expect(sanitize('!!!', 10, /!/g)).toBeUndefined();
  });

  it('removes matching characters', () => {
    expect(sanitize('key<> name', 100, /[^a-z ]/gi)).toBe('key name');
  });
});
