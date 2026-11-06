import { describe, expect, it } from 'vitest';
import { doesTinMatchTrn, isValidTin, isValidTrn, maskTrn, tinFromTrn } from '../src/tax';

describe('UAE tax identifiers', () => {
  it('validates documented lengths', () => {
    expect(isValidTrn('123456789012345')).toBe(true);
    expect(isValidTrn('123-456-789-012-345')).toBe(true);
    expect(isValidTrn('12345678901234')).toBe(false);
    expect(isValidTin('1234567890')).toBe(true);
    expect(isValidTin('123456789')).toBe(false);
  });
  it('derives and compares the TIN relationship', () => {
    expect(tinFromTrn('123456789012345')).toBe('1234567890');
    expect(doesTinMatchTrn('1234567890', '123456789012345')).toBe(true);
    expect(doesTinMatchTrn('0234567890', '123456789012345')).toBe(false);
  });
  it('masks valid TRNs', () => {
    expect(maskTrn('123456789012345')).toBe('123-***-***-345');
    expect(maskTrn('bad')).toBe('');
  });
});
