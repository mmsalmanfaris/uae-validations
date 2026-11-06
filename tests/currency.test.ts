import { describe, expect, it } from 'vitest';
import { aedToWords, formatAed, isValidAedAmount, parseAed } from '../src/currency';

describe('AED currency', () => {
  it('parses amounts and fils exactly', () => {
    expect(parseAed('AED 1,234.56')).toEqual({ amount: 1234.56, dirhams: 1234, fils: 56, currency: 'AED' });
    expect(parseAed('-1.05')).toEqual({ amount: -1.05, dirhams: -1, fils: 5, currency: 'AED' });
    expect(isValidAedAmount('1.234')).toBe(false);
    expect(isValidAedAmount(Number.POSITIVE_INFINITY)).toBe(false);
  });
  it('formats in UAE locales', () => {
    expect(formatAed('1234.5', 'en-AE')).toContain('1,234.50');
    expect(formatAed('bad')).toBe('');
  });
  it('converts amounts to English words', () => {
    expect(aedToWords('21.50')).toBe('twenty-one dirhams and fifty fils');
    expect(aedToWords('1.01')).toBe('one dirham and one fil');
    expect(aedToWords('bad')).toBe('');
  });
});
