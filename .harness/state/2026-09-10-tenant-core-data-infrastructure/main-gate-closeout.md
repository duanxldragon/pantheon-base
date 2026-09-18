# Main Gate Closeout — 2026-09-10-tenant-core-data-infrastructure

Date: 2026-09-18

## What was closed out

The 2026-09-10 tenant evolution wave (PRs #311, #312) left two follow-ups on `main`:

1. **Full Smoke failure — missing `tenantId` in client-side operation-log export**
   - Symptom: `cleanup-range-ui.spec.ts:536` failed on `main` (run 35278028148): the
     selected-rows CSV export header did not contain `tenantId`, while the backend DTO and
     backend export contract already did.
   - Fix: `exportSelectedOperationLogs` in `frontend/src/modules/system/audit/api.ts` now
     includes `tenantId` in the interface, header array, and row values (PR #316, merged
     2026-09-18 00:56 UTC, squash 623df890).

2. **Release Gate blocked by 1 unresolved SonarCloud issue**
   - Symptom: Release Gate run 35293249727 blocked with `Release blocked: 1 unresolved
     SonarCloud issue(s)`.
   - Fix: `.github/workflows/security.yml:202` — the zizmor pip install now uses
     `--only-binary :all:` per SonarCloud rule `githubactions:S8541` (PR #317, merged
     2026-09-18 01:41 UTC, squash 18728aac).

## Verification evidence

- Full Smoke Suite on `main`: **success** at 18728aac (run 35296346074) — the first fully
  green Full Smoke since the tenant wave landed.
- Release Gate on `main`: **success** at 18728aac (run 35296346107).
- CI / Core Smoke Tests / Security Gates / Code Quality Gates / Lint Workflows on `main`:
  **success** at 18728aac.
- SonarCloud (`duanxldragon_pantheon-base`, branch `main`): `resolved=false&types=BUG,
  VULNERABILITY,CODE_SMELL` → **0 unresolved issues** (verified 2026-09-18).

## Outcome

- `main` @ 18728aac is the all-green foundation for the next ops-consumable foundation release.
- Remaining gate work is tracked by the authoritative gate record:
  `.harness/state/2026-09-10-tenant-verification-and-gray-gates/status.md`
  (G1 ✓ G2 ✗ G3 ✗ G4 ✓) — untouched by this closeout.
- Local branch cleanup: all `fix/*` task branches deleted; `main` fast-forwarded to 18728aac.

## Workspace Cleanup Log — 2026-09-18 (untracked files removed)

Maintainer-directed deletion of 11 untracked worktree items left over from the
2026-09-15 parallel session (same session the fabricated gate claims came from;
none were ever committed, so no git history is affected):

- `.codex-flow/` (46MB) — AI tooling local journal, no repo value.
- `START_SMOKE_TEST_NOW.md` + `run-smoke-test.bat` — one-shot smoke helper referencing the
  old compat-mode DB flow; superseded by `docs/testing-usage-guide.md` and the
  `test:smoke:*` npm scripts already tracked in `frontend/package.json`.
- `scripts/commit-task-completion.sh` — bulk "git add everything" helper; contradicts the
  reviewable-diff rule and the governance evidence requirements.
- `scripts/backup/` — local backup rehearsal scripts; the authoritative G2 procedure is
  `docs/runbooks/PRODUCTION_BACKUP_RESTORE_DRILL_G2.md` (references to these scripts in
  the G2 report and gate state file remain as historical evidence).
- `frontend/scripts/run-tenant-smoke-suite.mjs` — untracked duplicate of tenant smoke
  selection; `tests/smoke-core/tenant-*.spec.ts` already run via CI and `test:smoke:*`.
- `.github/ISSUE_TEMPLATE/config.yml` + `documentation.md` — unreviewed additions to the
  tracked template set (bug_report/feature_request/question only, as shipped).
- `docs/case-studies/CASE_STUDY_TEMPLATE.md` — 269-line near-duplicate of the tracked
  525-line `TEMPLATE.md` referenced by `docs/case-studies/README.md`.
- `docs/designs/MULTI_TENANT_SAAS_DESIGN.md` — 585-line v2.0.0 SaaS vision (billing,
  self-registration) marked "设计阶段（未实施）"; overlaps the tracked
  `MULTI_TENANT_DESIGN.md` and predates the tenant contract work now in
  `docs/contracts/TENANT_CONTRACT_V1.md`.
- `docs/testing/` — 2-file smoke-execution guide + test-levels definition from the same
  session; no tracked file references the directory (the harness references
  `docs/testing-implementation-report.md`, which is tracked and unaffected).

Disposition: deleted (untracked; no unique committed value). This log is the record of
their existence and removal, mirroring the 2026-09-16 correction-log convention.
