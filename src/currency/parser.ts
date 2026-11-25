import { cleanString } from '../core/normalize';
import type { ReferenceSource, ValidationResult } from '../core/types';
import { createFailure, createSuccess, deepFreeze } from '../core/utils';

/** ISO 4217 data for the UAE dirham: 1 dirham = 100 fils. */
export const AED_CURRENCY = deepFreeze({
  code: 'AED',
  numericCode: '784',
  minorUnits: 2,
  nameEn: 'UAE Dirham',
  nameAr: 'درهم إماراتي',
} as const);

/**
 * The UAE Dirham sign, U+20C3 (`UAE DIRHAM SIGN`), introduced by the Central Bank of the UAE
 * in March 2025 and encoded in Unicode 18.0. Fonts released before Unicode 18.0 may not
 * draw it, so check your fonts before showing it to users.
 */
export const UAE_DIRHAM_SIGN = '\u20C3';

/** Largest amount accepted, in dirhams (just under one trillion), so fils stay exact as numbers. */
export const AED_MAX_DIRHAMS = 999_999_999_999;

/** Official sources for the currency rules implemented in this module. */
export const CURRENCY_SOURCES: readonly ReferenceSource[] = deepFreeze([
  {
    authority: 'SIX Group (ISO 4217 maintenance agency)',
    title: 'ISO 4217 currency code list: AED, 784, 2 minor units',
    url: 'https://www.six-group.com/en/products-services/financial-information/market-reference-data/data-standards.html',
    lastReviewed: '2026-11-06',
  },
  {
    authority: 'Central Bank of the UAE (CBUAE)',
    title: 'The Guidelines for the National Currency Symbol "UAE Dirham", version 1.0',
    url: 'https://centralbank.ae/media/e4ebcgtb/the_guidelines_for_the_national_currency_symbol_uae_dirham_english.pdf',
    lastReviewed: '2026-11-25',
  },
  {
    authority: 'Unicode Consortium',
    title: 'Unicode 18.0.0, UnicodeData.txt: U+20C3 UAE DIRHAM SIGN',
    url: 'https://www.unicode.org/Public/18.0.0/ucd/UnicodeData.txt',
    lastReviewed: '2026-11-25',
  },
  {
    authority: 'Unicode Consortium',
    title: 'Announcing The Unicode Standard, Version 18.0 (released 16 September 2026)',
    url: 'https://blog.unicode.org/2026/09/announcing-unicode-standard-version-180.html',
    lastReviewed: '2026-11-25',
  },
]);

/** An exact AED amount, returned by {@link parseAed}. */
export interface AedAmount {
  /** Total in fils (1/100 dirham). Negative for negative amounts. */
  fils: number;
  /** Whole dirhams, without sign. */
  dirhams: number;
  /** Remaining fils, 0–99, without sign. */
  remainderFils: number;
  /** `true` for amounts below zero. */
  negative: boolean;
  /** Plain decimal string with two places, for example `'1234.50'` or `'-0.05'`. */
  amount: string;
}

/** Options for {@link parseAed} and {@link validateAed}. */
export interface AedParseOptions {
  /** Accept amounts below zero, such as refunds or credit notes. Default `false`. */
  allowNegative?: boolean;
}

/** Stable error codes returned by {@link validateAed}. */
export type AedErrorCode =
  | 'AED_REQUIRED'
  | 'AED_INVALID_FORMAT'
  | 'AED_TOO_MANY_DECIMALS'
  | 'AED_NEGATIVE'
  | 'AED_TOO_LARGE';

const CURRENCY_MARKER =
  /^(?:AED|DHS?|د\.?\s?إ\.?|درهم|\u20C3)\s*|\s*(?:AED|DHS?|د\.?\s?إ\.?|درهم|\u20C3)$/giu;

/** @internal Converts an exact fils count to {@link AedAmount}. */
export function fromFils(fils: number): AedAmount {
  const negative = fils < 0;
  const abs = Math.abs(fils);
  const dirhams = Math.floor(abs / 100);
  const remainderFils = abs % 100;
  return {
    fils: negative ? -abs : abs,
    dirhams,
    remainderFils,
    negative,
    amount: `${negative ? '-' : ''}${dirhams}.${String(remainderFils).padStart(2, '0')}`,
  };
}

function inspect(
  input: unknown,
  options?: AedParseOptions,
): { amount: AedAmount } | { code: AedErrorCode } {
  let fils: number;
  if (typeof input === 'number') {
    if (!Number.isFinite(input)) return { code: 'AED_INVALID_FORMAT' };
    const scaled = Math.round(input * 100);
    if (Math.abs(input * 100 - scaled) > 1e-6) return { code: 'AED_TOO_MANY_DECIMALS' };
    fils = scaled;
  } else {
    const cleaned = cleanString(input);
    if (!cleaned) return { code: 'AED_REQUIRED' };
    const text = cleaned
      .replace(CURRENCY_MARKER, '')
      .replace(/\s/g, '')
      .replace(/٫/g, '.')
      .replace(/٬/g, ',');
    const match = /^([-+]?)([0-9]+|[0-9]{1,3}(?:,[0-9]{3})+)(?:\.([0-9]+))?$/.exec(text);
    if (!match) return { code: 'AED_INVALID_FORMAT' };
    const [, sign, whole, decimals = ''] = match;
    if (decimals.length > 2) return { code: 'AED_TOO_MANY_DECIMALS' };
    const digits = whole!.replace(/,/g, '').replace(/^0+(?=.)/, '');
    if (digits.length > String(AED_MAX_DIRHAMS).length) return { code: 'AED_TOO_LARGE' };
    fils = Number(digits) * 100 + Number(decimals.padEnd(2, '0'));
    if (sign === '-') fils = -fils;
  }
  if (Math.abs(fils) > AED_MAX_DIRHAMS * 100 + 99) return { code: 'AED_TOO_LARGE' };
  if (fils < 0 && options?.allowNegative !== true) return { code: 'AED_NEGATIVE' };
  return { amount: fromFils(fils === 0 ? 0 : fils) };
}

/**
 * Parses an AED amount exactly, without floating-point rounding.
 *
 * Accepts numbers and strings such as `'1234.5'`, `'1,234.50'`, `'AED 1,234.50'`,
 * `'Dhs 10'`, `'10 د.إ'`, the Dirham sign (`'\u20C3 10'`), and Arabic-Indic digits. Amounts with more than two decimal
 * places are rejected rather than silently rounded. Thousands separators, if used, must
 * be correctly placed.
 *
 * @param input - Amount to parse. Other types return `null` without throwing.
 * @param options - Optional `{ allowNegative }`.
 * @returns The {@link AedAmount}, or `null` if the input is invalid.
 *
 * @example
 * ```ts
 * parseAed('AED 1,234.50')?.fils; // 123450
 * parseAed('Dhs 10')?.amount; // '10.00'
 * parseAed('\u20C3 1,234.50')?.fils; // 123450
 * parseAed(0.1 + 0.2)?.amount; // '0.30'
 * parseAed(1.005); // null
 * parseAed('-5', { allowNegative: true })?.amount; // '-5.00'
 * parseAed('1,23,456'); // null
 * ```
 */
export function parseAed(input: unknown, options?: AedParseOptions): AedAmount | null {
  const result = inspect(input, options);
  return 'amount' in result ? result.amount : null;
}

/**
 * Checks whether the input is a valid AED amount. See {@link parseAed}.
 *
 * @param input - Amount to check.
 * @param options - Optional `{ allowNegative }`.
 * @returns `true` if {@link parseAed} accepts the input.
 *
 * @example
 * ```ts
 * isValidAed('99.99'); // true
 * isValidAed('99.999'); // false
 * isValidAed('-1'); // false
 * ```
 */
export function isValidAed(input: unknown, options?: AedParseOptions): boolean {
  return 'amount' in inspect(input, options);
}

const MESSAGES: Record<AedErrorCode, string> = {
  AED_REQUIRED: 'Amount is required.',
  AED_INVALID_FORMAT: 'Amount must be a number such as 1234.50 or 1,234.50.',
  AED_TOO_MANY_DECIMALS: 'Amount can have at most 2 decimal places (fils).',
  AED_NEGATIVE: 'Amount cannot be negative.',
  AED_TOO_LARGE: 'Amount is too large.',
};

/**
 * Validates an AED amount and explains why it failed.
 *
 * @param input - Amount to check. Other types return a failure without throwing.
 * @param options - Optional `{ allowNegative }`.
 * @returns `{ isValid: true, data }` with {@link AedAmount}, or a failure with an `AED_*` code.
 *
 * @example
 * ```ts
 * validateAed('1,000').data?.fils; // 100000
 * validateAed('12.345').code; // 'AED_TOO_MANY_DECIMALS'
 * validateAed('-1').code; // 'AED_NEGATIVE'
 * validateAed('abc').code; // 'AED_INVALID_FORMAT'
 * ```
 */
export function validateAed(
  input: unknown,
  options?: AedParseOptions,
): ValidationResult<AedAmount> {
  const result = inspect(input, options);
  if ('amount' in result) return createSuccess(result.amount);
  return createFailure(MESSAGES[result.code], result.code);
}
