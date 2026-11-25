/**
 * Show validation errors in English or Arabic.
 *
 * Import from `uae-validations/i18n`, or from the package root.
 *
 * Every failure carries a stable `code`. These helpers turn a code into a message in the
 * user's language, and accept your own wording for any code.
 *
 * @example
 * ```ts
 * import { translateValidationCode, localizeValidationResult } from 'uae-validations/i18n';
 * import { validateEmiratesId } from 'uae-validations/emirates-id';
 *
 * translateValidationCode('EMIRATES_ID_REQUIRED', 'ar'); // 'رقم الهوية الإماراتية مطلوب.'
 * localizeValidationResult(validateEmiratesId(''), 'ar').error; // 'رقم الهوية الإماراتية مطلوب.'
 * ```
 *
 * @module i18n
 */

import type { ValidationResult } from '../core/types';
import { VALIDATION_MESSAGES, type ValidationLocale } from './messages';

export * from './messages';

/** Your own messages keyed by validation code. They take precedence over the built-in ones. */
export type MessageOverrides = Readonly<Partial<Record<string, string>>>;

const has = (object: object, key: string): boolean =>
  Object.prototype.hasOwnProperty.call(object, key);

/**
 * Returns the message for a validation code in the given language. Unknown codes and
 * unsupported locales fall back to the generic `VALIDATION_FAILED` message.
 *
 * @param code - Validation code, such as `'IBAN_CHECKSUM_MISMATCH'`.
 * @param locale - `'en'` (default) or `'ar'`.
 * @param overrides - Optional messages keyed by code that replace the built-in text.
 * @returns The message for the code.
 *
 * @example
 * ```ts
 * translateValidationCode('IBAN_CHECKSUM_MISMATCH'); // 'IBAN check digits do not match.'
 * translateValidationCode('PHONE_REQUIRED', 'ar'); // 'رقم الهاتف مطلوب.'
 * translateValidationCode('PHONE_REQUIRED', 'en', { PHONE_REQUIRED: 'Enter your mobile number' }); // 'Enter your mobile number'
 * translateValidationCode('NOT_A_CODE', 'ar'); // 'فشل التحقق من صحة القيمة.'
 * ```
 */
export function translateValidationCode(
  code: string,
  locale: ValidationLocale = 'en',
  overrides?: MessageOverrides,
): string {
  const override = overrides && has(overrides, code) ? overrides[code] : undefined;
  if (typeof override === 'string') return override;
  const lang: ValidationLocale = locale === 'ar' ? 'ar' : 'en';
  const table = VALIDATION_MESSAGES as Readonly<
    Record<string, Readonly<{ en: string; ar: string }>>
  >;
  const entry = has(table, code) ? table[code]! : VALIDATION_MESSAGES.VALIDATION_FAILED;
  return entry[lang];
}

/**
 * Returns a failed result with its message in the given language. Successful results are
 * returned unchanged. The `code` never changes.
 *
 * @param result - Result from any `validateX` function.
 * @param locale - `'en'` (default) or `'ar'`.
 * @param overrides - Optional messages keyed by code.
 * @returns The same result with `error` and `errors` translated.
 *
 * @example
 * ```ts
 * localizeValidationResult(validateUaeIban('AE080331234567890123456'), 'ar').error; // 'رقما التحقق في رقم IBAN غير مطابقين.'
 * localizeValidationResult(validateUaeIban('AE070331234567890123456'), 'ar').isValid; // true
 * ```
 */
export function localizeValidationResult<T>(
  result: ValidationResult<T>,
  locale: ValidationLocale = 'en',
  overrides?: MessageOverrides,
): ValidationResult<T> {
  if (result.isValid) return result;
  const error = translateValidationCode(result.code, locale, overrides);
  return { isValid: false, code: result.code, error, errors: [error] };
}
