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
