export type CurrencyLocale = 'en-AE' | 'ar-AE';

export interface ParsedAedAmount {
  readonly amount: number;
  readonly dirhams: number;
  readonly fils: number;
  readonly currency: 'AED';
}

export function parseAed(value: unknown): ParsedAedAmount | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const raw = typeof value === 'number'
    ? String(value)
    : value.trim().replace(/^(AED|د\.?\s*إ\.?)\s*/iu, '').replace(/\s*(AED|د\.?\s*إ\.?)$/iu, '').replace(/,/g, '');
  if (!/^[+-]?\d+(?:\.\d{1,2})?$/.test(raw)) return null;
  const amount = Number(raw);
  if (!Number.isSafeInteger(Math.round(amount * 100))) return null;
  const totalFils = Math.round(amount * 100);
  const sign = totalFils < 0 ? -1 : 1;
  return { amount: totalFils / 100, dirhams: Math.trunc(Math.abs(totalFils) / 100) * sign, fils: Math.abs(totalFils) % 100, currency: 'AED' };
}

export const isValidAedAmount = (value: unknown): boolean => parseAed(value) !== null;

export function formatAed(value: unknown, locale: CurrencyLocale = 'en-AE'): string {
  const parsed = parseAed(value);
  return parsed ? new Intl.NumberFormat(locale, { style: 'currency', currency: 'AED', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(parsed.amount) : '';
}

const ONES = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'] as const;
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'] as const;

function underThousand(value: number): string {
  const parts: string[] = [];
  if (value >= 100) { parts.push(`${ONES[Math.floor(value / 100)]} hundred`); value %= 100; }
  if (value >= 20) { parts.push(`${TENS[Math.floor(value / 10)]}${value % 10 ? `-${ONES[value % 10]}` : ''}`); }
  else if (value > 0) parts.push(ONES[value] ?? '');
  return parts.join(' ');
}

function integerWords(value: number): string {
  if (value === 0) return 'zero';
  const groups: readonly [number, string][] = [[1_000_000_000_000, 'trillion'], [1_000_000_000, 'billion'], [1_000_000, 'million'], [1_000, 'thousand']];
  const parts: string[] = [];
  for (const [size, name] of groups) {
    if (value >= size) { parts.push(`${underThousand(Math.floor(value / size))} ${name}`); value %= size; }
  }
  if (value) parts.push(underThousand(value));
  return parts.join(' ');
}

export function aedToWords(value: unknown): string {
  const parsed = parseAed(value);
  if (!parsed) return '';
  const negative = parsed.amount < 0 ? 'minus ' : '';
  const dirhams = Math.abs(parsed.dirhams);
  const main = `${integerWords(dirhams)} ${dirhams === 1 ? 'dirham' : 'dirhams'}`;
  const fils = parsed.fils ? ` and ${integerWords(parsed.fils)} ${parsed.fils === 1 ? 'fil' : 'fils'}` : '';
  return `${negative}${main}${fils}`;
}
