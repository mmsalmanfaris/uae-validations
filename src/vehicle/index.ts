/**
 * Validate Dubai vehicle plate numbers: a letter code followed by a number of one to
 * five digits, as issued by the Roads and Transport Authority (RTA).
 *
 * Import from `uae-validations/vehicle`, or from the package root.
 *
 * Only Dubai is supported. Each emirate's licensing authority sets its own plate scheme,
 * and the others do not publish their code formats. Abu Dhabi, for example, publishes that
 * plate numbers have one to five digits but not which category codes exist.
 *
 * Only the structure is checked. It does not confirm that a plate has been issued, and it
 * does not cover non-standard plates such as export, trade, or diplomatic plates.
 *
 * @example
 * ```ts
 * import { isValidDubaiPlate, formatDubaiPlate } from 'uae-validations/vehicle';
 *
 * isValidDubaiPlate('AA 12345'); // true
 * formatDubaiPlate('b-7'); // 'B 7'
 * ```
 *
 * @module vehicle
 */

import { cleanString } from '../core/normalize';
import type { ReferenceSource, ValidationResult } from '../core/types';
import { createFailure, createSuccess, deepFreeze } from '../core/utils';

/** Official sources for the plate rules implemented in this module. */
export const VEHICLE_SOURCES: readonly ReferenceSource[] = deepFreeze([
  {
    authority: 'Roads and Transport Authority (RTA), Dubai',
    title:
      'Launching a new generation of vehicle licensing numbers (dual-code plates, code AA, one to five digits)',
    url: 'https://www.rta.ae/wps/portal/rta/ae/home/news-and-media/ArchivedNews/ArchivedNewsDetails/archived+news+details/launching-a-new-gen-of-vehicle-licensing-numbers-dual-code-plates',
    lastReviewed: '2026-11-06',
  },
  {
    authority: 'Roads and Transport Authority (RTA), Dubai',
    title: 'RTA releases distinguished V-coded plate numbers (four and five digits)',
    url: 'https://www.rta.ae/wps/portal/rta/ae/home/news-and-media/all-news/NewsDetails/rta-releases-distinguished-v-coded-plate-numbers',
    lastReviewed: '2026-11-06',
  },
  {
    authority: 'Roads and Transport Authority (RTA), Dubai',
    title:
      'Administrative Resolution No. (916) of 2021 Regulating the Sale of Vehicle Plate Numbers in the Emirate of Dubai (codes A, B, C, D)',
    url: 'https://www.rta.ae/wps/portal/rta/ae/home/open-data/licensing-legislations',
    lastReviewed: '2026-11-06',
  },
  {
    authority: 'Abu Dhabi Media Office',
    title:
      'DMT decision on distinguished vehicle plate numbers in Abu Dhabi (plates of one to five digits); no code scheme is published',
    url: 'https://www.mediaoffice.abudhabi/en/transport/department-of-municipalities-and-transport-issues-decision-to-facilitate-transfer-of-ownership-of-unregistered-distinctive-vehicle-plate-numbers-in-abu-dhabi/',
    lastReviewed: '2026-11-06',
  },
]);

/** A structurally valid Dubai plate, returned by {@link parseDubaiPlate}. */
export interface DubaiPlateInfo {
  /** The plate code: one or two Latin letters, uppercase. */
  code: string;
  /** The plate number: one to five digits, without leading zeros. */
  number: string;
  /** Number of digits in the plate number, from 1 to 5. */
  digitCount: number;
  /** Code and number separated by a space, for example `'AA 12345'`. */
  formatted: string;
}

/** Stable error codes returned by {@link validateDubaiPlate}. */
export type DubaiPlateErrorCode =
  'PLATE_REQUIRED' | 'PLATE_INVALID_FORMAT' | 'PLATE_INVALID_CODE' | 'PLATE_INVALID_NUMBER';

const PLATE_PATTERN = /^(?:dubai|dxb|دبي)?[\s-]*([a-z]+)[\s-]*([0-9]+)$/i;

function inspectDubaiPlate(
  input: unknown,
): { info: DubaiPlateInfo } | { code: DubaiPlateErrorCode } {
  if (typeof input !== 'string') return { code: 'PLATE_REQUIRED' };
  const cleaned = cleanString(input);
  if (!cleaned) return { code: 'PLATE_REQUIRED' };
  const match = PLATE_PATTERN.exec(cleaned);
  if (!match) return { code: 'PLATE_INVALID_FORMAT' };
  const code = match[1]!.toUpperCase();
  const number = match[2]!;
  if (code.length > 2) return { code: 'PLATE_INVALID_CODE' };
  if (number.length > 5 || number.startsWith('0')) return { code: 'PLATE_INVALID_NUMBER' };
  return { info: { code, number, digitCount: number.length, formatted: `${code} ${number}` } };
}

/**
 * Parses a Dubai plate written as code then number.
 *
 * @param input - Plate text such as `'AA 12345'`, `'aa-12345'`, or `'Dubai AA 12345'`.
 * Non-string input returns `null` without throwing.
 * @returns {@link DubaiPlateInfo}, or `null` if the input is not a valid plate.
 *
 * @example
 * ```ts
 * parseDubaiPlate('aa-12345'); // { code: 'AA', number: '12345', digitCount: 5, formatted: 'AA 12345' }
 * parseDubaiPlate('Dubai V 1234')?.code; // 'V'
 * parseDubaiPlate('12345 AA'); // null
 * ```
 */
export function parseDubaiPlate(input: unknown): DubaiPlateInfo | null {
  const result = inspectDubaiPlate(input);
  return 'info' in result ? result.info : null;
}

/**
 * Checks whether the input is a structurally valid Dubai plate.
 *
 * @param input - Plate text to check.
 * @returns `true` for a one- or two-letter code followed by a number of one to five digits.
 *
 * @example
 * ```ts
 * isValidDubaiPlate('A 1'); // true
 * isValidDubaiPlate('ABC 123'); // false
 * isValidDubaiPlate('A 123456'); // false
 * ```
 */
export function isValidDubaiPlate(input: unknown): boolean {
  return 'info' in inspectDubaiPlate(input);
}

/**
 * Validates a Dubai plate and explains why it failed.
 *
 * @param input - Plate text to check. Non-string input returns a failure without throwing.
 * @returns `{ isValid: true, data }` with {@link DubaiPlateInfo}, or a failure with
 * `PLATE_REQUIRED`, `PLATE_INVALID_FORMAT`, `PLATE_INVALID_CODE`, or `PLATE_INVALID_NUMBER`.
 *
 * @example
 * ```ts
 * validateDubaiPlate('B 7').isValid; // true
 * validateDubaiPlate('').code; // 'PLATE_REQUIRED'
 * validateDubaiPlate('12345').code; // 'PLATE_INVALID_FORMAT'
 * validateDubaiPlate('ABC 123').code; // 'PLATE_INVALID_CODE'
 * validateDubaiPlate('A 0123').code; // 'PLATE_INVALID_NUMBER'
 * ```
 */
export function validateDubaiPlate(input: unknown): ValidationResult<DubaiPlateInfo> {
  const result = inspectDubaiPlate(input);
  if ('info' in result) return createSuccess(result.info);
  switch (result.code) {
    case 'PLATE_REQUIRED':
      return createFailure('Plate number is required.', result.code);
    case 'PLATE_INVALID_FORMAT':
      return createFailure('Plate must be a letter code followed by a number.', result.code);
    case 'PLATE_INVALID_CODE':
      return createFailure('Plate code must be one or two letters.', result.code);
    case 'PLATE_INVALID_NUMBER':
      return createFailure(
        'Plate number must be one to five digits and must not start with 0.',
        result.code,
      );
  }
}

/**
 * Formats a Dubai plate as code and number separated by a space.
 *
 * @param input - Plate text to format.
 * @returns The formatted plate, or `null` if the input is invalid.
 *
 * @example
 * ```ts
 * formatDubaiPlate('aa12345'); // 'AA 12345'
 * formatDubaiPlate('bad'); // null
 * ```
 */
export function formatDubaiPlate(input: unknown): string | null {
  return parseDubaiPlate(input)?.formatted ?? null;
}
