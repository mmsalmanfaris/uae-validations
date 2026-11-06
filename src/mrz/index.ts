/**
 * Parse and validate ICAO 9303 machine-readable zones (MRZ): passports (TD3), ID cards
 * (TD1, including the back of the Emirates ID card), TD2 documents, and visas (MRV-A/B).
 *
 * Import from `uae-validations/mrz`, or from the package root.
 *
 * @example
 * ```ts
 * import { isValidMrz, mrzCheckDigit } from 'uae-validations/mrz';
 *
 * isValidMrz(['P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<', 'L898902C36UTO7408122F1204159ZE184226B<<<<<10']); // true
 * mrzCheckDigit('L898902C3'); // 6
 * ```
 *
 * @module mrz
 */

import type { ReferenceSource, ValidationResult } from '../core/types';
import { createFailure, createSuccess, deepFreeze } from '../core/utils';
import { inspectMrz } from './parser';
import type { MrzInfo, MrzOptions } from './types';

export * from './types';
export { mrzCheckDigit } from './check-digit';
export { parseMrz } from './parser';

/** Official sources for the MRZ rules implemented in this module. */
export const MRZ_SOURCES: readonly ReferenceSource[] = deepFreeze([
  {
    authority: 'International Civil Aviation Organization (ICAO)',
    title:
      'Doc 9303, Machine Readable Travel Documents (all parts; TD1 Part 5, TD2 Part 6, TD3 Part 4, visas Part 7)',
    url: 'https://www.icao.int/publications/doc-series/doc-9303',
    lastReviewed: '2026-11-06',
  },
  {
    authority: 'International Civil Aviation Organization (ICAO)',
    title: 'Doc 9303 Part 3: Specifications Common to all MRTDs (check digits)',
    url: 'https://www.icao.int/sites/default/files/publications/DocSeries/9303_p3_cons_en.pdf',
    lastReviewed: '2026-11-06',
  },
]);

/**
 * Checks whether the input is a well-formed MRZ whose check digits all match.
 *
 * @param input - MRZ text or lines.
 * @param options - Optional `{ referenceDate }`.
 * @returns `true` if {@link parseMrz} accepts the input.
 *
 * @example
 * ```ts
 * isValidMrz('I<UTOD231458907<<<<<<<<<<<<<<<\n7408122F1204159UTO<<<<<<<<<<<6\nERIKSSON<<ANNA<MARIA<<<<<<<<<<'); // true
 * isValidMrz('I<UTOD231458907<<<<<<<<<<<<<<<\n7408122F1204159UTO<<<<<<<<<<<5\nERIKSSON<<ANNA<MARIA<<<<<<<<<<'); // false
 * ```
 */
export function isValidMrz(input: unknown, options?: MrzOptions): boolean {
  return 'info' in inspectMrz(input, options);
}

const FIELD_LABELS = {
  documentNumber: 'document number',
  birthDate: 'date of birth',
  expiryDate: 'date of expiry',
  personalNumber: 'personal number',
  composite: 'composite',
} as const;

/**
 * Validates an MRZ and explains why it failed. When check digits fail, `errors` lists
 * every failing field, which helps tell an OCR misread from a forged document.
 *
 * Error codes: `MRZ_REQUIRED`, `MRZ_INVALID_FORMAT`, `MRZ_INVALID_DATE`, `MRZ_CHECK_DIGIT_MISMATCH`.
 *
 * @param input - MRZ text or lines. Other input returns a failure without throwing.
 * @param options - Optional `{ referenceDate }`.
 * @returns `{ isValid: true, data }` with {@link MrzInfo}, or `{ isValid: false, error, errors, code }`.
 *
 * @example
 * ```ts
 * validateMrz('').code; // 'MRZ_REQUIRED'
 * validateMrz('P<UTO').code; // 'MRZ_INVALID_FORMAT'
 * validateMrz('I<UTOD231458907<<<<<<<<<<<<<<<\n7408122F1204159UTO<<<<<<<<<<<5\nERIKSSON<<ANNA<MARIA<<<<<<<<<<').errors; // ['Check digit for composite does not match.']
 * ```
 */
export function validateMrz(input: unknown, options?: MrzOptions): ValidationResult<MrzInfo> {
  const result = inspectMrz(input, options);
  if ('info' in result) return createSuccess(result.info);
  switch (result.code) {
    case 'MRZ_REQUIRED':
      return createFailure('MRZ is required.', result.code);
    case 'MRZ_INVALID_FORMAT':
      return createFailure(
        'MRZ must be 3 lines of 30, or 2 lines of 36 or 44, characters A-Z, 0-9, and <.',
        result.code,
      );
    case 'MRZ_INVALID_DATE':
      return createFailure('MRZ contains an impossible date.', result.code);
    case 'MRZ_CHECK_DIGIT_MISMATCH': {
      const errors = result.fields.map(
        (field) => `Check digit for ${FIELD_LABELS[field]} does not match.`,
      );
      return createFailure(errors[0]!, result.code, errors);
    }
  }
}
