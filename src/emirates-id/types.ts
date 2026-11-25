/** Options shared by the Emirates ID parser, validators, and formatters. */
export interface EmiratesIdOptions {
  /**
   * Date used as "today" when checking that the encoded year is not in the future.
   * Compared by UTC year. Defaults to the current date; an invalid `Date` is ignored.
   */
  referenceDate?: Date;
  /**
   * Also require the final digit to pass the Luhn (mod 10) check. Defaults to `false`.
   *
   * ICP documents that the last digit is a check digit but does not publish the
   * algorithm. Luhn is widely reported to match issued cards, so it is available as
   * an opt-in, not as an official rule. See {@link EmiratesIdInfo.luhnValid}.
   */
  verifyChecksum?: boolean;
}

/** Everything decoded from a structurally valid Emirates ID by {@link parseEmiratesId}. */
export interface EmiratesIdInfo {
  /** The 15 digits with separators removed, for example `'784199012345676'`. */
  emiratesId: string;
  /** Hyphenated display form `784-YYYY-NNNNNNN-C`. */
  formatted: string;
  /** Leading `'784'`, the ISO 3166-1 numeric code for the UAE. */
  countryCode: '784';
  /** Four-digit year field (the holder's year of birth, per ICP). */
  year: number;
  /** Seven-digit serial segment. */
  serial: string;
  /** Final digit, documented by ICP as a check digit. */
  checkDigit: number;
  /**
   * Whether the 15 digits pass the Luhn check. Informational: ICP has not published
   * the check-digit algorithm, so `false` does not by itself prove the number is fake.
   */
  luhnValid: boolean;
}

/** Layout for {@link formatEmiratesId}. */
export type EmiratesIdFormatStyle = 'hyphenated' | 'spaced' | 'compact';

/** Options for {@link maskEmiratesId}. */
export interface MaskEmiratesIdOptions extends EmiratesIdOptions {
  /** Character that replaces hidden digits. Defaults to `'*'`. Only the first character is used. */
  maskChar?: string;
  /** How many trailing digits stay visible, 0 to 12. Defaults to `4`. The `784` prefix is always shown. */
  visibleDigits?: number;
}

/** Stable error codes returned by {@link validateEmiratesId}. */
export type EmiratesIdErrorCode =
  | 'EMIRATES_ID_REQUIRED'
  | 'EMIRATES_ID_INVALID_FORMAT'
  | 'EMIRATES_ID_INVALID_COUNTRY_CODE'
  | 'EMIRATES_ID_INVALID_YEAR'
  | 'EMIRATES_ID_CHECKSUM_MISMATCH';
