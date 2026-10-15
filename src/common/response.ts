import type { HandlerResponseType, ResponseOptionsType } from '../types';

const MAX_AGE = 300;

const CSP = [
  'default-src \'none\'',
  'script-src \'unsafe-inline\'',
  'script-src-attr \'unsafe-inline\'',
  'style-src \'unsafe-inline\' https:',
  'img-src https: data:',
  'media-src https: data:',
  'font-src https: data:',
  'connect-src \'none\'',
  'worker-src \'none\'',
  'frame-src \'none\'',
  'object-src \'none\'',
  'base-uri https:',
  'form-action \'none\'',
  'sandbox allow-scripts allow-popups allow-popups-to-escape-sandbox allow-downloads',
].join('; ');

const responsify = (response: HandlerResponseType, options: ResponseOptionsType = {}) => {
  const status = response?.status ?? 200;
  const headers = new Headers(response?.headers ?? {});

  headers.set('x-content-type-options', 'nosniff');
  headers.set('cache-control', options.cache ? `public, max-age=${MAX_AGE}` : 'no-store');

  if (options.csp) headers.set('content-security-policy', CSP);
  if (options.coop) headers.set('cross-origin-opener-policy', 'same-origin');

  if (response?.html) {
    headers.set('content-type', 'text/html; charset=utf-8');
    return new Response(response.html, { status, headers });
  }

  if (response?.body && typeof response?.body === 'object') {
    headers.set('content-type', 'application/json');
    const payload = JSON.stringify(response.body);

    return new Response(payload, { status, headers });
  }

  const payload = response?.body ? String(response.body) : null;
  return new Response(payload, { status, headers });
};

export { responsify };
