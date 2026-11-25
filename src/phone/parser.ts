import { cleanString } from '../core/normalize';
import { UAE_AREA_CODES, UAE_CALLING_CODE, UAE_MOBILE_PREFIXES } from './constants';
import type { UaePhoneErrorCode, UaePhoneInfo, UaePhoneOptions } from './types';

const ALLOWED_CHARACTERS = /^\+?[0-9\s\-.()]+$/;

/**
 * Converts any accepted input layout to the national form `0` + national significant
 * number, or returns why it could not.
 */
function toNational(input: unknown): { national: string } | { code: UaePhoneErrorCode } {
  const cleaned = cleanString(input);
  if (!cleaned) return { code: 'PHONE_REQUIRED' };
  if (!ALLOWED_CHARACTERS.test(cleaned)) return { code: 'PHONE_INVALID_FORMAT' };

  // Keep parentheses for now so a "(0)" written after the country code can be recognized.
  const compact = cleaned.replace(/[\s\-.]/g, '');
  let international: string | null = null;
  if (compact.startsWith('+')) international = compact.slice(1);
  else if (compact.startsWith('00')) international = compact.slice(2);
  else if (/^971[0-9]{8,9}$/.test(compact)) international = compact;

  if (international === null) return { national: compact.replace(/[()]/g, '') };
  if (!international.startsWith(UAE_CALLING_CODE)) return { code: 'PHONE_NOT_UAE' };
  let rest = international.slice(UAE_CALLING_CODE.length);
  if (rest.startsWith('(0)')) rest = rest.slice(3);
  return { national: `0${rest.replace(/[()]/g, '')}` };
}

/**
 * @internal Shared by the parser and `validateUaePhone`, so both apply the same rules in
 * the same order.
 */
export function inspectUaePhone(
  input: unknown,
  options?: UaePhoneOptions,
): { info: UaePhoneInfo } | { code: UaePhoneErrorCode } {
  const converted = toNational(input);
  if ('code' in converted) return converted;
  const { national } = converted;
  if (!/^0[0-9]{8,9}$/.test(national)) return { code: 'PHONE_INVALID_FORMAT' };

  // Mobile: 0 + 5 + Z + ABCXXXX (NNP Annex 1, Level 0, section C).
  if (national[1] === '5') {
    if (national.length !== 10) return { code: 'PHONE_INVALID_FORMAT' };
    if (options?.mobilePrefixes !== 'any' && !UAE_MOBILE_PREFIXES.includes(national.slice(0, 3))) {
      return { code: 'PHONE_UNALLOCATED_MOBILE_PREFIX' };
    }
    return { info: build(national, 'mobile', 2, null) };
  }

  // Landline: 0 + Y + ABCXXXX, A = 2-8, not B = C = 0 (NNP Annex 1, Level 0, section B).
  const area = UAE_AREA_CODES.find((a) => a.code === national.slice(0, 2));
  if (!area) return { code: 'PHONE_INVALID_PREFIX' };
  if (national.length !== 9) return { code: 'PHONE_INVALID_FORMAT' };
  if (!/^[2-8]/.test(national.slice(2)) || national.slice(3, 5) === '00') {
    return { code: 'PHONE_INVALID_SUBSCRIBER_NUMBER' };
  }
  return { info: build(national, 'landline', 1, area) };
}

function build(
  national: string,
  type: UaePhoneInfo['type'],
  prefixLength: number,
  area: UaePhoneInfo['area'],
): UaePhoneInfo {
  return {
    type,
    national,
    e164: `+${UAE_CALLING_CODE}${national.slice(1)}`,
    prefix: national.slice(1, 1 + prefixLength),
    subscriberNumber: national.slice(1 + prefixLength),
    area,
  };
}

/**
 * Parses a UAE mobile or landline number.
 *
 * Accepts the national form (`050 123 4567`, `04 123 4567`), `+971`, `00971`, or `971`
 * prefixes, an optional `(0)` after the country code, and spaces, hyphens, dots, or
 * parentheses as separators. Arabic-Indic digits are normalized first.
 *
 * Toll-free (800), fixed-cost (600), premium (900), and short codes are not supported yet.
 *
 * @param input - Phone number. Non-string input returns `null` without throwing.
 * @param options - Optional `{ mobilePrefixes }`.
 * @returns The decoded {@link UaePhoneInfo}, or `null` if the input is invalid.
 *
 * @example
 * ```ts
 * parseUaePhone('+971 50 123 4567')?.national; // '0501234567'
 * parseUaePhone('04 234 5678')?.area?.area; // 'Dubai'
 * parseUaePhone('0511234567'); // null
 * parseUaePhone('0511234567', { mobilePrefixes: 'any' })?.type; // 'mobile'
 * ```
 */
export function parseUaePhone(input: unknown, options?: UaePhoneOptions): UaePhoneInfo | null {
  const result = inspectUaePhone(input, options);
  return 'info' in result ? result.info : null;
}
