# uae-validations

[![CI](https://github.com/mmsalmanfaris/uae-validations/actions/workflows/ci.yml/badge.svg)](https://github.com/mmsalmanfaris/uae-validations/actions/workflows/ci.yml)
[![API docs](https://img.shields.io/badge/docs-API%20reference-00732f)](https://mmsalmanfaris.github.io/uae-validations/)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**uae-validations** is a zero-dependency TypeScript and JavaScript library for validating,
parsing, and formatting UAE data: Emirates ID numbers, UAE mobile and landline numbers, UAE
IBANs, TRN and TIN tax numbers, SWIFT/BIC codes, passport and ID-card MRZ, emirate names, Makani
numbers, Dubai vehicle plates, AED amounts, VAT, and Arabic names. Every rule cites an official
source, such as ICP, TDRA, CBUAE, the FTA, RTA, Dubai Municipality, or ICAO.

- TypeScript declarations, ESM and CommonJS, tree-shakeable subpath imports (0.6 to 2.1 kB each, minified and brotli-compressed)
- Validators take `unknown` and never throw, so they are safe on raw form and API input
- Arabic-Indic digits (`٠١٢٣`) and right-to-left marks are normalized automatically
- Works in Node.js 20+, browsers, Deno, and Bun

**Documentation:** [API reference](https://mmsalmanfaris.github.io/uae-validations/), generated
from the TSDoc on every export. AI tools can read [llms.txt](https://mmsalmanfaris.github.io/uae-validations/llms.txt)
or the whole documentation in [llms-full.txt](https://mmsalmanfaris.github.io/uae-validations/llms-full.txt).

> **Status: 0.1.0, pre-release.** All modules below are implemented and tested. See the
> [roadmap](#roadmap) for what comes next.

## Install

```bash
npm install uae-validations
```

## Quick start

```ts
import { isValidEmiratesId, formatUaePhone, validateUaeIban } from 'uae-validations';

isValidEmiratesId('784-1990-1234567-6'); // true
formatUaePhone('050 123 4567', 'e164'); // '+971501234567'
validateUaeIban('AE080331234567890123456').code; // 'IBAN_CHECKSUM_MISMATCH'
```

## Which function do I need?

| To validate or convert | Use | Import from |
| --- | --- | --- |
| Emirates ID number | `isValidEmiratesId`, `validateEmiratesId`, `maskEmiratesId` | `uae-validations/emirates-id` |
| UAE mobile or landline number | `isValidUaeMobile`, `validateUaePhone`, `formatUaePhone` | `uae-validations/phone` |
| UAE IBAN | `isValidUaeIban`, `parseUaeIban`, `buildUaeIban` | `uae-validations/iban` |
| TRN or TIN (VAT, Corporate Tax, e-invoicing) | `isValidTrn`, `isValidTin`, `tinFromTrn` | `uae-validations/tax` |
| SWIFT/BIC code | `isValidUaeBic`, `parseBic` | `uae-validations/swift` |
| Passport, ID card, or visa MRZ | `parseMrz`, `validateMrz`, `mrzCheckDigit` | `uae-validations/mrz` |
| Emirate name or ISO 3166-2 code | `normalizeEmirate`, `findEmirate` | `uae-validations/administrative` |
| Makani number (building entrance) | `isValidMakani`, `formatMakani` | `uae-validations/address` |
| Dubai vehicle plate | `isValidDubaiPlate`, `parseDubaiPlate` | `uae-validations/vehicle` |
| AED amount, or AED in words for cheques and invoices | `parseAed`, `formatAed`, `aedToWords` | `uae-validations/currency` |
| VAT at 5%, or whether a business must register | `calculateVat`, `getVatRegistrationRequirement` | `uae-validations/vat` |
| Arabic text and person names | `normalizeArabic`, `validatePersonName`, `areNamesEquivalent` | `uae-validations/arabic` |

Everything is also exported from `uae-validations`.

## Emirates ID

```ts
import {
  isValidEmiratesId,
  parseEmiratesId,
  validateEmiratesId,
  formatEmiratesId,
  maskEmiratesId,
} from 'uae-validations/emirates-id';

isValidEmiratesId('784-1990-1234567-6'); // true
isValidEmiratesId('784 1990 1234567 6'); // true
isValidEmiratesId('٧٨٤١٩٩٠١٢٣٤٥٦٧٦'); // true
isValidEmiratesId('784-1990-1234567'); // false

parseEmiratesId('784199012345676')?.year; // 1990
formatEmiratesId('784199012345676'); // '784-1990-1234567-6'
formatEmiratesId('784199012345676', 'spaced'); // '784 1990 1234567 6'
maskEmiratesId('784199012345676'); // '784-****-****567-6'

validateEmiratesId('785199012345676').code; // 'EMIRATES_ID_INVALID_COUNTRY_CODE'
```

### What is checked

| Rule                                                                   | Source                                                                       |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 15 digits, `784-YYYY-NNNNNNN-C`                                        | ICP National ID briefing; UAE Design System                                  |
| Starts with `784` (ISO 3166-1 numeric code for the UAE)                | ICP National ID briefing                                                     |
| Year field between 1900 and the current year                           | ICP National ID briefing (year of birth); lower bound is this package's choice |
| Separators: none, or hyphens/spaces in the 3-4-7-1 grouping (not mixed) | UAE Design System input pattern                                              |

### Check digit

ICP documents that the last digit is a check digit but does not publish the algorithm. Third-party
sources report that issued IDs pass the Luhn (mod 10) check, and this package does not treat that
as an official rule. Luhn is therefore **opt-in**:

```ts
isValidEmiratesId('784-1990-1234567-0'); // true
isValidEmiratesId('784-1990-1234567-0', { verifyChecksum: true }); // false
parseEmiratesId('784-1990-1234567-0')?.luhnValid; // false
```

### Error codes

`validateEmiratesId` checks the rules in this order and returns the first failure:

| Code                               | Meaning                                         |
| ---------------------------------- | ----------------------------------------------- |
| `EMIRATES_ID_REQUIRED`             | Empty, whitespace, or non-string input          |
| `EMIRATES_ID_INVALID_FORMAT`       | Not 15 digits in an accepted layout             |
| `EMIRATES_ID_INVALID_COUNTRY_CODE` | Does not start with `784`                       |
| `EMIRATES_ID_INVALID_YEAR`         | Year before 1900 or after the reference year    |
| `EMIRATES_ID_CHECKSUM_MISMATCH`    | Fails Luhn (only with `verifyChecksum: true`)   |

A valid result means the number is well-formed. It does not mean the number has been issued or
belongs to the person presenting it.

## Phone

```ts
import {
  isValidUaePhone,
  isValidUaeMobile,
  isValidUaeLandline,
  parseUaePhone,
  validateUaePhone,
  formatUaePhone,
} from 'uae-validations/phone';

isValidUaeMobile('050 123 4567'); // true
isValidUaeMobile('+971 (0) 50 123 4567'); // true
isValidUaeLandline('04 234 5678'); // true
isValidUaePhone('+44 20 7946 0000'); // false

formatUaePhone('0501234567', 'e164'); // '+971501234567'
formatUaePhone('0501234567', 'international'); // '+971 50 123 4567'
formatUaePhone('+97142345678'); // '04 234 5678'
parseUaePhone('06 512 3456')?.area?.emirates; // ['Sharjah', 'Ajman', 'Umm Al Quwain']

validateUaePhone('04 234 5678', { type: 'mobile' }).code; // 'PHONE_TYPE_MISMATCH'
```

Accepted input: national (`050…`, `04…`), `+971`, `00971`, or `971`, an optional `(0)` after the
country code, and spaces, hyphens, dots, or parentheses.

### What is checked

| Rule                                                                                     | Source                                   |
| ---------------------------------------------------------------------------------------- | ---------------------------------------- |
| Mobile: `05Z` + 7 digits                                                                 | TDRA National Numbering Plan v5.3, Annex 1 |
| Mobile codes `050`, `052`, `054`, `055`, `056`, `058` are allocated                      | TDRA presentation to ITU-T, 2019         |
| Landline: `0Y` + 7 digits, Y = 2, 3, 4, 6, 7, 9                                          | TDRA National Numbering Plan v5.3, Annex 1 |
| Landline subscriber number starts with 2–8, and its 2nd and 3rd digits are not both `0` | TDRA National Numbering Plan v5.3, Annex 1 |

To accept every `05Z` code the plan reserves for mobile, including ranges allocated after this
release, pass `{ mobilePrefixes: 'any' }`:

```ts
isValidUaeMobile('0531234567'); // false
isValidUaeMobile('0531234567', { mobilePrefixes: 'any' }); // true
```

Mobile prefixes are **not** mapped to operators. Numbers can be ported between networks, so a
prefix does not tell you the current operator. Toll-free (`800`), fixed-cost (`600`), premium
(`900`), and short codes are not supported yet.

Error codes: `PHONE_REQUIRED`, `PHONE_INVALID_FORMAT`, `PHONE_NOT_UAE`, `PHONE_INVALID_PREFIX`,
`PHONE_UNALLOCATED_MOBILE_PREFIX`, `PHONE_INVALID_SUBSCRIBER_NUMBER`, `PHONE_TYPE_MISMATCH`.

## IBAN

```ts
import { isValidUaeIban, parseUaeIban, buildUaeIban, formatUaeIban, maskUaeIban } from 'uae-validations/iban';

isValidUaeIban('AE07 0331 2345 6789 0123 456'); // true
parseUaeIban('AE070331234567890123456')?.bankCode; // '033'
buildUaeIban('033', '1234567890123456'); // 'AE070331234567890123456'
formatUaeIban('AE070331234567890123456'); // 'AE07 0331 2345 6789 0123 456'
maskUaeIban('AE070331234567890123456'); // 'AE07 033* **** **** ***3 456'
```

Checks `AE`, 23 characters, digits-only bank code and account, and the ISO 7064 MOD 97-10
checksum (CBUAE; ISO 13616). Bank names are **not** bundled: the bank-code tables published by
third parties disagree, and the official CBUAE table could not be verified yet. Error codes:
`IBAN_REQUIRED`, `IBAN_INVALID_FORMAT`, `IBAN_NOT_UAE`, `IBAN_INVALID_LENGTH`, `IBAN_CHECKSUM_MISMATCH`.

## Tax: TRN and TIN

```ts
import { isValidTrn, isValidTin, tinFromTrn, doesTinMatchTrn, maskTrn } from 'uae-validations/tax';

isValidTrn('100-1234-5670-0003'); // true
isValidTin('1001234567'); // true
tinFromTrn('100123456700003'); // '1001234567'
doesTinMatchTrn('1001234567', '100123456700003'); // true
maskTrn('100123456700003'); // '100*********003'
```

The FTA states that the TRN is 15 digits and the TIN is 10 digits, the first 10 of the TRN. The
FTA publishes no check-digit algorithm, so only structure is checked; confirm registration with
the FTA's TRN verification service.

## SWIFT / BIC

```ts
import { isValidBic, isValidUaeBic, parseBic } from 'uae-validations/swift';

isValidUaeBic('ABCDAEADXXX'); // true
isValidUaeBic('DEUTDEFF'); // false
isValidBic('DEUTDEFF'); // true
parseBic('ABCDAEAD')?.bic11; // 'ABCDAEADXXX'
```

ISO 9362 structure: party prefix, country (`AE`), location, optional branch. Also reports head-office
and test BICs.

## MRZ: passports and the back of the Emirates ID

```ts
import { parseMrz, validateMrz, mrzCheckDigit } from 'uae-validations/mrz';

// ICAO Doc 9303 specimen passport, one string with a line break
parseMrz('P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<\nL898902C36UTO7408122F1204159ZE184226B<<<<<10')?.documentNumber; // 'L898902C3'
parseMrz('P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<\nL898902C36UTO7408122F1204159ZE184226B<<<<<10')?.birthDate.iso; // '1974-08-12'
mrzCheckDigit('L898902C3'); // 6
```

Supports every ICAO Doc 9303 layout: TD1 (ID cards), TD2, TD3 (passports), MRV-A and MRV-B
(visas), including long document numbers. Every check digit is verified, and `validateMrz` lists
**each** failing field, which helps tell an OCR misread from a tampered document. For UAE-issued
cards whose first optional field holds a `784…` number, `emiratesId` returns it.

## Emirates

```ts
import { findEmirate, normalizeEmirate, getEmiratesByAreaCode } from 'uae-validations/administrative';

normalizeEmirate('DXB'); // 'dubai'
normalizeEmirate('إمارة أبوظبي'); // 'abu-dhabi'
findEmirate('AE-RK')?.nameEn; // 'Ras Al Khaimah'
findEmirate('Sharjah')?.nameAr; // 'الشارقة'
getEmiratesByAreaCode('06').map((e) => e.id); // ['sharjah', 'ajman', 'umm-al-quwain']
```

The seven emirates with ISO 3166-2 codes, English and Arabic names (u.ae), ISO romanizations, and
common abbreviations. Lookup ignores case, accents, spacing, and Arabic letter variants. Cities
such as Al Ain are not emirates and return `null`.

## Currency: AED

```ts
import { parseAed, formatAed, aedToWords } from 'uae-validations/currency';

parseAed('AED 1,234.50')?.fils; // 123450
parseAed('12.345'); // null
formatAed(1234.5); // 'AED 1,234.50'
aedToWords(1234.5); // 'one thousand two hundred thirty-four dirhams and fifty fils'
aedToWords(1234.5, { language: 'ar' }); // 'ألف ومائتان وأربعة وثلاثون درهماً وخمسون فلساً'
aedToWords(200, { language: 'ar', cheque: true }); // 'فقط مائتا درهم لا غير'
```

Amounts are exact integers of fils; more than two decimal places is an error, never a silent
rounding. Arabic words follow number–noun agreement (درهمان، ثلاثة دراهم، أحد عشر درهماً) and
construct forms (مائتا درهم).

## VAT

```ts
import { calculateVat, getVatRegistrationRequirement } from 'uae-validations/vat';

calculateVat(100)?.gross; // '105.00'
calculateVat(1000, { amountIncludesVat: true })?.vat; // '47.62'
getVatRegistrationRequirement(400000); // 'mandatory'
```

5% standard rate; FTA thresholds of AED 375,000 (mandatory) and AED 187,500 (voluntary). Exact
fils arithmetic, rounding half away from zero, and `net + vat = gross` always holds.

## Arabic text and names

```ts
import { normalizeArabic, areNamesEquivalent, isValidPersonName } from 'uae-validations/arabic';

normalizeArabic('أَحْمَد'); // 'احمد'
areNamesEquivalent('عبد الله', 'عبدالله'); // true
areNamesEquivalent('Mohammed', 'Muhammad'); // false
isValidPersonName('محمد بن راشد'); // true
isValidPersonName('Ahmed محمد'); // false
```

Removes diacritics and tatweel, unifies alef and Persian-keyboard letters, and optionally taa
marbuta, alef maqsura, and hamza. Name matching never transliterates or guesses between spellings.

## Makani numbers

```ts
import { isValidMakani, parseMakani, formatMakani } from 'uae-validations/address';

isValidMakani('30032 95320'); // true
parseMakani('Makani No. 00410 85963')?.makani; // '0041085963'
formatMakani('3003295320'); // '30032 95320'
```

Makani numbers identify building entrances. Dubai Municipality's Makani web-service manual writes
them as 10 digits in two groups of five. Only the structure is checked: whether a number belongs
to a real entrance can only be confirmed through Dubai Municipality's Makani service. The manual
also notes that the same number can exist in more than one emirate, so a Makani number does not
tell you the emirate. Pass Makani numbers as strings, because numbers drop leading zeros.

Abu Dhabi's Onwani system has no single code to validate. An Onwani address is a building
number, street name, city, area, and postal code (DMT).

## Dubai vehicle plates

```ts
import { isValidDubaiPlate, parseDubaiPlate, validateDubaiPlate } from 'uae-validations/vehicle';

isValidDubaiPlate('AA 12345'); // true
parseDubaiPlate('Dubai V 1234')?.code; // 'V'
validateDubaiPlate('ABC 123').code; // 'PLATE_INVALID_CODE'
validateDubaiPlate('A 123456').code; // 'PLATE_INVALID_NUMBER'
```

A Dubai plate is a code of one or two letters (such as `A`, `V`, or `AA`) followed by a number of
one to five digits (RTA). Only the structure is checked, not whether the plate has been issued.
Export, trade, and diplomatic plates are not covered.

### Other emirates and tenancy contracts

These are left out on purpose, because no official format is published:

| Item                                   | What the official source says                                                   |
| -------------------------------------- | ------------------------------------------------------------------------------- |
| Plates outside Dubai                   | Abu Dhabi (DMT) publishes that plates have one to five digits, but not its codes |
| Ejari (Dubai) contract numbers         | Dubai Land Department does not publish a number format                          |
| Tawtheeq (Abu Dhabi) contract numbers  | DMT does not publish a number format                                            |

Third-party guides describe these formats, but they disagree with each other. A validator built
from them could reject real values. Each will be added once an official specification is
available.

## Use with forms and APIs

`isValidX` fits any boolean check, and `validateX` returns a message and a stable error code.

```ts
// Zod
import { z } from 'zod';
import { isValidEmiratesId } from 'uae-validations/emirates-id';
import { isValidUaeMobile } from 'uae-validations/phone';

const KycSchema = z.object({
  emiratesId: z.string().refine((value) => isValidEmiratesId(value), 'Invalid Emirates ID'),
  mobile: z.string().refine((value) => isValidUaeMobile(value), 'Invalid UAE mobile number'),
});
```

```tsx
// React Hook Form: return the library's message on failure
import { validateUaeIban } from 'uae-validations/iban';

<input {...register('iban', { validate: (value) => validateUaeIban(value).error ?? true })} />;
```

```ts
// Express: return the error code so clients can translate it
import { validateUaePhone } from 'uae-validations/phone';

app.post('/contacts', (req, res) => {
  const phone = validateUaePhone(req.body.phone, { type: 'mobile' });
  if (!phone.isValid) return res.status(400).json({ code: phone.code, error: phone.error });
  saveContact({ phone: phone.data.e164 });
  res.sendStatus(201);
});
```

## FAQ

### How do I validate an Emirates ID in JavaScript?

Call `isValidEmiratesId(value)` from `uae-validations/emirates-id`. It accepts 15 digits with or
without hyphens or spaces (`784-1990-1234567-6`), checks the `784` prefix and that the year is
between 1900 and the current year, and returns `false` instead of throwing on bad input. Use
`validateEmiratesId` to get an error code.

### Does the Emirates ID have a check digit?

The last digit is widely reported to be a Luhn check digit, but ICP, the issuing authority, does
not publish the algorithm. This library therefore does not reject Luhn failures by default.
`parseEmiratesId` reports `luhnValid`, and `{ verifyChecksum: true }` enforces it if you choose to.

### What is a valid UAE mobile number?

A UAE mobile number is `05` plus one digit plus seven digits, such as `050 123 4567`, or
`+971 50 123 4567` in international form. TDRA has allocated the codes 050, 052, 054, 055, 056,
and 058, so `isValidUaeMobile` rejects 051, 053, 057, and 059 by default. A prefix does not tell
you the operator, because numbers can be ported.

### Why not just use a regex?

A regex checks shape, not meaning. It accepts an Emirates ID from the year 2099, a mobile number
with an unallocated code such as 053, and an IBAN with a mistyped digit. This library also checks
the IBAN MOD 97-10 checksum, ICAO MRZ check digits, and impossible MRZ dates, and returns a
specific error code for each failure.

### What is the difference between a TRN and a TIN?

The Federal Tax Authority issues a 15-digit Tax Registration Number (TRN) to VAT and Corporate
Tax registrants, and a 10-digit Tax Identification Number (TIN), used for e-invoicing, which is
the first 10 digits of the TRN. `tinFromTrn` extracts it, and `doesTinMatchTrn` compares them.

### Does validation prove a number is real?

No. Validation confirms the format and, where one exists, the checksum. It cannot confirm that an
Emirates ID, phone number, IBAN, TRN, Makani number, or plate is issued or belongs to a person.
Use the issuing authority's own service for that, such as the FTA's TRN verification.

### Does it support Arabic input?

Yes. Arabic-Indic (`٠١٢٣`) and Persian digits are converted, and right-to-left marks are removed,
so `isValidEmiratesId('٧٨٤١٩٩٠١٢٣٤٥٦٧٦')` returns `true`. Emirate lookup accepts Arabic names, and
`aedToWords` writes amounts in Arabic with correct number–noun agreement.

## Data sources

Each module exports its sources as a `*_SOURCES` constant with a `lastReviewed` date. All rules
were last reviewed on 2026-11-06.

| Module | Authority |
| --- | --- |
| `emirates-id` | Federal Authority for Identity, Citizenship, Customs and Port Security (ICP); UAE Design System |
| `phone` | Telecommunications and Digital Government Regulatory Authority (TDRA), National Numbering Plan |
| `iban` | Central Bank of the UAE (CBUAE); ISO 13616 |
| `tax`, `vat` | Federal Tax Authority (FTA) |
| `swift` | ISO 9362 (SWIFT) |
| `mrz` | International Civil Aviation Organization (ICAO), Doc 9303 |
| `administrative` | ISO 3166-2:AE; UAE Government portal (u.ae) |
| `address` | Dubai Municipality (Makani); Abu Dhabi Department of Municipalities and Transport (Onwani) |
| `vehicle` | Roads and Transport Authority (RTA), Dubai |
| `currency` | ISO 4217 |
| `arabic` | Unicode Standard |

Spotted an out-of-date rule? [Report a data correction](https://github.com/mmsalmanfaris/uae-validations/issues/new?template=data_correction.yml)
with a link to the official source.

## The validation contract

Every module follows the same shape as `lanka-validations`:

```ts
isValidX(value, options?): boolean
parseX(value, options?): Info | null
validateX(value, options?): ValidationResult<Info>
formatX(value, style?, options?): string | null
```

`ValidationResult` is a discriminated union. Check `isValid` and TypeScript narrows it to either
`data` or `{ error, errors, code }`.

## Roadmap

Next:

| Module     | Scope                                                                     |
| ---------- | ------------------------------------------------------------------------- |
| `vehicle`  | Plates for other emirates, once their authorities publish the code scheme |
| `property` | Ejari and Tawtheeq contract numbers, once a format is published           |
| `business` | Trade licence authorities, including free zones                           |
| `i18n`     | Arabic messages for every error code                                      |
| `schema`   | Zod, Yup, and React Hook Form adapters                                    |

## Contributing

Contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) for the branch flow
(pull requests target `development`), the data-source policy, and the release process.

- Found a wrong result? [Open a bug report](https://github.com/mmsalmanfaris/uae-validations/issues/new?template=bug_report.yml).
- Need a new UAE format validated? [Request a data source](https://github.com/mmsalmanfaris/uae-validations/issues/new?template=data_source_request.yml) with a link to the official specification.
- A rule or source is out of date? [Report a data correction](https://github.com/mmsalmanfaris/uae-validations/issues/new?template=data_correction.yml).
- Security problem? Report it privately; see [SECURITY.md](SECURITY.md).

## License

MIT © M.M. Salman Faris
