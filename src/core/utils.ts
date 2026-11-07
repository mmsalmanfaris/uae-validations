import type { ValidationResult } from './types';

/**
 * Recursively freezes a reference table so code elsewhere in the process cannot
 * change validation results by mutating shared data.
 *
 * @internal
 */
export function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

/**
 * Checks a digit string with the Luhn (mod 10) algorithm.
 *
 * @param digits - ASCII digits only.
 * @returns `true` if the final digit is a correct Luhn check digit; `false` for empty or non-digit input.
 *
 * @example
 * ```ts
 * luhnCheck('79927398713'); // true
 * luhnCheck('79927398710'); // false
 * ```
 */
export function luhnCheck(digits: string): boolean {
  if (!/^[0-9]+$/.test(digits)) return false;
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = digits.charCodeAt(digits.length - 1 - i) - 48;
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

/**
 * Computes the Luhn check digit to append to a digit string.
 *
 * @param payload - ASCII digits, without the check digit.
 * @returns The check digit `0`–`9`, or `null` for empty or non-digit input.
 *
 * @example
 * ```ts
 * luhnCheckDigit('7992739871'); // 3
 * ```
 */
export function luhnCheckDigit(payload: string): number | null {
  if (!/^[0-9]+$/.test(payload)) return null;
  for (let d = 0; d <= 9; d++) {
    if (luhnCheck(payload + d)) return d;
  }
  /* c8 ignore next */
  return null;
}

/**
 * Helper to construct a successful ValidationResult.
 *
 * @param data - Parsed value to return.
 * @returns A successful `ValidationResult`.
 *
 * @example
 * ```ts
 * createSuccess(42).isValid; // true
 * ```
 */
export function createSuccess<T>(data: T): ValidationResult<T> {
  return { isValid: true, data };
}

/**
 * Helper to construct a failed ValidationResult.
 *
 * @param error - English error message.
 * @param code - Stable error code. Defaults to `'VALIDATION_FAILED'`.
 * @param errors - All messages. Defaults to `[error]`.
 * @returns A failed `ValidationResult`.
 *
 * @example
 * ```ts
 * createFailure('Too short', 'NAME_TOO_SHORT').code; // 'NAME_TOO_SHORT'
 * ```
 */
export function createFailure<T = unknown>(
  error: string,
  code = 'VALIDATION_FAILED',
  errors?: string[],
): ValidationResult<T> {
  return { isValid: false, error, errors: errors ?? [error], code };
}
