import type { ValidationResult } from '../core/types';
import { createFailure, createSuccess } from '../core/utils';
import { inspectUaePhone } from './parser';
import type {
  UaePhoneErrorCode,
  UaePhoneInfo,
  UaePhoneOptions,
  ValidateUaePhoneOptions,
} from './types';

const MESSAGES: Record<UaePhoneErrorCode, string> = {
  PHONE_REQUIRED: 'Phone number is required.',
  PHONE_INVALID_FORMAT:
    'Phone number must be a UAE mobile (05X XXX XXXX) or landline (0X XXX XXXX).',
  PHONE_NOT_UAE: 'Phone number must use the UAE country code +971.',
  PHONE_INVALID_PREFIX: 'Phone number does not start with a UAE mobile or area code.',
  PHONE_UNALLOCATED_MOBILE_PREFIX: 'Mobile prefix is not an allocated UAE mobile range.',
  PHONE_INVALID_SUBSCRIBER_NUMBER: 'Landline number is not in a valid subscriber range.',
  PHONE_TYPE_MISMATCH: 'Phone number is not the expected type.',
};

/**
 * Checks whether the input is a valid UAE mobile or landline number.
 *
 * @param input - Phone number in any accepted layout. Non-string input returns `false` without throwing.
 * @param options - Optional `{ mobilePrefixes }`.
 * @returns `true` if {@link parseUaePhone} accepts the input.
 *
 * @example
 * ```ts
 * isValidUaePhone('0501234567'); // true
 * isValidUaePhone('+971 4 234 5678'); // true
 * isValidUaePhone('+44 20 7946 0000'); // false
 * ```
 */
export function isValidUaePhone(input: unknown, options?: UaePhoneOptions): boolean {
  return 'info' in inspectUaePhone(input, options);
}

/**
 * Checks whether the input is a valid UAE mobile number.
 *
 * @param input - Phone number in any accepted layout.
 * @param options - Optional `{ mobilePrefixes }`.
 * @returns `true` only for mobile numbers.
 *
 * @example
 * ```ts
 * isValidUaeMobile('050 123 4567'); // true
 * isValidUaeMobile('00971501234567'); // true
 * isValidUaeMobile('04 234 5678'); // false
 * ```
 */
export function isValidUaeMobile(input: unknown, options?: UaePhoneOptions): boolean {
  const result = inspectUaePhone(input, options);
  return 'info' in result && result.info.type === 'mobile';
}

/**
 * Checks whether the input is a valid UAE landline number.
 *
 * @param input - Phone number in any accepted layout.
 * @returns `true` only for landline numbers in a valid area and subscriber range.
 *
 * @example
 * ```ts
 * isValidUaeLandline('04 234 5678'); // true
 * isValidUaeLandline('+971 2 612 3456'); // true
 * isValidUaeLandline('04 100 5678'); // false
 * isValidUaeLandline('050 123 4567'); // false
 * ```
 */
export function isValidUaeLandline(input: unknown): boolean {
  const result = inspectUaePhone(input);
  return 'info' in result && result.info.type === 'landline';
}

/**
 * Validates a UAE phone number and explains why it failed.
 *
 * Error codes: `PHONE_REQUIRED`, `PHONE_INVALID_FORMAT`, `PHONE_NOT_UAE`,
 * `PHONE_INVALID_PREFIX`, `PHONE_UNALLOCATED_MOBILE_PREFIX`,
 * `PHONE_INVALID_SUBSCRIBER_NUMBER`, and (with `type`) `PHONE_TYPE_MISMATCH`.
 *
 * @param input - Phone number in any accepted layout. Non-string input returns a failure without throwing.
 * @param options - Optional `{ mobilePrefixes, type }`.
 * @returns `{ isValid: true, data }` with {@link UaePhoneInfo}, or `{ isValid: false, error, errors, code }`.
 *
 * @example
 * ```ts
 * validateUaePhone('0501234567').isValid; // true
 * validateUaePhone('+44 20 7946 0000').code; // 'PHONE_NOT_UAE'
 * validateUaePhone('0591234567').code; // 'PHONE_UNALLOCATED_MOBILE_PREFIX'
 * validateUaePhone('04 234 5678', { type: 'mobile' }).code; // 'PHONE_TYPE_MISMATCH'
 * ```
 */
export function validateUaePhone(
  input: unknown,
  options?: ValidateUaePhoneOptions,
): ValidationResult<UaePhoneInfo> {
  const result = inspectUaePhone(input, options);
  if ('code' in result) return createFailure(MESSAGES[result.code], result.code);
  const expected = options?.type;
  if (expected !== undefined && result.info.type !== expected) {
    return createFailure(`Phone number must be a UAE ${expected} number.`, 'PHONE_TYPE_MISMATCH');
  }
  return createSuccess(result.info);
}
