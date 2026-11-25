import { cleanString } from '../core/normalize';
import { luhnCheck } from '../core/utils';
import { EMIRATES_ID_COUNTRY_CODE, EMIRATES_ID_MIN_YEAR } from './constants';
import type { EmiratesIdErrorCode, EmiratesIdInfo, EmiratesIdOptions } from './types';

/** 15 digits, or the 3-4-7-1 grouping with one consistent separator (hyphen or space). */
const ACCEPTED_LAYOUT = /^(?:[0-9]{15}|[0-9]{3}([- ])[0-9]{4}\1[0-9]{7}\1[0-9])$/;

/** @internal Latest year field allowed for the given options. */
export function maxYear(options?: EmiratesIdOptions): number {
  const ref = options?.referenceDate;
  const date = ref instanceof Date && !Number.isNaN(ref.getTime()) ? ref : new Date();
  return date.getUTCFullYear();
}

/**
 * @internal Shared by the parser and `validateEmiratesId` so both apply the same rules
 * in the same order. Returns the parsed info or the first failing rule.
 */
export function inspectEmiratesId(
  input: unknown,
  options?: EmiratesIdOptions,
): { info: EmiratesIdInfo } | { code: EmiratesIdErrorCode } {
  const cleaned = cleanString(input);
  if (!cleaned) return { code: 'EMIRATES_ID_REQUIRED' };
  if (!ACCEPTED_LAYOUT.test(cleaned)) return { code: 'EMIRATES_ID_INVALID_FORMAT' };

  const digits = cleaned.replace(/[- ]/g, '');
  if (!digits.startsWith(EMIRATES_ID_COUNTRY_CODE)) {
    return { code: 'EMIRATES_ID_INVALID_COUNTRY_CODE' };
  }

  const year = Number(digits.slice(3, 7));
  if (year < EMIRATES_ID_MIN_YEAR || year > maxYear(options)) {
    return { code: 'EMIRATES_ID_INVALID_YEAR' };
  }

  const luhnValid = luhnCheck(digits);
  if (options?.verifyChecksum === true && !luhnValid) {
    return { code: 'EMIRATES_ID_CHECKSUM_MISMATCH' };
  }

  const serial = digits.slice(7, 14);
  const checkDigit = Number(digits[14]);
  return {
    info: {
      emiratesId: digits,
      formatted: `${EMIRATES_ID_COUNTRY_CODE}-${digits.slice(3, 7)}-${serial}-${checkDigit}`,
      countryCode: EMIRATES_ID_COUNTRY_CODE,
      year,
      serial,
      checkDigit,
      luhnValid,
    },
  };
}

/**
 * Parses an Emirates ID into its segments.
 *
 * Accepts 15 digits, or `784-YYYY-NNNNNNN-C` with hyphens or spaces between the
 * groups. Arabic-Indic digits and right-to-left marks are normalized first.
 *
 * Rules applied: 15 digits, starts with `784`, year field between 1900 and the
 * reference year. The Luhn check is applied only when `verifyChecksum` is `true`.
 *
 * @param input - Emirates ID in any accepted layout. Non-string input returns `null` without throwing.
 * @param options - Optional `{ referenceDate, verifyChecksum }`.
 * @returns The decoded {@link EmiratesIdInfo}, or `null` if the input is invalid.
 *
 * @example
 * ```ts
 * parseEmiratesId('784-1990-1234567-6')?.year; // 1990
 * parseEmiratesId('784199012345676')?.formatted; // '784-1990-1234567-6'
 * parseEmiratesId('123-1990-1234567-6'); // null
 * ```
 */
export function parseEmiratesId(
  input: unknown,
  options?: EmiratesIdOptions,
): EmiratesIdInfo | null {
  const result = inspectEmiratesId(input, options);
  return 'info' in result ? result.info : null;
}
