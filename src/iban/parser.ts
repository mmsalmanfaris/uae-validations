import { cleanString } from '../core/normalize';
import { UAE_IBAN_LENGTH } from './constants';
import type { UaeIbanErrorCode, UaeIbanInfo } from './types';

/** ISO 7064 MOD 97-10 remainder of a digit string, computed piecewise to avoid overflow. */
function mod97(digits: string): number {
  let remainder = 0;
  for (let i = 0; i < digits.length; i++) {
    remainder = (remainder * 10 + (digits.charCodeAt(i) - 48)) % 97;
  }
  return remainder;
}

/** Converts an IBAN's letters to numbers (A = 10 … Z = 35), as ISO 13616 requires. */
function lettersToDigits(value: string): string {
  return value.replace(/[A-Z]/g, (ch) => String(ch.charCodeAt(0) - 55));
}

/** @internal Shared by the parser and `validateUaeIban`. */
export function inspectUaeIban(input: unknown): { info: UaeIbanInfo } | { code: UaeIbanErrorCode } {
  const cleaned = cleanString(input)
    .toUpperCase()
    .replace(/^IBAN[\s:]*/, '');
  if (!cleaned) return { code: 'IBAN_REQUIRED' };
  const iban = cleaned.replace(/[\s-]/g, '');
  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(iban)) return { code: 'IBAN_INVALID_FORMAT' };
  if (!iban.startsWith('AE')) return { code: 'IBAN_NOT_UAE' };
  if (iban.length !== UAE_IBAN_LENGTH) return { code: 'IBAN_INVALID_LENGTH' };
  if (!/^AE[0-9]{21}$/.test(iban)) return { code: 'IBAN_INVALID_FORMAT' };

  const checkDigits = iban.slice(2, 4);
  // ISO 13616: 00, 01 and 99 are never valid check digits.
  if (
    checkDigits === '00' ||
    checkDigits === '01' ||
    checkDigits === '99' ||
    mod97(lettersToDigits(iban.slice(4) + iban.slice(0, 4))) !== 1
  ) {
    return { code: 'IBAN_CHECKSUM_MISMATCH' };
  }

  const bban = iban.slice(4);
  return {
    info: {
      iban,
      formatted: iban.replace(/(.{4})(?=.)/g, '$1 '),
      countryCode: 'AE',
      checkDigits,
      bankCode: bban.slice(0, 3),
      accountNumber: bban.slice(3),
      bban,
    },
  };
}

/**
 * Parses a UAE IBAN.
 *
 * Accepts the electronic form or the print form with spaces, in any letter case, with an
 * optional leading `IBAN` label. Checks the country code, the 23-character length, that
 * the bank code and account number are digits, and the ISO 7064 MOD 97-10 checksum.
 *
 * A valid checksum means the IBAN is well-formed. It does not prove the account exists.
 *
 * @param input - IBAN. Non-string input returns `null` without throwing.
 * @returns The decoded {@link UaeIbanInfo}, or `null` if the input is invalid.
 *
 * @example
 * ```ts
 * parseUaeIban('AE070331234567890123456')?.bankCode; // '033'
 * parseUaeIban('ae07 0331 2345 6789 0123 456')?.accountNumber; // '1234567890123456'
 * parseUaeIban('AE080331234567890123456'); // null
 * ```
 */
export function parseUaeIban(input: unknown): UaeIbanInfo | null {
  const result = inspectUaeIban(input);
  return 'info' in result ? result.info : null;
}

/**
 * Builds a UAE IBAN from a bank code and account number, computing the check digits.
 * Account numbers shorter than 16 digits are left-padded with zeros, as UAE banks do.
 *
 * @param bankCode - Three-digit CBUAE bank identifier.
 * @param accountNumber - Account number, up to 16 digits. Spaces and hyphens are ignored.
 * @returns The IBAN in electronic format, or `null` if either part is not digits of a valid length.
 *
 * @example
 * ```ts
 * buildUaeIban('033', '1234567890123456'); // 'AE070331234567890123456'
 * buildUaeIban('033', '12345'); // 'AE880330000000000012345'
 * buildUaeIban('33', '12345'); // null
 * ```
 */
export function buildUaeIban(bankCode: unknown, accountNumber: unknown): string | null {
  const bank = cleanString(bankCode);
  const account = cleanString(accountNumber).replace(/[\s-]/g, '');
  if (!/^[0-9]{3}$/.test(bank) || !/^[0-9]{1,16}$/.test(account)) return null;
  const bban = bank + account.padStart(16, '0');
  const check = 98 - mod97(lettersToDigits(`${bban}AE00`));
  return `AE${String(check).padStart(2, '0')}${bban}`;
}
