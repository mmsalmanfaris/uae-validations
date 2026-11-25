/**
 * Validate, parse, format, and mask UAE Emirates ID numbers.
 *
 * Import from `uae-validations/emirates-id`, or from the package root.
 *
 * An Emirates ID is 15 digits, `784-YYYY-NNNNNNN-C`: the UAE country code, the
 * holder's year of birth, a 7-digit serial, and a check digit. ICP does not publish
 * the check-digit algorithm, so Luhn verification is opt-in via `verifyChecksum`.
 *
 * @example
 * ```ts
 * import { isValidEmiratesId, formatEmiratesId, maskEmiratesId } from 'uae-validations/emirates-id';
 *
 * isValidEmiratesId('784-1990-1234567-6'); // true
 * formatEmiratesId('784199012345676'); // '784-1990-1234567-6'
 * maskEmiratesId('784199012345676'); // '784-****-****567-6'
 * ```
 *
 * @module emirates-id
 */

export * from './types';
export * from './constants';
export { parseEmiratesId } from './parser';
export * from './validator';
export * from './formatter';
