/**
 * The seven emirates: names in English and Arabic, ISO 3166-2 codes, common aliases,
 * and landline area codes, with lookup from any of them.
 *
 * Import from `uae-validations/administrative`, or from the package root.
 *
 * @example
 * ```ts
 * import { findEmirate, normalizeEmirate } from 'uae-validations/administrative';
 *
 * normalizeEmirate('DXB'); // 'dubai'
 * findEmirate('أبو ظبي')?.iso; // 'AE-AZ'
 * ```
 *
 * @module administrative
 */

import { normalizeArabic } from '../arabic';
import { MAX_INPUT_LENGTH } from '../core/normalize';
import type { ReferenceSource, ValidationResult } from '../core/types';
import { createFailure, createSuccess, deepFreeze } from '../core/utils';

/** Stable identifier of an emirate. */
export type EmirateId =
  'abu-dhabi' | 'dubai' | 'sharjah' | 'ajman' | 'umm-al-quwain' | 'ras-al-khaimah' | 'fujairah';

/** Reference data for one emirate. */
export interface EmirateInfo {
  /** Stable identifier, for example `'abu-dhabi'`. */
  id: EmirateId;
  /** ISO 3166-2 subdivision code, for example `'AE-AZ'`. */
  iso: string;
  /** English name as used by the UAE Government portal. */
  nameEn: string;
  /** Arabic name. */
  nameAr: string;
  /** Other accepted spellings and abbreviations, including the ISO 3166-2 romanization. */
  aliases: readonly string[];
  /** Landline area codes serving the emirate (the TDRA numbering plan; `06` is shared). */
  areaCodes: readonly string[];
}

/** Official sources for the emirate reference data. */
export const ADMINISTRATIVE_SOURCES: readonly ReferenceSource[] = deepFreeze([
  {
    authority: 'UAE Government (u.ae)',
    title: 'The seven emirates',
    url: 'https://u.ae/en/about-the-uae/the-seven-emirates',
    lastReviewed: '2026-11-06',
  },
  {
    authority: 'International Organization for Standardization (ISO)',
    title: 'ISO 3166-2:AE, subdivision codes for the United Arab Emirates',
    url: 'https://www.iso.org/obp/ui/#iso:code:3166:AE',
    lastReviewed: '2026-11-06',
  },
]);

/** All seven emirates, in the order the UAE Government lists them. */
export const EMIRATES: readonly EmirateInfo[] = deepFreeze([
  {
    id: 'abu-dhabi',
    iso: 'AE-AZ',
    nameEn: 'Abu Dhabi',
    nameAr: 'أبوظبي',
    aliases: ['Abū Z̧aby', 'Abu Zaby', 'Abudhabi', 'AD', 'AUH'],
    areaCodes: ['02', '03'],
  },
  {
    id: 'dubai',
    iso: 'AE-DU',
    nameEn: 'Dubai',
    nameAr: 'دبي',
    aliases: ['Dubayy', 'DXB'],
    areaCodes: ['04'],
  },
  {
    id: 'sharjah',
    iso: 'AE-SH',
    nameEn: 'Sharjah',
    nameAr: 'الشارقة',
    aliases: ['Ash Shāriqah', 'Ash Shariqah', 'Al Sharjah', 'SHJ'],
    areaCodes: ['06'],
  },
  {
    id: 'ajman',
    iso: 'AE-AJ',
    nameEn: 'Ajman',
    nameAr: 'عجمان',
    aliases: ['‘Ajmān', 'AJM'],
    areaCodes: ['06'],
  },
  {
    id: 'umm-al-quwain',
    iso: 'AE-UQ',
    nameEn: 'Umm Al Quwain',
    nameAr: 'أم القيوين',
    aliases: ['Umm al Qaywayn', 'Umm Al Qaiwain', 'UAQ'],
    areaCodes: ['06'],
  },
  {
    id: 'ras-al-khaimah',
    iso: 'AE-RK',
    nameEn: 'Ras Al Khaimah',
    nameAr: 'رأس الخيمة',
    aliases: ['Ra’s al Khaymah', 'Ras al Khaymah', 'RAK'],
    areaCodes: ['07'],
  },
  {
    id: 'fujairah',
    iso: 'AE-FU',
    nameEn: 'Fujairah',
    nameAr: 'الفجيرة',
    aliases: ['Al Fujayrah', 'Al Fujairah', 'FUJ'],
    areaCodes: ['09'],
  },
]);

/** Reduces a name to a lookup key: no accents, case, spaces, or punctuation. */
function key(value: string): string {
  const arabic = normalizeArabic(value, { normalizeTaaMarbuta: true, normalizeAlefMaqsura: true });
  return (
    arabic
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .toLowerCase()
      // "اماره" is "إمارة" after Arabic normalization.
      .replace(/^(?:emirate of |imarat |اماره ?)/u, '')
      .replace(/[\s\-'’‘.]/g, '')
  );
}

const INDEX: ReadonlyMap<string, EmirateInfo> = new Map(
  EMIRATES.flatMap((emirate) =>
    [
      emirate.id,
      emirate.iso,
      emirate.iso.slice(3),
      emirate.nameEn,
      emirate.nameAr,
      ...emirate.aliases,
    ].map((name) => [key(name), emirate] as const),
  ),
);

/**
 * Looks up an emirate by identifier, ISO code (with or without `AE-`), English or Arabic
 * name, ISO romanization, or common abbreviation. Matching ignores case, accents, spaces,
 * hyphens, Arabic diacritics and letter variants, and an "Emirate of" / "إمارة" prefix.
 *
 * @param input - Name or code to look up. Non-string input returns `null` without throwing.
 * @returns The {@link EmirateInfo}, or `null` if nothing matches.
 *
 * @example
 * ```ts
 * findEmirate('Abu Dhabi')?.id; // 'abu-dhabi'
 * findEmirate('AE-SH')?.nameEn; // 'Sharjah'
 * findEmirate('رأس الخيمة')?.iso; // 'AE-RK'
 * findEmirate('Emirate of Ajman')?.id; // 'ajman'
 * findEmirate('Al Ain'); // null
 * ```
 */
export function findEmirate(input: unknown): EmirateInfo | null {
  if (typeof input !== 'string' || input.length > MAX_INPUT_LENGTH) return null;
  const k = key(input);
  return k ? (INDEX.get(k) ?? null) : null;
}

/**
 * Returns the emirate's stable identifier.
 *
 * @param input - Name or code; see {@link findEmirate}.
 * @returns The {@link EmirateId}, or `null` if nothing matches.
 *
 * @example
 * ```ts
 * normalizeEmirate('DXB'); // 'dubai'
 * normalizeEmirate('umm al qaiwain'); // 'umm-al-quwain'
 * ```
 */
export function normalizeEmirate(input: unknown): EmirateId | null {
  return findEmirate(input)?.id ?? null;
}

/**
 * Checks whether the input names one of the seven emirates.
 *
 * @param input - Name or code; see {@link findEmirate}.
 * @returns `true` if {@link findEmirate} finds a match.
 *
 * @example
 * ```ts
 * isValidEmirate('Fujairah'); // true
 * isValidEmirate('Muscat'); // false
 * ```
 */
export function isValidEmirate(input: unknown): boolean {
  return findEmirate(input) !== null;
}

/**
 * Validates an emirate name or code and explains why it failed.
 *
 * @param input - Name or code; see {@link findEmirate}.
 * @returns `{ isValid: true, data }` with {@link EmirateInfo}, or a failure with `EMIRATE_REQUIRED` or `EMIRATE_UNKNOWN`.
 *
 * @example
 * ```ts
 * validateEmirate('RAK').data?.nameEn; // 'Ras Al Khaimah'
 * validateEmirate('').code; // 'EMIRATE_REQUIRED'
 * validateEmirate('Al Ain').code; // 'EMIRATE_UNKNOWN'
 * ```
 */
export function validateEmirate(input: unknown): ValidationResult<EmirateInfo> {
  const emirate = findEmirate(input);
  if (emirate) return createSuccess(emirate);
  if (typeof input !== 'string' || input.trim() === '') {
    return createFailure('Emirate is required.', 'EMIRATE_REQUIRED');
  }
  return createFailure('Emirate is not one of the seven UAE emirates.', 'EMIRATE_UNKNOWN');
}

/**
 * Returns the emirates served by a landline area code.
 *
 * @param areaCode - Area code with or without the trunk `0`, for example `'06'` or `'6'`.
 * @returns The matching emirates; empty if the code is unknown.
 *
 * @example
 * ```ts
 * getEmiratesByAreaCode('06').map((e) => e.id); // ['sharjah', 'ajman', 'umm-al-quwain']
 * getEmiratesByAreaCode('3').map((e) => e.id); // ['abu-dhabi']
 * ```
 */
export function getEmiratesByAreaCode(areaCode: unknown): EmirateInfo[] {
  if (typeof areaCode !== 'string' || !/^0?[0-9]$/.test(areaCode.trim())) return [];
  const code = areaCode.trim().padStart(2, '0');
  return EMIRATES.filter((emirate) => emirate.areaCodes.includes(code));
}
