import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  IBAN_SOURCES,
  buildUaeIban,
  formatUaeIban,
  isValidUaeIban,
  maskUaeIban,
  parseUaeIban,
  validateUaeIban,
} from '../src/iban';

// Synthetic IBANs only. AE070331234567890123456 is the ISO 13616 registry example.
const IBAN = 'AE070331234567890123456';

describe('parseUaeIban', () => {
  it('decodes every part', () => {
    expect(parseUaeIban(IBAN)).toEqual({
      iban: IBAN,
      formatted: 'AE07 0331 2345 6789 0123 456',
      countryCode: 'AE',
      checkDigits: '07',
      bankCode: '033',
      accountNumber: '1234567890123456',
      bban: '0331234567890123456',
    });
  });

  it.each([
    'AE07 0331 2345 6789 0123 456',
    'ae070331234567890123456',
    ' AE07-0331-2345-6789-0123-456 ',
    'IBAN AE07 0331 2345 6789 0123 456',
    'IBAN: AE070331234567890123456',
    '\u200EAE070331234567890123456',
  ])('accepts %j', (input) => {
    expect(parseUaeIban(input)?.iban).toBe(IBAN);
  });
});

describe('validateUaeIban', () => {
  it.each([
    ['', 'IBAN_REQUIRED'],
    [null, 'IBAN_REQUIRED'],
    ['IBAN', 'IBAN_REQUIRED'],
    ['AE07_0331', 'IBAN_INVALID_FORMAT'],
    ['0331234567890123456', 'IBAN_INVALID_FORMAT'],
    ['GB82WEST12345698765432', 'IBAN_NOT_UAE'],
    ['SA0380000000608010167519', 'IBAN_NOT_UAE'],
    ['AE07033123456789012345', 'IBAN_INVALID_LENGTH'],
    ['AE0703312345678901234567', 'IBAN_INVALID_LENGTH'],
    ['AE07033123456789012345A', 'IBAN_INVALID_FORMAT'],
    ['AE080331234567890123456', 'IBAN_CHECKSUM_MISMATCH'],
    ['AE070331234567890123465', 'IBAN_CHECKSUM_MISMATCH'],
  ])('rejects %j with %s', (input, code) => {
    const result = validateUaeIban(input);
    expect(result.isValid).toBe(false);
    expect(result.code).toBe(code);
  });

  it('rejects the reserved check digits 00, 01, and 99 even when Mod-97 passes', () => {
    // 98 ≡ 01 and 97 ≡ 00 (mod 97), so these pass the arithmetic check but are invalid by ISO 13616.
    const base = buildUaeIban('001', '0000000000000000')!;
    const bban = base.slice(4);
    for (const check of ['00', '01', '99']) {
      expect(validateUaeIban(`AE${check}${bban}`).isValid).toBe(false);
    }
  });
});

describe('buildUaeIban', () => {
  it('builds IBANs that validate', () => {
    expect(buildUaeIban('033', '1234567890123456')).toBe(IBAN);
    expect(buildUaeIban('033', '1234-5678 9012-3456')).toBe(IBAN);
    expect(isValidUaeIban(buildUaeIban('001', '1'))).toBe(true);
  });

  it.each([
    ['33', '1'],
    ['0333', '1'],
    ['abc', '1'],
    ['033', ''],
    ['033', '12345678901234567'],
    ['033', '12a'],
    [null, '1'],
  ])('returns null for bank %j and account %j', (bank, account) => {
    expect(buildUaeIban(bank, account)).toBeNull();
  });

  it('round-trips random bank codes and account numbers', () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^[0-9]{3}$/),
        fc.stringMatching(/^[0-9]{1,16}$/),
        (bank, account) => {
          const info = parseUaeIban(buildUaeIban(bank, account));
          expect(info?.bankCode).toBe(bank);
          expect(info?.accountNumber).toBe(account.padStart(16, '0'));
        },
      ),
    );
  });

  it('detects any single-digit change', () => {
    fc.assert(
      fc.property(fc.integer({ min: 4, max: 22 }), fc.integer({ min: 1, max: 9 }), (pos, delta) => {
        const digit = (Number(IBAN[pos]) + delta) % 10;
        const changed = IBAN.slice(0, pos) + String(digit) + IBAN.slice(pos + 1);
        expect(isValidUaeIban(changed)).toBe(false);
      }),
    );
  });
});

describe('formatUaeIban and maskUaeIban', () => {
  it('formats', () => {
    expect(formatUaeIban(IBAN)).toBe('AE07 0331 2345 6789 0123 456');
    expect(formatUaeIban('ae07 0331 2345 6789 0123 456', 'electronic')).toBe(IBAN);
    expect(formatUaeIban('bad')).toBeNull();
  });

  it('masks all but the bank code and last four digits', () => {
    expect(maskUaeIban(IBAN)).toBe('AE07 033* **** **** ***3 456');
    expect(maskUaeIban('bad')).toBeNull();
  });
});

describe('IBAN_SOURCES', () => {
  it('cites CBUAE', () => {
    expect(IBAN_SOURCES.some((s) => s.authority.includes('Central Bank'))).toBe(true);
  });
});
