import type { KeyTransformerType, UnknownPayloadType } from '../types';

const to_snake = (value: string): string => value.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();

const to_camel = (value: string): string => value.replace(/_([a-z0-9])/g, (_, char) => char.toUpperCase());

const transform = <Value>(source: unknown, action: KeyTransformerType): Value => {
  if (Array.isArray(source)) return source.map(item => transform(item, action)) as Value;

  if (source !== null && typeof source === 'object') {
    const outcome: UnknownPayloadType = {};
    for (const [key, value] of Object.entries(source)) {
      outcome[action(key)] = transform(value, action);
    }
    return outcome as Value;
  }

  return source as Value;
};

const inbound = <Value>(source: unknown): Value => transform<Value>(source, to_snake);
const outbound = <Value>(source: unknown): Value => transform<Value>(source, to_camel);

export { inbound, outbound };
