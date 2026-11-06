import { describe, expect, it } from 'vitest';
import { formatEmiratesId, isValidEmiratesId, maskEmiratesId, parseEmiratesId, validateEmiratesId } from '../src/emirates-id';

describe('Emirates ID', () => {
  it('accepts compact and displayed forms', () => {
    expect(isValidEmiratesId('784-1990-1234567-0')).toBe(true);
    expect(isValidEmiratesId('784199012345670')).toBe(true);
  });
  it('rejects invalid prefix, length, and characters', () => {
    expect(isValidEmiratesId('785-1990-1234567-0')).toBe(false);
    expect(isValidEmiratesId('784-1990-123456-0')).toBe(false);
    expect(isValidEmiratesId('784-ABCD-1234567-0')).toBe(false);
    expect(validateEmiratesId(null).valid).toBe(false);
  });
  it('parses, formats, and masks', () => {
    expect(parseEmiratesId('784199012345670')).toEqual({
      normalized: '784199012345670', countryCode: '784', year: '1990', serialNumber: '1234567', checkDigit: '0'
    });
    expect(formatEmiratesId('784199012345670')).toBe('784-1990-1234567-0');
    expect(maskEmiratesId('784199012345670')).toBe('784-1990-XXXXXXX-X');
    expect(formatEmiratesId('bad')).toBe('');
  });
});
