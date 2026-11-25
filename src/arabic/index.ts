/**
 * Normalize Arabic text and validate person names in Arabic or Latin script.
 *
 * Import from `uae-validations/arabic`, or from the package root.
 *
 * The same Arabic name is often typed several ways: with or without diacritics (tashkeel),
 * with different alef forms (أ إ آ ا), with tatweel (ـ), or with Persian keyboard letters
 * (ک ی). Normalizing first lets forms compare a typed name against an Emirates ID or a
 * database record reliably.
 *
 * @example
 * ```ts
 * import { normalizeArabic, areNamesEquivalent } from 'uae-validations/arabic';
 *
 * normalizeArabic('أَحْمَد'); // 'احمد'
 * areNamesEquivalent('إبراهيم', 'ابراهيم'); // true
 * ```
 *
 * @module arabic
 */

import { MAX_INPUT_LENGTH, toAsciiDigits } from '../core/normalize';
import type { ReferenceSource, ValidationResult } from '../core/types';
import { createFailure, createSuccess, deepFreeze } from '../core/utils';

/** Reference for the character ranges used in this module. */
export const ARABIC_SOURCES: readonly ReferenceSource[] = deepFreeze([
  {
    authority: 'Unicode Consortium',
    title: 'The Unicode Standard: Arabic block (U+0600–U+06FF)',
    url: 'https://www.unicode.org/charts/PDF/U0600.pdf',
    lastReviewed: '2026-11-06',
  },
]);

/** Options for {@link normalizeArabic}. Each defaults as noted. */
export interface ArabicNormalizeOptions {
  /** Remove diacritics (fathatan … sukun, superscript alef). Default `true`. */
  removeDiacritics?: boolean;
  /** Remove tatweel (ـ). Default `true`. */
  removeTatweel?: boolean;
  /** Replace أ إ آ ٱ with ا. Default `true`. */
  normalizeAlef?: boolean;
  /** Replace Persian/Urdu ک ی with Arabic ك ي. Default `true`. */
  normalizePersianLetters?: boolean;
  /** Replace ة with ه. Default `false` (changes meaning in some words). */
  normalizeTaaMarbuta?: boolean;
  /** Replace ى with ي. Default `false`. */
  normalizeAlefMaqsura?: boolean;
  /** Replace ؤ with و and ئ with ي. Default `false`. */
  normalizeHamza?: boolean;
  /** Convert Arabic-Indic digits to ASCII. Default `true`. */
  asciiDigits?: boolean;
}

/**
 * Normalizes Arabic text for comparison or storage. Also trims, collapses whitespace, and
 * removes invisible direction marks.
 *
 * @param input - Text to normalize. Non-string input returns `''`.
 * @param options - Which normalizations to apply; see {@link ArabicNormalizeOptions}.
 * @returns The normalized text.
 *
 * @example
 * ```ts
 * normalizeArabic('مُحَمَّد'); // 'محمد'
 * normalizeArabic('آمنة'); // 'امنة'
 * normalizeArabic('آمنة', { normalizeTaaMarbuta: true }); // 'امنه'
 * normalizeArabic('علـــي'); // 'علي'
 * normalizeArabic('٢٠٢٤'); // '2024'
 * ```
 */
export function normalizeArabic(input: unknown, options: ArabicNormalizeOptions = {}): string {
  if (typeof input !== 'string' || input.length > MAX_INPUT_LENGTH) return '';
  let text = input.replace(/[\u200B-\u200F\u202A-\u202E\u2066-\u2069\u061C\uFEFF]/g, '');
  if (options.removeDiacritics !== false) text = text.replace(/[ً-ٰٟ]/g, '');
  if (options.removeTatweel !== false) text = text.replace(/ـ/g, '');
  if (options.normalizeAlef !== false) text = text.replace(/[آأإٱ]/g, 'ا');
  if (options.normalizePersianLetters !== false) {
    text = text.replace(/ک/g, 'ك').replace(/[یے]/g, 'ي');
  }
  if (options.normalizeTaaMarbuta === true) text = text.replace(/ة/g, 'ه');
  if (options.normalizeAlefMaqsura === true) text = text.replace(/ى/g, 'ي');
  if (options.normalizeHamza === true) {
    text = text.replace(/ؤ/g, 'و').replace(/ئ/g, 'ي');
  }
  if (options.asciiDigits !== false) text = toAsciiDigits(text);
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Checks whether the text contains at least one Arabic letter.
 *
 * @param input - Text to check.
 * @returns `true` if any Arabic-script letter is present.
 *
 * @example
 * ```ts
 * containsArabic('Dubai دبي'); // true
 * containsArabic('Dubai'); // false
 * ```
 */
export function containsArabic(input: unknown): boolean {
  return typeof input === 'string' && /(?=\p{Script=Arabic})\p{L}/u.test(input);
}

/** Script accepted by {@link isValidPersonName}. */
export type NameScript = 'arabic' | 'latin' | 'any';

/** Options for {@link validatePersonName}. */
export interface PersonNameOptions {
  /** `'arabic'`, `'latin'`, or `'any'` (default: either script, but not mixed in one name). */
  script?: NameScript;
  /** Minimum length in letters, after trimming. Default `2`. */
  minLength?: number;
  /** Maximum length in characters, after trimming. Default `100`. */
  maxLength?: number;
}

/** Stable error codes returned by {@link validatePersonName}. */
export type PersonNameErrorCode =
  | 'NAME_REQUIRED'
  | 'NAME_TOO_SHORT'
  | 'NAME_TOO_LONG'
  | 'NAME_INVALID_CHARACTERS'
  | 'NAME_MIXED_SCRIPTS';

// Script_Extensions, because Arabic diacritics belong to the Inherited script.
const ARABIC_LETTER = String.raw`(?:(?=\p{Script_Extensions=Arabic})[\p{L}\p{M}])`;
const LATIN_LETTER = String.raw`(?:(?=\p{Script=Latin})\p{L}\p{M}*)`;
const namePattern = (letter: string): RegExp =>
  new RegExp(String.raw`^${letter}+(?:(?:[ \-'’]|\. ?)${letter}+)*\.?$`, 'u');
const ARABIC_NAME = namePattern(ARABIC_LETTER);
const LATIN_NAME = namePattern(LATIN_LETTER);

/**
 * Validates a person's name: letters of one script, separated by single spaces,
 * hyphens, apostrophes, or dots (for initials).
 *
 * @param input - Name to check. Non-string input returns a failure without throwing.
 * @param options - Optional `{ script, minLength, maxLength }`.
 * @returns `{ isValid: true, data }` with the trimmed, whitespace-collapsed name, or a failure.
 *
 * @example
 * ```ts
 * validatePersonName('محمد بن راشد').isValid; // true
 * validatePersonName("Mary-Jane O'Neil").isValid; // true
 * validatePersonName('Ahmed محمد').code; // 'NAME_MIXED_SCRIPTS'
 * validatePersonName('Ahmed', { script: 'arabic' }).code; // 'NAME_INVALID_CHARACTERS'
 * validatePersonName('R2D2').code; // 'NAME_INVALID_CHARACTERS'
 * ```
 */
export function validatePersonName(
  input: unknown,
  options: PersonNameOptions = {},
): ValidationResult<string> {
  const name =
    typeof input === 'string' && input.length <= MAX_INPUT_LENGTH
      ? input
          .replace(/[\u200B-\u200F\u202A-\u202E\u2066-\u2069\u061C\uFEFF]/g, '')
          .replace(/\s+/g, ' ')
          .trim()
      : '';
  if (!name) return createFailure('Name is required.', 'NAME_REQUIRED');
  const min = options.minLength ?? 2;
  const max = options.maxLength ?? 100;
  if (name.length > max) {
    return createFailure(`Name must be at most ${max} characters.`, 'NAME_TOO_LONG');
  }
  const script = options.script ?? 'any';
  const arabic = ARABIC_NAME.test(name);
  const latin = LATIN_NAME.test(name);
  const ok = script === 'arabic' ? arabic : script === 'latin' ? latin : arabic || latin;
  if (!ok) {
    const mixed =
      script === 'any' &&
      containsArabic(name) &&
      /(?=\p{Script=Latin})\p{L}/u.test(name) &&
      /^[\p{L}\p{M} \-'’.]+$/u.test(name);
    return mixed
      ? createFailure('Name must use one script, Arabic or Latin.', 'NAME_MIXED_SCRIPTS')
      : createFailure('Name contains characters that are not allowed.', 'NAME_INVALID_CHARACTERS');
  }
  if (name.replace(/[^\p{L}]/gu, '').length < min) {
    return createFailure(`Name must be at least ${min} letters.`, 'NAME_TOO_SHORT');
  }
  return createSuccess(name);
}

/**
 * Checks whether the input is a valid person name. See {@link validatePersonName}.
 *
 * @param input - Name to check.
 * @param options - Optional `{ script, minLength, maxLength }`.
 * @returns `true` if {@link validatePersonName} succeeds.
 *
 * @example
 * ```ts
 * isValidPersonName('فاطمة'); // true
 * isValidPersonName('José Álvarez', { script: 'latin' }); // true
 * isValidPersonName('A'); // false
 * ```
 */
export function isValidPersonName(input: unknown, options?: PersonNameOptions): boolean {
  return validatePersonName(input, options).isValid;
}

function comparable(name: string): string {
  if (containsArabic(name)) {
    return normalizeArabic(name, {
      normalizeTaaMarbuta: true,
      normalizeAlefMaqsura: true,
      normalizeHamza: true,
    }).replace(/[\s\-'’.]/g, '');
  }
  return name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[\s\-'’.]/g, '');
}

/**
 * Compares two names after aggressive normalization: Arabic diacritics, alef, hamza,
 * taa marbuta, and alef maqsura variants; Latin case and accents; and spaces, hyphens,
 * apostrophes, and dots. It does not transliterate between scripts or match spelling
 * variants such as Mohammed and Muhammad.
 *
 * @param a - First name.
 * @param b - Second name.
 * @returns `true` if both are non-empty strings that normalize to the same text.
 *
 * @example
 * ```ts
 * areNamesEquivalent('عبد الله', 'عبدالله'); // true
 * areNamesEquivalent('فاطمة', 'فاطمه'); // true
 * areNamesEquivalent('José', 'jose'); // true
 * areNamesEquivalent('Mohammed', 'Muhammad'); // false
 * ```
 */
export function areNamesEquivalent(a: unknown, b: unknown): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length > MAX_INPUT_LENGTH || b.length > MAX_INPUT_LENGTH) return false;
  const left = comparable(a);
  return left !== '' && left === comparable(b);
}
