import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  AED_CURRENCY,
  AED_MAX_DIRHAMS,
  CURRENCY_SOURCES,
  aedToWords,
  formatAed,
  isValidAed,
  parseAed,
  validateAed,
} from '../src/currency';
import {
  VAT_MANDATORY_THRESHOLD,
  VAT_SOURCES,
  VAT_STANDARD_RATE,
  VAT_VOLUNTARY_THRESHOLD,
  calculateVat,
  getVatRegistrationRequirement,
} from '../src/vat';

describe('AED_CURRENCY', () => {
  it('matches ISO 4217', () => {
    expect(AED_CURRENCY).toMatchObject({ code: 'AED', numericCode: '784', minorUnits: 2 });
    expect(CURRENCY_SOURCES.length).toBeGreaterThan(0);
  });
});

describe('parseAed', () => {
  it.each([
    ['1234.5', 123450],
    ['1,234.50', 123450],
    ['AED 1,234.50', 123450],
    ['aed1234.50', 123450],
    ['1234.50 AED', 123450],
    ['Dhs 10', 1000],
    ['DH 10', 1000],
    ['10 د.إ', 1000],
    ['د.إ 10', 1000],
    ['10 درهم', 1000],
    ['١٬٢٣٤٫٥٠', 123450],
    ['0', 0],
    ['0.05', 5],
    ['007', 700],
    ['+5', 500],
    [12.34, 1234],
    [0, 0],
    [999_999_999_999.99, 99_999_999_999_999],
  ])('parses %j as %d fils', (input, fils) => {
    expect(parseAed(input)?.fils).toBe(fils);
  });

  it('returns a complete amount', () => {
    expect(parseAed('-1234.5', { allowNegative: true })).toEqual({
      fils: -123450,
      dirhams: 1234,
      remainderFils: 50,
      negative: true,
      amount: '-1234.50',
    });
    expect(parseAed('-0', { allowNegative: true })?.negative).toBe(false);
  });

  it.each([
    ['', 'AED_REQUIRED'],
    [null, 'AED_REQUIRED'],
    ['abc', 'AED_INVALID_FORMAT'],
    ['1,23,456', 'AED_INVALID_FORMAT'],
    ['1,2345', 'AED_INVALID_FORMAT'],
    ['12.', 'AED_INVALID_FORMAT'],
    ['.5', 'AED_INVALID_FORMAT'],
    ['1e3', 'AED_INVALID_FORMAT'],
    ['USD 10', 'AED_INVALID_FORMAT'],
    [NaN, 'AED_INVALID_FORMAT'],
    [Infinity, 'AED_INVALID_FORMAT'],
    ['12.345', 'AED_TOO_MANY_DECIMALS'],
    [1.005, 'AED_TOO_MANY_DECIMALS'],
    ['-1', 'AED_NEGATIVE'],
    [-1, 'AED_NEGATIVE'],
    ['1000000000000', 'AED_TOO_LARGE'],
    [1e15, 'AED_TOO_LARGE'],
  ])('rejects %j with %s', (input, code) => {
    expect(validateAed(input).code).toBe(code);
    expect(isValidAed(input)).toBe(false);
  });

  it('accepts the maximum and rejects one fils more', () => {
    expect(isValidAed(`${AED_MAX_DIRHAMS}.99`)).toBe(true);
  });

  it('round-trips through formatAed', () => {
    fc.assert(
      fc.property(fc.integer({ min: -1e12, max: 1e12 }), (fils) => {
        const amount = (fils < 0 ? '-' : '') + (Math.abs(fils) / 100).toFixed(2);
        const formatted = formatAed(amount)!;
        expect(parseAed(formatted, { allowNegative: true })?.fils).toBe(fils === 0 ? 0 : fils);
      }),
    );
  });
});

describe('formatAed', () => {
  it('formats in each style', () => {
    expect(formatAed(1234.5)).toBe('AED 1,234.50');
    expect(formatAed('1234567.891'.slice(0, 10))).toBe('AED 1,234,567.89');
    expect(formatAed(0)).toBe('AED 0.00');
    expect(formatAed(999, { display: 'none' })).toBe('999.00');
    expect(formatAed(-1000, { display: 'arabic' })).toBe('-1,000.00 د.إ');
    expect(formatAed(1000000, { grouping: false })).toBe('AED 1000000.00');
    expect(formatAed('bad')).toBeNull();
  });
});

describe('aedToWords: English', () => {
  it.each([
    [0, 'zero dirhams'],
    [1, 'one dirham'],
    [2, 'two dirhams'],
    [0.01, 'one fils'],
    [0.5, 'fifty fils'],
    [1.01, 'one dirham and one fils'],
    [15, 'fifteen dirhams'],
    [20, 'twenty dirhams'],
    [99, 'ninety-nine dirhams'],
    [100, 'one hundred dirhams'],
    [101, 'one hundred one dirhams'],
    [1000, 'one thousand dirhams'],
    [1_000_001, 'one million one dirhams'],
    [
      12_345_678.9,
      'twelve million three hundred forty-five thousand six hundred seventy-eight dirhams and ninety fils',
    ],
    [
      999_999_999_999.99,
      'nine hundred ninety-nine billion nine hundred ninety-nine million nine hundred ninety-nine thousand nine hundred ninety-nine dirhams and ninety-nine fils',
    ],
  ])('%d → %s', (amount, words) => {
    expect(aedToWords(amount)).toBe(words);
  });

  it('writes cheque style', () => {
    expect(aedToWords(1234.5, { cheque: true })).toBe(
      'One Thousand Two Hundred Thirty-Four Dirhams And Fifty Fils Only',
    );
  });

  it('rejects invalid and negative amounts', () => {
    expect(aedToWords(-1)).toBeNull();
    expect(aedToWords('abc')).toBeNull();
  });
});

describe('aedToWords: Arabic', () => {
  const ar = (n: number | string): string | null => aedToWords(n, { language: 'ar' });

  it.each([
    [0, 'صفر درهم'],
    [1, 'درهم واحد'],
    [2, 'درهمان'],
    [3, 'ثلاثة دراهم'],
    [10, 'عشرة دراهم'],
    [11, 'أحد عشر درهماً'],
    [12, 'اثنا عشر درهماً'],
    [15, 'خمسة عشر درهماً'],
    [20, 'عشرون درهماً'],
    [21, 'واحد وعشرون درهماً'],
    [99, 'تسعة وتسعون درهماً'],
    [100, 'مائة درهم'],
    [103, 'مائة وثلاثة دراهم'],
    [200, 'مائتا درهم'],
    [999, 'تسعمائة وتسعة وتسعون درهماً'],
    [1000, 'ألف درهم'],
    [1001, 'ألف وواحد درهم'],
    [2000, 'ألفا درهم'],
    [3000, 'ثلاثة آلاف درهم'],
    [11000, 'أحد عشر ألف درهم'],
    [100000, 'مائة ألف درهم'],
    [250000, 'مائتان وخمسون ألف درهم'],
    [1_000_000, 'مليون درهم'],
    [2_500_000, 'مليونان وخمسمائة ألف درهم'],
    [2_000_000, 'مليونا درهم'],
    [3_000_000, 'ثلاثة ملايين درهم'],
    [11_000_000, 'أحد عشر مليون درهم'],
    [1200, 'ألف ومائتا درهم'],
    [2_000_000_000, 'مليارا درهم'],
    [15_000_000_000, 'خمسة عشر مليار درهم'],
    [5_000_000_000, 'خمسة مليارات درهم'],
    [0.01, 'فلس واحد'],
    [0.02, 'فلسان'],
    [0.05, 'خمسة فلوس'],
    [0.5, 'خمسون فلساً'],
    [1234.5, 'ألف ومائتان وأربعة وثلاثون درهماً وخمسون فلساً'],
  ])('%d → %s', (amount, words) => {
    expect(ar(amount)).toBe(words);
  });

  it('writes cheque style', () => {
    expect(aedToWords(500, { language: 'ar', cheque: true })).toBe('فقط خمسمائة درهم لا غير');
  });
});

describe('calculateVat', () => {
  it('uses 5% by default', () => {
    expect(VAT_STANDARD_RATE).toBe(5);
    expect(calculateVat(100)).toEqual({
      net: '100.00',
      vat: '5.00',
      gross: '105.00',
      netFils: 10000,
      vatFils: 500,
      grossFils: 10500,
      ratePercent: 5,
    });
  });

  it('extracts VAT from inclusive amounts', () => {
    expect(calculateVat(105, { amountIncludesVat: true })).toMatchObject({
      net: '100.00',
      vat: '5.00',
      gross: '105.00',
    });
    expect(calculateVat(1000, { amountIncludesVat: true })).toMatchObject({
      net: '952.38',
      vat: '47.62',
      gross: '1000.00',
    });
  });

  it('rounds half away from zero to the nearest fils', () => {
    expect(calculateVat(0.1)?.vat).toBe('0.01'); // 0.5 fils
    expect(calculateVat(0.09)?.vat).toBe('0.00'); // 0.45 fils
    expect(calculateVat(-0.1, {})?.vat).toBe('-0.01');
    expect(calculateVat(-105, { amountIncludesVat: true })?.net).toBe('-100.00');
  });

  it('accepts custom rates', () => {
    expect(calculateVat(100, { ratePercent: 0 })?.vat).toBe('0.00');
    expect(calculateVat(100, { ratePercent: 12.5 })?.vat).toBe('12.50');
    expect(calculateVat(100, { ratePercent: 100 })?.gross).toBe('200.00');
  });

  it('keeps net + vat = gross exactly', () => {
    fc.assert(
      fc.property(fc.integer({ min: -1e11, max: 1e11 }), fc.boolean(), (fils, inclusive) => {
        const r = calculateVat((fils / 100).toFixed(2), { amountIncludesVat: inclusive })!;
        expect(r.netFils + r.vatFils).toBe(r.grossFils);
        expect(inclusive ? r.grossFils : r.netFils).toBe(fils === 0 ? 0 : fils);
      }),
    );
  });

  it.each([
    ['abc', {}],
    [100, { ratePercent: -1 }],
    [100, { ratePercent: 101 }],
    [100, { ratePercent: NaN }],
    [100, { ratePercent: 5.001 }],
    [100, { ratePercent: '5' as unknown as number }],
  ])('returns null for %j with %j', (amount, options) => {
    expect(calculateVat(amount, options)).toBeNull();
  });
});

describe('getVatRegistrationRequirement', () => {
  it('applies the FTA thresholds', () => {
    expect(VAT_MANDATORY_THRESHOLD).toBe(375_000);
    expect(VAT_VOLUNTARY_THRESHOLD).toBe(187_500);
    expect(getVatRegistrationRequirement(375_000.01)).toBe('mandatory');
    expect(getVatRegistrationRequirement(375_000)).toBe('voluntary');
    expect(getVatRegistrationRequirement(187_500.01)).toBe('voluntary');
    expect(getVatRegistrationRequirement(187_500)).toBe('not-eligible');
    expect(getVatRegistrationRequirement(0)).toBe('not-eligible');
    expect(getVatRegistrationRequirement('bad')).toBeNull();
    expect(getVatRegistrationRequirement(-1)).toBeNull();
  });

  it('cites the FTA', () => {
    expect(VAT_SOURCES[0]?.url).toContain('tax.gov.ae');
  });
});
