import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import * as lib from '../src';

/** Validators, parsers, and formatters that accept untrusted `unknown` input as their first argument. */
const UNKNOWN_INPUT_FUNCTIONS: Record<string, (input: unknown, ...rest: never[]) => unknown> = {
  cleanString: lib.cleanString,
  removeSeparators: lib.removeSeparators,
  isValidEmiratesId: lib.isValidEmiratesId,
  parseEmiratesId: lib.parseEmiratesId,
  validateEmiratesId: lib.validateEmiratesId,
  formatEmiratesId: lib.formatEmiratesId,
  maskEmiratesId: lib.maskEmiratesId,
  isValidUaePhone: lib.isValidUaePhone,
  isValidUaeMobile: lib.isValidUaeMobile,
  isValidUaeLandline: lib.isValidUaeLandline,
  parseUaePhone: lib.parseUaePhone,
  validateUaePhone: lib.validateUaePhone,
  formatUaePhone: lib.formatUaePhone,
  isValidUaeIban: lib.isValidUaeIban,
  parseUaeIban: lib.parseUaeIban,
  validateUaeIban: lib.validateUaeIban,
  formatUaeIban: lib.formatUaeIban,
  maskUaeIban: lib.maskUaeIban,
  buildUaeIban: lib.buildUaeIban,
  isValidTrn: lib.isValidTrn,
  parseTrn: lib.parseTrn,
  validateTrn: lib.validateTrn,
  isValidTin: lib.isValidTin,
  validateTin: lib.validateTin,
  tinFromTrn: lib.tinFromTrn,
  doesTinMatchTrn: lib.doesTinMatchTrn,
  maskTrn: lib.maskTrn,
  isValidBic: lib.isValidBic,
  isValidUaeBic: lib.isValidUaeBic,
  parseBic: lib.parseBic,
  validateUaeBic: lib.validateUaeBic,
  mrzCheckDigit: lib.mrzCheckDigit as (input: unknown) => unknown,
  isValidMrz: lib.isValidMrz,
  parseMrz: lib.parseMrz,
  validateMrz: lib.validateMrz,
  findEmirate: lib.findEmirate,
  normalizeEmirate: lib.normalizeEmirate,
  isValidEmirate: lib.isValidEmirate,
  validateEmirate: lib.validateEmirate,
  getEmiratesByAreaCode: lib.getEmiratesByAreaCode,
  parseAed: lib.parseAed,
  isValidAed: lib.isValidAed,
  validateAed: lib.validateAed,
  formatAed: lib.formatAed,
  aedToWords: lib.aedToWords,
  calculateVat: lib.calculateVat,
  getVatRegistrationRequirement: lib.getVatRegistrationRequirement,
  normalizeArabic: lib.normalizeArabic,
  containsArabic: lib.containsArabic,
  isValidPersonName: lib.isValidPersonName,
  validatePersonName: lib.validatePersonName,
  areNamesEquivalent: lib.areNamesEquivalent,
  parseMakani: lib.parseMakani,
  isValidMakani: lib.isValidMakani,
  validateMakani: lib.validateMakani,
  formatMakani: lib.formatMakani,
  parseDubaiPlate: lib.parseDubaiPlate,
  isValidDubaiPlate: lib.isValidDubaiPlate,
  validateDubaiPlate: lib.validateDubaiPlate,
  formatDubaiPlate: lib.formatDubaiPlate,
};

const idLike = fc
  .array(fc.constantFrom(...'0123456789٠١٢٣٤٥٦٧٨٩ -+().,<AEPIDLVأبدة\n'.split('')), {
    maxLength: 96,
  })
  .map((chars) => chars.join(''));

describe('property: never throws on arbitrary input', () => {
  for (const [name, fn] of Object.entries(UNKNOWN_INPUT_FUNCTIONS)) {
    it(name, () => {
      fc.assert(
        fc.property(fc.oneof(fc.anything(), idLike, fc.string({ unit: 'binary' })), (input) => {
          expect(() => fn(input)).not.toThrow();
        }),
      );
    });
  }
});

describe('property: Emirates ID round trips', () => {
  const validId = fc
    .tuple(fc.integer({ min: 1900, max: 2026 }), fc.stringMatching(/^[0-9]{8}$/))
    .map(([year, rest]) => `784${year}${rest}`);
  const ref = { referenceDate: new Date(Date.UTC(2026, 0, 1)) };

  it('every 784 + valid year + 8 digits is accepted in all layouts', () => {
    fc.assert(
      fc.property(validId, (id) => {
        expect(lib.isValidEmiratesId(id, ref)).toBe(true);
        const hyphenated = lib.formatEmiratesId(id, 'hyphenated', ref)!;
        const spaced = lib.formatEmiratesId(id, 'spaced', ref)!;
        expect(lib.formatEmiratesId(hyphenated, 'compact', ref)).toBe(id);
        expect(lib.formatEmiratesId(spaced, 'compact', ref)).toBe(id);
      }),
    );
  });

  it('isValid, parse, and validate always agree', () => {
    fc.assert(
      fc.property(fc.oneof(validId, idLike), fc.boolean(), (input, verifyChecksum) => {
        const options = { ...ref, verifyChecksum };
        const valid = lib.isValidEmiratesId(input, options);
        expect(lib.parseEmiratesId(input, options) !== null).toBe(valid);
        expect(lib.validateEmiratesId(input, options).isValid).toBe(valid);
      }),
    );
  });

  it('masking never reveals the year at the default setting', () => {
    fc.assert(
      fc.property(validId, (id) => {
        expect(lib.maskEmiratesId(id, ref)!.slice(4, 8)).toBe('****');
      }),
    );
  });
});
