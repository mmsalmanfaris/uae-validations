/**
 * Validate, parse, and format UAE mobile and landline numbers, and non-geographic service
 * numbers such as toll-free `800` and fixed-cost `600`.
 *
 * Import from `uae-validations/phone`, or from the package root.
 *
 * Rules follow the TDRA National Numbering Plan: mobiles are `05Z` + 7 digits and
 * landlines are `0Y` + 7 digits for the six geographic area codes. Mobile prefixes are
 * not mapped to operators because numbers can be ported between networks. Service numbers
 * (`400`, `600`, `700`, `800`, `900`) have their own functions, such as
 * `parseUaeServiceNumber`, so `validateUaePhone` keeps meaning a subscriber number.
 *
 * @example
 * ```ts
 * import { isValidUaeMobile, formatUaePhone } from 'uae-validations/phone';
 *
 * isValidUaeMobile('050 123 4567'); // true
 * formatUaePhone('0501234567', 'e164'); // '+971501234567'
 * ```
 *
 * ```ts
 * import { isValidUaeTollFree } from 'uae-validations/phone';
 *
 * isValidUaeTollFree('800 12345'); // true
 * ```
 *
 * @module phone
 */

export * from './types';
export * from './constants';
export { parseUaePhone } from './parser';
export * from './validator';
export * from './formatter';
export * from './service';
