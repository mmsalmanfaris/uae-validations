import { describe, expect, it } from 'vitest';
import {
  ADMINISTRATIVE_SOURCES,
  EMIRATES,
  findEmirate,
  getEmiratesByAreaCode,
  isValidEmirate,
  normalizeEmirate,
  validateEmirate,
} from '../src/administrative';
import {
  ARABIC_SOURCES,
  areNamesEquivalent,
  containsArabic,
  isValidPersonName,
  normalizeArabic,
  validatePersonName,
} from '../src/arabic';
import { UAE_AREA_CODES } from '../src/phone';

describe('EMIRATES', () => {
  it('lists the seven emirates with ISO 3166-2 codes', () => {
    expect(EMIRATES.map((e) => e.iso)).toEqual([
      'AE-AZ',
      'AE-DU',
      'AE-SH',
      'AE-AJ',
      'AE-UQ',
      'AE-RK',
      'AE-FU',
    ]);
    expect(Object.isFrozen(EMIRATES[0])).toBe(true);
  });

  it('agrees with the phone module on area codes', () => {
    for (const area of UAE_AREA_CODES) {
      expect(getEmiratesByAreaCode(area.code).map((e) => e.nameEn)).toEqual(area.emirates);
    }
  });

  it('cites official sources', () => {
    expect(ADMINISTRATIVE_SOURCES.map((s) => s.url).join(' ')).toContain('u.ae');
  });
});

describe('findEmirate', () => {
  it.each([
    ['abu-dhabi', 'abu-dhabi'],
    ['Abu Dhabi', 'abu-dhabi'],
    ['ABU DHABI', 'abu-dhabi'],
    ['abudhabi', 'abu-dhabi'],
    ['Abū Z̧aby', 'abu-dhabi'],
    ['AE-AZ', 'abu-dhabi'],
    ['az', 'abu-dhabi'],
    ['AUH', 'abu-dhabi'],
    ['أبوظبي', 'abu-dhabi'],
    ['أبو ظبي', 'abu-dhabi'],
    ['ابوظبي', 'abu-dhabi'],
    ['إمارة أبوظبي', 'abu-dhabi'],
    ['Emirate of Dubai', 'dubai'],
    ['Dubayy', 'dubai'],
    ['دبي', 'dubai'],
    ['Ash Shariqah', 'sharjah'],
    ['الشارقة', 'sharjah'],
    ['الشارقه', 'sharjah'],
    ["'Ajman", 'ajman'],
    ['عجمان', 'ajman'],
    ['Umm Al-Quwain', 'umm-al-quwain'],
    ['UAQ', 'umm-al-quwain'],
    ['أم القيوين', 'umm-al-quwain'],
    ["Ra's al Khaymah", 'ras-al-khaimah'],
    ['Ras Al-Khaimah', 'ras-al-khaimah'],
    ['رأس الخيمة', 'ras-al-khaimah'],
    ['Al Fujairah', 'fujairah'],
    ['الفجيرة', 'fujairah'],
  ])('finds %j', (input, id) => {
    expect(findEmirate(input)?.id).toBe(id);
    expect(normalizeEmirate(input)).toBe(id);
    expect(isValidEmirate(input)).toBe(true);
  });

  it.each(['Al Ain', 'Muscat', 'Khor Fakkan', '', '  ', 'AE', null, 7, 'x'.repeat(2000)])(
    'does not match %j',
    (input) => {
      expect(findEmirate(input)).toBeNull();
      expect(normalizeEmirate(input)).toBeNull();
    },
  );

  it('validates with error codes', () => {
    expect(validateEmirate('Dubai').isValid).toBe(true);
    expect(validateEmirate(undefined).code).toBe('EMIRATE_REQUIRED');
    expect(validateEmirate(' ').code).toBe('EMIRATE_REQUIRED');
    expect(validateEmirate('Doha').code).toBe('EMIRATE_UNKNOWN');
  });

  it('maps area codes', () => {
    expect(getEmiratesByAreaCode('04').map((e) => e.id)).toEqual(['dubai']);
    expect(getEmiratesByAreaCode(' 9 ').map((e) => e.id)).toEqual(['fujairah']);
    expect(getEmiratesByAreaCode('05')).toEqual([]);
    expect(getEmiratesByAreaCode('004')).toEqual([]);
    expect(getEmiratesByAreaCode(4)).toEqual([]);
  });
});

describe('normalizeArabic', () => {
  it('applies default normalizations', () => {
    expect(normalizeArabic('أَحْمَد')).toBe('احمد');
    expect(normalizeArabic('إبراهيم')).toBe('ابراهيم');
    expect(normalizeArabic('ٱلله')).toBe('الله');
    expect(normalizeArabic('علـــي')).toBe('علي');
    expect(normalizeArabic('کریم')).toBe('كريم');
    expect(normalizeArabic('  \u200Fمحمد   علي  ')).toBe('محمد علي');
    expect(normalizeArabic('رقم ٤٥')).toBe('رقم 45');
  });

  it('applies optional normalizations', () => {
    expect(normalizeArabic('فاطمة', { normalizeTaaMarbuta: true })).toBe('فاطمه');
    expect(normalizeArabic('مصطفى', { normalizeAlefMaqsura: true })).toBe('مصطفي');
    expect(normalizeArabic('مؤمن هيئة', { normalizeHamza: true })).toBe('مومن هيية');
  });

  it('can turn each default off', () => {
    const off = {
      removeDiacritics: false,
      removeTatweel: false,
      normalizeAlef: false,
      normalizePersianLetters: false,
      asciiDigits: false,
    };
    expect(normalizeArabic('أَحْمَـد ک ٤', off)).toBe('أَحْمَـد ک ٤');
  });

  it('returns an empty string for non-strings and oversized input', () => {
    expect(normalizeArabic(null)).toBe('');
    expect(normalizeArabic('ا'.repeat(2000))).toBe('');
  });
});

describe('containsArabic', () => {
  it('detects Arabic letters only', () => {
    expect(containsArabic('Dubai دبي')).toBe(true);
    expect(containsArabic('٤٥')).toBe(false);
    expect(containsArabic('Dubai')).toBe(false);
    expect(containsArabic(5)).toBe(false);
  });
});

describe('validatePersonName', () => {
  it.each([
    'محمد',
    'مُحَمَّد بن راشد',
    'عبد الله',
    'Ahmed',
    'Mary-Jane',
    "O'Neil",
    'O’Neil',
    'J. R. Smith',
    'José Álvarez',
    'Zoë',
  ])('accepts %j', (name) => {
    expect(isValidPersonName(name)).toBe(true);
  });

  it.each([
    ['', 'NAME_REQUIRED'],
    [null, 'NAME_REQUIRED'],
    ['A', 'NAME_TOO_SHORT'],
    ['م', 'NAME_TOO_SHORT'],
    ['R2D2', 'NAME_INVALID_CHARACTERS'],
    ['Ahmed  -- Ali', 'NAME_INVALID_CHARACTERS'],
    ['-Ahmed', 'NAME_INVALID_CHARACTERS'],
    ['Ahmed@', 'NAME_INVALID_CHARACTERS'],
    ['Иван', 'NAME_INVALID_CHARACTERS'],
    ['Ahmed محمد', 'NAME_MIXED_SCRIPTS'],
  ])('rejects %j with %s', (name, code) => {
    expect(validatePersonName(name).code).toBe(code);
  });

  it('enforces script and length options', () => {
    expect(validatePersonName('محمد', { script: 'arabic' }).isValid).toBe(true);
    expect(validatePersonName('Ahmed', { script: 'arabic' }).code).toBe('NAME_INVALID_CHARACTERS');
    expect(validatePersonName('محمد', { script: 'latin' }).code).toBe('NAME_INVALID_CHARACTERS');
    expect(validatePersonName('Ahmed محمد', { script: 'latin' }).code).toBe(
      'NAME_INVALID_CHARACTERS',
    );
    expect(validatePersonName('Al', { minLength: 3 }).code).toBe('NAME_TOO_SHORT');
    expect(validatePersonName('Ahmed Ali', { maxLength: 5 }).code).toBe('NAME_TOO_LONG');
  });

  it('returns the cleaned name', () => {
    expect(validatePersonName('  Ahmed   Ali ').data).toBe('Ahmed Ali');
  });
});

describe('areNamesEquivalent', () => {
  it('matches spelling variants that normalize together', () => {
    expect(areNamesEquivalent('عبد الله', 'عبدالله')).toBe(true);
    expect(areNamesEquivalent('إبراهيم', 'ابراهيم')).toBe(true);
    expect(areNamesEquivalent('فاطمة', 'فاطمه')).toBe(true);
    expect(areNamesEquivalent('مصطفى', 'مصطفي')).toBe(true);
    expect(areNamesEquivalent('مُحَمَّد', 'محمد')).toBe(true);
    expect(areNamesEquivalent('José', 'jose')).toBe(true);
    expect(areNamesEquivalent('Mary-Jane', 'mary jane')).toBe(true);
  });

  it('does not transliterate or guess', () => {
    expect(areNamesEquivalent('Mohammed', 'Muhammad')).toBe(false);
    expect(areNamesEquivalent('محمد', 'Mohammed')).toBe(false);
    expect(areNamesEquivalent('', '')).toBe(false);
    expect(areNamesEquivalent('a', null)).toBe(false);
    expect(areNamesEquivalent('a'.repeat(2000), 'a'.repeat(2000))).toBe(false);
  });

  it('cites Unicode', () => {
    expect(ARABIC_SOURCES[0]?.authority).toBe('Unicode Consortium');
  });
});
