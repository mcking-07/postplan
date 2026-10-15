import type { SettledType } from '../types';

const settle = async <ItemType, ValueType>(items: ItemType[], action: (item: ItemType) => Promise<ValueType>) => {
  const settled = await Promise.allSettled(items.map(action));

  return settled.reduce<SettledType<ValueType>>((outcomes, outcome) => {
    if (outcome.status === 'fulfilled') outcomes.values.push(outcome.value);
    if (outcome.status === 'rejected') outcomes.errors.push(outcome.reason instanceof Error ? outcome.reason : new Error(String(outcome.reason)));

    return outcomes;
  }, { values: [], errors: [] });
};

export { settle };
