import { describe, expect, it } from 'vitest';
import { MRZ_SOURCES, isValidMrz, mrzCheckDigit, parseMrz, validateMrz } from '../src/mrz';

// ICAO Doc 9303 specimens (fictional state "Utopia") and synthetic documents only.
const TD3 = [
  'P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<',
  'L898902C36UTO7408122F1204159ZE184226B<<<<<10',
];
const TD1 = [
  'I<UTOD231458907<<<<<<<<<<<<<<<',
  '7408122F1204159UTO<<<<<<<<<<<6',
  'ERIKSSON<<ANNA<MARIA<<<<<<<<<<',
];
const TD2 = ['I<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<', 'D231458907UTO7408122F1204159<<<<<<<6'];
const REF = { referenceDate: new Date(Date.UTC(2026, 10, 6)) };

const cd = (s: string): string => String(mrzCheckDigit(s));

/** Builds a valid TD1 MRZ with computed check digits. */
function td1(opts: {
  code?: string;
  state?: string;
  docNumber: string;
  optional1?: string;
  dob?: string;
  sex?: string;
  expiry?: string;
  nationality?: string;
  optional2?: string;
  names?: string;
}): string[] {
  const { docNumber } = opts;
  let docField: string;
  let opt1: string;
  if (docNumber.length > 9) {
    docField = `${docNumber.slice(0, 9)}<`;
    opt1 = (docNumber.slice(9) + cd(docNumber) + '<' + (opts.optional1 ?? '')).padEnd(15, '<');
  } else {
    docField = docNumber.padEnd(9, '<') + cd(docNumber.padEnd(9, '<'));
    opt1 = (opts.optional1 ?? '').padEnd(15, '<');
  }
  const l1 = `${(opts.code ?? 'ID').padEnd(2, '<')}${opts.state ?? 'ARE'}${docField}${opt1}`;
  const dob = opts.dob ?? '900101';
  const expiry = opts.expiry ?? '300101';
  const l2a = `${dob}${cd(dob)}${opts.sex ?? 'M'}${expiry}${cd(expiry)}${opts.nationality ?? 'ARE'}${(opts.optional2 ?? '').padEnd(11, '<')}`;
  const composite = cd(l1.slice(5, 30) + l2a.slice(0, 7) + l2a.slice(8, 15) + l2a.slice(18, 29));
  return [l1, l2a + composite, (opts.names ?? 'DOE<<JOHN').padEnd(30, '<')];
}

describe('mrzCheckDigit', () => {
  it('matches ICAO examples', () => {
    expect(mrzCheckDigit('L898902C3')).toBe(6);
    expect(mrzCheckDigit('740812')).toBe(2);
    expect(mrzCheckDigit('120415')).toBe(9);
    expect(mrzCheckDigit('ZE184226B<<<<<')).toBe(1);
    expect(mrzCheckDigit('<<<')).toBe(0);
    expect(mrzCheckDigit('')).toBe(0);
  });

  it('rejects invalid characters', () => {
    expect(mrzCheckDigit('l898')).toBeNull();
    expect(mrzCheckDigit(42 as unknown as string)).toBeNull();
  });
});

describe('parseMrz: TD3 passport', () => {
  it('decodes the ICAO specimen', () => {
    expect(parseMrz(TD3, REF)).toEqual({
      format: 'TD3',
      documentCode: 'P',
      issuingState: 'UTO',
      documentNumber: 'L898902C3',
      nationality: 'UTO',
      birthDate: { raw: '740812', iso: '1974-08-12' },
      sex: 'female',
      expiryDate: { raw: '120415', iso: '2012-04-15' },
      surname: 'ERIKSSON',
      givenNames: 'ANNA MARIA',
      optionalData: ['ZE184226B'],
      emiratesId: null,
      lines: TD3,
    });
  });

  it('accepts a string with CRLF, spaces, lower case, and blank lines', () => {
    const messy = `\n ${TD3[0]!.toLowerCase()} \r\n${TD3[1]!.replace(/(.{11})/g, '$1 ')}\n\n`;
    expect(parseMrz(messy, REF)?.documentNumber).toBe('L898902C3');
  });

  it('accepts an empty personal number with < as its check digit', () => {
    const l2 = `L898902C36UTO7408122F1204159${'<'.repeat(14)}<`;
    const composite = cd(l2.slice(0, 10) + l2.slice(13, 20) + l2.slice(21, 43));
    expect(parseMrz([TD3[0], l2 + composite], REF)?.optionalData).toEqual(['']);
  });

  it('reports each failing check digit', () => {
    const broken = TD3[1]!.replace('L898902C36', 'L898902C35').replace('7408122', '7408123');
    const result = validateMrz([TD3[0], broken], REF);
    expect(result.code).toBe('MRZ_CHECK_DIGIT_MISMATCH');
    expect(result.errors).toEqual([
      'Check digit for document number does not match.',
      'Check digit for date of birth does not match.',
      'Check digit for composite does not match.',
    ]);
  });

  it('checks the personal number and expiry date', () => {
    const l2 = TD3[1]!;
    const badPersonal = `${l2.slice(0, 42)}2${l2.slice(43)}`;
    expect(validateMrz([TD3[0], badPersonal], REF).errors).toContain(
      'Check digit for personal number does not match.',
    );
    const badExpiry = `${l2.slice(0, 27)}8${l2.slice(28)}`;
    expect(validateMrz([TD3[0], badExpiry], REF).errors).toContain(
      'Check digit for date of expiry does not match.',
    );
  });
});

describe('parseMrz: TD1 and TD2', () => {
  it('decodes the ICAO TD1 specimen', () => {
    const info = parseMrz(TD1, REF);
    expect(info?.format).toBe('TD1');
    expect(info?.documentNumber).toBe('D23145890');
    expect(info?.optionalData).toEqual(['', '']);
  });

  it('decodes the ICAO TD2 specimen', () => {
    const info = parseMrz(TD2, REF);
    expect(info?.format).toBe('TD2');
    expect(info?.surname).toBe('ERIKSSON');
  });

  it('extracts the Emirates ID number from a UAE card', () => {
    const lines = td1({ docNumber: '123456789', optional1: '784199012345676' });
    const info = parseMrz(lines, REF);
    expect(info?.emiratesId).toBe('784199012345676');
    expect(info?.issuingState).toBe('ARE');
    expect(info?.surname).toBe('DOE');
    expect(info?.givenNames).toBe('JOHN');
  });

  it('only extracts an Emirates ID from UAE-issued documents', () => {
    const lines = td1({ docNumber: '123456789', optional1: '784199012345676', state: 'UTO' });
    expect(parseMrz(lines, REF)?.emiratesId).toBeNull();
    expect(
      parseMrz(td1({ docNumber: '123456789', optional1: '12345' }), REF)?.emiratesId,
    ).toBeNull();
  });

  it('handles long document numbers', () => {
    const lines = td1({ docNumber: 'D23145890734', optional1: 'XY' });
    const info = parseMrz(lines, REF);
    expect(info?.documentNumber).toBe('D23145890734');
    expect(info?.optionalData[0]).toBe('XY');
  });

  it('rejects a long document number with no overflow', () => {
    const lines = td1({ docNumber: '123456789' });
    lines[0] = `${lines[0]!.slice(0, 14)}<${'<'.repeat(15)}`;
    expect(validateMrz(lines, REF).code).toBe('MRZ_INVALID_FORMAT');
  });

  it('accepts unspecified sex and names without given names', () => {
    expect(parseMrz(td1({ docNumber: 'A1', sex: '<' }), REF)?.sex).toBe('unspecified');
    expect(parseMrz(td1({ docNumber: 'A1', sex: 'X' }), REF)?.sex).toBe('unspecified');
    expect(parseMrz(td1({ docNumber: 'A1', sex: 'M' }), REF)?.sex).toBe('male');
    expect(parseMrz(td1({ docNumber: 'A1', names: 'MADONNA' }), REF)?.givenNames).toBe('');
  });

  it('keeps unknown date parts as raw text', () => {
    const info = parseMrz(td1({ docNumber: 'A1', dob: '90<<<<' }), REF);
    expect(info?.birthDate).toEqual({ raw: '90<<<<', iso: null });
  });

  it('infers centuries from the reference date', () => {
    expect(parseMrz(td1({ docNumber: 'A1', dob: '250101' }), REF)?.birthDate.iso).toBe(
      '2025-01-01',
    );
    expect(parseMrz(td1({ docNumber: 'A1', dob: '270101' }), REF)?.birthDate.iso).toBe(
      '1927-01-01',
    );
    expect(parseMrz(td1({ docNumber: 'A1', expiry: '990101' }), REF)?.expiryDate.iso).toBe(
      '1999-01-01',
    );
    expect(parseMrz(td1({ docNumber: 'A1', expiry: '700101' }), REF)?.expiryDate.iso).toBe(
      '2070-01-01',
    );
    expect(
      parseMrz(td1({ docNumber: 'A1' }), { referenceDate: new Date(NaN) })?.expiryDate.iso,
    ).toBe('2030-01-01');
  });

  it('rejects impossible dates', () => {
    expect(validateMrz(td1({ docNumber: 'A1', dob: '900230' }), REF).code).toBe('MRZ_INVALID_DATE');
    expect(validateMrz(td1({ docNumber: 'A1', expiry: '301301' }), REF).code).toBe(
      'MRZ_INVALID_DATE',
    );
    expect(isValidMrz(td1({ docNumber: 'A1', dob: '000229' }), REF)).toBe(true);
    expect(isValidMrz(td1({ docNumber: 'A1', dob: '010229' }), REF)).toBe(false);
  });

  it('rejects an invalid sex character', () => {
    expect(validateMrz(td1({ docNumber: 'A1', sex: 'Q' }), REF).code).toBe('MRZ_INVALID_FORMAT');
  });
});

describe('parseMrz: visas', () => {
  it('decodes MRV-A without a composite check digit', () => {
    const l2 = `L898902C36UTO7408122F1204159${'<'.repeat(16)}`;
    const info = parseMrz(['V<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<', l2], REF);
    expect(info?.format).toBe('MRV-A');
    expect(info?.documentCode).toBe('V');
  });

  it('decodes MRV-B', () => {
    const l2 = `L898902C36UTO7408122F1204159${'<'.repeat(8)}`;
    expect(parseMrz(['V<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<', l2], REF)?.format).toBe('MRV-B');
  });
});

describe('validateMrz: structural errors', () => {
  it.each([
    ['', 'MRZ_REQUIRED'],
    ['\n\n', 'MRZ_REQUIRED'],
    [[], 'MRZ_REQUIRED'],
    [null, 'MRZ_INVALID_FORMAT'],
    [42, 'MRZ_INVALID_FORMAT'],
    [[TD3[0], 42], 'MRZ_INVALID_FORMAT'],
    [['a', 'b', 'c', 'd'], 'MRZ_INVALID_FORMAT'],
    ['P<UTO', 'MRZ_INVALID_FORMAT'],
    [[TD3[0], TD3[1]!.slice(0, 43)], 'MRZ_INVALID_FORMAT'],
    [[TD1[0], TD1[1]], 'MRZ_INVALID_FORMAT'],
    [[TD3[0], TD3[1]!.replace('L', 'É')], 'MRZ_INVALID_FORMAT'],
    [[...TD1, TD1[0]], 'MRZ_INVALID_FORMAT'],
  ])('rejects %j with %s', (input, code) => {
    const result = validateMrz(input, REF);
    expect(result.isValid).toBe(false);
    expect(result.code).toBe(code);
  });

  it('describes the date error', () => {
    expect(validateMrz(td1({ docNumber: 'A1', dob: '901301' }), REF).error).toBe(
      'MRZ contains an impossible date.',
    );
  });

  it('returns data on success', () => {
    const result = validateMrz(TD3, REF);
    expect(result.isValid).toBe(true);
    if (result.isValid) expect(result.data.givenNames).toBe('ANNA MARIA');
  });
});

describe('MRZ_SOURCES', () => {
  it('cites ICAO Doc 9303', () => {
    expect(MRZ_SOURCES[0]?.title).toContain('9303');
  });
});
