# Summary — 2026-10-26 PR #427 hosted gate closure

## What changed

PR #427 shipped the tenant-operations round and the governance-red-checkers round onto the hosted chain, which returned four red
signals on head `e4a70094`. Closing them exposed a fifth, caused by this branch's own role-save policy sync. Every one was closed
in code or by the disposition the repository already records for that exact class — no gate was weakened.

| Finding | Gate that reported it | Before | After |
|---|---|---|---|
| CI-01 (P2) | `Go Lint` (`golangci-lint run --new-from-rev=main`) | 5 findings on `e4a70094` | `0 issues.`, exit 0; bare `run ./...` still reports 73 repo-wide findings, recorded as CI-07 so the 0 is not read as 'repo is clean' |
| CI-02 (P2) | SonarCloud PR analysis | 10 unresolved issues (1 BLOCKER, 5 CRITICAL, 2 MAJOR, 2 MINOR-class) | Live web-api `issues/search?resolved=false` → 1 (`typescript:S3626`, introduced by this round's fixture edit and removed in the same round); PR gate `status: OK` on all five conditions |
| CI-03 (P2) | Duplication Gate | new-code duplication 198/5462 = 3.62% vs threshold 3% | `new_duplicated_lines_density` actual **0.8**, condition OK |
| CI-04 (P2) | `PR Smoke Modules` | 2 strict-mode failures on `getByLabel(Password)` | 0 — `Smoke Sanity` and the module suites pass; locators select `input[type=password]` |
| CI-05 (P2) | `GitHub Feedback Prereq` | CodeQL review thread `#discussion_r4375038750` classified `actionable-change` → `BLOCKED` | alerts 95-96 dismissed `used in tests` (same rationale as 90-94); `fetch-github-feedback.mjs --check` exit 0 and the hosted job passes |
| CI-08 (P2) | `PR Smoke Modules` (second batch) | 3 fixtures get `400 permission.policy.exists` from `POST /system/permission`; remediation spec finds no gap | fixtures tolerate only that message; remediation spec revokes the synced policy first. Hosted job on `76e3bdb6` shows this as the single remaining failure, repaired in the pushed head |

Repairs, by shape (`6122c6d1^..HEAD`, 520 insertions / 368 deletions, plus this round's working tree):

| Shape | Files | Repair |
|---|---:|---|
| Rename + constant extraction | 7 backend files | `tenant.TenantPlan` → `tenant.Plan` (and its response field) with both `TENANT_CONTRACT_V1` documents following; named GORM predicates (`condIDEquals`, `condStatusEquals`, `condPlanEquals`, `condDeletedAtMissing` …) and the four built-in plan codes; deleted the unused `quotaLimitOrUnlimited` |
| Cognitive-complexity split | `role_policy_sync.go` (63/21) | `syncRoleAPIPolicies` (complexity 25) split into `rolePolicyRouteSets`, `deleteRetiredRolePolicies`, `missingRolePolicies` with the writes unchanged |
| Suppression re-anchored | `tenant_plan_store.go` | The plan-update map hoisted into a variable so `// NOSONAR gosecurity:S3649` sits on the line Sonar reports, instead of on a multi-line statement's closing bracket |
| Duplication removed | `TenantOverview.tsx` (42/110), `TenantMemberList.tsx` (40/113), new `tenantListCells.tsx` (73), new `TenantListParts.tsx` (115) | The shared table shell, loading branches and cell renderers extracted out of the two pages that each carried a copy |
| Nested ternaries | `QuotaRatio.tsx`, `ModuleWizard.tsx` | One `quotaTone` function and one `tablePrefixForScope` helper replace `typescript:S3358` sites |
| Locator retarget | 2 smoke specs | Three password locators select `input[type=password]` (the convention `tests/smoke/helpers/auth.ts:82` already used); the accessible toggle names from the previous round are untouched |
| Fixture tolerance (CI-08) | `system-pages-helpers.ts`, `system-secondary-route-permission.spec.ts` | A non-200 from `POST /system/permission` is accepted only when `message === 'permission.policy.exists'`; both copies then dropped the redundant `return;` that Sonar reported as `S3626` |
| Gap restoration | `permission-workbench-remediation-real.spec.ts` | New `dropPolicy` helper revokes the policy the role save already synced, so the remediation case exercises a gap that genuinely exists |
| Governance artifacts | 1 packet + 1 manifest + 3 evidence files | Packet rewritten to the 13-section template; manifest `implementationNotes` converted to a string array and coverage dimensions corrected to the checker's enum; evidence set added, which is what clears `check-adoption` |

## Root cause

Four hosted reds, four different owners of truth: the linter config, the Sonar PR measures, Playwright's strict mode, and the
feedback classifier's default for open review threads. Only two needed a judgement — where to anchor the S3649 suppression, and
whether to revert the previous round's accessibility work or retarget the test — and both went the way that keeps the earlier
decision intact.

CI-08 is a different class: a second-order regression the branch created itself. `role_policy_sync.go` (new on this branch, called
from `role_service.go:370/455`) grants the API routes a role's permission keys declare, using the same
`requiredAPIRoutesByPermission` table the workbench reads. Three smoke fixtures then POST a grant that is already in place, and
`ensurePolicyUnique` answers `common.NewConflict("permission.policy.exists")`. Because `CodeForError` has no 409 sentinel, the
envelope code is 400, indistinguishable from a real parameter error except by message — which is exactly why the fix had to be
message-shaped and belongs in the fixtures, not in the endpoint's semantics.

## Verification

- `golangci-lint run --new-from-rev=main ./...` → `0 issues.` / exit 0; `go build ./...`, `go vet ./modules/system/...`,
  `gofmt -l .` → silent.
- `PANTHEON_TEST_DSN_REQUIRED=true` with `../.env.test` sourced → 12 `modules/system/...` packages `ok`, 0 FAIL, 0 skips.
  The same command without a sourced DSN fails with 'mysql is required', which is the skip-masking guard working and is recorded.
- `tsc -b` exit 0 and `eslint src tests --max-warnings 0` exit 0, each run twice (before and after the final two edits).
- Remediation spec: 1 passed; with `dropPolicy` removed, 1 failed at `expect(before.governanceStatus).toBe('pending')`; restored
  and re-passed. Local batch over the suites that consume the changed fixtures: 38 passed / 1 failed (`pagination-contract`,
  which passes 4/4 in isolation in 20.4s and is green in the hosted job).
- Hosted: `Go Lint`, `Backend Tests`, `Duplication Gate`, `Docs Governance`, `CodeQL`, `SonarCloud Code Analysis`,
  `GitHub Feedback Prereq`, `Smoke Sanity`, `Frontend Contract`, `Unit Tests`, `Secret Scan` pass on `76e3bdb6`;
  `PR Smoke Modules` carries the one failure this round repairs.
- Sonar web-api: PR gate `status: OK`, `new_duplicated_lines_density` 0.8 vs 3, unresolved issues 1 → 0 in code.
- Governance: 24-checker strict matrix all rc=0 (after this round's own packet/manifest/evidence were completed — the first run
  was 21/24), `check-pr-governance.mjs --event frontend/.tmp/pr-event.json` → `OK pantheon-base PR body governance fields are present`.

## Gaps and limits

1. The pushed head's hosted re-run is the remaining verdict; `PR Smoke Modules` and the `Quality Gates` aggregate were red at the
   moment the fix was committed.
2. The remediation case now proves 'a gap that exists can be filled', not 'saving a role leaves a gap'. The narrower claim is
   honest only if said out loud, so it is stated in review.md; restoring the original claim end-to-end needs a new case with a
   permission key that has no binding entry.
3. The three fixtures are now coupled to `requiredAPIRoutesByPermission`: adding a binding for a provisioned key turns their POST
   into a conflict again. The tolerance absorbs it, but nothing warns about the coupling from the table side.
4. `pagination-contract.spec.ts` failed twice locally and passed isolated and in CI; recorded as host-load sensitivity against a
   30s budget, with all three readings, rather than as a pass or a relaxed test.
5. `continue-on-error: true` on the hosted golangci-lint step (CI-06) keeps making the step list read green while the enforcing
   step is red. Changing the workflow is a gate-policy decision, so the fact is registered and the file is not touched.
6. `check:evidence`, `check-review`, `check-runtime-evidence`, `check-inheritance-contract` and the bare `--strict`
   `check-boundaries` are still not wired into CI or npm scripts (FR-016 / FR-017 open) — maintainer decision, not taken here.
7. Quotas stay display-only: nothing in this round changes write-side plan or quota enforcement, which remains outside contract V1.5.
8. `pantheon-ops`'s inheritance-doc changes are uncommitted in that repository, and the workspace-root docs sit outside every git
   repo, so they are not part of PR #427 and not reproducible from a clean checkout.
