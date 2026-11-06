const WEIGHTS = [7, 3, 1] as const;

/**
 * Computes the ICAO 9303 check digit of an MRZ field: characters are valued `0`–`9`,
 * `A`–`Z` = 10–35, and `<` = 0, then weighted 7, 3, 1 repeating, and summed modulo 10.
 *
 * @param field - MRZ characters (`0`–`9`, `A`–`Z`, `<`).
 * @returns The check digit `0`–`9`, or `null` if the field contains any other character.
 *
 * @example
 * ```ts
 * mrzCheckDigit('L898902C3'); // 6
 * mrzCheckDigit('740812'); // 2
 * mrzCheckDigit('abc'); // null
 * ```
 */
export function mrzCheckDigit(field: string): number | null {
  if (typeof field !== 'string' || !/^[0-9A-Z<]*$/.test(field)) return null;
  let sum = 0;
  for (let i = 0; i < field.length; i++) {
    const code = field.charCodeAt(i);
    const value = code === 60 ? 0 : code <= 57 ? code - 48 : code - 55;
    sum += value * WEIGHTS[i % 3]!;
  }
  return sum % 10;
}
