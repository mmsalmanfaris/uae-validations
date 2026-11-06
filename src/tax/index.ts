import { normalizeDigits } from '../core/normalize';
import { invalid, valid } from '../core/result';
import type { ValidationResult } from '../core/types';

function validateTaxNumber(value: unknown, length: number, label: string): ValidationResult {
  const normalized = normalizeDigits(value);
  if (normalized === null) return invalid('INVALID_TYPE', `${label} must contain only digits and supported separators.`);
  if (normalized.length !== length) return invalid('INVALID_LENGTH', `${label} must contain ${length} digits.`);
  return valid(normalized);
}

export const validateTrn = (value: unknown): ValidationResult => validateTaxNumber(value, 15, 'TRN');
export const validateTin = (value: unknown): ValidationResult => validateTaxNumber(value, 10, 'TIN');
export const isValidTrn = (value: unknown): boolean => validateTrn(value).valid;
export const isValidTin = (value: unknown): boolean => validateTin(value).valid;

export function tinFromTrn(value: unknown): string | null {
  const result = validateTrn(value);
  return result.valid ? result.normalized.slice(0, 10) : null;
}

export function doesTinMatchTrn(tin: unknown, trn: unknown): boolean {
  const tinResult = validateTin(tin);
  const trnResult = validateTrn(trn);
  return tinResult.valid && trnResult.valid && trnResult.normalized.startsWith(tinResult.normalized);
}

export function maskTrn(value: unknown): string {
  const result = validateTrn(value);
  return result.valid ? `${result.normalized.slice(0, 3)}-***-***-${result.normalized.slice(-3)}` : '';
}
