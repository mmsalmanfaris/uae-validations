import type { ValidationResult } from '../core/types';
import { createFailure, createSuccess } from '../core/utils';
import { EMIRATES_ID_MIN_YEAR } from './constants';
import { inspectEmiratesId, maxYear } from './parser';
import type { EmiratesIdErrorCode, EmiratesIdInfo, EmiratesIdOptions } from './types';

/**
 * Checks whether the input is a structurally valid Emirates ID.
 *
 * @param input - Emirates ID, for example `'784-1990-1234567-6'` or `'784199012345676'`. Non-string input returns `false` without throwing.
 * @param options - Optional `{ referenceDate, verifyChecksum }`.
 * @returns `true` if {@link parseEmiratesId} accepts the input.
 *
 * @example
 * ```ts
 * isValidEmiratesId('784-1990-1234567-6'); // true
 * isValidEmiratesId('784 1990 1234567 6'); // true
 * isValidEmiratesId('784-1990-1234567'); // false
 * isValidEmiratesId('784-1990-1234567-0', { verifyChecksum: true }); // false
 * ```
 */
export function isValidEmiratesId(input: unknown, options?: EmiratesIdOptions): boolean {
  return 'info' in inspectEmiratesId(input, options);
}

function message(code: EmiratesIdErrorCode, options?: EmiratesIdOptions): string {
  switch (code) {
    case 'EMIRATES_ID_REQUIRED':
      return 'Emirates ID is required.';
    case 'EMIRATES_ID_INVALID_FORMAT':
      return 'Emirates ID must be 15 digits, written as 784-YYYY-NNNNNNN-C or without separators.';
    case 'EMIRATES_ID_INVALID_COUNTRY_CODE':
      return 'Emirates ID must start with 784.';
    case 'EMIRATES_ID_INVALID_YEAR':
      return `Emirates ID year must be between ${EMIRATES_ID_MIN_YEAR} and ${maxYear(options)}.`;
    case 'EMIRATES_ID_CHECKSUM_MISMATCH':
      return 'Emirates ID check digit does not match.';
  }
}

/**
 * Validates an Emirates ID and explains why it failed.
 *
 * Error codes, in the order they are checked: `EMIRATES_ID_REQUIRED`,
 * `EMIRATES_ID_INVALID_FORMAT`, `EMIRATES_ID_INVALID_COUNTRY_CODE`,
 * `EMIRATES_ID_INVALID_YEAR`, and (with `verifyChecksum`) `EMIRATES_ID_CHECKSUM_MISMATCH`.
 *
 * @param input - Emirates ID in any accepted layout. Non-string input returns a failure without throwing.
 * @param options - Optional `{ referenceDate, verifyChecksum }`.
 * @returns `{ isValid: true, data }` with {@link EmiratesIdInfo}, or `{ isValid: false, error, errors, code }`.
 *
 * @example
 * ```ts
 * validateEmiratesId('784-1990-1234567-6').isValid; // true
 * validateEmiratesId('').code; // 'EMIRATES_ID_REQUIRED'
 * validateEmiratesId('785199012345676').code; // 'EMIRATES_ID_INVALID_COUNTRY_CODE'
 * ```
 */
export function validateEmiratesId(
  input: unknown,
  options?: EmiratesIdOptions,
): ValidationResult<EmiratesIdInfo> {
  const result = inspectEmiratesId(input, options);
  if ('info' in result) return createSuccess(result.info);
  return createFailure(message(result.code, options), result.code);
}
