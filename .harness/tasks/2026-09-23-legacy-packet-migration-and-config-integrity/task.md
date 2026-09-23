# Task Packet: 2026-09-23-legacy-packet-migration-and-config-integrity

## Goal

Close the three items the 2026-09-23 governance residual closeout recorded as out of scope: migrate the 17 pre-template task packets to the section-based template and empty the legacy allowlist, remove the three v1-only keys that made golangci-lint silently ignore `linters.exclusions` (and re-enable config verification so they cannot come back), and fix the generated-smoke governance test whose first attempt was guaranteed to fail at the `/system/modules` row assertion and only ever passed via Playwright's retry.

## Primary Layer

platform

## Dependency Layers

- docs harness task packets and the task-packet checker
- backend golangci-lint configuration and the CI Go Lint step
- frontend generated-business smoke suite

## Harness Profile

- Template: admin-platform
- Overlay: governance-ratchet
- Quality Profile: ci-workflow
- Portable Failure Class: static-sensor-gap
- Owner Layer: platform
- Coverage Dimensions:
  - behaviour
  - maintainability
  - architecture-fitness
  - runtime-quality

## Contract Anchors

- `docs/acceptances/TASK_PACKET_BASE_TEMPLATE.md`
- `config/task-packet-legacy-docs.json`
- `scripts/harness/check-task-packet.mjs`
- `backend/.golangci.yml`
- `frontend/tests/smoke/business/generated/module-governance-real.spec.ts`
- `.github/workflows/quality.yml`

## Scope

### In

- Rewrite the 17 pre-template task packets into the section-based template with their manifest facts, keeping frontmatter as-is.
- Empty `config/task-packet-legacy-docs.json` so a plain checker run covers every packet.
- Remove `goconst.ignore-tests`, move `issues.exclusions` to `linters.exclusions`, and drop `output.sort-results` in `backend/.golangci.yml`.
- Replace the schema-invalid `linters: [all]` generated-code rule with `generated: strict` coverage.
- Turn golangci-lint config verification back on in `ci.yml` and `quality.yml`.
- Give the `/system/modules` navigation in `module-governance-real.spec.ts` its own budget and retry only the row assertion.

### Out

- Any change to runtime behaviour, API, permissions, menus, i18n, database or seed.
- Raising `check-boundaries.mjs` from report-only to blocking, or baselining its 5 findings.
- Migrating the two generated registries off the standard marker-based exclusion.
- Adding a static sensor for navigation-inside-retry in smoke specs.
- pantheon-ops synchronization (standing deferral, untouched).

## Expected Files

### Create

- `.harness/tasks/2026-09-23-legacy-packet-migration-and-config-integrity/manifest.json`
- `.harness/tasks/2026-09-23-legacy-packet-migration-and-config-integrity/task.md`
- `.harness/evidence/2026-09-23-legacy-packet-migration-and-config-integrity/commands.json`
- `.harness/evidence/2026-09-23-legacy-packet-migration-and-config-integrity/summary.md`
- `.harness/evidence/2026-09-23-legacy-packet-migration-and-config-integrity/review.md`

### Modify

- the 17 `docs/harness/tasks/*.task.md` packets listed in the manifest
- `config/task-packet-legacy-docs.json`
- `scripts/harness/README.md`
- `backend/.golangci.yml`
- `.github/workflows/ci.yml`
- `.github/workflows/quality.yml`
- `frontend/tests/smoke/business/generated/module-governance-real.spec.ts`

### Do Not Touch

- `backend/modules/**` and `backend/pkg/**` (no Go source change in this round)
- `frontend/src/**` (no product source change)
- admin SQL, seeds, permission matrix and i18n resources
- the 17 linked `.harness/tasks/**/manifest.json` files and their evidence directories

## Implementation Notes

- Reconstruct each migrated packet from its existing manifest (goal, scope, expected files, verification plan, human gates) plus the prose already in the doc; invent no new facts and leave the linked manifests untouched.
- The migration changes where a fact is written, not what it says: keep the original scope wording, keep `status`/`layer` frontmatter, and record the lock-in as completed checklist items.
- Prefer deletion over substitution in `.golangci.yml`: `goconst.ignore-tests` is redundant with the `_test\.go` exclusion rule, and the `generated_.*\.go` name rule is redundant with `linters.exclusions.generated: strict` because both generated registries carry the standard marker.
- Move `issues.exclusions` rather than re-authoring it, so the intent of each rule survives the v1 → v2 relocation.
- In the smoke spec, separate the compile-bound navigation from the data-bound assertion instead of raising a shared budget; the data is already proven ready by the API poll above it.

## Verification Plan

- `node scripts/harness/check-task-packet.mjs --root .`
- `node scripts/harness/check-task-packet.mjs --root . --legacy .tmp/legacy-probe.json`
- `cd backend && ../.tmp/bin/golangci-lint config verify`
- `cd backend && ../.tmp/bin/golangci-lint run --new-from-rev=$(git merge-base HEAD origin/main) ./...`
- `cd frontend && ./node_modules/.bin/tsc --noEmit -p tsconfig.json && ./node_modules/.bin/eslint tests/smoke/business/generated/module-governance-real.spec.ts && node ./scripts/check-smoke-coverage-contract.mjs`
- doc frontmatter, doc links, doc inventory and encoding gates
- `gh workflow run smoke-full.yml --ref <branch>` (the suite cannot run on this host)

## Linkage

- Task ID: `2026-09-23-legacy-packet-migration-and-config-integrity`
- Task Manifest: `.harness/tasks/2026-09-23-legacy-packet-migration-and-config-integrity/manifest.json`
- OpenSpec Change: `none`
- Superpowers Plan: `none`
- Plan References: `.harness/tasks/2026-09-23-governance-residual-closeout/manifest.json`
- Evidence Directory: `.harness/evidence/2026-09-23-legacy-packet-migration-and-config-integrity/`
- Review File: `.harness/evidence/2026-09-23-legacy-packet-migration-and-config-integrity/review.md`

## Evidence Required

- task-packet checker output over all 28 packets with an empty legacy allowlist, plus a stale-entry negative probe
- golangci-lint before/after for config verify and for test-file exclusions, plus the new-code lint result
- the measured smoke evidence (attempt 1 timing versus retry timing) and the dispatched Full Smoke Suite result
- frontend type-check, eslint and smoke-coverage contract output
- doc and evidence gate output
- review disposition incl. the two deferred follow-ups

## Human Gates

- none required (no permission, API, retention, menu or data surface changed) — PR gates, non-author review, and a manually dispatched Full Smoke Suite

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
