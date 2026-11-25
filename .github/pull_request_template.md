<!--
Title: use a commit subject, for example "feat: ✨ add Makani validation". It becomes the
squash-merge commit, and CI checks it. See Commit messages in CONTRIBUTING.md.
Target: development. Only release/ and hotfix/ branches target main.
-->

## What and why

<!-- What does this change, and which issue does it close? -->

Closes #

## Type of change

- [ ] Bug fix (no API change)
- [ ] New validator, option, or helper
- [ ] Rule or data change backed by an official source
- [ ] Breaking change (title uses `type!:` and the description explains the migration)
- [ ] Documentation, tests, or tooling only

## Official sources

<!--
Required for any rule or data change. List each source with its authority and the date you
checked it, and update the module's *_SOURCES constant (lastReviewed). Delete this section
if the PR does not change a rule.
-->

| Rule | Authority | Link | Checked on |
| ---- | --------- | ---- | ---------- |
|      |           |      |            |

## Checklist

- [ ] Targets the `development` branch
- [ ] `npm run verify` passes locally
- [ ] Tests cover valid input and edge-case invalid input; new public functions are added to `tests/properties.test.ts`
- [ ] Every new export has a TSDoc comment, and every `call(); // result` example shows the real result
- [ ] Behaviour changes are listed in `CHANGELOG.md` under Unreleased
- [ ] No real Emirates ID, phone, IBAN, TRN, passport, or plate numbers in tests, examples, or this PR
