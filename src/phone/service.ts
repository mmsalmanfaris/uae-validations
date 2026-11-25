import { cleanString } from '../core/normalize';
import type { ValidationResult } from '../core/types';
import { createFailure, createSuccess, deepFreeze } from '../core/utils';
import { UAE_CALLING_CODE } from './constants';

/**
 * Kind of non-geographic number, named as in the TDRA National Numbering Plan (Annex 1).
 *
 * - `'toll-free'`: `800`, the called party pays.
 * - `'free-access'`: `400`.
 * - `'fixed-cost'`: `600`, charged at a fixed rate, not free.
 * - `'shared-cost'`: `700`, the cost is shared between caller and called party.
 * - `'premium-rate'`: `900`, shared-revenue and premium-rate services.
 */
export type UaeServiceNumberType =
  'toll-free' | 'free-access' | 'fixed-cost' | 'shared-cost' | 'premium-rate';

/** Details of a valid UAE non-geographic number, returned by {@link parseUaeServiceNumber}. */
export interface UaeServiceNumberInfo {
  /** The service the range is designated for. */
  type: UaeServiceNumberType;
  /** The number as dialled in the UAE, digits only, for example `'80012345'` or `'600512345'`. */
  number: string;
  /** The three-digit service code: `'400'`, `'600'`, `'700'`, `'800'`, or `'900'`. */
  prefix: string;
  /** Digits after the service code. */
  serviceNumber: string;
}

/** Options for {@link validateUaeServiceNumber}. */
export interface ValidateUaeServiceNumberOptions {
  /** Require this type; a valid number of another type fails with `SERVICE_NUMBER_TYPE_MISMATCH`. */
  type?: UaeServiceNumberType;
}

/** Output layout for {@link formatUaeServiceNumber}. */
export type UaeServiceNumberFormat = 'national' | 'compact';

/** Stable error codes returned by {@link validateUaeServiceNumber}. */
export type UaeServiceNumberErrorCode =
  | 'SERVICE_NUMBER_REQUIRED'
  | 'SERVICE_NUMBER_INVALID_FORMAT'
  | 'SERVICE_NUMBER_NOT_UAE'
  | 'SERVICE_NUMBER_INVALID_PREFIX'
  | 'SERVICE_NUMBER_INVALID_LENGTH'
  | 'SERVICE_NUMBER_RESERVED_RANGE'
  | 'SERVICE_NUMBER_TYPE_MISMATCH';

/** A non-geographic range of the TDRA National Numbering Plan, Annex 1. */
export interface UaeServiceRange {
  /** The three-digit service code. */
  prefix: string;
  /** Service the range is designated for. */
  type: UaeServiceNumberType;
  /** Fewest digits after the service code. */
  minDigits: number;
  /** Most digits after the service code. */
  maxDigits: number;
  /**
   * Digits allowed straight after the service code (`Y` in the plan). The plan reserves the
   * other values for future expansion. `null` when every digit is allowed.
   */
  designatedY: readonly string[] | null;
}

/**
 * Non-geographic ranges from the TDRA National Numbering Plan v5.3, Annex 1, Levels 4, 6, 7,
 * 8, and 9. Toll-free numbers have a variable length of 5 to 12 digits in total.
 */
export const UAE_SERVICE_RANGES: readonly UaeServiceRange[] = deepFreeze([
  { prefix: '400', type: 'free-access', minDigits: 6, maxDigits: 6, designatedY: ['2', '4'] },
  { prefix: '600', type: 'fixed-cost', minDigits: 6, maxDigits: 6, designatedY: ['2', '5'] },
  { prefix: '700', type: 'shared-cost', minDigits: 6, maxDigits: 6, designatedY: ['0', '5'] },
  { prefix: '800', type: 'toll-free', minDigits: 2, maxDigits: 9, designatedY: null },
  { prefix: '900', type: 'premium-rate', minDigits: 6, maxDigits: 6, designatedY: ['0', '2'] },
]);

const ALLOWED_CHARACTERS = /^\+?[0-9\s\-.()]+$/;

function inspect(
  input: unknown,
): { info: UaeServiceNumberInfo } | { code: UaeServiceNumberErrorCode } {
  const cleaned = cleanString(input);
  if (!cleaned) return { code: 'SERVICE_NUMBER_REQUIRED' };
  if (!ALLOWED_CHARACTERS.test(cleaned)) return { code: 'SERVICE_NUMBER_INVALID_FORMAT' };
  let digits = cleaned.replace(/[\s\-.()]/g, '');
  if (digits.startsWith('+') || digits.startsWith('00')) {
    const international = digits.replace(/^(?:\+|00)/, '');
    if (!international.startsWith(UAE_CALLING_CODE)) return { code: 'SERVICE_NUMBER_NOT_UAE' };
    digits = international.slice(UAE_CALLING_CODE.length);
  }
  if (!/^[0-9]+$/.test(digits)) return { code: 'SERVICE_NUMBER_INVALID_FORMAT' };

  const range = UAE_SERVICE_RANGES.find((r) => digits.startsWith(r.prefix));
  if (!range) return { code: 'SERVICE_NUMBER_INVALID_PREFIX' };
  const rest = digits.slice(3);
  if (rest.length < range.minDigits || rest.length > range.maxDigits) {
    return { code: 'SERVICE_NUMBER_INVALID_LENGTH' };
  }
  if (range.designatedY && !range.designatedY.includes(rest[0]!)) {
    return { code: 'SERVICE_NUMBER_RESERVED_RANGE' };
  }
  return {
    info: { type: range.type, number: digits, prefix: range.prefix, serviceNumber: rest },
  };
}

/**
 * Parses a UAE non-geographic number: toll-free (`800`), free-access (`400`), fixed-cost
 * (`600`), shared-cost (`700`), or premium-rate (`900`).
 *
 * These numbers are dialled without a leading `0`. A `+971` or `00971` prefix is accepted
 * and removed, because numbers are often written that way, but the numbering plan does not
 * say these numbers can be reached from abroad. Spaces, hyphens, dots, parentheses, and
 * Arabic-Indic digits are accepted.
 *
 * Mobile and landline numbers are handled by {@link parseUaePhone}, not here.
 *
 * @param input - Number to parse. Non-string input returns `null` without throwing.
 * @returns The {@link UaeServiceNumberInfo}, or `null` if the input is invalid.
 *
 * @example
 * ```ts
 * parseUaeServiceNumber('800 12345')?.type; // 'toll-free'
 * parseUaeServiceNumber('600 512345')?.type; // 'fixed-cost'
 * parseUaeServiceNumber('+971 600 512345')?.number; // '600512345'
 * parseUaeServiceNumber('600 123456'); // null
 * ```
 */
export function parseUaeServiceNumber(input: unknown): UaeServiceNumberInfo | null {
  const result = inspect(input);
  return 'info' in result ? result.info : null;
}

/**
 * Checks whether the input is a UAE non-geographic number in a designated range. See
 * {@link parseUaeServiceNumber}.
 *
 * @param input - Number to check.
 * @returns `true` if {@link parseUaeServiceNumber} accepts the input.
 *
 * @example
 * ```ts
 * isValidUaeServiceNumber('800 12345'); // true
 * isValidUaeServiceNumber('700 051234'); // true
 * isValidUaeServiceNumber('050 123 4567'); // false
 * ```
 */
export function isValidUaeServiceNumber(input: unknown): boolean {
  return 'info' in inspect(input);
}

/**
 * Checks whether the input is a UAE toll-free number: `800` followed by 2 to 9 digits.
 *
 * @param input - Number to check.
 * @returns `true` for a toll-free number.
 *
 * @example
 * ```ts
 * isValidUaeTollFree('800 12345'); // true
 * isValidUaeTollFree('80012'); // true
 * isValidUaeTollFree('600 512345'); // false
 * ```
 */
export function isValidUaeTollFree(input: unknown): boolean {
  return parseUaeServiceNumber(input)?.type === 'toll-free';
}

const MESSAGES: Record<UaeServiceNumberErrorCode, string> = {
  SERVICE_NUMBER_REQUIRED: 'Service number is required.',
  SERVICE_NUMBER_INVALID_FORMAT: 'Service number must contain only digits and separators.',
  SERVICE_NUMBER_NOT_UAE: 'Service number must use the UAE country code +971.',
  SERVICE_NUMBER_INVALID_PREFIX: 'Service number must start with 400, 600, 700, 800, or 900.',
  SERVICE_NUMBER_INVALID_LENGTH: 'Service number has the wrong number of digits.',
  SERVICE_NUMBER_RESERVED_RANGE: 'Service number is in a range reserved for future use.',
  SERVICE_NUMBER_TYPE_MISMATCH: 'Service number is not the expected type.',
};

/**
 * Validates a UAE non-geographic number and explains why it failed.
 *
 * @param input - Number to check. Other types return a failure without throwing.
 * @param options - Optional `{ type }` to require one kind of service number.
 * @returns `{ isValid: true, data }` with {@link UaeServiceNumberInfo}, or a failure with a `SERVICE_NUMBER_*` code.
 *
 * @example
 * ```ts
 * validateUaeServiceNumber('800 12345').data?.prefix; // '800'
 * validateUaeServiceNumber('600 123456').code; // 'SERVICE_NUMBER_RESERVED_RANGE'
 * validateUaeServiceNumber('600 512345', { type: 'toll-free' }).code; // 'SERVICE_NUMBER_TYPE_MISMATCH'
 * validateUaeServiceNumber('500 512345').code; // 'SERVICE_NUMBER_INVALID_PREFIX'
 * ```
 */
export function validateUaeServiceNumber(
  input: unknown,
  options?: ValidateUaeServiceNumberOptions,
): ValidationResult<UaeServiceNumberInfo> {
  const result = inspect(input);
  if ('code' in result) return createFailure(MESSAGES[result.code], result.code);
  if (options?.type !== undefined && result.info.type !== options.type) {
    return createFailure(MESSAGES.SERVICE_NUMBER_TYPE_MISMATCH, 'SERVICE_NUMBER_TYPE_MISMATCH');
  }
  return createSuccess(result.info);
}

/**
 * Formats a UAE non-geographic number.
 *
 * @param input - Number in any accepted layout.
 * @param format - `'national'` (default, service code and a space, `'800 12345'`) or `'compact'` (digits only).
 * @returns The formatted number, or `null` if the input is invalid.
 *
 * @example
 * ```ts
 * formatUaeServiceNumber('80012345'); // '800 12345'
 * formatUaeServiceNumber('+971 600-512345'); // '600 512345'
 * formatUaeServiceNumber('800 12345', 'compact'); // '80012345'
 * ```
 */
export function formatUaeServiceNumber(
  input: unknown,
  format: UaeServiceNumberFormat = 'national',
): string | null {
  const info = parseUaeServiceNumber(input);
  if (!info) return null;
  return format === 'compact' ? info.number : `${info.prefix} ${info.serviceNumber}`;
}
