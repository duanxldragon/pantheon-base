# Task Packet: 2026-09-24-fix-report-residual-closeout

## Goal

Close every remaining item from `fix-report.md` §四 (需人工介入的问题) that an agent can close, plus the residual gaps the 2026-09-22 remediation rounds recorded: turn the MFA production baseline into deployment-guide law, give `system_i18n` operator attribution (`updated_by` DDL + migration + audit writes + tests), land the four-theme screenshot baseline, rewrite the stale `business-generated-basic` smoke spec, extend `check-generated` to cover dynamically generated module artifacts, and re-verify the docs index. Items already closed by earlier packets (boundary gate, coverage gate) are核销ed with their evidence.

## Primary Layer

system/config

## Dependency Layers

- platform governance tooling (harness checkers, visual baselines)
- backend-services (system/config i18n domain)
- backend-repositories (schema + migrations)
- backend/testing (i18n service tests, migrate tests)

## Harness Profile

- Template: api-service
- Overlay: governance-ratchet
- Coverage Dimensions:
  - behaviour
  - maintainability
  - architecture-fitness
  - runtime-quality

## Contract Anchors

- `fix-report.md`
- `docs/DEPLOYMENT_GUIDE.md`
- `backend/pkg/database/migrations/000018_session_pagination_indexes.up.sql`
- `backend/pkg/database/migrate.go`
- `scripts/harness/check-generated.mjs`
- `frontend/tests/visual/visual-baseline.spec.ts`
- `frontend/tests/smoke-core/business-generated-basic.spec.ts`
- `docs/README.md`

## Scope

### In

- fix-report §四.2: production `login.mfa_enabled=true` baseline written into `docs/DEPLOYMENT_GUIDE.md` (§4 note + §7 release checklist item)
- fix-report §四.5: `system_i18n.updated_by` column — migration `000019` (guarded), `currentRuntimeSchemaMarkers` entry, `system_init.sql` parity, `000012` guard hardening so the marker-driven replay window stays idempotent, model + `I18nResp` field, actor writes in Create/Update/Import/SyncMissingKeys, handler wiring from the auth context, DB-backed tests
- fix-report §四.4: four-theme visual baseline spec (`frontend/tests/visual/theme-baseline.spec.ts`, indigo/emerald/violet/slate login snapshots)
- fix-report §四.1 and §四.3核销: boundary-blocking gate and coverage gate already landed (`ci.yml:389`, `ci.yml:431`) — evidence only, no code
- Residual gap ③a: rewrite `business-generated-basic.spec.ts` to probe the nav menu tree via API instead of the stale `.arco-menu-item:has-text("业务")` selector
- Residual gap ③b: extend `check-generated.mjs` to discover `schema/generated/<scope>/*.json` and generated module files under `backend|frontend/**/modules/business/<module>/`, with matching tests
- Residual gap ③c: re-verify `docs/README.md` / `README.en.md` index coverage (testing-* and harness guides are already indexed) and record the result

### Out

- Human gates explicitly deferred: G2 recovery drill (DBA), production G3 sizing, v0.12.0 release cut, state-file close-out checkboxes
- Changing the seed default of `login.mfa_enabled` (stays `false` for dev; the baseline requirement is deployment-side, documented)
- Filling `updated_by` on the maintenance writers `FillMissingLocales` / `HydrateBuiltinLocales` (system-origin rows; operator already traced by the operation log)
- CSV export column additions for `updated_by`
- Migrating the 17 pre-template task docs, pantheon-ops sync, or any `business/*` runtime behavior change

## Expected Files

### Create

- `backend/pkg/database/migrations/000019_i18n_updated_by.up.sql`
- `backend/pkg/database/migrations/000019_i18n_updated_by.down.sql`
- `frontend/tests/visual/theme-baseline.spec.ts`
- `frontend/tests/visual/theme-baseline.spec.ts-snapshots/*` (generated baselines)
- `.harness/tasks/2026-09-24-fix-report-residual-closeout/task.md`
- `.harness/tasks/2026-09-24-fix-report-residual-closeout/manifest.json`
- `.harness/evidence/2026-09-24-fix-report-residual-closeout/commands.json`
- `.harness/evidence/2026-09-24-fix-report-residual-closeout/summary.md`
- `.harness/evidence/2026-09-24-fix-report-residual-closeout/review.md`

### Modify

- `docs/DEPLOYMENT_GUIDE.md`
- `fix-report.md` (closure-status table for §四 items)
- `backend/pkg/database/migrations/000012_high_traffic_indexes.up.sql` (guard) and `.down.sql` (symmetric guard)
- `backend/pkg/database/migrate.go` (marker)
- `backend/pkg/database/migrate_test.go` (fixture CREATE + expectedColumns)
- `backend/database/system_init.sql`
- `backend/modules/system/i18n/i18n_model.go`
- `backend/modules/system/i18n/i18n_handler.go`
- `backend/modules/system/i18n/i18n_service.go`
- `backend/modules/system/i18n/i18n_export.go`
- `backend/modules/system/i18n/i18n_helper.go`
- `backend/modules/system/i18n/i18n_service_test.go`
- `frontend/tests/smoke-core/business-generated-basic.spec.ts`
- `scripts/harness/check-generated.mjs`
- `tests/scripts/harness-check-generated.test.mjs`
- `docs/designs/REPOSITORY_LAYOUT.md` and `docs/designs/REPOSITORY_LAYOUT.en.md` (§7 coverage description)
- `.harness/NAMING_AND_BOUNDARIES_REMEDIATION_PLAN_2026-09-22.md` (residual line update)

### Do Not Touch

- `backend/modules/business/**` runtime behavior
- seed defaults for `login.mfa_enabled` (`backend/modules/system/config/setting/setting_seed.go`)
- `.github/workflows/*` gate thresholds
- `docs/contracts/TENANT_CONTRACT_V1.md`
- the 17 pre-template task docs in `config/task-packet-legacy-docs.json`

## Implementation Notes

- **Migration marker semantics (FR-009)**: `currentRuntimeSchemaMarkers` decides "schema is already current" and bootstraps `schema_migrations` to latest, which would skip `000019` on every existing DB. Adding `system_i18n.updated_by` to the marker set makes old DBs fail the current-check, rewind to v7 and replay 8..19. That replay window is idempotent for 8..11 and 13..18 (guarded migrations, proven by the existing bootstrapped-compat tests) but `000012` was unguarded — it is hardened in the same patch, otherwise the replay dies on duplicate index creation.
- The bootstrap fixture `seedCurrentSchemaBootstrapMarkers` and the deprecated `system_init.sql` both gain the column so a "judged current" schema physically has it.
- Actor flow: token middleware writes `username` into the Gin context; handlers inject it into `I18nCreateReq`/`I18nUpdateReq` (`json:"-"`, never client-supplied) and pass it to `Import`/`SyncMissingKeys`.
- `check-generated` extension mirrors `cleanup-generated-modules.mjs` ownership: only the `business` scope directories are generator-owned; `schema/generated/<scope>/*.json` files are identified by path + parseability. Empty/absent directories yield zero findings, so a clean repo stays green.
- The smoke rewrite keys business menus by `module` prefix `business.` from the `/system/menu/tree?scope=nav` API, keeping the honest `test.skip` when no business module exists.

## Verification Plan

- `cd backend && go build ./... && go vet ./... && gofmt -l .`
- `cd backend && go test -count=1 ./modules/system/i18n/... ./pkg/database/...`
- `node scripts/harness/check-boundaries.mjs --strict --repo pantheon-base --baseline config/boundary-baseline.json`
- `node scripts/harness/check-generated.mjs --root . --strict && node --test tests/scripts/harness-check-generated.test.mjs tests/scripts/generated-marker-consistency.test.mjs`
- `node scripts/harness/check-structure-contract.mjs --root . --strict`
- `node scripts/harness/check-doc-links.mjs --root . --strict && node scripts/harness/check-doc-inventory.mjs --root . --strict && node scripts/harness/check-encoding.mjs --root . --strict && node scripts/harness/check-failure-registry.mjs --root . --strict && node scripts/frontmatter-check.mjs`
- `node scripts/harness/check-task-packet.mjs --root .` plus explicit-file runs for this packet's task.md
- `node scripts/harness/check-evidence.mjs && node scripts/harness/check-review.mjs`
- `cd frontend && npx tsc -b && npx playwright test -c playwright.visual.config.ts tests/visual/theme-baseline.spec.ts --update-snapshots`
- `cd frontend && npx playwright test -c playwright.config.ts tests/smoke-core/business-generated-basic.spec.ts` (requires local MySQL+Redis stack; otherwise recorded as runtime gap)

## Linkage

- Task ID: 2026-09-24-fix-report-residual-closeout
- Task Manifest: `.harness/tasks/2026-09-24-fix-report-residual-closeout/manifest.json`
- OpenSpec Change: none
- Superpowers Plan: none
- Plan References: `.harness/NAMING_AND_BOUNDARIES_REMEDIATION_PLAN_2026-09-22.md`, `fix-report.md`
- Evidence Directory: `.harness/evidence/2026-09-24-fix-report-residual-closeout/`
- Review File: `.harness/evidence/2026-09-24-fix-report-residual-closeout/review.md`

## Evidence Required

- Migration replay proof: migrate tests green with the new marker, `000019` guarded up/down, `000012` idempotent replay
- i18n DB-backed tests showing `updated_by` written on Create/Update/Import/SyncMissingKeys
- Deployment-guide diff showing the MFA baseline in §4 and §7
- Four-theme snapshot run output (or explicit runtime gap if no browser/stack)
- check-generated negative probes: unmarked generated module file and unparseable schema JSON both fail `--strict`
- Smoke-spec rewrite review: selector strategy, skip semantics preserved
- Docs-index recheck result
- Review disposition with the deferred human gates listed

## Human Gates

- G2 recovery drill (DBA) — deferred, out of agent scope
- production G3 sizing — deferred, maintainer decision
- v0.12.0 release cut — deferred, maintainer decision
- state-file close-out checkboxes — deferred, maintainer touchpoint ③
- final visual acceptance of the four-theme baselines — maintainer touchpoint ③

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
