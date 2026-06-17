---
name: repo-pr-gate
description: Use when preparing a Pantheon Base pull request or merge candidate and deciding which review, evidence, and security gates are required
---

# Repo PR Gate

Close the change before PR. Do not rely on the PR conversation to discover missing gates.

## Required Sequence

1. Run `repo-verify` for the touched scope.
2. Classify risk.
3. Run `gh-address-comments` if the branch PR or linked issue/discussion already has actionable GitHub feedback.
4. Attach evidence.
5. Request independent review.

## Risk Split

- Standard change:
  - at least one non-author approval
- High-risk change:
  - at least two non-author approvals
  - one reviewer should be domain, security, or architecture responsible

High-risk scope in this repo includes:

- `system/auth`
- `system/iam`
- `system/config`
- permission or audit chains
- shared `pkg/*`
- generator or dynamic-module flows
- `.github/workflows/*`
- secrets, credentials, dependency posture

## Extra Gates

- Open GitHub feedback:
  - use `gh-address-comments` before calling the PR ready
- UI change:
  - use `impeccable`
  - attach rendered evidence or a concrete runtime gap
- Runtime-sensitive or security-sensitive change:
  - run `security-diff-scan`
- GitHub workflow change:
  - add local `repo-ci-triage` notes for the affected jobs

## PR Body Minimum

- owning layer
- change boundary
- affected subgraph summary
- commands run
- evidence summary
- known gaps
