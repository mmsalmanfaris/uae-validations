/**
 * Validate and parse SWIFT/BIC codes (ISO 9362), with helpers for UAE banks.
 *
 * Import from `uae-validations/swift`, or from the package root.
 *
 * A BIC is 8 or 11 characters: a 4-character party prefix (the institution), a
 * 2-letter country code (`AE` for the UAE), a 2-character location code, and an
 * optional 3-character branch code. A valid structure does not prove the BIC is
 * registered with SWIFT.
 *
 * @example
 * ```ts
 * import { isValidUaeBic, parseBic } from 'uae-validations/swift';
 *
 * isValidUaeBic('ABCDAEAD'); // true
 * parseBic('ABCDAEADXXX')?.isPrimaryOffice; // true
 * ```
 *
 * @module swift
 */

import { cleanString } from '../core/normalize';
import type { ReferenceSource, ValidationResult } from '../core/types';
import { createFailure, createSuccess, deepFreeze } from '../core/utils';

/** Official sources for the BIC rules implemented in this module. */
export const SWIFT_SOURCES: readonly ReferenceSource[] = deepFreeze([
  {
    authority: 'SWIFT (ISO 9362 registration authority)',
    title: 'ISO 9362 Business Identifier Code (BIC)',
    url: 'https://www.swift.com/standards/data-standards/bic-business-identifier-code',
    lastReviewed: '2026-11-06',
  },
]);

/** Everything decoded from a valid BIC by {@link parseBic}. */
export interface BicInfo {
  /** The BIC as given, upper case, 8 or 11 characters. */
  bic: string;
  /** The 11-character form, with `XXX` appended to 8-character codes. */
  bic11: string;
  /** Four-character party prefix identifying the institution. */
  institutionCode: string;
  /** Two-letter ISO 3166-1 country code. */
  countryCode: string;
  /** Two-character location code. */
  locationCode: string;
  /** Three-character branch code, or `null` for 8-character BICs. */
  branchCode: string | null;
  /** `true` when the BIC identifies the head office (no branch code, or `XXX`). */
  isPrimaryOffice: boolean;
  /** `true` when the second character of the location code is `0`, which marks a test and training BIC. */
  isTestBic: boolean;
}

/** Stable error codes returned by {@link validateUaeBic}. */
export type BicErrorCode = 'BIC_REQUIRED' | 'BIC_INVALID_FORMAT' | 'BIC_NOT_UAE';

const BIC_PATTERN = /^[A-Z0-9]{4}[A-Z]{2}[A-Z0-9]{2}(?:[A-Z0-9]{3})?$/;

function inspect(input: unknown): { info: BicInfo } | { code: BicErrorCode } {
  const cleaned = cleanString(input);
  if (!cleaned) return { code: 'BIC_REQUIRED' };
  const bic = cleaned.toUpperCase().replace(/\s/g, '');
  if (!BIC_PATTERN.test(bic)) return { code: 'BIC_INVALID_FORMAT' };
  const branchCode = bic.length === 11 ? bic.slice(8) : null;
  const locationCode = bic.slice(6, 8);
  return {
    info: {
      bic,
      bic11: bic.length === 11 ? bic : `${bic}XXX`,
      institutionCode: bic.slice(0, 4),
      countryCode: bic.slice(4, 6),
      locationCode,
      branchCode,
      isPrimaryOffice: branchCode === null || branchCode === 'XXX',
      isTestBic: locationCode[1] === '0',
    },
  };
}

/**
 * Parses a BIC from any country.
 *
 * @param input - BIC, 8 or 11 characters, any letter case; spaces are ignored. Non-string input returns `null` without throwing.
 * @returns The decoded {@link BicInfo}, or `null` if the structure is invalid.
 *
 * @example
 * ```ts
 * parseBic('abcd ae ad 123')?.branchCode; // '123'
 * parseBic('ABCDAEAD')?.bic11; // 'ABCDAEADXXX'
 * parseBic('ABCD1EAD'); // null
 * ```
 */
export function parseBic(input: unknown): BicInfo | null {
  const result = inspect(input);
  return 'info' in result ? result.info : null;
}

/**
 * Checks whether the input is a structurally valid BIC from any country.
 *
 * @param input - BIC to check.
 * @returns `true` for a valid 8- or 11-character BIC.
 *
 * @example
 * ```ts
 * isValidBic('DEUTDEFF'); // true
 * isValidBic('DEUTDEF'); // false
 * ```
 */
export function isValidBic(input: unknown): boolean {
  return 'info' in inspect(input);
}

/**
 * Checks whether the input is a structurally valid BIC with country code `AE`.
 *
 * @param input - BIC to check.
 * @returns `true` for a valid BIC whose country code is `AE`.
 *
 * @example
 * ```ts
 * isValidUaeBic('ABCDAEADXXX'); // true
 * isValidUaeBic('DEUTDEFF'); // false
 * ```
 */
export function isValidUaeBic(input: unknown): boolean {
  return parseBic(input)?.countryCode === 'AE';
}

/**
 * Validates a UAE BIC and explains why it failed.
 *
 * @param input - BIC to check. Non-string input returns a failure without throwing.
 * @returns `{ isValid: true, data }` with {@link BicInfo}, or a failure with `BIC_REQUIRED`, `BIC_INVALID_FORMAT`, or `BIC_NOT_UAE`.
 *
 * @example
 * ```ts
 * validateUaeBic('ABCDAEAD').isValid; // true
 * validateUaeBic('DEUTDEFF').code; // 'BIC_NOT_UAE'
 * validateUaeBic('ABC').code; // 'BIC_INVALID_FORMAT'
 * ```
 */
export function validateUaeBic(input: unknown): ValidationResult<BicInfo> {
  const result = inspect(input);
  if ('code' in result) {
    return result.code === 'BIC_REQUIRED'
      ? createFailure('BIC is required.', result.code)
      : createFailure('BIC must be 8 or 11 characters: AAAA BB CC (DDD).', result.code);
  }
  if (result.info.countryCode !== 'AE') {
    return createFailure('BIC must have the UAE country code AE.', 'BIC_NOT_UAE');
  }
  return createSuccess(result.info);
}
