/**
 * Validate, parse, build, format, and mask UAE IBANs.
 *
 * Import from `uae-validations/iban`, or from the package root.
 *
 * A UAE IBAN is 23 characters: `AE`, two check digits, a 3-digit bank identifier assigned
 * by the Central Bank of the UAE, and a 16-digit account number. Bank names are not
 * bundled yet because no official CBUAE code table could be verified.
 *
 * @example
 * ```ts
 * import { isValidUaeIban, parseUaeIban } from 'uae-validations/iban';
 *
 * isValidUaeIban('AE070331234567890123456'); // true
 * parseUaeIban('AE070331234567890123456')?.bankCode; // '033'
 * ```
 *
 * @module iban
 */

export * from './types';
export * from './constants';
export { parseUaeIban, buildUaeIban } from './parser';
export * from './validator';
