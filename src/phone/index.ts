/**
 * Validate, parse, and format UAE mobile and landline numbers.
 *
 * Import from `uae-validations/phone`, or from the package root.
 *
 * Rules follow the TDRA National Numbering Plan: mobiles are `05Z` + 7 digits and
 * landlines are `0Y` + 7 digits for the six geographic area codes. Mobile prefixes are
 * not mapped to operators because numbers can be ported between networks.
 *
 * @example
 * ```ts
 * import { isValidUaeMobile, formatUaePhone } from 'uae-validations/phone';
 *
 * isValidUaeMobile('050 123 4567'); // true
 * formatUaePhone('0501234567', 'e164'); // '+971501234567'
 * ```
 *
 * @module phone
 */

export * from './types';
export * from './constants';
export { parseUaePhone } from './parser';
export * from './validator';
export * from './formatter';
