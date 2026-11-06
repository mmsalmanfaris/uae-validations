/**
 * ICAO 9303 machine-readable zone layout: `TD1` (ID cards, 3 × 30), `TD2` (2 × 36),
 * `TD3` (passports, 2 × 44), and the visa layouts `MRV-A` (2 × 44) and `MRV-B` (2 × 36).
 */
export type MrzFormat = 'TD1' | 'TD2' | 'TD3' | 'MRV-A' | 'MRV-B';

/** A date field from the MRZ. */
export interface MrzDate {
  /** The six characters as printed, `YYMMDD`. May contain `<` for unknown parts. */
  raw: string;
  /** `YYYY-MM-DD` with the century inferred, or `null` if part of the date is unknown. */
  iso: string | null;
}

/** Field whose check digit can fail, as reported by {@link validateMrz}. */
export type MrzCheckedField =
  'documentNumber' | 'birthDate' | 'expiryDate' | 'personalNumber' | 'composite';

/** Everything decoded from a valid MRZ by {@link parseMrz}. */
export interface MrzInfo {
  /** Detected layout. */
  format: MrzFormat;
  /** Document code with filler removed, for example `'P'`, `'I'`, `'ID'`, `'IL'`, or `'V'`. */
  documentCode: string;
  /** Issuing state or organization, ICAO 3-letter code with filler removed (`'ARE'` for the UAE). */
  issuingState: string;
  /** Document number with filler removed, including long document numbers. */
  documentNumber: string;
  /** Nationality, ICAO 3-letter code with filler removed. */
  nationality: string;
  /** Date of birth. */
  birthDate: MrzDate;
  /** Sex as printed: `'male'` (`M`), `'female'` (`F`), or `'unspecified'` (`<` or `X`). */
  sex: 'male' | 'female' | 'unspecified';
  /** Date of expiry. */
  expiryDate: MrzDate;
  /** Primary identifier (surname), filler replaced with spaces. */
  surname: string;
  /** Secondary identifier (given names), filler replaced with spaces. */
  givenNames: string;
  /** Optional data fields with filler removed: one for TD2/TD3/MRV (TD3: the personal number), two for TD1. */
  optionalData: string[];
  /**
   * The 15-digit Emirates ID number, when the document was issued by the UAE (`ARE`) and
   * its first optional data field starts with `784` followed by 12 digits; otherwise `null`.
   */
  emiratesId: string | null;
  /** The normalized MRZ lines. */
  lines: string[];
}

/** Options for the MRZ parser and validators. */
export interface MrzOptions {
  /** Date used to infer the century of birth and expiry dates. Defaults to today. */
  referenceDate?: Date;
}

/** Stable error codes returned by {@link validateMrz}. */
export type MrzErrorCode =
  'MRZ_REQUIRED' | 'MRZ_INVALID_FORMAT' | 'MRZ_INVALID_DATE' | 'MRZ_CHECK_DIGIT_MISMATCH';
