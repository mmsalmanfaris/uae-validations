import { parseUaePhone } from './parser';
import type { UaePhoneFormat, UaePhoneOptions } from './types';

/**
 * Formats a valid UAE phone number.
 *
 * @param input - Phone number in any accepted layout.
 * @param format - `'national'` (default), `'international'`, `'e164'`, `'compact'` (national without spaces), or `'tel'` (a `tel:` URI).
 * @param options - Optional `{ mobilePrefixes }`.
 * @returns The formatted number, or `null` if the input is invalid.
 *
 * @example
 * ```ts
 * formatUaePhone('+971501234567'); // '050 123 4567'
 * formatUaePhone('0501234567', 'e164'); // '+971501234567'
 * formatUaePhone('0501234567', 'international'); // '+971 50 123 4567'
 * formatUaePhone('+97142345678'); // '04 234 5678'
 * formatUaePhone('04 234 5678', 'tel'); // 'tel:+97142345678'
 * ```
 */
export function formatUaePhone(
  input: unknown,
  format: UaePhoneFormat = 'national',
  options?: UaePhoneOptions,
): string | null {
  const info = parseUaePhone(input, options);
  if (!info) return null;
  const subscriber = `${info.subscriberNumber.slice(0, 3)} ${info.subscriberNumber.slice(3)}`;
  switch (format) {
    case 'e164':
      return info.e164;
    case 'tel':
      return `tel:${info.e164}`;
    case 'compact':
      return info.national;
    case 'international':
      return `+971 ${info.prefix} ${subscriber}`;
    default:
      return `0${info.prefix} ${subscriber}`;
  }
}
