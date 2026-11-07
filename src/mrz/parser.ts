import { cleanString } from '../core/normalize';
import { isValidCalendarDate } from './dates';
import { mrzCheckDigit } from './check-digit';
import type {
  MrzCheckedField,
  MrzDate,
  MrzErrorCode,
  MrzFormat,
  MrzInfo,
  MrzOptions,
} from './types';

/** Raw field slices for one layout, before any interpretation. */
interface RawFields {
  format: MrzFormat;
  documentCode: string;
  issuingState: string;
  names: string;
  documentNumber: string;
  documentNumberCheck: string;
  nationality: string;
  birthDate: string;
  birthDateCheck: string;
  sex: string;
  expiryDate: string;
  expiryDateCheck: string;
  optionalData: string[];
  /** TD3 only. */
  personalNumberCheck: string | null;
  /** Characters covered by the composite check digit, or `null` for visas. */
  compositeInput: string | null;
  compositeCheck: string | null;
  /** Index into `optionalData` that holds the overflow of a long document number (TD1, TD2). */
  longDocumentField: number | null;
}

function normalizeLines(input: unknown): string[] | null {
  let lines: unknown[];
  if (typeof input === 'string') lines = input.split(/\r?\n/);
  else if (Array.isArray(input)) lines = input as unknown[];
  else return null;
  if (lines.length > 3 && typeof input !== 'string') return null;
  const result: string[] = [];
  for (const line of lines) {
    if (typeof line !== 'string') return null;
    const cleaned = cleanString(line).toUpperCase().replace(/\s/g, '');
    if (cleaned) result.push(cleaned);
  }
  return result;
}

function slice(lines: string[]): RawFields | null {
  const [l1 = '', l2 = '', l3] = lines;
  const shape = `${lines.length}x${l1.length}`;
  if (lines.some((line) => line.length !== l1.length)) return null;

  if (shape === '3x30' && l3 !== undefined) {
    return {
      format: 'TD1',
      documentCode: l1.slice(0, 2),
      issuingState: l1.slice(2, 5),
      documentNumber: l1.slice(5, 14),
      documentNumberCheck: l1[14]!,
      optionalData: [l1.slice(15, 30), l2.slice(18, 29)],
      birthDate: l2.slice(0, 6),
      birthDateCheck: l2[6]!,
      sex: l2[7]!,
      expiryDate: l2.slice(8, 14),
      expiryDateCheck: l2[14]!,
      nationality: l2.slice(15, 18),
      compositeInput: l1.slice(5, 30) + l2.slice(0, 7) + l2.slice(8, 15) + l2.slice(18, 29),
      compositeCheck: l2[29]!,
      names: l3,
      personalNumberCheck: null,
      longDocumentField: 0,
    };
  }

  if (shape !== '2x36' && shape !== '2x44') return null;
  const isVisa = l1[0] === 'V';
  const wide = l1.length === 44;
  const common = {
    documentCode: l1.slice(0, 2),
    issuingState: l1.slice(2, 5),
    names: l1.slice(5),
    documentNumber: l2.slice(0, 9),
    documentNumberCheck: l2[9]!,
    nationality: l2.slice(10, 13),
    birthDate: l2.slice(13, 19),
    birthDateCheck: l2[19]!,
    sex: l2[20]!,
    expiryDate: l2.slice(21, 27),
    expiryDateCheck: l2[27]!,
  };

  if (isVisa) {
    return {
      ...common,
      format: wide ? 'MRV-A' : 'MRV-B',
      optionalData: [l2.slice(28)],
      personalNumberCheck: null,
      compositeInput: null,
      compositeCheck: null,
      longDocumentField: null,
    };
  }
  const end = l2.length - 1;
  return {
    ...common,
    format: wide ? 'TD3' : 'TD2',
    optionalData: [l2.slice(28, wide ? 42 : end)],
    personalNumberCheck: wide ? l2[42]! : null,
    compositeInput: l2.slice(0, 10) + l2.slice(13, 20) + l2.slice(21, end),
    compositeCheck: l2[end]!,
    longDocumentField: wide ? null : 0,
  };
}

const stripFiller = (value: string): string => value.replace(/<+$/, '').replace(/</g, ' ').trim();

function toDate(raw: string, kind: 'birth' | 'expiry', options?: MrzOptions): MrzDate | null {
  if (!/^[0-9]{6}$/.test(raw)) return { raw, iso: null };
  const yy = Number(raw.slice(0, 2));
  const month = Number(raw.slice(2, 4));
  const day = Number(raw.slice(4, 6));
  const ref = options?.referenceDate;
  const today = ref instanceof Date && !Number.isNaN(ref.getTime()) ? ref : new Date();
  const refYear = today.getUTCFullYear();
  let year = 2000 + yy;
  if (kind === 'birth' && year > refYear) year -= 100;
  if (kind === 'expiry' && year > refYear + 50) year -= 100;
  if (!isValidCalendarDate(year, month, day)) return null;
  return { raw, iso: `${year}-${raw.slice(2, 4)}-${raw.slice(4, 6)}` };
}

const checkMatches = (field: string, digit: string): boolean =>
  String(mrzCheckDigit(field)) === digit;

/** @internal Result of inspecting an MRZ: the info, or the first structural error, or every failed check digit. */
export type MrzInspection =
  | { info: MrzInfo }
  | { code: Exclude<MrzErrorCode, 'MRZ_CHECK_DIGIT_MISMATCH'> }
  | { code: 'MRZ_CHECK_DIGIT_MISMATCH'; fields: MrzCheckedField[] };

/** @internal Shared by the parser and `validateMrz`. */
export function inspectMrz(input: unknown, options?: MrzOptions): MrzInspection {
  const lines = normalizeLines(input);
  if (lines === null) return { code: 'MRZ_INVALID_FORMAT' };
  if (lines.length === 0) return { code: 'MRZ_REQUIRED' };
  if (lines.some((line) => !/^[0-9A-Z<]+$/.test(line))) return { code: 'MRZ_INVALID_FORMAT' };
  const raw = slice(lines);
  if (raw === null) return { code: 'MRZ_INVALID_FORMAT' };

  const sexMap = { M: 'male', F: 'female', '<': 'unspecified', X: 'unspecified' } as const;
  const sex = sexMap[raw.sex as keyof typeof sexMap];
  if (sex === undefined) return { code: 'MRZ_INVALID_FORMAT' };

  // Long document numbers (TD1/TD2): `<` in the check position, overflow in the optional data.
  let documentNumber = raw.documentNumber;
  let documentNumberCheck = raw.documentNumberCheck;
  const optionalData = [...raw.optionalData];
  if (raw.longDocumentField !== null && documentNumberCheck === '<') {
    const overflow = optionalData[raw.longDocumentField]!;
    const segment = /^[0-9A-Z]+/.exec(overflow)?.[0];
    if (segment === undefined) return { code: 'MRZ_INVALID_FORMAT' };
    documentNumber += segment.slice(0, -1);
    documentNumberCheck = segment.slice(-1);
    optionalData[raw.longDocumentField] = overflow.slice(segment.length + 1);
  }

  const birthDate = toDate(raw.birthDate, 'birth', options);
  const expiryDate = toDate(raw.expiryDate, 'expiry', options);
  if (birthDate === null || expiryDate === null) return { code: 'MRZ_INVALID_DATE' };

  const failed: MrzCheckedField[] = [];
  if (!checkMatches(documentNumber, documentNumberCheck)) failed.push('documentNumber');
  if (!checkMatches(raw.birthDate, raw.birthDateCheck)) failed.push('birthDate');
  if (!checkMatches(raw.expiryDate, raw.expiryDateCheck)) failed.push('expiryDate');
  if (raw.personalNumberCheck !== null) {
    const personal = raw.optionalData[0]!;
    // An empty personal number may carry `<` instead of a check digit.
    const emptyOk = /^<+$/.test(personal) && raw.personalNumberCheck === '<';
    if (!emptyOk && !checkMatches(personal, raw.personalNumberCheck)) failed.push('personalNumber');
  }
  if (raw.compositeInput !== null && !checkMatches(raw.compositeInput, raw.compositeCheck!)) {
    failed.push('composite');
  }
  if (failed.length > 0) return { code: 'MRZ_CHECK_DIGIT_MISMATCH', fields: failed };

  const names = raw.names.replace(/<+$/, '');
  const separator = names.indexOf('<<');
  const issuingState = stripFiller(raw.issuingState);
  const firstOptional = optionalData[0]!;
  const emiratesId =
    issuingState === 'ARE' && /^784[0-9]{12}/.test(firstOptional)
      ? firstOptional.slice(0, 15)
      : null;

  return {
    info: {
      format: raw.format,
      documentCode: stripFiller(raw.documentCode),
      issuingState,
      documentNumber: stripFiller(documentNumber),
      nationality: stripFiller(raw.nationality),
      birthDate,
      sex,
      expiryDate,
      surname: stripFiller(separator === -1 ? names : names.slice(0, separator)),
      givenNames: separator === -1 ? '' : stripFiller(names.slice(separator + 2)),
      optionalData: optionalData.map(stripFiller),
      emiratesId,
      lines,
    },
  };
}

/**
 * Parses an ICAO 9303 machine-readable zone from a passport, ID card (including the back
 * of the Emirates ID card), or visa.
 *
 * Accepts the MRZ as one string with line breaks or as an array of lines. Spaces are
 * removed and letters upper-cased, which tolerates most OCR output. Every check digit
 * (document number, birth date, expiry date, personal number, composite) must match.
 *
 * @param input - MRZ text or lines. Other input returns `null` without throwing.
 * @param options - Optional `{ referenceDate }` used to infer date centuries.
 * @returns The decoded {@link MrzInfo}, or `null` if the MRZ is malformed or a check digit fails.
 *
 * @example
 * ```ts
 * parseMrz(['P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<', 'L898902C36UTO7408122F1204159ZE184226B<<<<<10'])?.documentNumber; // 'L898902C3'
 * parseMrz('I<UTOD231458907<<<<<<<<<<<<<<<\n7408122F1204159UTO<<<<<<<<<<<6\nERIKSSON<<ANNA<MARIA<<<<<<<<<<')?.givenNames; // 'ANNA MARIA'
 * ```
 */
export function parseMrz(input: unknown, options?: MrzOptions): MrzInfo | null {
  const result = inspectMrz(input, options);
  return 'info' in result ? result.info : null;
}
