# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `uae-validations/i18n`: English and Arabic messages for every error code, with
  `translateValidationCode`, `localizeValidationResult`, `VALIDATION_MESSAGES`, and the
  `UaeValidationCode` type. The message table is typed by every module's error codes, so a
  missing translation fails type checking.
- `uae-validations/phone`: non-geographic numbers from the TDRA National Numbering Plan
  v5.3, Annex 1: toll-free `800` (5 to 12 digits), free-access `400`, fixed-cost `600`,
  shared-cost `700`, and premium-rate `900`, with `parseUaeServiceNumber`,
  `isValidUaeServiceNumber`, `isValidUaeTollFree`, `validateUaeServiceNumber`,
  `formatUaeServiceNumber`, and `UAE_SERVICE_RANGES`. Ranges the plan reserves fail with
  `SERVICE_NUMBER_RESERVED_RANGE`. `validateUaePhone` is unchanged.
- `uae-validations/currency`: the Dirham sign U+20C3 (`UAE_DIRHAM_SIGN`, Unicode 18.0).
  `formatAed(value, { display: 'symbol' })` places it to the left of the amount, as the CBUAE
  guidelines require, and `parseAed` accepts it. `CURRENCY_SOURCES` cites the CBUAE
  guidelines and the Unicode data file.
- `parseMrz` and `validateMrz` accept `{ allowSexX: true }` for documents that print `X` in the
  sex field.

### Changed

- MRZ: the sex field now accepts only `M`, `F`, and `<` by default, as ICAO Doc 9303 specifies.
  `X` belongs to the visual zone.
- Dubai plates: a two-letter code must be a doubled letter (`AA`, `BB`, `CC`), the only dual
  codes RTA has published. Mixed pairs such as `AB` fail with `PLATE_INVALID_CODE`.

### Fixed

- Docs no longer state that the Emirates ID year field is the holder's year of birth. ICP's
  briefing labels it so, but EIDA has said it does not necessarily match.
- Docs say that `doesTinMatchTrn` applies only to an entity's own TRN (group members keep their
  own TIN), that `XXX` head-office and test BICs are SWIFT conventions rather than ISO 9362
  rules, and how VAT registration applies to non-residents.
- Sources: added the TDRA 2021 mobile-prefix press release, the Ministry of Finance e-invoicing
  field requirements, the VAT Decree-Law and Executive Regulation PDFs, and the Unicode 18.0
  release announcement; updated moved URLs.
- README: added an independent-project notice, a Privacy section, and a Limitations and
  disclaimer section.

## [0.1.0] - 2026-11-07

### Added

- Project scaffold: TypeScript, tsup (ESM + CommonJS), Vitest, ESLint, Prettier, TypeDoc, CI.
- Core: `ValidationResult` types, `cleanString`, `removeSeparators`, `toAsciiDigits`
  (Arabic-Indic and Eastern Arabic digits), `luhnCheck`, `luhnCheckDigit`,
  `createSuccess`, and `createFailure`.
- `uae-validations/emirates-id`: `isValidEmiratesId`, `parseEmiratesId`,
  `validateEmiratesId`, `formatEmiratesId`, `maskEmiratesId`, and `EMIRATES_ID_SOURCES`.
  Luhn verification is opt-in (`verifyChecksum`) because ICP does not publish the
  check-digit algorithm.
- `uae-validations/phone`: `isValidUaePhone`, `isValidUaeMobile`, `isValidUaeLandline`,
  `parseUaePhone`, `validateUaePhone`, `formatUaePhone`, `UAE_MOBILE_PREFIXES`,
  `UAE_AREA_CODES`, and `PHONE_SOURCES`, following the TDRA National Numbering Plan.
  Mobile prefixes are not mapped to operators (number portability).
- `uae-validations/iban`: `isValidUaeIban`, `parseUaeIban`, `validateUaeIban`, `formatUaeIban`,
  `maskUaeIban`, `buildUaeIban`. Bank names are not bundled until the CBUAE code table is verified.
- `uae-validations/tax`: TRN and TIN validation, `tinFromTrn`, `doesTinMatchTrn`, `maskTrn`.
- `uae-validations/swift`: ISO 9362 BIC parsing, `isValidBic`, `isValidUaeBic`, `validateUaeBic`.
- `uae-validations/mrz`: ICAO 9303 MRZ parsing for TD1, TD2, TD3, MRV-A, and MRV-B, with every
  check digit verified and the Emirates ID number extracted from UAE cards.
- `uae-validations/administrative`: the seven emirates with ISO 3166-2 codes, English and Arabic
  names, aliases, and area codes; `findEmirate`, `normalizeEmirate`, `getEmiratesByAreaCode`.
- `uae-validations/currency`: exact AED parsing and formatting, and amounts in English and Arabic
  words (`aedToWords`).
- `uae-validations/vat`: 5% standard rate, FTA registration thresholds, `calculateVat`, and
  `getVatRegistrationRequirement`.
- `uae-validations/arabic`: `normalizeArabic`, `containsArabic`, `validatePersonName`, and
  `areNamesEquivalent`.
- `uae-validations/address`: Makani numbers (`isValidMakani`, `parseMakani`, `validateMakani`,
  `formatMakani`), checked for structure as documented by Dubai Municipality.
- `uae-validations/vehicle`: Dubai plates (`isValidDubaiPlate`, `parseDubaiPlate`,
  `validateDubaiPlate`, `formatDubaiPlate`), following RTA. Other emirates' plates and Ejari and
  Tawtheeq contract numbers are not included, because no official format is published.
