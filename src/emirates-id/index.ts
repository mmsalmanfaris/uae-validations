import { normalizeDigits } from '../core/normalize';
import { invalid, valid } from '../core/result';
import type { ValidationResult } from '../core/types';

export interface ParsedEmiratesId {
  readonly normalized: string;
  readonly countryCode: '784';
  readonly year: string;
  readonly serialNumber: string;
  readonly checkDigit: string;
}

export function validateEmiratesId(value: unknown): ValidationResult {
  const normalized = normalizeDigits(value);
  if (normalized === null) return invalid('INVALID_TYPE', 'Emirates ID must contain only digits and supported separators.');
  if (normalized.length !== 15) return invalid('INVALID_LENGTH', 'Emirates ID must contain 15 digits.');
  if (!normalized.startsWith('784')) return invalid('INVALID_PREFIX', 'Emirates ID must start with 784.');
  return valid(normalized);
}

export const isValidEmiratesId = (value: unknown): boolean => validateEmiratesId(value).valid;

export function parseEmiratesId(value: unknown): ParsedEmiratesId | null {
  const result = validateEmiratesId(value);
  if (!result.valid) return null;
  return {
    normalized: result.normalized,
    countryCode: '784',
    year: result.normalized.slice(3, 7),
    serialNumber: result.normalized.slice(7, 14),
    checkDigit: result.normalized.slice(14)
  };
}

export function formatEmiratesId(value: unknown): string {
  const parsed = parseEmiratesId(value);
  return parsed ? `${parsed.countryCode}-${parsed.year}-${parsed.serialNumber}-${parsed.checkDigit}` : '';
}

export function maskEmiratesId(value: unknown): string {
  const parsed = parseEmiratesId(value);
  return parsed ? `${parsed.countryCode}-${parsed.year}-XXXXXXX-X` : '';
}
