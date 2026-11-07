import { parseAed } from './parser';

/** Options for {@link aedToWords}. */
export interface AedWordsOptions {
  /** `'en'` (default) or `'ar'`. */
  language?: 'en' | 'ar';
  /**
   * Cheque style: English in Title Case ending in "Only"; Arabic wrapped in
   * "فقط … لا غير". Default `false`.
   */
  cheque?: boolean;
}

// ---------- English ----------

const EN_ONES = [
  '',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve',
  'thirteen',
  'fourteen',
  'fifteen',
  'sixteen',
  'seventeen',
  'eighteen',
  'nineteen',
];
const EN_TENS = [
  '',
  '',
  'twenty',
  'thirty',
  'forty',
  'fifty',
  'sixty',
  'seventy',
  'eighty',
  'ninety',
];
const EN_SCALES = ['', 'thousand', 'million', 'billion'];

function enBelow1000(n: number): string {
  const parts: string[] = [];
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  if (hundreds) parts.push(`${EN_ONES[hundreds]} hundred`);
  if (rest >= 20) {
    const unit = rest % 10;
    parts.push(EN_TENS[Math.floor(rest / 10)]! + (unit ? `-${EN_ONES[unit]}` : ''));
  } else if (rest) {
    parts.push(EN_ONES[rest]!);
  }
  return parts.join(' ');
}

function enNumber(n: number): string {
  if (n === 0) return 'zero';
  const parts: string[] = [];
  for (let scale = EN_SCALES.length - 1; scale >= 0; scale--) {
    const group = Math.floor(n / 1000 ** scale) % 1000;
    if (group) parts.push(enBelow1000(group) + (scale ? ` ${EN_SCALES[scale]}` : ''));
  }
  return parts.join(' ');
}

function english(dirhams: number, fils: number, cheque: boolean): string {
  const parts: string[] = [];
  if (dirhams || !fils) parts.push(`${enNumber(dirhams)} ${dirhams === 1 ? 'dirham' : 'dirhams'}`);
  if (fils) parts.push(`${enNumber(fils)} fils`);
  const text = parts.join(' and ');
  if (!cheque) return text;
  return `${text.replace(/(^|[\s-])([a-z])/g, (_, sep: string, ch: string) => sep + ch.toUpperCase())} Only`;
}

// ---------- Arabic ----------

/** Forms of a masculine counted noun: singular, dual, plural (3–10), accusative singular (11–99). */
interface NounForms {
  one: string;
  two: string;
  plural: string;
  accusative: string;
}

const AR_ONES = [
  '',
  'واحد',
  'اثنان',
  'ثلاثة',
  'أربعة',
  'خمسة',
  'ستة',
  'سبعة',
  'ثمانية',
  'تسعة',
  'عشرة',
];
const AR_TENS = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
const AR_HUNDREDS = [
  '',
  'مائة',
  'مائتان',
  'ثلاثمائة',
  'أربعمائة',
  'خمسمائة',
  'ستمائة',
  'سبعمائة',
  'ثمانمائة',
  'تسعمائة',
];
const AR_SCALES: NounForms[] = [
  { one: 'ألف', two: 'ألفان', plural: 'آلاف', accusative: 'ألفاً' },
  { one: 'مليون', two: 'مليونان', plural: 'ملايين', accusative: 'مليوناً' },
  { one: 'مليار', two: 'ملياران', plural: 'مليارات', accusative: 'ملياراً' },
];
const DIRHAM: NounForms = { one: 'درهم', two: 'درهمان', plural: 'دراهم', accusative: 'درهماً' };
const FILS: NounForms = { one: 'فلس', two: 'فلسان', plural: 'فلوس', accusative: 'فلساً' };

function arBelow100(n: number): string {
  if (n <= 10) return AR_ONES[n]!;
  if (n === 11) return 'أحد عشر';
  if (n === 12) return 'اثنا عشر';
  if (n < 20) return `${AR_ONES[n - 10]} عشر`;
  const unit = n % 10;
  const tens = AR_TENS[Math.floor(n / 10)]!;
  return unit ? `${AR_ONES[unit]} و${tens}` : tens;
}

function arBelow1000(n: number): string {
  const hundreds = AR_HUNDREDS[Math.floor(n / 100)]!;
  const rest = n % 100;
  if (!rest) return hundreds;
  return hundreds ? `${hundreds} و${arBelow100(rest)}` : arBelow100(rest);
}

/** Noun form after a number, by its last two digits: 3–10 plural, 11–99 accusative, else singular. */
function nounForm(n: number, noun: NounForms): string {
  const rest = n % 100;
  if (rest >= 3 && rest <= 10) return noun.plural;
  return rest >= 11 ? noun.accusative : noun.one;
}

/**
 * A number below 1,000 with its counted noun. One and two use the noun alone (singular
 * or dual); `withOne` adds "واحد" after the singular, as for "درهم واحد".
 */
function arCounted(n: number, noun: NounForms, withOne: boolean): string {
  if (n === 1) return withOne ? `${noun.one} ${AR_ONES[1]}` : noun.one;
  if (n === 2) return noun.two;
  return `${construct(arBelow1000(n))} ${nounForm(n, noun)}`;
}

function arNumberWithNoun(n: number, noun: NounForms): string {
  if (n === 0) return `صفر ${noun.one}`;
  if (n < 1000) return arCounted(n, noun, true);
  const parts: string[] = [];
  for (let scale = AR_SCALES.length; scale >= 1; scale--) {
    const group = Math.floor(n / 1000 ** scale) % 1000;
    if (group) parts.push(arCounted(group, AR_SCALES[scale - 1]!, false));
  }
  const units = n % 1000;
  if (units) parts.push(arBelow1000(units));
  return `${construct(parts.join(' و'))} ${nounForm(n, noun)}`;
}

/** Construct (iḍāfa) forms used when a number word is directly followed by its noun. */
const CONSTRUCT: Readonly<Record<string, string>> = {
  مائتان: 'مائتا',
  ألفان: 'ألفا',
  مليونان: 'مليونا',
  ملياران: 'مليارا',
  ألفاً: 'ألف',
  مليوناً: 'مليون',
  ملياراً: 'مليار',
};

/** Puts the last word of a number in its construct form, e.g. "مائتان" → "مائتا" before "درهم". */
function construct(words: string): string {
  // The last word may carry the conjunction "و" ("and") as a prefix.
  const match = /^(.*?)(و?)([^ و][^ ]*)$/.exec(words)!;
  const [, head, conjunction, last] = match as unknown as [string, string, string, string];
  return head + conjunction + (CONSTRUCT[last] ?? last);
}

function arabic(dirhams: number, fils: number, cheque: boolean): string {
  const parts: string[] = [];
  if (dirhams || !fils) parts.push(arNumberWithNoun(dirhams, DIRHAM));
  if (fils) parts.push(arNumberWithNoun(fils, FILS));
  const text = parts.join(' و');
  return cheque ? `فقط ${text} لا غير` : text;
}

/**
 * Writes an AED amount in words, in English or Arabic, as used on cheques, invoices,
 * and contracts.
 *
 * @param input - Non-negative amount as a number or string; see {@link parseAed}.
 * @param options - Optional `{ language, cheque }`.
 * @returns The amount in words, or `null` if the input is invalid or negative.
 *
 * @example
 * ```ts
 * aedToWords(1234.5); // 'one thousand two hundred thirty-four dirhams and fifty fils'
 * aedToWords('1'); // 'one dirham'
 * aedToWords(0.25); // 'twenty-five fils'
 * aedToWords(250, { cheque: true }); // 'Two Hundred Fifty Dirhams Only'
 * aedToWords(1234.5, { language: 'ar' }); // 'ألف ومائتان وأربعة وثلاثون درهماً وخمسون فلساً'
 * aedToWords(5, { language: 'ar' }); // 'خمسة دراهم'
 * aedToWords(2000, { language: 'ar', cheque: true }); // 'فقط ألفا درهم لا غير'
 * ```
 */
export function aedToWords(input: unknown, options: AedWordsOptions = {}): string | null {
  const parsed = parseAed(input);
  if (!parsed) return null;
  const cheque = options.cheque === true;
  return options.language === 'ar'
    ? arabic(parsed.dirhams, parsed.remainderFils, cheque)
    : english(parsed.dirhams, parsed.remainderFils, cheque);
}
