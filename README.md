# uae-validations

Zero-runtime-dependency TypeScript and JavaScript validation utilities and reference data for the UAE. The package ships ESM, CommonJS, and strict TypeScript declarations, with tree-shakeable subpath exports.

> Validation confirms a documented structure and checksum where one exists. It does not prove that an identifier was issued, belongs to a person, or is currently active.

## Install

```sh
npm install uae-validations
```

## Usage

```ts
import {
  formatEmiratesId,
  formatUaePhone,
  isValidEmiratesId,
  isValidUaeIban,
  isValidTrn,
  parseUaeIban
} from 'uae-validations';

isValidEmiratesId('784-1990-1234567-0'); // true (structure only)
formatEmiratesId('784199012345670');     // 784-1990-1234567-0
formatUaePhone('0501234567', 'e164');     // +971501234567
isValidUaeIban('AE070331234567890123456'); // true
parseUaeIban('AE070331234567890123456')?.bankCode; // 033
isValidTrn('123456789012345'); // true (structure only)
```

Every validator accepts `unknown` and returns `false` rather than throwing for ordinary invalid input. Detailed validators return:

```ts
type ValidationResult =
  | { valid: true; normalized: string }
  | { valid: false; errors: readonly ValidationError[] };
```

## Modules

| Module | Highlights |
| --- | --- |
| `emirates-id` | Structural validation, parsing, display formatting, masking |
| `phone` | Mobile and landline validation, national/E.164 formatting |
| `iban` | UAE format and MOD-97 validation, bank-code extraction |
| `tax` | TRN/TIN structure and first-ten-digit relationship |
| `administrative` | Seven emirates, English/Arabic names, aliases, landline areas |
| `address` | Address objects, structural PO Box validation, postal formatting |
| `currency` | AED/fils parsing, locale formatting, English amount-to-words |
| `privacy` | One import point for Emirates ID, phone, IBAN, and TRN masking |
| `schema` | Composable object and cross-field validation |
| `i18n` | English and Arabic validation messages |
| `dates` | Strict Gregorian dates, age checks, UAE-locale display |
| `metadata` | Machine-readable rule sources and review dates |

Every module is available as a subpath, for example:

```ts
import { getEmirate } from 'uae-validations/administrative';
import { formatAed } from 'uae-validations/currency';
import { validateSchema } from 'uae-validations/schema';

getEmirate('RAK')?.nameAr; // رأس الخيمة
formatAed('1234.50');      // AED 1,234.50 (exact glyph placement is runtime-dependent)
```

## Validation boundaries

- **Emirates ID:** 15 digits in `784-YYYY-NNNNNNN-C` structure. The last digit is exposed as the card's check-digit field, but no checksum algorithm is applied because the reviewed official sources do not define one.
- **Mobile:** accepts national and `+971`/`00971` forms for the TDRA-documented `050`, `052`, `054`, `055`, `056`, and `058` prefixes. Prefixes do not identify the current operator because numbers are portable.
- **Landline:** accepts geographic codes `02`, `03`, `04`, `06`, `07`, and `09`, followed by seven subscriber digits.
- **IBAN:** requires `AE`, 23 total characters, a three-digit bank identifier, a 16-digit account field, and a valid ISO 7064 MOD-97-10 checksum.
- **TRN/TIN:** validates only the documented 15- and 10-digit structures. `tinFromTrn` and `doesTinMatchTrn` implement the FTA-documented first-ten-digit relationship.
- **Addresses and PO Boxes:** validates documented address components and numeric PO Box structure; it does not claim that an address or box exists. Emirates Post does not publish one universal PO Box digit length.
- **Dates and age:** utilities use strict Gregorian calendar dates. `isAdult` is a generic 18-year threshold, not a legal conclusion for a particular activity.
- **Currency:** AED input supports no more than two decimal places because one dirham contains 100 fils. Amount-to-words currently produces English text.

## Sources

Rules last reviewed **2026-11-06**:

- [UAE Design System — Emirates ID](https://designsystem.gov.ae/docs/patterns/emirates-id-input)
- [TDRA — National Numbering Plan](https://tdra.gov.ae/-/media/About/regulations-and-ruling/EN/National-Number-Plan-pdf.ashx)
- [TDRA — Number portability](https://tdra.gov.ae/en/consumer-tool-hub/topics/porting-numbers)
- [Central Bank of the UAE — IBAN](https://centralbank.ae/en/our-operations/payments-and-settlements/regulations-and-standards/iban/)
- [Federal Tax Authority — UAE e-invoicing](https://tax.gov.ae/en/content/uae.einvoicing.aspx)
- [Official UAE Portal — The Seven Emirates](https://u.ae/about-the-uae/the-seven-emirates)
- [Emirates Post — UAE addressing standard](https://www.emiratespost.ae/faq)
- [Central Bank Rulebook — Currency unit](https://rulebook.centralbank.ae/en/rulebook/article-52-currency-unit)

## Development

```sh
npm install
npm run check
```

## License

MIT
