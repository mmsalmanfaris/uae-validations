import type { ValidationResult } from '../core/types';
import { createFailure, createSuccess } from '../core/utils';
import { inspectUaeIban } from './parser';
import type { UaeIbanErrorCode, UaeIbanFormat, UaeIbanInfo } from './types';

const MESSAGES: Record<UaeIbanErrorCode, string> = {
  IBAN_REQUIRED: 'IBAN is required.',
  IBAN_INVALID_FORMAT: 'UAE IBAN must be AE followed by 21 digits.',
  IBAN_NOT_UAE: 'IBAN must be a UAE IBAN starting with AE.',
  IBAN_INVALID_LENGTH: 'UAE IBAN must be 23 characters long.',
  IBAN_CHECKSUM_MISMATCH: 'IBAN check digits do not match.',
};

/**
 * Checks whether the input is a valid UAE IBAN.
 *
 * @param input - IBAN in electronic or print format. Non-string input returns `false` without throwing.
 * @returns `true` if {@link parseUaeIban} accepts the input.
 *
 * @example
 * ```ts
 * isValidUaeIban('AE070331234567890123456'); // true
 * isValidUaeIban('AE07 0331 2345 6789 0123 456'); // true
 * isValidUaeIban('GB82WEST12345698765432'); // false
 * ```
 */
export function isValidUaeIban(input: unknown): boolean {
  return 'info' in inspectUaeIban(input);
}

/**
 * Validates a UAE IBAN and explains why it failed.
 *
 * Error codes, in the order they are checked: `IBAN_REQUIRED`, `IBAN_INVALID_FORMAT`,
 * `IBAN_NOT_UAE`, `IBAN_INVALID_LENGTH`, `IBAN_CHECKSUM_MISMATCH`.
 *
 * @param input - IBAN in electronic or print format. Non-string input returns a failure without throwing.
 * @returns `{ isValid: true, data }` with {@link UaeIbanInfo}, or `{ isValid: false, error, errors, code }`.
 *
 * @example
 * ```ts
 * validateUaeIban('AE070331234567890123456').isValid; // true
 * validateUaeIban('GB82WEST12345698765432').code; // 'IBAN_NOT_UAE'
 * validateUaeIban('AE0703312345678901234').code; // 'IBAN_INVALID_LENGTH'
 * validateUaeIban('AE080331234567890123456').code; // 'IBAN_CHECKSUM_MISMATCH'
 * ```
 */
export function validateUaeIban(input: unknown): ValidationResult<UaeIbanInfo> {
  const result = inspectUaeIban(input);
  if ('info' in result) return createSuccess(result.info);
  return createFailure(MESSAGES[result.code], result.code);
}

/**
 * Formats a valid UAE IBAN.
 *
 * @param input - IBAN in any accepted layout.
 * @param format - `'print'` (default, groups of four) or `'electronic'` (no spaces).
 * @returns The formatted IBAN, or `null` if the input is invalid.
 *
 * @example
 * ```ts
 * formatUaeIban('AE070331234567890123456'); // 'AE07 0331 2345 6789 0123 456'
 * formatUaeIban('ae07 0331 2345 6789 0123 456', 'electronic'); // 'AE070331234567890123456'
 * ```
 */
export function formatUaeIban(input: unknown, format: UaeIbanFormat = 'print'): string | null {
  const result = inspectUaeIban(input);
  if (!('info' in result)) return null;
  return format === 'electronic' ? result.info.iban : result.info.formatted;
}

/**
 * Masks a UAE IBAN for display, keeping the country code, check digits, bank code, and
 * the last four digits of the account.
 *
 * @param input - IBAN in any accepted layout.
 * @returns The masked IBAN in print format, or `null` if the input is invalid.
 *
 * @example
 * ```ts
 * maskUaeIban('AE070331234567890123456'); // 'AE07 033* **** **** ***3 456'
 * ```
 */
export function maskUaeIban(input: unknown): string | null {
  const result = inspectUaeIban(input);
  if (!('info' in result)) return null;
  const { iban } = result.info;
  const masked = iban.slice(0, 7) + '*'.repeat(12) + iban.slice(19);
  return masked.replace(/(.{4})(?=.)/g, '$1 ');
}
