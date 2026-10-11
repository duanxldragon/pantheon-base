# Verification Summary: 2026-10-11 SonarCloud duplication under 3%

## What the metric actually was

| Measure | Value | Source |
| --- | --- | --- |
| SonarCloud overall `duplicated_lines_density` | **3.16%** (5269 / 166757 lines) | `/api/measures/component` on `main` @ `1015bcf7` |
| SonarCloud new-code `new_duplicated_lines_density` | **1.8%** (threshold 3%) | `/api/qualitygates/project_status` — already **OK** |
| Repository's own gate `npm run check:duplication` | **1.52%** (2024 / 132732 lines) | `scripts/check-duplication.mjs` — already **passes** |

So the gated metric was never failing. The 3.16% is the *ungated overall* density — the same
objective the 2026-09-01 task packet (`docs/harness/tasks/2026-09-01-sonar-duplication-reduction.task.md`)
set out to bring below 3.00%, which had since regressed from 1.61% → 3.16%.

**Target arithmetic.** `duplicated_lines_density = duplicated_lines / lines`. To reach 3.00% of the
current 166757 lines the numerator must drop to ≤ 5002, i.e. **remove ≥ 267 duplicated lines**.

## Where the duplication lives

102 of 735 analysed files carry duplication. Grouped by layer:

| Layer | Duplicated lines | Share |
| --- | --- | --- |
| Test code (`frontend/tests/smoke/**` 1504, Go `*_test.go` ~1400, `tests/scripts/**` 336) | **3285** | 62% |
| `frontend/src/**` | 1394 | 26% |
| Backend production | 623 | 12% |

The single largest offender is one E2E spec: `frontend/tests/smoke/system/system-pages.spec.ts`
carries **737 duplicated lines — 14% of the entire repository total** — concentrated in 16 ranges.

## Answer to the question: yes, and the test code is the right place

Because 62% of the duplication is test scaffolding and the top file alone is 14%, the target is
reachable with behaviour-preserving extractions in test code, with **zero production risk**. That
also matches the non-goals the repository already recorded: no SonarCloud setting or exclusion
changes, no fixture rewriting to game the metric.

## Fix

Two files, pure extraction, no assertion changed.

### 1. `frontend/tests/smoke/system/system-pages.spec.ts` — 4053 → 3709 lines

Three helpers replace 26 copy-pasted call sites:

- `withListViewOnlyViewer(page, options, assertViewer)` — the seven "list-only role can view page
  but cannot …" permission smoke tests were seven copies of the same ~75-line
  provision-role → provision-user → sign-in → open-page → cleanup workflow. Each is now ~27 lines
  with only its own capability assertions inline. This alone addresses the 145-line and 159-line
  duplicated ranges.
- `fetchSettingGroupItems(page, token, group)` — the 7-line "GET /system/setting/group/:group and
  assert the envelope" block had been copy-pasted **15 times**.
- `readSettingValueFromApi(page, token, group, key)` — collapses the 4 setting-group
  `expect.poll` verification blocks from 11 lines to 3.

### 2. `backend/modules/system/i18n/i18n_service_test.go` — 1339 → 1241 lines

- `newI18nTestService(t)` — replaced 23 copies of the DB-open + `NewI18nService` + `Migrate` block.
- `newI18nTestServiceWithRawTable(t)` — replaced 8 copies of the `AutoMigrate(&SystemI18n{})` variant.
- `seedI18nRows(t, service, items...)` — replaced 8 copies of the `BatchInsert` + `t.Fatalf` block.

Net diff: **319 insertions / 761 deletions across 2 files**.

## Verification performed

1. **eslint** on the changed spec: exit 0.
2. **TypeScript, before-vs-after error-set diff.** `tsconfig.app.json` only includes `src/`, so the
   spec is not normally type-checked. A temporary config was used and deleted; errors attributable
   to the spec were **34 before and 34 after, with zero new and zero removed**. All 34 are
   pre-existing artifacts of the ad-hoc config, not of this change.
3. **Structural invariants.** Top-level `test(` declarations: **59 before, 59 after**, titles
   unchanged. No stale identifier (`groupResponse`, `groupPayload`, `verifyResponse`,
   `verifyPayload`) remains. Each new helper has exactly one definition and the expected call-site
   count (16, 4, 7).
4. **Frontend contract gates.** `npm run type-check` exit 0; `npm run prebuild` all green,
   including `check:smoke-coverage-contract` (28 smoke specs / 14 script entries) and
   `check:import-path-case` (248 files).
5. **Go.** `gofmt -l` empty. `go test -c -vet=off ./modules/system/i18n/` exit 0 producing a
   29 MB test binary — which compiles the whole test package and therefore proves there are no
   unused variables (the one real hazard: `db` became unused at 11 sites and was rewritten to
   `_, service := …`), no type errors and no syntax errors.
6. **Line-level equivalence proof for the Go transformation.** Excluding the allowed-to-change
   setup/seed lines, the multiset of non-blank lines is **809 before / 810 after**, the single
   difference being the closing brace of a newly added helper. No assertion, fixture value or
   control-flow line changed.

## Expected result

~660 duplicated lines removed (476 in the spec region + ~187 in the i18n test file), against the
267 required. Projected overall density ≈ **2.75%**, with the new-code density staying below its
existing 1.8%.

The authoritative number comes from the hosted re-analysis after CI; the local
`check-duplication` gate cannot confirm it because it excludes `frontend/tests`.

## Residual risk

- **`go test` could not be executed locally.** Mid-session the sandbox began terminating Go process
  execution — `go test` hangs and is SIGTERM'd, and even `go run main.go` on a trivial hello-world
  is killed, while `go build` and `go test -c` still work. `go test ./pkg/contracts/...`, which had
  succeeded in 0.237 s earlier in the same session, fails identically, so this is an environment
  regression. The Go suite is therefore verified by CI only.
- **The E2E specs cannot be executed locally either** (Node cannot spawn child processes on this
  host, so Playwright and `node --test` both fail). The spec is executed by the blocking Quality
  Gates smoke job in CI.
- **Deliberately deferred headroom**, recorded in the manifest scope: the five
  `system-secondary-route-*.spec.ts` / `backoffice-ui-visual.spec.ts` files share ~280 duplicated
  lines of identical harness, but are only covered by the report-only daily smoke, so extracting
  them would be unverifiable by a PR-blocking gate.
- **No production file was modified**, so no API, database, permission, menu or runtime behaviour
  can have changed.
