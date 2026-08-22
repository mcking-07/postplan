const hash = async (input: string): Promise<string> => {
  const encoded = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', encoded);

  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
};

const random = async (bytes = 32): Promise<string> => {
  const buffer = new Uint8Array(bytes);
  crypto.getRandomValues(buffer);

  return Array.from(buffer).map(b => b.toString(16).padStart(2, '0')).join('');
};

export { hash, random };
