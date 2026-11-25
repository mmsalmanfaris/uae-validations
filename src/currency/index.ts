/**
 * Parse, validate, and format UAE dirham (AED) amounts exactly, and write them in
 * English or Arabic words.
 *
 * Import from `uae-validations/currency`, or from the package root.
 *
 * Amounts are handled as whole fils (1 dirham = 100 fils), so there is no floating-point
 * rounding. Input with more than two decimal places is rejected, not rounded.
 *
 * @example
 * ```ts
 * import { parseAed, formatAed, aedToWords } from 'uae-validations/currency';
 *
 * parseAed('AED 1,234.50')?.fils; // 123450
 * formatAed(1234.5); // 'AED 1,234.50'
 * aedToWords(1234.5); // 'one thousand two hundred thirty-four dirhams and fifty fils'
 * ```
 *
 * @module currency
 */

export {
  AED_CURRENCY,
  AED_MAX_DIRHAMS,
  CURRENCY_SOURCES,
  isValidAed,
  parseAed,
  validateAed,
} from './parser';
export type { AedAmount, AedErrorCode, AedParseOptions } from './parser';
export * from './formatter';
export * from './words';
