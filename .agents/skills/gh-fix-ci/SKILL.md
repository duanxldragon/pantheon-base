---
name: gh-fix-ci
description: Use when a Pantheon Base GitHub Actions run is red and local verification is green or incomplete, so CI repair must be driven from GitHub run details
---

# GH Fix CI

This is the Pantheon Base adaptation of CI-fix workflow for GitHub Actions.

## Before Using

- Reproduce locally first with `repo-ci-triage`.
- Do not jump into CI-only debugging while local checks are still red.

## Minimal Loop

1. Identify the failing workflow, job, and step.
2. Pull the failed-run details with GitHub CLI when available.
3. Map the failing job to the local command set from `repo-ci-triage`.
4. Fix the smallest real cause.
5. Re-run the local proof commands plus `repo-verify`.

## GitHub CLI Hints

- `gh run list --limit 10`
- `gh run view <run-id> --json jobs`
- `gh run view <run-id> --log-failed`

## Pantheon Base-Specific Rules

- `quality-gates` and `security-gates` are aggregators. Find the first upstream failing job instead of patching the gate job.
- If `.github/workflows/*` changed, include local `zizmor` reproduction before claiming the workflow fix is ready.
- If `codeql-security` is the only red job, inspect the changed trust boundary and run `security-diff-scan` instead of papering over the alert.
- If the failure is in generated modules, menu contracts, or smoke coverage checks, update the generated artifacts and contract files in the same patch.

## Final Report

- failing run identifier
- failing job and step
- local reproduction command
- root cause
- fix
- remaining nonlocal risk
