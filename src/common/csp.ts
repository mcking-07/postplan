import * as parse5 from 'parse5';
import { hash } from './crypto';
import { safe } from './safe';
import type { PolicyNodeType } from '../types';

const script_bodies = (html: string): string[] => {
  const [error, document] = safe(() => parse5.parse(html, { scriptingEnabled: false }) as PolicyNodeType)();
  if (error || !document) return [];

  const bodies: string[] = [];
  const stack: PolicyNodeType[] = [document];

  while (stack.length) {
    const node = stack.pop();

    if (!node) break;
    if (node.tagName?.toLowerCase() === 'script') bodies.push((node.childNodes ?? []).filter(child => child.nodeName === '#text').map(child => child.value ?? '').join(''));

    for (const child of node.childNodes ?? []) stack.push(child);
  }

  return bodies;
};

const cspify = async (html: string): Promise<string> => {
  const hashes = await Promise.all(script_bodies(html).map(async body => `'sha256-${await hash(body, 'base64')}'`));

  return [
    'default-src \'none\'',
    `script-src ${hashes.length ? hashes.join(' ') : '\'none\''}`,
    'style-src \'unsafe-inline\' https:',
    'img-src https: data:',
    'font-src https: data:',
    'frame-src https:',
    'media-src https:',
    'connect-src \'none\'',
    'base-uri \'none\'',
    'form-action \'none\'',
  ].join('; ');
};

export { cspify };
