export type EmirateId =
  | 'abu-dhabi'
  | 'dubai'
  | 'sharjah'
  | 'ajman'
  | 'umm-al-quwain'
  | 'ras-al-khaimah'
  | 'fujairah';

export interface Emirate {
  readonly id: EmirateId;
  readonly nameEn: string;
  readonly nameAr: string;
  readonly aliases: readonly string[];
  readonly landlineCodes: readonly string[];
}

export const EMIRATES: readonly Emirate[] = Object.freeze([
  { id: 'abu-dhabi', nameEn: 'Abu Dhabi', nameAr: 'أبوظبي', aliases: ['abu dhabi', 'abu-dhabi', 'abudhabi', 'al ain'], landlineCodes: ['02', '03'] },
  { id: 'dubai', nameEn: 'Dubai', nameAr: 'دبي', aliases: ['dubai'], landlineCodes: ['04'] },
  { id: 'sharjah', nameEn: 'Sharjah', nameAr: 'الشارقة', aliases: ['sharjah'], landlineCodes: ['06'] },
  { id: 'ajman', nameEn: 'Ajman', nameAr: 'عجمان', aliases: ['ajman'], landlineCodes: ['06'] },
  { id: 'umm-al-quwain', nameEn: 'Umm Al Quwain', nameAr: 'أم القيوين', aliases: ['umm al quwain', 'umm-al-quwain', 'umm al qaiwain', 'uaq'], landlineCodes: ['06'] },
  { id: 'ras-al-khaimah', nameEn: 'Ras Al Khaimah', nameAr: 'رأس الخيمة', aliases: ['ras al khaimah', 'ras-al-khaimah', 'ras al khaimah', 'rak'], landlineCodes: ['07'] },
  { id: 'fujairah', nameEn: 'Fujairah', nameAr: 'الفجيرة', aliases: ['fujairah', 'fujeirah'], landlineCodes: ['09'] }
]);

const normalized = (value: string): string => value.trim().toLocaleLowerCase('en').replace(/[._]+/g, ' ').replace(/\s+/g, ' ');

export function getEmirate(value: unknown): Emirate | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const query = normalized(value);
  return EMIRATES.find((emirate) =>
    normalized(emirate.id) === query ||
    normalized(emirate.nameEn) === query ||
    emirate.nameAr === value.trim() ||
    emirate.aliases.some((alias) => normalized(alias) === query)
  ) ?? null;
}

export const isValidEmirate = (value: unknown): boolean => getEmirate(value) !== null;

export function getEmiratesByLandlineCode(value: unknown): readonly Emirate[] {
  if (typeof value !== 'string' && typeof value !== 'number') return [];
  const digits = String(value).replace(/\D/g, '');
  const code = digits.startsWith('971') ? `0${digits.slice(3, 4)}` : digits.length === 1 ? `0${digits}` : digits.slice(0, 2);
  return EMIRATES.filter((emirate) => emirate.landlineCodes.includes(code));
}
