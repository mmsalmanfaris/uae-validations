import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  PHONE_SOURCES,
  UAE_AREA_CODES,
  UAE_MOBILE_PREFIXES,
  formatUaePhone,
  isValidUaeLandline,
  isValidUaeMobile,
  isValidUaePhone,
  parseUaePhone,
  validateUaePhone,
} from '../src/phone';

// All numbers here are synthetic. Never use real phone numbers in tests.
const MOBILE = '0501234567';
const LANDLINE = '042345678';

describe('parseUaePhone: mobile', () => {
  it('parses a national mobile number', () => {
    expect(parseUaePhone(MOBILE)).toEqual({
      type: 'mobile',
      national: MOBILE,
      e164: '+971501234567',
      prefix: '50',
      subscriberNumber: '1234567',
      area: null,
    });
  });

  it.each([
    '050 123 4567',
    '050-123-4567',
    '050.123.4567',
    '(050) 123 4567',
    '+971501234567',
    '+971 50 123 4567',
    '+971-50-123-4567',
    '+971 (0) 50 123 4567',
    '+971(0)501234567',
    '00971501234567',
    '00 971 50 123 4567',
    '971501234567',
    '٠٥٠١٢٣٤٥٦٧',
    '+٩٧١٥٠١٢٣٤٥٦٧',
    '\u200E+971 50 123 4567\u200E',
    971501234567,
  ])('accepts %j', (input) => {
    expect(parseUaePhone(input)?.national).toBe(MOBILE);
  });

  it('accepts every allocated mobile prefix', () => {
    for (const prefix of UAE_MOBILE_PREFIXES) {
      expect(isValidUaeMobile(`${prefix}1234567`)).toBe(true);
    }
  });

  it('rejects unallocated 05Z codes by default and accepts them with mobilePrefixes: any', () => {
    for (const z of ['1', '3', '7', '9']) {
      expect(isValidUaeMobile(`05${z}1234567`)).toBe(false);
      expect(isValidUaeMobile(`05${z}1234567`, { mobilePrefixes: 'any' })).toBe(true);
    }
  });

  it('does not expose an operator', () => {
    expect(Object.keys(parseUaePhone(MOBILE)!)).not.toContain('operator');
  });
});

describe('parseUaePhone: landline', () => {
  it('parses a Dubai landline', () => {
    expect(parseUaePhone(LANDLINE)).toEqual({
      type: 'landline',
      national: LANDLINE,
      e164: '+97142345678',
      prefix: '4',
      subscriberNumber: '2345678',
      area: { code: '04', area: 'Dubai', emirates: ['Dubai'] },
    });
  });

  it.each([
    ['02 612 3456', 'Abu Dhabi'],
    ['03 712 3456', 'Al Ain'],
    ['+971 4 234 5678', 'Dubai'],
    ['06 512 3456', 'West Coast'],
    ['07 222 3456', 'Ras Al Khaimah'],
    ['09 222 3456', 'East Coast'],
  ])('maps %s to %s', (input, area) => {
    expect(parseUaePhone(input)?.area?.area).toBe(area);
  });

  it('covers the six NNP area codes', () => {
    expect(UAE_AREA_CODES.map((a) => a.code)).toEqual(['02', '03', '04', '06', '07', '09']);
    expect(UAE_AREA_CODES.find((a) => a.code === '06')?.emirates).toEqual([
      'Sharjah',
      'Ajman',
      'Umm Al Quwain',
    ]);
  });

  it('requires the first subscriber digit to be 2-8', () => {
    for (const a of ['2', '5', '8']) expect(isValidUaeLandline(`04${a}345678`)).toBe(true);
    for (const a of ['0', '1', '9']) expect(isValidUaeLandline(`04${a}345678`)).toBe(false);
  });

  it('rejects subscriber numbers whose second and third digits are both 0', () => {
    expect(isValidUaeLandline('042005678')).toBe(false);
    expect(isValidUaeLandline('042015678')).toBe(true);
    expect(isValidUaeLandline('042105678')).toBe(true);
  });
});

describe('type checks', () => {
  it('distinguishes mobile and landline', () => {
    expect(isValidUaePhone(MOBILE)).toBe(true);
    expect(isValidUaePhone(LANDLINE)).toBe(true);
    expect(isValidUaeMobile(LANDLINE)).toBe(false);
    expect(isValidUaeLandline(MOBILE)).toBe(false);
  });

  it('returns false for non-string and empty input', () => {
    for (const value of [undefined, null, '', '  ', {}, [], true, NaN, () => 1]) {
      expect(isValidUaePhone(value)).toBe(false);
    }
  });
});

describe('validateUaePhone', () => {
  it('returns parsed data on success', () => {
    const result = validateUaePhone(MOBILE, { type: 'mobile' });
    expect(result.isValid).toBe(true);
    if (result.isValid) expect(result.data.e164).toBe('+971501234567');
  });

  it.each([
    ['', 'PHONE_REQUIRED'],
    [undefined, 'PHONE_REQUIRED'],
    ['050 123 456x', 'PHONE_INVALID_FORMAT'],
    ['050123456', 'PHONE_INVALID_FORMAT'],
    ['05012345678', 'PHONE_INVALID_FORMAT'],
    ['04234567', 'PHONE_INVALID_FORMAT'],
    ['0423456789', 'PHONE_INVALID_FORMAT'],
    ['501234567', 'PHONE_INVALID_FORMAT'],
    ['+971 0501234567', 'PHONE_INVALID_FORMAT'],
    ['+abc', 'PHONE_INVALID_FORMAT'],
    ['+', 'PHONE_INVALID_FORMAT'],
    ['+44 20 7946 0000', 'PHONE_NOT_UAE'],
    ['0044 20 7946 0000', 'PHONE_NOT_UAE'],
    ['0123456789', 'PHONE_INVALID_PREFIX'],
    ['081234567', 'PHONE_INVALID_PREFIX'],
    ['800123456', 'PHONE_INVALID_FORMAT'],
    ['0591234567', 'PHONE_UNALLOCATED_MOBILE_PREFIX'],
    ['041345678', 'PHONE_INVALID_SUBSCRIBER_NUMBER'],
  ])('rejects %j with %s', (input, code) => {
    const result = validateUaePhone(input);
    expect(result.isValid).toBe(false);
    expect(result.code).toBe(code);
    expect(result.error).toBeTruthy();
  });

  it('enforces the expected type', () => {
    const result = validateUaePhone(LANDLINE, { type: 'mobile' });
    expect(result.code).toBe('PHONE_TYPE_MISMATCH');
    expect(result.error).toBe('Phone number must be a UAE mobile number.');
    expect(validateUaePhone(MOBILE, { type: 'landline' }).code).toBe('PHONE_TYPE_MISMATCH');
  });
});

describe('formatUaePhone', () => {
  it('formats mobiles', () => {
    expect(formatUaePhone(MOBILE)).toBe('050 123 4567');
    expect(formatUaePhone(MOBILE, 'national')).toBe('050 123 4567');
    expect(formatUaePhone(MOBILE, 'international')).toBe('+971 50 123 4567');
    expect(formatUaePhone(MOBILE, 'e164')).toBe('+971501234567');
    expect(formatUaePhone('+971 50 123 4567', 'compact')).toBe(MOBILE);
    expect(formatUaePhone(MOBILE, 'tel')).toBe('tel:+971501234567');
  });

  it('formats landlines', () => {
    expect(formatUaePhone(LANDLINE)).toBe('04 234 5678');
    expect(formatUaePhone(LANDLINE, 'international')).toBe('+971 4 234 5678');
    expect(formatUaePhone(LANDLINE, 'e164')).toBe('+97142345678');
  });

  it('passes options through and returns null for invalid input', () => {
    expect(formatUaePhone('0591234567')).toBeNull();
    expect(formatUaePhone('0591234567', 'e164', { mobilePrefixes: 'any' })).toBe('+971591234567');
  });
});

describe('property: phone round trips', () => {
  const mobile = fc
    .tuple(fc.constantFrom(...UAE_MOBILE_PREFIXES), fc.stringMatching(/^[0-9]{7}$/))
    .map(([prefix, rest]) => prefix + rest);
  const landline = fc
    .tuple(
      fc.constantFrom('02', '03', '04', '06', '07', '09'),
      fc.stringMatching(/^[2-8](?:[1-9][0-9]|0[1-9])[0-9]{4}$/),
    )
    .map(([code, rest]) => code + rest);

  it('every format re-parses to the same number', () => {
    fc.assert(
      fc.property(fc.oneof(mobile, landline), (national) => {
        expect(parseUaePhone(national)?.national).toBe(national);
        for (const format of ['national', 'international', 'e164', 'compact'] as const) {
          expect(parseUaePhone(formatUaePhone(national, format))?.national).toBe(national);
        }
      }),
    );
  });
});

describe('PHONE_SOURCES', () => {
  it('records official sources with review dates', () => {
    expect(PHONE_SOURCES.length).toBeGreaterThan(0);
    for (const source of PHONE_SOURCES) {
      expect(source.url).toMatch(/^https:\/\//);
      expect(source.lastReviewed).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});
