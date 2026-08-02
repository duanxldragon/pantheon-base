---
title: SonarCloud open issue remediation
doc_type: Remediation
layer: platform
status: Active
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
  - docs/contracts/SYSTEM_AUTH_CONTRACT.md
  - docs/contracts/SYSTEM_IAM_CONTRACT.md
  - docs/contracts/SYSTEM_ORG_CONTRACT.md
  - docs/contracts/SYSTEM_CONFIG_CONTRACT.md
updated_at: 2026-08-02
---

# SonarCloud Open Issue Remediation

## In

- Resolve all 77 unresolved SonarCloud code smells reported on `main`.
- Keep behavior stable while extracting helpers, using table-driven tests, and
  grouping long parameter lists into existing-domain option values.
- Run focused checks per batch and the full repository gates after integration.

## Out

- No API, schema, permission, menu, authentication, audit, or visual redesign.
- No new dependencies and no Pantheon Ops source changes.

## Batches

1. Backend tests.
2. Backend system-domain production code.
3. Backend platform, auth, lowcode, and shared packages.
4. Frontend TypeScript and React.

The batches have disjoint write scopes. Integration and full verification are
serial.

## Success

- SonarCloud unresolved issues: `77 -> 0`.
- SonarCloud quality gate: `OK`.
- GitHub Quality Gates, Security Gates, Backend Tests, Go Lint, Frontend
  Contract, and Smoke Sanity pass.
- The PR is merged and local/remote branches are cleaned back to `main` only.

## Linkage

- Task manifest:
  `.harness/tasks/2026-08-02-sonarcloud-open-issues/manifest.json`
- Evidence:
  `.harness/evidence/2026-08-02-sonarcloud-open-issues/`
- Review:
  `.harness/evidence/2026-08-02-sonarcloud-open-issues/review.md`
