import { describe, expect, it } from 'vitest';
import {
  EMIRATES_ID_SOURCES,
  formatEmiratesId,
  isValidEmiratesId,
  maskEmiratesId,
  parseEmiratesId,
  validateEmiratesId,
} from '../src/emirates-id';
import { luhnCheckDigit } from '../src/core/utils';

// All IDs here are synthetic. Never use real Emirates ID numbers in tests.
const LUHN_VALID = '784199012345676';
const LUHN_INVALID = '784199012345670';
const REF = { referenceDate: new Date(Date.UTC(2026, 10, 6)) };

/** Builds a synthetic, Luhn-valid ID for a given year and serial. */
function makeId(year: number | string, serial = '0000001'): string {
  const payload = `784${year}${serial}`;
  return payload + String(luhnCheckDigit(payload));
}

describe('parseEmiratesId', () => {
  it('parses a compact ID', () => {
    expect(parseEmiratesId(LUHN_VALID, REF)).toEqual({
      emiratesId: LUHN_VALID,
      formatted: '784-1990-1234567-6',
      countryCode: '784',
      year: 1990,
      serial: '1234567',
      checkDigit: 6,
      luhnValid: true,
    });
  });

  it.each([
    '784-1990-1234567-6',
    '784 1990 1234567 6',
    '  784-1990-1234567-6  ',
    '٧٨٤-١٩٩٠-١٢٣٤٥٦٧-٦',
    '\u200E784-1990-1234567-6\u200E',
  ])('accepts the layout %j', (input) => {
    expect(parseEmiratesId(input, REF)?.emiratesId).toBe(LUHN_VALID);
  });

  it('accepts finite numbers', () => {
    expect(parseEmiratesId(784199012345676, REF)?.emiratesId).toBe(LUHN_VALID);
  });

  it.each([
    '784-1990-1234567-',
    '784-1990-123456-76',
    '78-41990-1234567-6',
    '784-1990 1234567-6', // mixed separators
    '784--1990-1234567-6',
    '784.1990.1234567.6',
    '784/1990/1234567/6',
    '78419901234567',
    '7841990123456760',
    '784199012345A76',
    '784_1990_1234567_6',
  ])('rejects the malformed layout %j', (input) => {
    expect(parseEmiratesId(input, REF)).toBeNull();
  });

  it('reports a failed Luhn check without rejecting by default', () => {
    const info = parseEmiratesId(LUHN_INVALID, REF);
    expect(info).not.toBeNull();
    expect(info?.luhnValid).toBe(false);
  });

  it('rejects a failed Luhn check when verifyChecksum is set', () => {
    expect(parseEmiratesId(LUHN_INVALID, { ...REF, verifyChecksum: true })).toBeNull();
    expect(parseEmiratesId(LUHN_VALID, { ...REF, verifyChecksum: true })).not.toBeNull();
  });
});

describe('year boundaries', () => {
  it('accepts 1900 and the reference year', () => {
    expect(isValidEmiratesId(makeId(1900), REF)).toBe(true);
    expect(isValidEmiratesId(makeId(2026), REF)).toBe(true);
  });

  it('rejects years before 1900 and after the reference year', () => {
    expect(isValidEmiratesId(makeId(1899), REF)).toBe(false);
    expect(isValidEmiratesId(makeId(2027), REF)).toBe(false);
    expect(isValidEmiratesId(makeId('0000'), REF)).toBe(false);
  });

  it('compares by UTC year', () => {
    const lastMomentOf2026 = new Date(Date.UTC(2026, 11, 31, 23, 59, 59));
    expect(isValidEmiratesId(makeId(2027), { referenceDate: lastMomentOf2026 })).toBe(false);
    const firstMomentOf2027 = new Date(Date.UTC(2027, 0, 1));
    expect(isValidEmiratesId(makeId(2027), { referenceDate: firstMomentOf2027 })).toBe(true);
  });

  it('falls back to the current date for an invalid referenceDate', () => {
    expect(isValidEmiratesId(makeId(1990), { referenceDate: new Date(NaN) })).toBe(true);
    expect(isValidEmiratesId(makeId(9999), { referenceDate: new Date(NaN) })).toBe(false);
  });
});

describe('isValidEmiratesId', () => {
  it('returns false for non-string and empty input', () => {
    for (const value of [undefined, null, '', '   ', {}, [], true, NaN, Symbol('x'), () => 1]) {
      expect(isValidEmiratesId(value)).toBe(false);
    }
  });
});

describe('validateEmiratesId', () => {
  it('returns parsed data on success', () => {
    const result = validateEmiratesId(LUHN_VALID, REF);
    expect(result.isValid).toBe(true);
    if (result.isValid) expect(result.data.year).toBe(1990);
  });

  it.each([
    ['', 'EMIRATES_ID_REQUIRED'],
    [null, 'EMIRATES_ID_REQUIRED'],
    ['784-1990-1234567', 'EMIRATES_ID_INVALID_FORMAT'],
    ['abc', 'EMIRATES_ID_INVALID_FORMAT'],
    ['785199012345676', 'EMIRATES_ID_INVALID_COUNTRY_CODE'],
    ['785-1990-1234567-6', 'EMIRATES_ID_INVALID_COUNTRY_CODE'],
    ['784189912345676', 'EMIRATES_ID_INVALID_YEAR'],
    ['784202712345676', 'EMIRATES_ID_INVALID_YEAR'],
  ])('rejects %j with %s', (input, code) => {
    const result = validateEmiratesId(input, REF);
    expect(result.isValid).toBe(false);
    expect(result.code).toBe(code);
    expect(result.errors).toEqual([result.error]);
  });

  it('includes the allowed year range in the message', () => {
    expect(validateEmiratesId('784202712345676', REF).error).toBe(
      'Emirates ID year must be between 1900 and 2026.',
    );
  });

  it('reports checksum mismatches only when requested', () => {
    expect(validateEmiratesId(LUHN_INVALID, REF).isValid).toBe(true);
    const result = validateEmiratesId(LUHN_INVALID, { ...REF, verifyChecksum: true });
    expect(result.code).toBe('EMIRATES_ID_CHECKSUM_MISMATCH');
    expect(result.error).toBe('Emirates ID check digit does not match.');
  });

  it('checks the country code before the year', () => {
    expect(validateEmiratesId('785000012345676', REF).code).toBe(
      'EMIRATES_ID_INVALID_COUNTRY_CODE',
    );
  });
});

describe('formatEmiratesId', () => {
  it('formats in each style', () => {
    expect(formatEmiratesId(LUHN_VALID)).toBe('784-1990-1234567-6');
    expect(formatEmiratesId(LUHN_VALID, 'hyphenated')).toBe('784-1990-1234567-6');
    expect(formatEmiratesId('784-1990-1234567-6', 'spaced')).toBe('784 1990 1234567 6');
    expect(formatEmiratesId('784 1990 1234567 6', 'compact')).toBe(LUHN_VALID);
  });

  it('returns null for invalid input', () => {
    expect(formatEmiratesId('123')).toBeNull();
    expect(formatEmiratesId(LUHN_INVALID, 'compact', { verifyChecksum: true })).toBeNull();
  });
});

describe('maskEmiratesId', () => {
  it('hides the year and serial by default', () => {
    expect(maskEmiratesId(LUHN_VALID)).toBe('784-****-****567-6');
  });

  it('supports a custom mask character and visible digit count', () => {
    expect(maskEmiratesId(LUHN_VALID, { maskChar: 'X', visibleDigits: 1 })).toBe(
      '784-XXXX-XXXXXXX-6',
    );
    expect(maskEmiratesId(LUHN_VALID, { maskChar: '•••', visibleDigits: 0 })).toBe(
      '784-••••-•••••••-•',
    );
    expect(maskEmiratesId(LUHN_VALID, { visibleDigits: 12 })).toBe('784-1990-1234567-6');
  });

  it('clamps and sanitizes visibleDigits and maskChar', () => {
    expect(maskEmiratesId(LUHN_VALID, { visibleDigits: 99 })).toBe('784-1990-1234567-6');
    expect(maskEmiratesId(LUHN_VALID, { visibleDigits: -5 })).toBe('784-****-*******-*');
    expect(maskEmiratesId(LUHN_VALID, { visibleDigits: 2.9 })).toBe('784-****-******7-6');
    expect(maskEmiratesId(LUHN_VALID, { visibleDigits: NaN })).toBe('784-****-****567-6');
    expect(maskEmiratesId(LUHN_VALID, { maskChar: '' })).toBe('784-****-****567-6');
  });

  it('returns null for invalid input', () => {
    expect(maskEmiratesId('not an id')).toBeNull();
  });
});

describe('EMIRATES_ID_SOURCES', () => {
  it('records official sources with review dates', () => {
    expect(EMIRATES_ID_SOURCES.length).toBeGreaterThan(0);
    for (const source of EMIRATES_ID_SOURCES) {
      expect(source.url).toMatch(/^https:\/\/[a-z.]+\.gov\.ae\//);
      expect(source.lastReviewed).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
    expect(Object.isFrozen(EMIRATES_ID_SOURCES)).toBe(true);
  });
});
