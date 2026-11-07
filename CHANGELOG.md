# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
