---
title: Dependabot PR governance workflow alignment
doc_type: Remediation
layer: platform
status: Active
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
updated_at: 2026-08-03
---

# Dependabot PR Governance Workflow Alignment

## Scope

- Apply the existing Dependabot body-governance exemption consistently in PR automation.
- Keep human and agent-authored PR body validation unchanged.
- Add regression coverage for the skip condition and successful prerequisite output.
- Re-run and merge the existing Dependabot PRs without `solo-override`.

## Out Of Scope

- Product code, APIs, database schema, permissions, menus, and UI behavior.
- Disabling structural governance checks or required quality/security checks.

## Success Criteria

- Dependabot PRs no longer fail `PR Governance Prereq` for generated body content.
- Non-Dependabot PRs still run `check-pr-governance.mjs`.
- Dependabot can reach the existing auto-merge path after all real checks pass.
- GitHub and the local repository are returned to `main`-only branch hygiene.

## Linkage

- Task ID: `2026-08-03-dependabot-pr-governance`
- Manifest: `.harness/tasks/2026-08-03-dependabot-pr-governance/manifest.json`
- Evidence: `.harness/evidence/2026-08-03-dependabot-pr-governance/commands.json`
- Review: `.harness/evidence/2026-08-03-dependabot-pr-governance/review.md`
