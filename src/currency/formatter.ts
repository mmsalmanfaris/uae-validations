import { parseAed, UAE_DIRHAM_SIGN } from './parser';

/** Options for {@link formatAed}. */
export interface AedFormatOptions {
  /**
   * How to mark the currency. Defaults to `'code'`.
   *
   * - `'code'`: the ISO 4217 code, `AED 1,234.50`.
   * - `'symbol'`: the Dirham sign U+20C3 to the left of the amount, separated by a space, as
   *   the CBUAE guidelines require. Never combined with `AED`.
   * - `'arabic'`: the Arabic abbreviation after the amount, `1,234.50 د.إ`.
   * - `'none'`: the amount alone, `1,234.50`.
   */
  display?: 'code' | 'symbol' | 'arabic' | 'none';
  /** Use thousands separators. Default `true`. */
  grouping?: boolean;
}

/**
 * Formats an AED amount with exactly two decimal places.
 *
 * @param input - Amount as a number or string; see {@link parseAed}. Negative amounts are allowed.
 * @param options - Optional `{ display, grouping }`.
 * @returns The formatted amount, or `null` if the input is invalid.
 *
 * @example
 * ```ts
 * formatAed(1234.5); // 'AED 1,234.50'
 * formatAed(1234.5, { display: 'symbol' }); // '\u20C3 1,234.50'
 * formatAed('1234.5', { display: 'arabic' }); // '1,234.50 د.إ'
 * formatAed(-20, { display: 'none' }); // '-20.00'
 * formatAed(1000000, { grouping: false }); // 'AED 1000000.00'
 * ```
 */
export function formatAed(input: unknown, options: AedFormatOptions = {}): string | null {
  const parsed = parseAed(input, { allowNegative: true });
  if (!parsed) return null;
  const whole =
    options.grouping === false
      ? String(parsed.dirhams)
      : String(parsed.dirhams).replace(/\B(?=([0-9]{3})+(?![0-9]))/g, ',');
  const number = `${parsed.negative ? '-' : ''}${whole}.${String(parsed.remainderFils).padStart(2, '0')}`;
  if (options.display === 'none') return number;
  if (options.display === 'symbol') return `${UAE_DIRHAM_SIGN} ${number}`;
  if (options.display === 'arabic') return `${number} د.إ`;
  return `AED ${number}`;
}
