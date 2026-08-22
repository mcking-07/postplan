const sanitize = (text: unknown, maximum = 255, pattern?: RegExp): string | undefined => {
  if (typeof text !== 'string' || !text.trim()) return undefined;

  const cleaned = pattern ? text.replace(pattern, '') : text;

  return cleaned.trim().slice(0, maximum) || undefined;
};

export { sanitize };
