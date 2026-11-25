import { describe, expect, it } from 'vitest';
import {
  UAE_SERVICE_RANGES,
  formatUaeServiceNumber,
  isValidUaePhone,
  isValidUaeServiceNumber,
  isValidUaeTollFree,
  parseUaeServiceNumber,
  validateUaeServiceNumber,
} from '../src/phone';

// All numbers here are synthetic. Never use real phone numbers in tests.

describe('parseUaeServiceNumber', () => {
  it.each([
    ['80012', 'toll-free', '800', '12'],
    ['800 12345', 'toll-free', '800', '12345'],
    ['800123456789', 'toll-free', '800', '123456789'],
    ['8000 1234', 'toll-free', '800', '01234'],
    ['400 212345', 'free-access', '400', '212345'],
    ['400 412345', 'free-access', '400', '412345'],
    ['600 212345', 'fixed-cost', '600', '212345'],
    ['600 512345', 'fixed-cost', '600', '512345'],
    ['700 012345', 'shared-cost', '700', '012345'],
    ['700 512345', 'shared-cost', '700', '512345'],
    ['900 012345', 'premium-rate', '900', '012345'],
    ['900 212345', 'premium-rate', '900', '212345'],
  ] as const)('%s is %s', (input, type, prefix, serviceNumber) => {
    expect(parseUaeServiceNumber(input)).toEqual({
      type,
      prefix,
      serviceNumber,
      number: `${prefix}${serviceNumber}`,
    });
  });

  it('accepts separators, +971, 00971, and Arabic-Indic digits', () => {
    for (const input of [
      '600-512-345',
      '(600) 512.345',
      '+971 600 512345',
      '00971600512345',
      '٦٠٠٥١٢٣٤٥',
    ]) {
      expect(parseUaeServiceNumber(input)?.number).toBe('600512345');
    }
  });

  it('is separate from subscriber numbers', () => {
    expect(isValidUaePhone('600 512345')).toBe(false);
    expect(isValidUaeServiceNumber('050 123 4567')).toBe(false);
    expect(isValidUaeServiceNumber('04 234 5678')).toBe(false);
  });

  it('covers each range the numbering plan defines', () => {
    expect(UAE_SERVICE_RANGES.map((r) => r.prefix)).toEqual(['400', '600', '700', '800', '900']);
    expect(Object.isFrozen(UAE_SERVICE_RANGES[0])).toBe(true);
  });
});

describe('validateUaeServiceNumber', () => {
  it.each([
    [undefined, 'SERVICE_NUMBER_REQUIRED'],
    ['  ', 'SERVICE_NUMBER_REQUIRED'],
    ['800 ABC', 'SERVICE_NUMBER_INVALID_FORMAT'],
    ['+44 800 12345', 'SERVICE_NUMBER_NOT_UAE'],
    ['0800 12345', 'SERVICE_NUMBER_INVALID_PREFIX'],
    ['500 512345', 'SERVICE_NUMBER_INVALID_PREFIX'],
    ['8001', 'SERVICE_NUMBER_INVALID_LENGTH'],
    ['8001234567890', 'SERVICE_NUMBER_INVALID_LENGTH'],
    ['600 51234', 'SERVICE_NUMBER_INVALID_LENGTH'],
    ['600 5123456', 'SERVICE_NUMBER_INVALID_LENGTH'],
    ['600 112345', 'SERVICE_NUMBER_RESERVED_RANGE'],
    ['700 112345', 'SERVICE_NUMBER_RESERVED_RANGE'],
    ['400 512345', 'SERVICE_NUMBER_RESERVED_RANGE'],
    ['900 112345', 'SERVICE_NUMBER_RESERVED_RANGE'],
  ])('%s fails with %s', (input, code) => {
    const result = validateUaeServiceNumber(input);
    expect(result.isValid).toBe(false);
    expect(result.code).toBe(code);
  });

  it('checks the requested type', () => {
    expect(validateUaeServiceNumber('800 12345', { type: 'toll-free' }).isValid).toBe(true);
    expect(validateUaeServiceNumber('600 512345', { type: 'toll-free' }).code).toBe(
      'SERVICE_NUMBER_TYPE_MISMATCH',
    );
  });
});

describe('isValidUaeTollFree and formatUaeServiceNumber', () => {
  it('detects toll-free numbers only', () => {
    expect(isValidUaeTollFree('800 12345')).toBe(true);
    expect(isValidUaeTollFree('600 512345')).toBe(false);
    expect(isValidUaeTollFree(null)).toBe(false);
  });

  it('formats', () => {
    expect(formatUaeServiceNumber('+971 800 12345')).toBe('800 12345');
    expect(formatUaeServiceNumber('600-512-345', 'compact')).toBe('600512345');
    expect(formatUaeServiceNumber('600 112345')).toBeNull();
  });
});
