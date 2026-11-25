/**
 * Validate UAE Tax Registration Numbers (TRN) and Tax Identification Numbers (TIN).
 *
 * Import from `uae-validations/tax`, or from the package root.
 *
 * The Federal Tax Authority issues a 15-digit TRN to VAT and Corporate Tax registrants
 * and a 10-digit TIN to every business. The TIN is the first 10 digits of the TRN. The
 * FTA does not publish a check-digit algorithm, so only the structure is validated; use
 * the FTA's TRN verification service to confirm a number is registered.
 *
 * @example
 * ```ts
 * import { isValidTrn, tinFromTrn } from 'uae-validations/tax';
 *
 * isValidTrn('100123456700003'); // true
 * tinFromTrn('100123456700003'); // '1001234567'
 * ```
 *
 * @module tax
 */

import { cleanString } from '../core/normalize';
import type { ReferenceSource, ValidationResult } from '../core/types';
import { createFailure, createSuccess, deepFreeze } from '../core/utils';

/** Number of digits in a TRN. */
export const TRN_LENGTH = 15;

/** Number of digits in a TIN. */
export const TIN_LENGTH = 10;

/** Official sources for the tax-number rules implemented in this module. */
export const TAX_SOURCES: readonly ReferenceSource[] = deepFreeze([
  {
    authority: 'Federal Tax Authority (FTA)',
    title:
      'UAE e-Invoicing: TIN is 10 digits and corresponds to the first 10 digits of the 15-digit TRN',
    url: 'https://www.tax.gov.ae/en/content/uae.einvoicing.aspx',
    lastReviewed: '2026-11-06',
  },
]);

/** A valid TRN and the TIN it contains, returned by {@link parseTrn}. */
export interface TrnInfo {
  /** The 15 digits, without separators. */
  trn: string;
  /** The first 10 digits: the business's TIN. */
  tin: string;
}

/** Stable error codes returned by {@link validateTrn} and {@link validateTin}. */
export type TaxNumberErrorCode =
  | 'TRN_REQUIRED'
  | 'TRN_INVALID_FORMAT'
  | 'TRN_INVALID_LENGTH'
  | 'TIN_REQUIRED'
  | 'TIN_INVALID_FORMAT'
  | 'TIN_INVALID_LENGTH';

function inspect(
  input: unknown,
  length: number,
  label: 'TRN' | 'TIN',
): { digits: string } | { code: TaxNumberErrorCode; message: string } {
  const cleaned = cleanString(input);
  if (!cleaned) return { code: `${label}_REQUIRED`, message: `${label} is required.` };
  const digits = cleaned.replace(/[\s-]/g, '');
  if (!/^[0-9]+$/.test(digits)) {
    return {
      code: `${label}_INVALID_FORMAT`,
      message: `${label} must contain only digits, spaces, or hyphens.`,
    };
  }
  if (digits.length !== length) {
    return { code: `${label}_INVALID_LENGTH`, message: `${label} must be ${length} digits.` };
  }
  return { digits };
}

/**
 * Parses a TRN and extracts its TIN.
 *
 * @param input - TRN, with or without spaces or hyphens. Non-string input returns `null` without throwing.
 * @returns `{ trn, tin }`, or `null` if the input is not 15 digits.
 *
 * @example
 * ```ts
 * parseTrn('100-1234-5670-0003'); // { trn: '100123456700003', tin: '1001234567' }
 * parseTrn('12345'); // null
 * ```
 */
export function parseTrn(input: unknown): TrnInfo | null {
  const result = inspect(input, TRN_LENGTH, 'TRN');
  return 'digits' in result
    ? { trn: result.digits, tin: result.digits.slice(0, TIN_LENGTH) }
    : null;
}

/**
 * Checks whether the input is a structurally valid TRN (15 digits).
 *
 * @param input - TRN to check.
 * @returns `true` for 15 digits, optionally separated by spaces or hyphens.
 *
 * @example
 * ```ts
 * isValidTrn('100123456700003'); // true
 * isValidTrn('1001234567'); // false
 * ```
 */
export function isValidTrn(input: unknown): boolean {
  return parseTrn(input) !== null;
}

/**
 * Validates a TRN and explains why it failed.
 *
 * @param input - TRN to check. Non-string input returns a failure without throwing.
 * @returns `{ isValid: true, data }` with {@link TrnInfo}, or a failure with `TRN_REQUIRED`, `TRN_INVALID_FORMAT`, or `TRN_INVALID_LENGTH`.
 *
 * @example
 * ```ts
 * validateTrn('100123456700003').isValid; // true
 * validateTrn('10012345670000A').code; // 'TRN_INVALID_FORMAT'
 * validateTrn('1001234567').code; // 'TRN_INVALID_LENGTH'
 * ```
 */
export function validateTrn(input: unknown): ValidationResult<TrnInfo> {
  const result = inspect(input, TRN_LENGTH, 'TRN');
  if ('code' in result) return createFailure(result.message, result.code);
  return createSuccess({ trn: result.digits, tin: result.digits.slice(0, TIN_LENGTH) });
}

/**
 * Checks whether the input is a structurally valid TIN (10 digits).
 *
 * @param input - TIN to check.
 * @returns `true` for 10 digits, optionally separated by spaces or hyphens.
 *
 * @example
 * ```ts
 * isValidTin('1001234567'); // true
 * isValidTin('100123456700003'); // false
 * ```
 */
export function isValidTin(input: unknown): boolean {
  return 'digits' in inspect(input, TIN_LENGTH, 'TIN');
}

/**
 * Validates a TIN and explains why it failed.
 *
 * @param input - TIN to check. Non-string input returns a failure without throwing.
 * @returns `{ isValid: true, data }` with the 10 digits, or a failure with `TIN_REQUIRED`, `TIN_INVALID_FORMAT`, or `TIN_INVALID_LENGTH`.
 *
 * @example
 * ```ts
 * validateTin('100 123 4567').data; // '1001234567'
 * validateTin('100123456700003').code; // 'TIN_INVALID_LENGTH'
 * ```
 */
export function validateTin(input: unknown): ValidationResult<string> {
  const result = inspect(input, TIN_LENGTH, 'TIN');
  if ('code' in result) return createFailure(result.message, result.code);
  return createSuccess(result.digits);
}

/**
 * Returns the TIN contained in a TRN.
 *
 * @param trn - TRN to read.
 * @returns The first 10 digits, or `null` if the TRN is invalid.
 *
 * @example
 * ```ts
 * tinFromTrn('100123456700003'); // '1001234567'
 * ```
 */
export function tinFromTrn(trn: unknown): string | null {
  return parseTrn(trn)?.tin ?? null;
}

/**
 * Checks whether a TIN belongs to a TRN, meaning it equals the TRN's first 10 digits.
 *
 * @param tin - TIN to compare.
 * @param trn - TRN to compare.
 * @returns `true` only if both are valid and the TIN matches the TRN.
 *
 * @example
 * ```ts
 * doesTinMatchTrn('1001234567', '100123456700003'); // true
 * doesTinMatchTrn('1001234568', '100123456700003'); // false
 * ```
 */
export function doesTinMatchTrn(tin: unknown, trn: unknown): boolean {
  const tinResult = inspect(tin, TIN_LENGTH, 'TIN');
  return 'digits' in tinResult && tinFromTrn(trn) === tinResult.digits;
}

/**
 * Masks a TRN for display, keeping the first three and last three digits.
 *
 * @param trn - TRN to mask.
 * @returns The masked TRN, or `null` if the TRN is invalid.
 *
 * @example
 * ```ts
 * maskTrn('100123456700003'); // '100*********003'
 * ```
 */
export function maskTrn(trn: unknown): string | null {
  const info = parseTrn(trn);
  return info ? `${info.trn.slice(0, 3)}${'*'.repeat(9)}${info.trn.slice(12)}` : null;
}
