# Security Policy

## Supported versions

| Version | Supported |
| ------- | --------- |
| 0.1.x   | Yes       |

Before 1.0.0, only the latest minor version receives fixes.

## Reporting a vulnerability

Please do not open a public issue for security problems.

Report privately through GitHub:
[Report a vulnerability](https://github.com/mmsalmanfaris/uae-validations/security/advisories/new).
If you cannot use GitHub, email mmsalmanfaris@outlook.com with "uae-validations security" in the subject.

Include:

- the affected version and function (for example, `validateUaeIban` in 0.1.0)
- the input that triggers the problem and the result you observed, using made-up values
- the impact you expect in a consuming application, if known

You can expect an acknowledgement within 3 working days and an assessment within
10 working days. Fixes are released as a patch version and disclosed in a GitHub
security advisory; reporters are credited unless they ask not to be.

## Scope

In scope: validator or parser results that accept input they should reject (or the
reverse) in a way that bypasses a check, exceptions or excessive CPU or memory use
triggered by input, and prototype or shared-state tampering through the public API.

Out of scope: this library checks format only. It does not confirm that an Emirates ID,
phone number, IBAN, TRN, Makani number, or plate exists or belongs to a person, so a
well-formed but fictitious value passing validation is not a vulnerability. Advisories in
development-only dependencies that do not affect the published package are also out of scope.
