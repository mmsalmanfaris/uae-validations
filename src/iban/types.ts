/** Everything decoded from a valid UAE IBAN by {@link parseUaeIban}. */
export interface UaeIbanInfo {
  /** Electronic format: 23 characters, no spaces, upper case. */
  iban: string;
  /** Print format: groups of four separated by spaces, for example `'AE07 0331 2345 6789 0123 456'`. */
  formatted: string;
  /** Always `'AE'`. */
  countryCode: 'AE';
  /** The two ISO 7064 check digits. */
  checkDigits: string;
  /** Three-digit bank identifier assigned by the Central Bank of the UAE. */
  bankCode: string;
  /** Sixteen-digit customer account number, left-padded with zeros by the bank. */
  accountNumber: string;
  /** Basic Bank Account Number: `bankCode` + `accountNumber` (19 digits). */
  bban: string;
}

/** Layout for {@link formatUaeIban}: `'print'` (grouped in fours) or `'electronic'` (no spaces). */
export type UaeIbanFormat = 'print' | 'electronic';

/** Stable error codes returned by {@link validateUaeIban}. */
export type UaeIbanErrorCode =
  | 'IBAN_REQUIRED'
  | 'IBAN_INVALID_FORMAT'
  | 'IBAN_NOT_UAE'
  | 'IBAN_INVALID_LENGTH'
  | 'IBAN_CHECKSUM_MISMATCH';
