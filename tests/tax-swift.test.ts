import { describe, expect, it } from 'vitest';
import { SWIFT_SOURCES, isValidBic, isValidUaeBic, parseBic, validateUaeBic } from '../src/swift';
import {
  TAX_SOURCES,
  doesTinMatchTrn,
  isValidTin,
  isValidTrn,
  maskTrn,
  parseTrn,
  tinFromTrn,
  validateTin,
  validateTrn,
} from '../src/tax';

// Synthetic numbers only.
const TRN = '100123456700003';
const TIN = '1001234567';

describe('TRN', () => {
  it.each([TRN, '100 1234 5670 0003', '100-123-456-700-003', '١٠٠١٢٣٤٥٦٧٠٠٠٠٣', 100123456700003])(
    'accepts %j',
    (input) => {
      expect(parseTrn(input)).toEqual({ trn: TRN, tin: TIN });
      expect(isValidTrn(input)).toBe(true);
    },
  );

  it.each([
    ['', 'TRN_REQUIRED'],
    [undefined, 'TRN_REQUIRED'],
    ['10012345670000A', 'TRN_INVALID_FORMAT'],
    ['100.123.456.700.003', 'TRN_INVALID_FORMAT'],
    ['10012345670000', 'TRN_INVALID_LENGTH'],
    ['1001234567000031', 'TRN_INVALID_LENGTH'],
  ])('rejects %j with %s', (input, code) => {
    const result = validateTrn(input);
    expect(result.isValid).toBe(false);
    expect(result.code).toBe(code);
  });

  it('returns TRN info on success', () => {
    expect(validateTrn(TRN)).toEqual({ isValid: true, data: { trn: TRN, tin: TIN } });
  });

  it('masks', () => {
    expect(maskTrn(TRN)).toBe('100*********003');
    expect(maskTrn('123')).toBeNull();
  });
});

describe('TIN', () => {
  it('validates 10 digits', () => {
    expect(isValidTin(TIN)).toBe(true);
    expect(isValidTin('100 123 4567')).toBe(true);
    expect(isValidTin(TRN)).toBe(false);
    expect(isValidTin('100123456A')).toBe(false);
  });

  it.each([
    ['', 'TIN_REQUIRED'],
    ['100123456A', 'TIN_INVALID_FORMAT'],
    ['123456789', 'TIN_INVALID_LENGTH'],
  ])('rejects %j with %s', (input, code) => {
    expect(validateTin(input).code).toBe(code);
  });

  it('relates TIN and TRN', () => {
    expect(tinFromTrn(TRN)).toBe(TIN);
    expect(tinFromTrn('bad')).toBeNull();
    expect(doesTinMatchTrn(TIN, TRN)).toBe(true);
    expect(doesTinMatchTrn('100 123 4567', '100-1234-5670-0003')).toBe(true);
    expect(doesTinMatchTrn('1001234568', TRN)).toBe(false);
    expect(doesTinMatchTrn('bad', TRN)).toBe(false);
    expect(doesTinMatchTrn(TIN, 'bad')).toBe(false);
  });

  it('cites the FTA', () => {
    expect(TAX_SOURCES[0]?.url).toContain('tax.gov.ae');
  });
});

describe('BIC', () => {
  it('parses an 8-character BIC', () => {
    expect(parseBic('ABCDAEAD')).toEqual({
      bic: 'ABCDAEAD',
      bic11: 'ABCDAEADXXX',
      institutionCode: 'ABCD',
      countryCode: 'AE',
      locationCode: 'AD',
      branchCode: null,
      isPrimaryOffice: true,
      isTestBic: false,
    });
  });

  it('parses branches and test BICs', () => {
    expect(parseBic('ABCDAEAD123')?.isPrimaryOffice).toBe(false);
    expect(parseBic('ABCDAEADXXX')?.isPrimaryOffice).toBe(true);
    expect(parseBic('ABCDAEA0')?.isTestBic).toBe(true);
    expect(parseBic('ab12 ae ad')?.institutionCode).toBe('AB12');
  });

  it.each(['ABCDAE', 'ABCDAEAD1', 'ABCDAEAD12', 'ABCDAEAD1234', 'ABCD12AD', 'ABCD-AEAD', '', null])(
    'rejects %j',
    (input) => {
      expect(isValidBic(input)).toBe(false);
    },
  );

  it('restricts UAE validation to country AE', () => {
    expect(isValidUaeBic('ABCDAEAD')).toBe(true);
    expect(isValidUaeBic('DEUTDEFF')).toBe(false);
    expect(validateUaeBic('').code).toBe('BIC_REQUIRED');
    expect(validateUaeBic('ABC').code).toBe('BIC_INVALID_FORMAT');
    expect(validateUaeBic('DEUTDEFF').code).toBe('BIC_NOT_UAE');
    expect(validateUaeBic('ABCDAEAD').isValid).toBe(true);
  });

  it('cites SWIFT', () => {
    expect(SWIFT_SOURCES[0]?.authority).toContain('SWIFT');
  });
});
