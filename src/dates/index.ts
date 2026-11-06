export interface UaeDateParts { readonly year: number; readonly month: number; readonly day: number }

export function parseGregorianDate(value: unknown): UaeDateParts | null {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return { year: value.getUTCFullYear(), month: value.getUTCMonth() + 1, day: value.getUTCDate() };
  }
  if (typeof value !== 'string') return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() + 1 === month && date.getUTCDate() === day
    ? { year, month, day }
    : null;
}

export const isValidGregorianDate = (value: unknown): boolean => parseGregorianDate(value) !== null;

export function calculateAge(dateOfBirth: unknown, asOf: unknown = new Date()): number | null {
  const birth = parseGregorianDate(dateOfBirth);
  const reference = parseGregorianDate(asOf);
  if (!birth || !reference) return null;
  const birthKey = birth.year * 10_000 + birth.month * 100 + birth.day;
  const referenceKey = reference.year * 10_000 + reference.month * 100 + reference.day;
  if (birthKey > referenceKey) return null;
  let age = reference.year - birth.year;
  if (reference.month < birth.month || (reference.month === birth.month && reference.day < birth.day)) age--;
  return age;
}

export function isAtLeastAge(dateOfBirth: unknown, minimumAge = 18, asOf: unknown = new Date()): boolean {
  if (!Number.isInteger(minimumAge) || minimumAge < 0) return false;
  const age = calculateAge(dateOfBirth, asOf);
  return age !== null && age >= minimumAge;
}

export const isAdult = (dateOfBirth: unknown, asOf: unknown = new Date()): boolean => isAtLeastAge(dateOfBirth, 18, asOf);

export function formatUaeDate(value: unknown, locale: 'en-AE' | 'ar-AE' = 'en-AE'): string {
  const parts = parseGregorianDate(value);
  if (!parts) return '';
  return new Intl.DateTimeFormat(locale, { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Asia/Dubai' })
    .format(new Date(Date.UTC(parts.year, parts.month - 1, parts.day, 12)));
}
