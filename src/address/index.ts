/**
 * Validate Makani numbers, the 10-digit building-entrance codes issued through Dubai
 * Municipality's Makani system.
 *
 * Import from `uae-validations/address`, or from the package root.
 *
 * Only the structure is checked: 10 digits, written as two groups of five. Whether a
 * number belongs to a real entrance can only be confirmed through Dubai Municipality's
 * Makani service. The same number can exist in more than one emirate, so a Makani
 * number alone does not identify the emirate.
 *
 * Abu Dhabi's Onwani system addresses buildings by building number, street, and area
 * rather than by a single code, so it has no identifier to validate here.
 *
 * @example
 * ```ts
 * import { isValidMakani, formatMakani } from 'uae-validations/address';
 *
 * isValidMakani('30032 95320'); // true
 * formatMakani('3003295320'); // '30032 95320'
 * ```
 *
 * @module address
 */

import { cleanString } from '../core/normalize';
import type { ReferenceSource, ValidationResult } from '../core/types';
import { createFailure, createSuccess, deepFreeze } from '../core/utils';

/** Number of digits in a Makani number. */
export const MAKANI_LENGTH = 10;

/** Official sources for the address rules implemented in this module. */
export const ADDRESS_SOURCES: readonly ReferenceSource[] = deepFreeze([
  {
    authority: 'Dubai Municipality',
    title: 'Open Data for Makani',
    url: 'https://www.dm.gov.ae/open-data2/open-data-for-makani/',
    lastReviewed: '2026-11-06',
  },
  {
    authority: 'Dubai Municipality',
    title:
      'Manual to use Makani Web Service: Makani numbers written as "30032 95320"; a number may exist in more than one emirate',
    url: 'https://dmpmedia.dm.gov.ae/uploads/2017/05/Makani-Public-Web-Service-Access.pdf',
    lastReviewed: '2026-11-06',
  },
  {
    authority: 'Abu Dhabi Department of Municipalities and Transport (DMT)',
    title: 'Onwani: address elements are building number, street, city, area, and postal code',
    url: 'https://pages.dmt.gov.ae/en/onwani',
    lastReviewed: '2026-11-06',
  },
]);

/** A structurally valid Makani number, returned by {@link parseMakani}. */
export interface MakaniInfo {
  /** The 10 digits, without separators. */
  makani: string;
  /** The number in its official display form, two groups of five digits. */
  formatted: string;
}

/** Output styles for {@link formatMakani}. */
export type MakaniFormat = 'spaced' | 'compact';

/** Stable error codes returned by {@link validateMakani}. */
export type MakaniErrorCode = 'MAKANI_REQUIRED' | 'MAKANI_INVALID_FORMAT' | 'MAKANI_INVALID_LENGTH';

function inspectMakani(input: unknown): { info: MakaniInfo } | { code: MakaniErrorCode } {
  // Numbers lose leading zeros, and Makani numbers can start with 0, so only strings are accepted.
  if (typeof input === 'number' || typeof input === 'bigint') {
    return { code: 'MAKANI_INVALID_FORMAT' };
  }
  const cleaned = cleanString(input);
  if (!cleaned) return { code: 'MAKANI_REQUIRED' };
  const digits = cleaned
    .replace(/^makani(?:\s*(?:no\.?|number))?\s*:?\s*/i, '')
    .replace(/[\s-]/g, '');
  if (!/^[0-9]+$/.test(digits)) return { code: 'MAKANI_INVALID_FORMAT' };
  if (digits.length !== MAKANI_LENGTH) return { code: 'MAKANI_INVALID_LENGTH' };
  return { info: { makani: digits, formatted: `${digits.slice(0, 5)} ${digits.slice(5)}` } };
}

/**
 * Parses a Makani number.
 *
 * @param input - Makani number as a string, with or without spaces, hyphens, or a `Makani` label.
 * Numbers are rejected because they drop leading zeros. Other input returns `null` without throwing.
 * @returns {@link MakaniInfo}, or `null` if the input is not 10 digits.
 *
 * @example
 * ```ts
 * parseMakani('30032 95320'); // { makani: '3003295320', formatted: '30032 95320' }
 * parseMakani('Makani No. 00410 85963')?.makani; // '0041085963'
 * parseMakani('12345'); // null
 * ```
 */
export function parseMakani(input: unknown): MakaniInfo | null {
  const result = inspectMakani(input);
  return 'info' in result ? result.info : null;
}

/**
 * Checks whether the input is a structurally valid Makani number.
 *
 * @param input - Makani number to check.
 * @returns `true` for 10 digits, optionally grouped with spaces or hyphens.
 *
 * @example
 * ```ts
 * isValidMakani('30032 95320'); // true
 * isValidMakani('3003295'); // false
 * isValidMakani(3003295320); // false
 * ```
 */
export function isValidMakani(input: unknown): boolean {
  return 'info' in inspectMakani(input);
}

/**
 * Validates a Makani number and explains why it failed.
 *
 * @param input - Makani number to check. Non-string input returns a failure without throwing.
 * @returns `{ isValid: true, data }` with {@link MakaniInfo}, or a failure with
 * `MAKANI_REQUIRED`, `MAKANI_INVALID_FORMAT`, or `MAKANI_INVALID_LENGTH`.
 *
 * @example
 * ```ts
 * validateMakani('30032-95320').isValid; // true
 * validateMakani('').code; // 'MAKANI_REQUIRED'
 * validateMakani('30032 9532A').code; // 'MAKANI_INVALID_FORMAT'
 * validateMakani('30032 953').code; // 'MAKANI_INVALID_LENGTH'
 * validateMakani(3003295320).code; // 'MAKANI_INVALID_FORMAT'
 * ```
 */
export function validateMakani(input: unknown): ValidationResult<MakaniInfo> {
  const result = inspectMakani(input);
  if ('info' in result) return createSuccess(result.info);
  switch (result.code) {
    case 'MAKANI_REQUIRED':
      return createFailure('Makani number is required.', result.code);
    case 'MAKANI_INVALID_FORMAT':
      return createFailure(
        'Makani number must be a string of digits, optionally grouped with spaces or hyphens.',
        result.code,
      );
    case 'MAKANI_INVALID_LENGTH':
      return createFailure(`Makani number must be ${MAKANI_LENGTH} digits.`, result.code);
  }
}

/**
 * Formats a Makani number.
 *
 * @param input - Makani number to format.
 * @param format - `'spaced'` (default, the official display form) or `'compact'`.
 * @returns The formatted number, or `null` if the input is invalid.
 *
 * @example
 * ```ts
 * formatMakani('3003295320'); // '30032 95320'
 * formatMakani('30032 95320', 'compact'); // '3003295320'
 * formatMakani('bad'); // null
 * ```
 */
export function formatMakani(input: unknown, format: MakaniFormat = 'spaced'): string | null {
  const info = parseMakani(input);
  if (!info) return null;
  return format === 'compact' ? info.makani : info.formatted;
}
