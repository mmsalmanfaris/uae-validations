#!/usr/bin/env bash
# One-time GitHub repository setup for maintainers. Safe to re-run.
#
# Requires the GitHub CLI (`gh auth login`) with admin rights on the repository, and the
# `main` branch already pushed.
#
# Usage: scripts/setup-github.sh [owner/repo]
set -euo pipefail

REPO="${1:-mmsalmanfaris/uae-validations}"
echo "Configuring $REPO"

# 1. development branch, created from main, and made the default branch for pull requests.
if ! gh api "repos/$REPO/branches/development" >/dev/null 2>&1; then
  sha="$(gh api "repos/$REPO/git/ref/heads/main" --jq .object.sha)"
  gh api "repos/$REPO/git/refs" -f ref=refs/heads/development -f sha="$sha" >/dev/null
  echo "Created development from main"
fi

# 2. Repository features and merge settings.
gh api -X PATCH "repos/$REPO" \
  -f default_branch=development \
  -F has_issues=true \
  -F has_discussions=true \
  -F has_wiki=false \
  -F allow_squash_merge=true \
  -F allow_merge_commit=true \
  -F allow_rebase_merge=false \
  -f squash_merge_commit_title=PR_TITLE \
  -f squash_merge_commit_message=PR_BODY \
  -F delete_branch_on_merge=true \
  -F allow_update_branch=true >/dev/null
echo "Set default branch, merge options, and features"

gh api -X PUT "repos/$REPO/private-vulnerability-reporting" >/dev/null
gh api -X PUT "repos/$REPO/vulnerability-alerts" >/dev/null
gh api -X PUT "repos/$REPO/automated-security-fixes" >/dev/null
echo "Enabled private vulnerability reporting and Dependabot alerts and security updates"

# GitHub Pages, deployed by .github/workflows/docs.yml (source: GitHub Actions).
if gh api "repos/$REPO/pages" >/dev/null 2>&1; then
  gh api -X PUT "repos/$REPO/pages" -f build_type=workflow >/dev/null
else
  gh api -X POST "repos/$REPO/pages" -f build_type=workflow >/dev/null
fi
echo "Enabled GitHub Pages (source: GitHub Actions)"

# About box: description, website, and topics, taken from package.json so npm, GitHub, and the
# docs describe the package the same way.
description="$(node -p "require('./package.json').description")"
homepage="$(node -p "require('./package.json').homepage")"
gh repo edit "$REPO" --description "$description" --homepage "$homepage" >/dev/null
gh api -X PUT "repos/$REPO/topics" --input - >/dev/null <<'JSON'
{
  "names": [
    "uae",
    "united-arab-emirates",
    "emirates-id",
    "validation",
    "validator",
    "typescript",
    "javascript",
    "zero-dependency",
    "phone-number",
    "iban",
    "trn",
    "vat",
    "mrz",
    "icao-9303",
    "aed",
    "arabic",
    "makani",
    "kyc",
    "form-validation",
    "dubai"
  ]
}
JSON
echo "Set description, website, and topics"

# 3. Labels used by the issue forms and CONTRIBUTING.md.
label() { gh label create "$1" --repo "$REPO" --color "$2" --description "$3" --force >/dev/null; }
label triage 'fbca04' 'New; not reviewed yet'
label needs-source 'd93f0b' 'Blocked until an official source is found'
label accepted '0e8a16' 'Agreed; a pull request is welcome'
label 'good first issue' '7057ff' 'Small and well-defined'
label bug 'd73a4a' 'A function returns the wrong result or throws'
label enhancement 'a2eeef' 'New option or helper in an existing module'
label data-source '1d76db' 'Request for a new identifier or format, with an official source'
label data-correction '5319e7' 'A rule, code list, or source link is wrong or out of date'
label breaking 'b60205' 'Needs a major version (minor before 1.0.0)'
label wontfix 'ffffff' 'Out of scope, or no official source exists'
label dependencies '0366d6' 'Dependency updates'
echo "Created labels"

# 4. Branch protection. Required checks are the job names in .github/workflows/ci.yml and
#    pr-policy.yml. enforce_admins is false so a sole maintainer can merge their own pull
#    requests; turn it on once there is a second reviewer.
protect() {
  gh api -X PUT "repos/$REPO/branches/$1/protection" --input - >/dev/null <<JSON
{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "Static checks",
      "Test (Node 20)",
      "Test (Node 22)",
      "Test (Node 24)",
      "Coverage",
      "Package lint",
      "Target branch",
      "PR title"
    ]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "require_code_owner_reviews": true,
    "dismiss_stale_reviews": true
  },
  "restrictions": null,
  "required_linear_history": false,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_conversation_resolution": true
}
JSON
  echo "Protected $1"
}
protect main
protect development

cat <<'EOF'
Done. Remaining manual steps:
  - npm: configure Trusted Publishing for this repository and .github/workflows/release.yml.
  - GitHub: Settings > Environments > create "npm" (optionally require reviewers).
EOF
