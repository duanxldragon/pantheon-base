# Harness Scripts

Chinese version: [README.zh.md](./README.zh.md)

Repo-local Harness Engineering checks for `pantheon-base`.

The portable method source of truth lives in `agentic-method-kit/` and `agentic-repo-shell/`.
This directory is the pantheon-base execution layer.

## Quick validation

```powershell
node scripts/harness/check-method-health.mjs --strict
node scripts/harness/check-adoption.mjs --strict
node scripts/harness/check-review.mjs --strict
node scripts/harness/check-template-health.mjs
node scripts/harness/check-runtime-evidence.mjs
node scripts/harness/check-doc-links.mjs --strict
node scripts/harness/check-doc-inventory.mjs --strict
node scripts/harness/check-sync-drift.mjs --strict
node scripts/harness/check-feature-ledger.mjs --strict
node scripts/harness/check-doc-frontmatter.mjs --report-legacy
node scripts/harness/check-task-packet.mjs
node scripts/harness/check-evidence.mjs --strict
node scripts/harness/check-failure-registry.mjs --root . --strict
node scripts/harness/check-boundaries.mjs
node scripts/harness/check-visual-evidence.mjs
```

## Graph review tools

- `build-graph-review-import.mjs` — normalize CodeGraph JSON for import
- `check-graph-review.mjs` — validate manifest structural scope, evidence `graphChecks`, and review `structuralReview` consistency
- `scaffold-graph-review.mjs` — seed `graphChecks` and `structuralReview` from task manifest structural scope

## Shared utilities

- `sort-utils.mjs` — shared string sorting helper used by harness checks

## Pantheon-base additions

The following scripts are repo-specific and not part of the portable method:

- `check-audit-coverage.mjs` — audit coverage validation
- `check-backend-dto-contract.mjs` — backend DTO contract checks
- `check-backend-response-contract.mjs` — backend response contract checks
- `check-inheritance-contract.mjs` — base-to-ops inheritance validation
- `check-permission-contract.mjs` — permission model contract checks
- `triage-base-drift.mjs` — base drift triage

## Tests

```powershell
node --test agentic-repo-shell/scripts/harness/*.test.mjs
```
