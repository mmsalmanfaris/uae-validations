# Contributing to uae-validations

Thank you for helping. Bug reports, data-source requests, documentation fixes, and code are all
welcome. This guide explains how work moves from an issue to a release.

- [Code of conduct](#code-of-conduct)
- [Raising an issue](#raising-an-issue)
- [Data sources](#data-sources)
- [Branches](#branches)
- [Development setup](#development-setup)
- [Making a change](#making-a-change)
- [Pull requests](#pull-requests)
- [Commit messages](#commit-messages)
- [Versioning and releases](#versioning-and-releases)
- [Maintainer setup](#maintainer-setup)

## Code of conduct

Everyone taking part follows the [Code of Conduct](CODE_OF_CONDUCT.md).

## Raising an issue

Pick the form that matches your problem on the
[new issue page](https://github.com/mmsalmanfaris/uae-validations/issues/new/choose):

| Form | Use it when |
| --- | --- |
| **Bug report** | A function returns the wrong result or throws |
| **Feature request** | You want a new option or helper in an existing module |
| **Data source request** | You want a new identifier or format validated, such as a trade licence number |
| **Data source correction** | A rule, code list, or source link is wrong or out of date |
| [Security advisory](https://github.com/mmsalmanfaris/uae-validations/security/advisories/new) | Input bypasses a check, or causes a crash or excessive CPU or memory use. Report privately; see [SECURITY.md](SECURITY.md) |
| [Discussions](https://github.com/mmsalmanfaris/uae-validations/discussions) | Questions, and ideas that are not yet a concrete request |

Steps:

1. Search [open and closed issues](https://github.com/mmsalmanfaris/uae-validations/issues?q=is%3Aissue) first.
2. Choose a form and fill in every required field. Data-source forms need an official link.
3. **Never include real personal data.** Use made-up Emirates ID, phone, IBAN, TRN, passport,
   and plate numbers, or examples printed in the official source.
4. A maintainer adds a status label (see below) within a few working days.
5. If you want to implement it, say so in the issue. Wait for `accepted` before starting large
   changes, so the design is agreed first.

Labels:

| Label | Meaning |
| --- | --- |
| `triage` | New; not reviewed yet |
| `needs-source` | Blocked until an official source is found |
| `accepted` | Agreed; a pull request is welcome |
| `good first issue` | Small and well-defined |
| `bug`, `enhancement`, `data-source`, `data-correction` | Issue type, set by the form |
| `breaking` | Needs a major version (or minor before 1.0.0) |
| `wontfix` | Out of scope, or no official source exists |

## Data sources

This library's value is that every rule is traceable. Each module exports its sources as a
`*_SOURCES` constant (for example, `PHONE_SOURCES`) with an authority, title, URL, and
`lastReviewed` date.

### What counts as a source

| Tier | Examples | Can define a rule? |
| --- | --- | --- |
| Official UAE authority | ICP, TDRA, CBUAE, FTA, MOI, RTA, Dubai Municipality, DMT (Abu Dhabi), DLD, u.ae, emirate legislation portals | Yes |
| International standard | ISO (3166, 4217, 9362, 13616), ICAO Doc 9303, Unicode | Yes |
| Official example | A specimen or example printed by the authority itself | Yes, as a test case |
| Secondary | News, Wikipedia, bank or vendor guides, blogs | No. Can point you to an official source |
| Observation | Values seen on real documents or in real data | No. Never put these in issues or tests |

When only secondary sources exist, the rule is not added as an official check. It may be added
as an **opt-in** option that is off by default and documented as unofficial, as with Emirates ID
`verifyChecksum` (ICP does not publish the check-digit algorithm). Otherwise the README lists
the item as unsupported and explains why, as with Ejari and Tawtheeq contract numbers.

### Requesting a new data source

1. Open a **Data source request** with the issuing authority, the official links, and the rule
   quoted from the source.
2. A maintainer checks the source. If it holds, the issue gets `accepted`. If it does not, the
   issue gets `needs-source` and stays open until one is found.
3. The pull request adds the rule, cites the source in the module's `*_SOURCES` with today's
   date as `lastReviewed`, and documents what is and is not checked in the README.

### Updating an existing source

Rules change. Phone prefixes get allocated, thresholds change, and URLs move. Open a **Data source
correction**, or send a pull request directly that updates the rule, the source entry, its
`lastReviewed` date, the tests, and `CHANGELOG.md`.

## Branches

| Branch | Purpose | Merges into |
| --- | --- | --- |
| `main` | Released code only. Every commit here is a published version | — |
| `development` | Integration branch; the default target for pull requests | `release/*` |
| `feat/…`, `fix/…`, `data/…`, `docs/…`, `test/…`, `refactor/…`, `chore/…` | Work branches, created from `development` | `development` |
| `release/x.y.z` | Prepares a release: version bump and changelog | `main`, then back into `development` |
| `hotfix/x.y.z` | Urgent fix for the released version, created from `main` | `main`, then back into `development` |

```
feat/… ─┐
fix/…  ─┼─► development ─► release/x.y.z ─► main ─► tag x.y.z ─► npm
data/… ─┘                                    ▲
                           hotfix/x.y.z ─────┘
```

The **PR policy** workflow enforces this: a pull request into `main` fails unless it comes from
a `release/` or `hotfix/` branch.

## Development setup

Requirements: Node.js 20 or later, npm, and Git.

```bash
# Fork on GitHub, then:
git clone https://github.com/<your-username>/uae-validations.git
cd uae-validations
git remote add upstream https://github.com/mmsalmanfaris/uae-validations.git
npm install
npm run verify
```

| Script | What it does |
| --- | --- |
| `npm test` | Runs the tests once |
| `npm run test:watch` | Runs the tests in watch mode |
| `npm run test:coverage` | Runs the tests with coverage thresholds |
| `npm run typecheck` | Type-checks source and tests |
| `npm run lint` / `npm run format` | ESLint / Prettier |
| `npm run docs` | Builds the API docs; fails if an export has no TSDoc |
| `npm run lint:package` | Builds, then runs publint and arethetypeswrong |
| `npm run size` | Builds, then checks each entry point's size budget |
| `npm run check:package` | Installs the packed tarball in a fresh project and imports every entry point |
| `npm run verify` | All of the above, in the same order as CI |

## Making a change

1. Sync and branch from `development`:

   ```bash
   git switch development
   git pull upstream development
   git switch -c feat/sharjah-plates
   ```

2. Follow the rules in [AGENTS.md](AGENTS.md). The main ones:
   - No runtime dependencies.
   - Validators take `unknown` and never throw. Add every new public function to
     `tests/properties.test.ts`, which checks this with random input.
   - Every export has a TSDoc comment. `call(); // result` lines in TSDoc and the README are run
     as tests, so they must show the real result.
   - Each module follows the contract `isValidX`, `parseX`, `validateX`, and `formatX`, and
     `validateX` returns stable error codes such as `PLATE_INVALID_CODE`.
   - Do not claim a phone prefix identifies an operator (number portability), and do not assume
     one format covers documents issued by different authorities.

3. A new module also needs entries in `src/index.ts`, `tsup.config.ts`, `typedoc.json`,
   `.size-limit.json`, the `exports` and `typesVersions` fields in `package.json`, and
   `scripts/check-package.mjs`.

4. Add a line to `CHANGELOG.md` under the Unreleased version for any behaviour change.

5. Run `npm run verify`.

## Pull requests

1. Push your branch to your fork and open a pull request **into `development`**.
2. Give it a title in commit-message form, such as `feat: ✨ add Sharjah plate validation`. Pull
   requests are squash-merged, so the title becomes the commit on `development`. CI checks the
   format.
3. Fill in the template, including the official sources table for any rule change.
4. CI must pass: static checks, tests on Node 20, 22, and 24, coverage, package lint, size, and
   PR policy.
5. A maintainer (see `.github/CODEOWNERS`) reviews. Push follow-up commits to the same branch;
   they are squashed on merge.

## Commit messages

Commits follow [Conventional Commits](https://www.conventionalcommits.org/) with exactly one
[gitmoji](https://gitmoji.dev/) after the type:

```
<type>: <emoji> <description>

<optional body: what changed and why>
```

| Type | Emoji | Use for |
| --- | --- | --- |
| `feat` | ✨ | A new validator, option, or public API |
| `fix` | 🐛 | A bug fix |
| `fix` | 🔒️ | A security fix |
| `fix` | 🗃️ | A data or rule correction from an official source |
| `perf` | ⚡️ | A performance improvement |
| `refactor` | ♻️ | A change that neither fixes a bug nor adds a feature |
| `test` | ✅ | Tests only |
| `docs` | 📝 | Documentation only |
| `style` | 🎨 | Formatting only |
| `build` | 📦️ | Build output, packaging, or dependencies |
| `ci` | 👷 | CI workflows |
| `chore` | 🔧 | Tooling and configuration |
| `chore` | 🔖 | Release commits |
| `revert` | ⏪️ | Reverting an earlier commit |

Mark breaking changes with `!` after the type and a `BREAKING CHANGE:` footer:

```
fix!: 🐛 reject Emirates IDs with mixed separators

BREAKING CHANGE: isValidEmiratesId('784-1990 1234567-6') now returns false.
```

Use emojis only in commit subjects, never in code comments or documentation. These rules apply
to every commit, including commits written by AI coding assistants.

## Versioning and releases

The package follows [Semantic Versioning](https://semver.org/). The version is managed by hand in
`package.json` and `CHANGELOG.md` ([Keep a Changelog](https://keepachangelog.com/en/1.1.0/)), and
publishing is automated from Git tags.

| Change | Before 1.0.0 | From 1.0.0 |
| --- | --- | --- |
| Breaking: a valid value now fails, a function or error code is renamed or removed | minor (`0.2.0`) | major |
| New module, function, or option; newly accepted values from an official source | minor | minor |
| Bug fix, source link update, or documentation | patch | patch |

A rule correction that makes previously accepted values fail is a breaking change, even when it
follows a new official source.

### Release steps (maintainers)

1. Branch from `development`:

   ```bash
   git switch development && git pull
   git switch -c release/0.2.0
   npm version 0.2.0 --no-git-tag-version
   ```

2. In `CHANGELOG.md`, rename the Unreleased heading to `## [0.2.0] - YYYY-MM-DD` and add a new
   empty `## [Unreleased]` section above it.
3. Commit with `chore: 🔖 release 0.2.0`, push, and open a pull request into `main`.
4. When CI passes, merge it with a **merge commit** (not squash), so `main` and `development`
   share history.
5. Tag the merge commit and push the tag. The tag must equal the `package.json` version, with no
   `v` prefix:

   ```bash
   git switch main && git pull
   git tag -a 0.2.0 -m "0.2.0"
   git push origin 0.2.0
   ```

   The **Release** workflow checks the tag against `package.json`, runs `prepublishOnly`, and
   publishes to npm with provenance. Pre-release tags such as `0.2.0-beta.1` publish under the
   `next` dist-tag.

6. Create a GitHub release from the tag, using the changelog section as the notes.
7. Merge `main` back into `development` (open a pull request from `main` into `development`).

A hotfix follows the same steps, but branches from `main` as `hotfix/0.2.1` and bumps the patch
version.

## Maintainer setup

One-time repository settings, applied by `scripts/setup-github.sh` with the GitHub CLI:

- Create the `development` branch and make it the default branch.
- Create the issue labels listed above.
- Protect `main` and `development`: require a pull request, an approving review, and passing CI;
  block force pushes and deletion.
- Allow squash merges (for `development`) and merge commits (for releases), with squash commits
  using the pull request title.
- Enable Discussions, private vulnerability reporting, and Dependabot security updates.
- For publishing: add an `npm` environment and configure npm Trusted Publishing for
  `.github/workflows/release.yml`.

## Questions

Ask in [Discussions](https://github.com/mmsalmanfaris/uae-validations/discussions), or contact
the maintainer, M.M. Salman Faris ([@mmsalmanfaris](https://github.com/mmsalmanfaris),
[mmsalmanfaris@outlook.com](mailto:mmsalmanfaris@outlook.com)).
