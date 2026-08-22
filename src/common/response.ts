import type { HandlerResponseType, ResponseOptionsType } from '../types';

const MAX_AGE = 300;
const CSP = 'default-src \'none\'; script-src \'none\'; style-src \'unsafe-inline\'; img-src https: data:; connect-src \'none\'; base-uri \'none\'; form-action \'none\'';

const responsify = (response: HandlerResponseType, options: ResponseOptionsType = {}) => {
  const status = response?.status ?? 200;
  const headers = new Headers(response?.headers ?? {});

  headers.set('x-content-type-options', 'nosniff');
  headers.set('cache-control', options.cache ? `public, max-age=${MAX_AGE}` : 'no-store');

  if (options.csp) headers.set('content-security-policy', CSP);

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
