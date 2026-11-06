import { normalizeDigits } from '../core/normalize';
import { invalid, valid } from '../core/result';
import type { ValidationResult } from '../core/types';

export type UaePhoneType = 'mobile' | 'landline';
export type UaePhoneFormat = 'national' | 'e164' | 'international';
export interface ParsedUaePhone {
  readonly normalized: string;
  readonly national: string;
  readonly e164: string;
  readonly type: UaePhoneType;
  readonly areaOrMobileCode: string;
  readonly subscriberNumber: string;
}

const MOBILE_CODES = new Set(['50', '52', '54', '55', '56', '58']);
const LANDLINE_CODES = new Set(['2', '3', '4', '6', '7', '9']);

function toNational(value: unknown): string | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  let input = String(value).trim();
  if (input.startsWith('+')) input = input.slice(1);
  const digits = normalizeDigits(input);
  if (digits === null) return null;
  if (digits.startsWith('00971')) return `0${digits.slice(5)}`;
  if (digits.startsWith('971')) return `0${digits.slice(3)}`;
  return digits;
}

export function parseUaePhone(value: unknown): ParsedUaePhone | null {
  const national = toNational(value);
  if (national === null) return null;
  const mobile = /^05\d{8}$/.test(national) && MOBILE_CODES.has(national.slice(1, 3));
  const landline = /^0\d{8}$/.test(national) && LANDLINE_CODES.has(national.slice(1, 2));
  if (!mobile && !landline) return null;
  const type: UaePhoneType = mobile ? 'mobile' : 'landline';
  const codeLength = mobile ? 2 : 1;
  return {
    normalized: national,
    national,
    e164: `+971${national.slice(1)}`,
    type,
    areaOrMobileCode: national.slice(1, 1 + codeLength),
    subscriberNumber: national.slice(1 + codeLength)
  };
}

export function validateUaePhone(value: unknown): ValidationResult {
  const parsed = parseUaePhone(value);
  if (parsed) return valid(parsed.national);
  if (typeof value !== 'string' && typeof value !== 'number') return invalid('INVALID_TYPE', 'Phone number must be a string or number.');
  return invalid('INVALID_FORMAT', 'Phone number is not a supported UAE mobile or landline number.');
}

export const isValidUaePhone = (value: unknown): boolean => parseUaePhone(value) !== null;
export const isValidUaeMobile = (value: unknown): boolean => parseUaePhone(value)?.type === 'mobile';
export const isValidUaeLandline = (value: unknown): boolean => parseUaePhone(value)?.type === 'landline';

export function formatUaePhone(value: unknown, format: UaePhoneFormat = 'national'): string {
  const parsed = parseUaePhone(value);
  if (!parsed) return '';
  if (format === 'e164') return parsed.e164;
  if (format === 'international') return `+971 ${parsed.national.slice(1, parsed.type === 'mobile' ? 3 : 2)} ${parsed.subscriberNumber}`;
  return parsed.type === 'mobile'
    ? `${parsed.national.slice(0, 3)} ${parsed.subscriberNumber}`
    : `${parsed.national.slice(0, 2)} ${parsed.subscriberNumber}`;
}
