import { describe, expect, it } from 'vitest';
import {
  ADDRESS_SOURCES,
  MAKANI_LENGTH,
  formatMakani,
  isValidMakani,
  parseMakani,
  validateMakani,
} from '../src/address';
import {
  VEHICLE_SOURCES,
  formatDubaiPlate,
  isValidDubaiPlate,
  parseDubaiPlate,
  validateDubaiPlate,
} from '../src/vehicle';

// 30032 95320 is the example in Dubai Municipality's Makani web-service manual
// (Dubai Municipality main office). Plates are synthetic.
const MAKANI = '3003295320';

describe('parseMakani', () => {
  it.each([
    MAKANI,
    '30032 95320',
    '30032-95320',
    '  30032   95320 ',
    '٣٠٠٣٢ ٩٥٣٢٠',
    '‏30032 95320',
    'Makani 30032 95320',
    'Makani No. 30032 95320',
    'makani number: 3003295320',
  ])('accepts %j', (input) => {
    expect(parseMakani(input)).toEqual({ makani: MAKANI, formatted: '30032 95320' });
  });

  it('keeps leading zeros', () => {
    expect(parseMakani('00410 85963')?.makani).toBe('0041085963');
  });

  it.each([
    ['', 'MAKANI_REQUIRED'],
    ['   ', 'MAKANI_REQUIRED'],
    [null, 'MAKANI_REQUIRED'],
    [undefined, 'MAKANI_REQUIRED'],
    [{}, 'MAKANI_REQUIRED'],
    [3003295320, 'MAKANI_INVALID_FORMAT'],
    ['30032.95320', 'MAKANI_INVALID_FORMAT'],
    ['3003A95320', 'MAKANI_INVALID_FORMAT'],
    ['Makani', 'MAKANI_INVALID_FORMAT'],
    ['300329532', 'MAKANI_INVALID_LENGTH'],
    ['30032953201', 'MAKANI_INVALID_LENGTH'],
  ])('rejects %j with %s', (input, code) => {
    const result = validateMakani(input);
    expect(result.isValid).toBe(false);
    expect(result.code).toBe(code);
    expect(result.errors).toEqual([result.error]);
    expect(isValidMakani(input)).toBe(false);
    expect(parseMakani(input)).toBeNull();
  });

  it('rejects bigint input, which would drop leading zeros', () => {
    expect(validateMakani(3003295320n).code).toBe('MAKANI_INVALID_FORMAT');
  });

  it('returns data on success', () => {
    expect(validateMakani('30032 95320')).toEqual({
      isValid: true,
      data: { makani: MAKANI, formatted: '30032 95320' },
    });
    expect(MAKANI_LENGTH).toBe(10);
  });
});

describe('formatMakani', () => {
  it('formats', () => {
    expect(formatMakani(MAKANI)).toBe('30032 95320');
    expect(formatMakani(MAKANI, 'spaced')).toBe('30032 95320');
    expect(formatMakani('30032 95320', 'compact')).toBe(MAKANI);
    expect(formatMakani('123')).toBeNull();
  });

  it('cites Dubai Municipality and DMT', () => {
    const urls = ADDRESS_SOURCES.map((s) => s.url).join(' ');
    expect(urls).toContain('dm.gov.ae');
    expect(urls).toContain('dmt.gov.ae');
    expect(Object.isFrozen(ADDRESS_SOURCES)).toBe(true);
  });
});

describe('parseDubaiPlate', () => {
  it.each([
    ['A 1', 'A', '1'],
    ['B 7', 'B', '7'],
    ['AA 12345', 'AA', '12345'],
    ['aa12345', 'AA', '12345'],
    ['aa-12345', 'AA', '12345'],
    ['V 1234', 'V', '1234'],
    ['Dubai V 1234', 'V', '1234'],
    ['DXB-Z-99', 'Z', '99'],
    ['دبي A 5', 'A', '5'],
    ['A ١٢٣', 'A', '123'],
    ['  zz   10000 ', 'ZZ', '10000'],
  ])('accepts %j', (input, code, number) => {
    expect(parseDubaiPlate(input)).toEqual({
      code,
      number,
      digitCount: number.length,
      formatted: `${code} ${number}`,
    });
    expect(isValidDubaiPlate(input)).toBe(true);
  });

  it.each([
    ['', 'PLATE_REQUIRED'],
    [null, 'PLATE_REQUIRED'],
    [12345, 'PLATE_REQUIRED'],
    ['12345', 'PLATE_INVALID_FORMAT'],
    ['12345 AA', 'PLATE_INVALID_FORMAT'],
    ['AA', 'PLATE_INVALID_FORMAT'],
    ['A_1', 'PLATE_INVALID_FORMAT'],
    ['A 1 B', 'PLATE_INVALID_FORMAT'],
    ['ABC 123', 'PLATE_INVALID_CODE'],
    ['Dubai 123', 'PLATE_INVALID_CODE'],
    ['A 123456', 'PLATE_INVALID_NUMBER'],
    ['A 0', 'PLATE_INVALID_NUMBER'],
    ['A 0123', 'PLATE_INVALID_NUMBER'],
  ])('rejects %j with %s', (input, code) => {
    const result = validateDubaiPlate(input);
    expect(result.isValid).toBe(false);
    expect(result.code).toBe(code);
    expect(parseDubaiPlate(input)).toBeNull();
  });

  it('formats', () => {
    expect(formatDubaiPlate('aa12345')).toBe('AA 12345');
    expect(formatDubaiPlate('bad')).toBeNull();
    expect(validateDubaiPlate('B 7').isValid).toBe(true);
  });

  it('cites the RTA', () => {
    expect(VEHICLE_SOURCES.some((s) => s.url.includes('rta.ae'))).toBe(true);
  });
});
