# Summary — 2026-09-24 fix-report residual closeout

L2 governance closeout: one guarded DDL (migration 000019), i18n operator
attribution across every dynamic write path, a deployment-baseline doc change,
two test rewrites with generated baselines, and a checker extension — closing
every `fix-report.md` §四 item an agent can close plus the three residual gaps
recorded by the 2026-09-22/23 rounds. The four human gates stay deferred by
definition.

## What was wrong and what changed

**1. fix-report §四.1 — `business/*` boundary gate (already closed, re-verified).**
`2026-09-22-layer-boundary-gate` landed it: `ci.yml:389` runs
`check-boundaries --strict --repo pantheon-base --baseline config/boundary-baseline.json`.
This round re-ran the gate: `0 finding(s), 5 baselined, 0 stale baselined,
0 warning(s)`, review-by 2026-12-31. The suggested `depguard` rule is expressed
by the checker's own import rules instead. Closed.

**2. fix-report §四.2 — production `mfa_enabled=1` deployment baseline.**
`docs/DEPLOYMENT_GUIDE.md` §4 now carries a `login.mfa_enabled` row that
requires `true` in production (seed default `false` is development-only, and
"not enabled" fails the release), and §7's post-deploy checklist gained item 9
verifying it. The seed default itself was not touched (doNotTouch).

**3. fix-report §四.3 — coverage gate (already closed, executed locally).**
`ci.yml:431` runs `check-coverage.mjs backend/coverage.txt --threshold 50`.
This round executed the same gate against the real local profiles:
`OK: total coverage 56.0% meets threshold 50%` (whole-repo profile) and
`58.3%` (platform+lowcode profile). Closed.

**4. fix-report §四.4 — four-theme screenshot baseline.**
New `frontend/tests/visual/theme-baseline.spec.ts` captures the login page
under indigo/emerald/violet/slate (theme primed via `pantheon_theme` in
localStorage before boot); four `*-win32.png` baselines generated, and a second
run passed unchanged, so the baselines are deterministic.

**5. fix-report §四.5 — `system_i18n` has no `updated_by`.**
Migration `000019_i18n_updated_by.{up,down}.sql` (guarded PREPARE pattern),
registered in `currentRuntimeSchemaMarkers` so versioned-migration deployments
replay it — which requires the whole 8..19 replay window to be idempotent, and
replaying against the real dev database exposed three latent defects, each now
fixed with a regression test: `000012` rebuilt indexes without a guard, `000008`
compared a `utf8mb4_general_ci` legacy table against the `0900_ai_ci` target,
and `000013` collided on `idx_tenants_code` when the dev-seeded `__global__`
row had `id != 0` (it is now adopted onto `id=0` before the guarded insert).
`database/system_init.sql` parity, model + `I18nResp` field, handler injection
from the token-middleware username, and writes in Create/Update/Import/
SyncMissingKeys all landed; DB-backed tests cover each path. Final state on the
real database: `schema_migrations` 19/0, `updated_by varchar(64)` present,
placeholder tenant at `id=0`.

**6. Residual gap — `business-generated-basic.spec.ts` still on stale selectors.**
Rewritten to discover business menus via `GET /system/menu/tree?scope=nav`
(module/path prefix contract) instead of `.arco-menu-item:has-text("业务")`.
Proven on the real stack: login succeeds, the probe sees no business node
(database has no dynamic-module table, `schema/generated/business` is empty),
and the three cases skip with the exact reason `No business modules exist in
the current database`. Full `test:smoke:core` afterwards: **26 passed /
3 skipped**, matching the 2026-09-10 baseline. `.harness/CORE_SMOKE_TRIAGE.md`
residual line updated.

**7. Residual gap — `check-generated` blind spot for dynamic artifacts.**
The gate now discovers generated module trees (`backend/modules/business/**`,
`frontend/src/modules/business/**` — text files must carry the first-line
marker, JSON must parse) and `schema/generated/<scope>/**/*.json` (parseability).
Negative probes fire both rules (2 findings / 13 artifacts, exit 1), the clean
tree is 0/11 exit 0, and the checker's test suite (11 pass) was extended with
it. `REPOSITORY_LAYOUT.md` §7 docs synced in both languages.

**8. Residual gap — docs index (recheck only).**
`docs/README.md:119-124` and `docs/README.en.md:88-93` already list all four
`testing-*.md` guides plus `HARNESS_GOVERNANCE_GUIDE` and
`harness-pr-generator-guide`. No edit was needed; the recheck is recorded.

**Accounting: the four master-plan P2 packets that never existed.**
`2026-09-08-p2-test-coverage-phase2`, `-multi-tenant-design`,
`-community-building`, `-test-coverage-phase3` now have task.md + manifest.json
(completed, back-filled) with their own evidence sets, and
`TASK_MASTER_PLAN.md` marks all four ✅ Completed with the measured numbers.

## Verification

| Gate | Result |
| --- | --- |
| `go build` / `go vet` / `gofmt` (whole backend) | clean |
| `go test ./pkg/database/` | ok 13.4s (000019 backfill, 000008/000013 replay, dirty repair) |
| `go test ./modules/system/i18n/` | ok 121.3s DB-backed (updated_by on all four write paths) |
| real-database migration chain | version 19 / dirty 0, `updated_by` column present, placeholder tenant at id=0 |
| `golangci-lint --new-from-rev=origin/main` (from backend/) | 0 issues |
| frontend `tsc -b` / `eslint --max-warnings=0` / `vite build` | all clean |
| `node --test tests/scripts/*.test.mjs` | 129 pass / 0 fail |
| `check-boundaries --strict --baseline` | 0 findings, 0 stale, 0 warnings |
| `check-generated --strict` + negative probes | 0/11 clean; probes 2/13 exit 1 |
| `check-task-packet --root .` | PASS |
| frontmatter / doc-links / inventory / encoding / failure-registry / structure / generated-modules | all pass |
| `check-coverage --threshold 50` on both profiles | 56.0% and 58.3% — OK |
| four-theme visual baseline + stability rerun | 4 passed, 4 passed |
| `business-generated-basic` on the real stack | 3 skipped with exact API-derived reason |
| full `test:smoke:core` | 26 passed / 3 skipped, RC=0 |

## Explicit gap

Deferred to the maintainer (human gates, by definition): **G2 recovery drill
(DBA)**, **production G3 sizing**, **v0.12.0 release cut** and **state-file
close-out checkboxes**. The **four-theme visual acceptance** (touchpoint ③) was
**signed off on 2026-09-24** — checklist and sign-off in `visual-acceptance.md`.
No remote CI ran this round (no push from this
session); the local gate set is the standard depth, and the eventual push
re-executes the same checks. pantheon-ops synchronization was out of scope —
this round's shared surfaces (checker, docs) reach ops with the next foundation
release, consistent with the still-recorded ops blocker.

## Residual risks

- Business smoke UI assertions need a database containing generated business
  modules; neither the local nor the CI database has one, so those three cases
  stay conditional skips. The rewrite removed the *judgement* ambiguity, not the
  data dependency.
- Four-theme snapshots are win32-platform; other OSes regenerate their set with
  `--update-snapshots`.
- `updated_by` intentionally absent on system-origin fill paths and CSV export —
  recorded as the packet's technicalDebtNote.
- `.harness/tasks/<id>/task.md` directory packets remain outside
  `check-task-packet`'s scan surface (pre-existing layout split, 119 files).
- Coverage numbers are a 2026-09-24 local snapshot; continuous enforcement is
  `ci.yml:431`. The generator package (26.3%) is the named low-coverage
  residual, tracked by the phase-3 packet.
- This round is a self-review; it leans on executable proof (regression tests,
  live negative probes, a real-database replay and a full gate run) rather than
  on a second reader.
