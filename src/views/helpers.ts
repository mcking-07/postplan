const escape = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

const format_bytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  const kilobytes = bytes / 1024;

  return kilobytes < 100 ? `${kilobytes.toFixed(1)} KB` : `${Math.round(kilobytes)} KB`;
};

const format_date = (iso: string) => iso.slice(0, 16).replace('T', ' ');

const plural = (count: number, word: string) => count === 1 ? `${count} ${word}` : `${count} ${word}s`;

const relative = (iso: string) => {
  const diff = new Date(iso).getTime() - Date.now();
  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  const units = [
    ['month', 30 * 24 * 60 * 60 * 1000],
    ['day', 24 * 60 * 60 * 1000],
    ['hour', 60 * 60 * 1000],
    ['minute', 60 * 1000],
  ] as const;

  for (const [unit, ms] of units) {
    const value = Math.trunc(diff / ms);

    if (Math.abs(value) >= 1) return formatter.format(value, unit);
  }

  return 'now';
};

export { escape, format_bytes, format_date, plural, relative };
