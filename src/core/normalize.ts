/** Returns ASCII digits after removing common visual separators, or null. */
export function normalizeDigits(value: unknown): string | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const input = String(value).trim();
  if (!input || !/^[\d\s()-]+$/.test(input)) return null;
  return input.replace(/[^\d]/g, '');
}

export function normalizeAlphanumeric(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const input = value.trim().toUpperCase();
  if (!input || !/^[A-Z0-9\s-]+$/.test(input)) return null;
  return input.replace(/[\s-]/g, '');
}
