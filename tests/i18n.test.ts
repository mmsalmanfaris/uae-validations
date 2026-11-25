import { describe, expect, it } from 'vitest';
import * as lib from '../src';
import {
  VALIDATION_MESSAGES,
  localizeValidationResult,
  translateValidationCode,
} from '../src/i18n';

// Failures whose English message is fixed text, so it must equal the built-in message.
const STATIC_FAILURES = [
  lib.validateEmiratesId(''),
  lib.validateEmiratesId('784-1990-1234567'),
  lib.validateEmiratesId('785199012345676'),
  lib.validateUaePhone(''),
  lib.validateUaePhone('+44 20 7946 0000'),
  lib.validateUaePhone('0531234567'),
  lib.validateUaeServiceNumber('600 112345'),
  lib.validateUaeServiceNumber('500 512345'),
  lib.validateUaeIban('AE080331234567890123456'),
  lib.validateUaeIban('GB070331234567890123456'),
  lib.validateTrn('12'),
  lib.validateTin('abc'),
  lib.validateUaeBic('DEUTDEFF'),
  lib.validateMrz(''),
  lib.validateEmirate('Al Ain'),
  lib.validateMakani('123'),
  lib.validateDubaiPlate('ABC 123'),
  lib.validateAed('12.345'),
  lib.validateAed('-1'),
  lib.validatePersonName(''),
  lib.validatePersonName('Ahmed محمد'),
];

describe('VALIDATION_MESSAGES', () => {
  it('has a non-empty English and Arabic message for every code', () => {
    for (const [code, messages] of Object.entries(VALIDATION_MESSAGES)) {
      expect(messages.en, code).toMatch(/\S/);
      expect(messages.ar, code).toMatch(/[؀-ۿ]/);
    }
  });

  it.each(STATIC_FAILURES.map((r) => [r.code, r] as const))(
    '%s English message matches the validator',
    (_code, result) => {
      expect(result.isValid).toBe(false);
      if (result.isValid) return;
      expect(Object.keys(VALIDATION_MESSAGES)).toContain(result.code);
      expect(translateValidationCode(result.code, 'en')).toBe(result.error);
    },
  );

  it('is frozen', () => {
    expect(Object.isFrozen(VALIDATION_MESSAGES)).toBe(true);
    expect(Object.isFrozen(VALIDATION_MESSAGES.PHONE_REQUIRED)).toBe(true);
  });
});

describe('translateValidationCode', () => {
  it('translates, overrides, and falls back', () => {
    expect(translateValidationCode('AED_NEGATIVE', 'ar')).toBe('لا يمكن أن يكون المبلغ سالباً.');
    expect(translateValidationCode('AED_NEGATIVE', 'ar', { AED_NEGATIVE: 'x' })).toBe('x');
    expect(translateValidationCode('UNKNOWN')).toBe('Validation failed.');
    expect(translateValidationCode('AED_NEGATIVE', 'fr' as 'en')).toBe(
      'Amount cannot be negative.',
    );
  });

  it('ignores inherited object keys', () => {
    expect(translateValidationCode('toString')).toBe('Validation failed.');
    expect(translateValidationCode('__proto__', 'ar')).toBe('فشل التحقق من صحة القيمة.');
    expect(translateValidationCode('constructor', 'en', {})).toBe('Validation failed.');
  });
});

describe('localizeValidationResult', () => {
  it('translates failures and keeps the code', () => {
    const result = localizeValidationResult(lib.validateMrz(''), 'ar');
    expect(result).toEqual({
      isValid: false,
      code: 'MRZ_REQUIRED',
      error: 'منطقة القراءة الآلية (MRZ) مطلوبة.',
      errors: ['منطقة القراءة الآلية (MRZ) مطلوبة.'],
    });
  });

  it('returns successes unchanged', () => {
    const ok = lib.validateAed('10');
    expect(localizeValidationResult(ok, 'ar')).toBe(ok);
  });
});
