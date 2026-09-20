const hash = async (input: string, encoding: 'hex' | 'base64' = 'hex'): Promise<string> => {
  const encoded = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', encoded);

  if (encoding === 'base64') return btoa(Array.from(new Uint8Array(digest)).map(byte => String.fromCharCode(byte)).join(''));

  return Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, '0')).join('');
};

const random = async (bytes = 32): Promise<string> => {
  const buffer = new Uint8Array(bytes);
  crypto.getRandomValues(buffer);

  return Array.from(buffer).map(byte => byte.toString(16).padStart(2, '0')).join('');
};

export { hash, random };
