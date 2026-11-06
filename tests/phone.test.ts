import { describe, expect, it } from 'vitest';
import { formatUaePhone, isValidUaeLandline, isValidUaeMobile, parseUaePhone } from '../src/phone';

describe('UAE phone', () => {
  it('normalizes national and international mobile numbers', () => {
    expect(isValidUaeMobile('050 123 4567')).toBe(true);
    expect(isValidUaeMobile('+971-50-123-4567')).toBe(true);
    expect(isValidUaeMobile('00971501234567')).toBe(true);
    expect(formatUaePhone('0501234567', 'e164')).toBe('+971501234567');
  });
  it('recognizes documented mobile prefixes only', () => {
    for (const code of ['050', '052', '054', '055', '056', '058']) expect(isValidUaeMobile(`${code}1234567`)).toBe(true);
    expect(isValidUaeMobile('0511234567')).toBe(false);
    expect(isValidUaeMobile('0591234567')).toBe(false);
  });
  it('recognizes geographic landlines', () => {
    expect(isValidUaeLandline('04 1234567')).toBe(true);
    expect(isValidUaeLandline('+971 2 1234567')).toBe(true);
    expect(isValidUaeLandline('05 1234567')).toBe(false);
  });
  it('parses and rejects malformed inputs', () => {
    expect(parseUaePhone('+971501234567')).toMatchObject({ type: 'mobile', areaOrMobileCode: '50', subscriberNumber: '1234567' });
    expect(parseUaePhone('not-a-number')).toBeNull();
    expect(parseUaePhone(null)).toBeNull();
  });
});
