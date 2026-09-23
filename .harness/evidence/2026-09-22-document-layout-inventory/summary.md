# Summary — 2026-09-22-document-layout-inventory

## Scope

Wave 0 #2 of `.harness/NAMING_AND_BOUNDARIES_REMEDIATION_PLAN_2026-09-22.md`:
classify out-of-place docs before any relocation. Read-only; no file moves.

## Deliverable

`.harness/evidence/2026-09-22-document-layout-inventory/inventory.json` — machine-readable,
one entry per docs-root file plus `docs/reviews`, `docs/operations`, `docs/runbooks`.

Fields: `path`, `category`, `classification`, `targetPath`, `references[]`, `referenceScope`,
`rationale`, `migrationRisk`, `ownerLayer`.

## Classification

- **ARCHIVE** → `docs/archive/upgrade/`: `system_design.md`, `engineering_handoff.md`,
  `class-diagram.mermaid`, `sequence-diagram.mermaid`.
- **ARCHIVE** → `docs/archive/baselines/`: `SECURITY_SCAN_REPORT.md`,
  `PANTHEON_BASE_CODE_REVIEW_CHECKLIST.md`.
- **KEEP_ADD_INDEX**: `DEPLOYMENT_GUIDE.md`, `DEV_DB_INIT_GUIDE.md`,
  `VERSION_MANAGEMENT_GUIDE.md`, four `testing-*.md`,
  `HARNESS_GOVERNANCE_GUIDE.md`, `harness-pr-generator-guide.md`.
- **KEEP_INDEXED**: `GITHUB_GOVERNANCE_CHECKLIST{,.en}.md`,
  `GITHUB_REPOSITORY_SETUP{,.en}.md`, and the reviews/operations/runbooks dirs.
- **Deletion candidates: 0.**

## Why the high-fan-out docs stay

`DEPLOYMENT_GUIDE.md` / `DEV_DB_INIT_GUIDE.md` are referenced by README entry docs, k8s README,
a GitHub issue template, a backend generator comment, maintenance scripts and the structure
checker whitelist. `VERSION_MANAGEMENT_GUIDE.md` is referenced by immutable `releases/*`
artifacts. Moving any of them fans out into code/CI/release records at once.

## Verification

- Reference census ran over all 17 candidates (16 files matched for the five named docs).
- `inventory.json` parses as JSON.

## Known gaps

- `testing-*.md` currency unconfirmed → kept in place with rationale.
- The two harness guides cannot be archived without a mismatched `doc_type` → kept + indexed.
- Historical `.harness` records are not rewritten (not gate-visible).

## Completion Status

complete
