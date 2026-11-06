import { normalizeAlphanumeric } from '../core/normalize';
import { invalid, valid } from '../core/result';
import type { ValidationResult } from '../core/types';

export interface ParsedUaeIban {
  readonly normalized: string;
  readonly countryCode: 'AE';
  readonly checkDigits: string;
  readonly bankCode: string;
  readonly accountNumber: string;
}

function hasValidMod97(iban: string): boolean {
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  let remainder = 0;
  for (const char of rearranged) {
    const numeric = char >= 'A' && char <= 'Z' ? String(char.charCodeAt(0) - 55) : char;
    for (const digit of numeric) remainder = (remainder * 10 + Number(digit)) % 97;
  }
  return remainder === 1;
}

export function validateUaeIban(value: unknown): ValidationResult {
  const normalized = normalizeAlphanumeric(value);
  if (normalized === null) return invalid('INVALID_TYPE', 'IBAN must contain only letters, digits, and supported separators.');
  if (normalized.length !== 23) return invalid('INVALID_LENGTH', 'UAE IBAN must contain 23 characters.');
  if (!/^AE\d{21}$/.test(normalized)) return invalid('INVALID_FORMAT', 'UAE IBAN must start with AE followed by 21 digits.');
  if (!hasValidMod97(normalized)) return invalid('INVALID_CHECKSUM', 'IBAN checksum is invalid.');
  return valid(normalized);
}

export const isValidUaeIban = (value: unknown): boolean => validateUaeIban(value).valid;

export function parseUaeIban(value: unknown): ParsedUaeIban | null {
  const result = validateUaeIban(value);
  if (!result.valid) return null;
  return {
    normalized: result.normalized,
    countryCode: 'AE',
    checkDigits: result.normalized.slice(2, 4),
    bankCode: result.normalized.slice(4, 7),
    accountNumber: result.normalized.slice(7)
  };
}

export function formatUaeIban(value: unknown): string {
  const parsed = parseUaeIban(value);
  return parsed ? parsed.normalized.match(/.{1,4}/g)?.join(' ') ?? '' : '';
}

export function maskUaeIban(value: unknown): string {
  const parsed = parseUaeIban(value);
  return parsed ? `${parsed.normalized.slice(0, 7)}${'*'.repeat(12)}${parsed.normalized.slice(-4)}` : '';
}
