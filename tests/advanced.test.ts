import { describe, expect, it } from 'vitest';
import { calculateAge, formatUaeDate, isAdult, isValidGregorianDate } from '../src/dates';
import { getValidationMessage } from '../src/i18n';
import { getSource, getSourcesForModule, RULE_SOURCES } from '../src/metadata';
import { maskUaePhone } from '../src/privacy';
import { asFieldValidator, matchesField, validateSchema } from '../src/schema';
import { isValidEmiratesId } from '../src/emirates-id';

describe('dates', () => {
  it('validates calendar dates and calculates birthday-aware ages', () => {
    expect(isValidGregorianDate('2024-02-29')).toBe(true);
    expect(isValidGregorianDate('2023-02-29')).toBe(false);
    expect(calculateAge('2000-11-07', '2026-11-06')).toBe(25);
    expect(calculateAge('2000-11-06', '2026-11-06')).toBe(26);
    expect(isAdult('2008-11-07', '2026-11-06')).toBe(false);
    expect(formatUaeDate('2026-11-06')).not.toBe('');
  });
});

describe('i18n, schema, privacy, and metadata', () => {
  it('provides parameterized English and Arabic messages', () => {
    expect(getValidationMessage('TOO_YOUNG', 'en', { age: 18 })).toContain('18');
    expect(getValidationMessage('REQUIRED', 'ar')).toBe('هذا الحقل مطلوب.');
  });
  it('composes field validation and cross-field rules', () => {
    interface Form { id: string; confirmId: string }
    const schema = {
      id: { required: true, validators: [asFieldValidator<Form>(isValidEmiratesId, 'Invalid Emirates ID.')] },
      confirmId: { required: true, validators: [matchesField<Form>('id')] }
    };
    expect(validateSchema<Form>({ id: '784199012345670', confirmId: '784199012345670' }, schema).valid).toBe(true);
    expect(validateSchema<Form>({ id: 'bad', confirmId: 'different' }, schema)).toMatchObject({ valid: false, errors: [{ path: 'id' }, { path: 'confirmId' }] });
  });
  it('masks phones and exposes source metadata', () => {
    expect(maskUaePhone('+971501234567')).toBe('050 **** 567');
    expect(RULE_SOURCES.length).toBeGreaterThanOrEqual(8);
    expect(getSource('uae-iban')?.authority).toBe('Central Bank of the UAE');
    expect(getSourcesForModule('currency')).toHaveLength(1);
  });
});
