# Instructions for AI coding agents

`uae-validations` is a zero-dependency TypeScript library that validates UAE identifiers and data. It is the companion to `lanka-validations` and keeps the same API contract and conventions.

## Commits

Use `<type>: <emoji> <description>`, with exactly one gitmoji after the conventional type, for example `fix: 🐛 reject mixed separators in Emirates ID`. Mark breaking changes with `type!:` and a `BREAKING CHANGE:` footer. Use emojis only in commit subjects, never in docs or code comments.

## Before committing

```bash
npm run typecheck && npm run lint && npm run format:check && npm run docs
npm run test:coverage && npm run lint:package && npm run size
```

## Rules

- No runtime dependencies.
- Validators take `unknown` input and must never throw on it; `tests/properties.test.ts` enforces this. Add every new public function to its list.
- Every exported function, type, and constant needs a TSDoc comment (`npm run docs` fails otherwise).
- Every country-specific rule needs an official UAE source (ICP, TDRA, CBUAE, FTA, u.ae) or international standard (ISO, ICAO, SWIFT) with a last-reviewed date. Do not encode a rule as official when only third-party sources support it; make it opt-in and document why (see Emirates ID `verifyChecksum`).
- Do not claim a phone prefix identifies the current operator (number portability).
- Do not assume passports, driving licences, visa file numbers, or trade licences share one national format.
- Behaviour changes go in `CHANGELOG.md` under the unreleased version.
- TSDoc and README examples are tests (`tests/doc-examples.test.ts`): a `call(); // result` comment must show the real result.
- Never use real Emirates ID, phone, IBAN, or TRN numbers in tests, examples, or issues.
- Do not commit `docs/` (private notes) or generated output (`dist/`, `coverage/`, `api-docs/`).
