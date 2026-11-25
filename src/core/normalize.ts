/** Maximum raw scalar string length, in UTF-16 code units, before normalization. */
export const MAX_INPUT_LENGTH = 1024;

/**
 * Converts Arabic-Indic (`٠`–`٩`) and Eastern Arabic/Persian (`۰`–`۹`) digits to ASCII
 * `0`–`9`. UAE users frequently type numbers on Arabic keyboards, so every validator
 * runs input through this before matching.
 *
 * @param input - Text that may contain Arabic-script digits.
 * @returns The same text with every Arabic-script digit replaced by its ASCII equivalent.
 *
 * @example
 * ```ts
 * toAsciiDigits('٧٨٤'); // '784'
 * toAsciiDigits('۰۵۰'); // '050'
 * ```
 */
export function toAsciiDigits(input: string): string {
  // U+0660 and U+06F0 both end in 0x0, so the low nibble is the digit value.
  return input.replace(/[\u0660-\u0669\u06F0-\u06F9]/g, (ch) => String(ch.charCodeAt(0) & 0xf));
}

/**
 * Trims strings, removes zero-width characters and bidirectional marks, and converts
 * Arabic-script digits to ASCII. Accepts finite numbers explicitly; rejects other types
 * without invoking user-defined coercion.
 *
 * @param input - Any value.
 * @returns The cleaned string, a finite number as text, or `''` for anything else or strings over 1,024 characters.
 *
 * @example
 * ```ts
 * cleanString('  784-1990-1234567-6 '); // '784-1990-1234567-6'
 * cleanString('\u200F٧٨٤'); // '784'
 * cleanString(42); // '42'
 * cleanString({}); // ''
 * ```
 */
export function cleanString(input: unknown): string {
  if (typeof input !== 'string') {
    return typeof input === 'number' && Number.isFinite(input) ? String(input) : '';
  }
  if (input.length > MAX_INPUT_LENGTH) return '';
  // Zero-width space/joiners, BOM, and the LRM/RLM/ALM and embedding/isolate controls
  // that right-to-left text fields insert around numbers.
  return toAsciiDigits(
    input.replace(/[\u200B-\u200F\u202A-\u202E\u2066-\u2069\u061C\uFEFF]/g, '').trim(),
  );
}

/**
 * Strips spaces, hyphens, underscores, slashes, and dots after {@link cleanString}.
 *
 * @param input - Any value.
 * @returns The cleaned string with separators removed.
 *
 * @example
 * ```ts
 * removeSeparators('784-1990 1234567.6'); // '784199012345676'
 * ```
 */
export function removeSeparators(input: unknown): string {
  return cleanString(input).replace(/[\s\-_/.]/g, '');
}
