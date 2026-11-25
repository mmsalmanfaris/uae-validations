import { describe, expect, it } from 'vitest';
import {
  MAX_INPUT_LENGTH,
  cleanString,
  removeSeparators,
  toAsciiDigits,
} from '../src/core/normalize';
import {
  createFailure,
  createSuccess,
  deepFreeze,
  luhnCheck,
  luhnCheckDigit,
} from '../src/core/utils';

describe('toAsciiDigits', () => {
  it('converts Arabic-Indic digits', () => {
    expect(toAsciiDigits('٠١٢٣٤٥٦٧٨٩')).toBe('0123456789');
  });
  it('converts Eastern Arabic (Persian) digits', () => {
    expect(toAsciiDigits('۰۱۲۳۴۵۶۷۸۹')).toBe('0123456789');
  });
  it('leaves other characters alone', () => {
    expect(toAsciiDigits('AE-07 x')).toBe('AE-07 x');
  });
});

describe('cleanString', () => {
  it('trims and strips zero-width and bidi control characters', () => {
    expect(cleanString(' \u200F784\u200B\u200E-\u2067\u2069\uFEFF ')).toBe('784-');
    expect(cleanString('\u061C٧٨٤')).toBe('784');
  });
  it('accepts finite numbers only', () => {
    expect(cleanString(42)).toBe('42');
    expect(cleanString(NaN)).toBe('');
    expect(cleanString(Infinity)).toBe('');
  });
  it('rejects non-scalar input without coercion', () => {
    const tricky = {
      toString() {
        throw new Error('should not be called');
      },
    };
    expect(cleanString(tricky)).toBe('');
    expect(cleanString(null)).toBe('');
    expect(cleanString(undefined)).toBe('');
    expect(cleanString(['784'])).toBe('');
  });
  it('rejects strings over the length limit', () => {
    expect(cleanString('1'.repeat(MAX_INPUT_LENGTH))).toHaveLength(MAX_INPUT_LENGTH);
    expect(cleanString('1'.repeat(MAX_INPUT_LENGTH + 1))).toBe('');
  });
});

describe('removeSeparators', () => {
  it('removes spaces, hyphens, underscores, slashes, and dots', () => {
    expect(removeSeparators(' 784-1990 1234_567/6.')).toBe('784199012345676');
  });
});

describe('luhn', () => {
  it('validates known Luhn numbers', () => {
    expect(luhnCheck('79927398713')).toBe(true);
    expect(luhnCheck('79927398710')).toBe(false);
    expect(luhnCheck('0')).toBe(true);
  });
  it('rejects empty and non-digit input', () => {
    expect(luhnCheck('')).toBe(false);
    expect(luhnCheck('7992739871a')).toBe(false);
  });
  it('computes check digits', () => {
    expect(luhnCheckDigit('7992739871')).toBe(3);
    expect(luhnCheckDigit('78419901234567')).toBe(6);
    expect(luhnCheckDigit('')).toBeNull();
    expect(luhnCheckDigit('12a')).toBeNull();
  });
});

describe('result helpers', () => {
  it('builds success and failure results', () => {
    expect(createSuccess(1)).toEqual({ isValid: true, data: 1 });
    expect(createFailure('Bad')).toEqual({
      isValid: false,
      error: 'Bad',
      errors: ['Bad'],
      code: 'VALIDATION_FAILED',
    });
    expect(createFailure('Bad', 'X', ['Bad', 'Worse']).errors).toEqual(['Bad', 'Worse']);
  });
});

describe('deepFreeze', () => {
  it('freezes nested objects and tolerates primitives', () => {
    const value = deepFreeze({ a: { b: [1] } });
    expect(Object.isFrozen(value.a.b)).toBe(true);
    expect(deepFreeze(5)).toBe(5);
    expect(deepFreeze(null)).toBeNull();
  });
});
