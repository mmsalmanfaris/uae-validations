import { describe, expect, it } from 'vitest';
import { formatUaeIban, isValidUaeIban, maskUaeIban, parseUaeIban, validateUaeIban } from '../src/iban';

const IBAN = 'AE070331234567890123456';

describe('UAE IBAN', () => {
  it('validates official example and formatted input', () => {
    expect(isValidUaeIban(IBAN)).toBe(true);
    expect(isValidUaeIban('AE07 0331 2345 6789 0123 456')).toBe(true);
  });
  it('rejects wrong checksum, country, length, and BBAN letters', () => {
    expect(validateUaeIban('AE080331234567890123456')).toMatchObject({ valid: false });
    expect(isValidUaeIban('GB070331234567890123456')).toBe(false);
    expect(isValidUaeIban('AE07033123456789012345')).toBe(false);
    expect(isValidUaeIban('AE07033A234567890123456')).toBe(false);
  });
  it('parses, formats, and masks', () => {
    expect(parseUaeIban(IBAN)).toMatchObject({ countryCode: 'AE', checkDigits: '07', bankCode: '033', accountNumber: '1234567890123456' });
    expect(formatUaeIban(IBAN)).toBe('AE07 0331 2345 6789 0123 456');
    expect(maskUaeIban(IBAN)).toBe('AE07033************3456');
  });
});
