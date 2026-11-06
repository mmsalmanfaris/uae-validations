import type { ValidationErrorCode, ValidationResult } from './types';

export const valid = (normalized: string): ValidationResult => ({ valid: true, normalized });
export const invalid = (code: ValidationErrorCode, message: string): ValidationResult => ({
  valid: false,
  errors: [{ code, message }]
});
