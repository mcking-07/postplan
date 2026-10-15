import { describe, expect, it } from 'vitest';
import { settle } from '../../src/common';

describe('settle', () => {
  it('returns values in input order', async () => {
    const outcomes = await settle([3, 1, 2], async value => {
      await new Promise(resolve => setTimeout(resolve, value));
      return value * 10;
    });

    expect(outcomes).toEqual({ values: [30, 10, 20], errors: [] });
  });

  it('settles every action and returns values and errors', async () => {
    const outcomes = await settle([1, 2, 3], async value => {
      if (value !== 2) throw new Error(`failed ${value}`);
      return value;
    });

    expect(outcomes).toEqual({ values: [2], errors: [new Error('failed 1'), new Error('failed 3')] });
  });

  it('wraps rejections that are not errors', async () => {
    const outcomes = await settle([1], () => Promise.reject('broken'));

    expect(outcomes.errors).toEqual([new Error('broken')]);
  });
});
