import { parseEmiratesId } from './parser';
import type { EmiratesIdFormatStyle, EmiratesIdOptions, MaskEmiratesIdOptions } from './types';

/**
 * Formats a valid Emirates ID.
 *
 * @param input - Emirates ID in any accepted layout.
 * @param style - `'hyphenated'` (default, `784-1990-1234567-6`), `'spaced'` (`784 1990 1234567 6`), or `'compact'` (`784199012345676`).
 * @param options - Optional `{ referenceDate, verifyChecksum }`.
 * @returns The formatted ID, or `null` if the input is invalid.
 *
 * @example
 * ```ts
 * formatEmiratesId('784199012345676'); // '784-1990-1234567-6'
 * formatEmiratesId('784-1990-1234567-6', 'spaced'); // '784 1990 1234567 6'
 * formatEmiratesId('784 1990 1234567 6', 'compact'); // '784199012345676'
 * ```
 */
export function formatEmiratesId(
  input: unknown,
  style: EmiratesIdFormatStyle = 'hyphenated',
  options?: EmiratesIdOptions,
): string | null {
  const info = parseEmiratesId(input, options);
  if (!info) return null;
  if (style === 'compact') return info.emiratesId;
  if (style === 'spaced') return info.formatted.replace(/-/g, ' ');
  return info.formatted;
}

/**
 * Masks an Emirates ID for display or logging, keeping the `784` prefix and the last
 * few digits. The birth year is hidden by default because it is personal data.
 *
 * @param input - Emirates ID in any accepted layout.
 * @param options - `{ maskChar, visibleDigits }` plus the usual `{ referenceDate, verifyChecksum }`.
 * @returns The hyphenated, masked ID, or `null` if the input is invalid.
 *
 * @example
 * ```ts
 * maskEmiratesId('784199012345676'); // '784-****-****567-6'
 * maskEmiratesId('784199012345676', { visibleDigits: 1, maskChar: 'X' }); // '784-XXXX-XXXXXXX-6'
 * ```
 */
export function maskEmiratesId(input: unknown, options?: MaskEmiratesIdOptions): string | null {
  const info = parseEmiratesId(input, options);
  if (!info) return null;

  const requested = options?.visibleDigits;
  const visible =
    typeof requested === 'number' && Number.isFinite(requested)
      ? Math.min(12, Math.max(0, Math.trunc(requested)))
      : 4;
  const maskChar =
    typeof options?.maskChar === 'string' && options.maskChar.length > 0
      ? options.maskChar.charAt(0)
      : '*';

  const body = info.emiratesId.slice(3);
  const masked = maskChar.repeat(body.length - visible) + body.slice(body.length - visible);
  return `784-${masked.slice(0, 4)}-${masked.slice(4, 11)}-${masked.slice(11)}`;
}
