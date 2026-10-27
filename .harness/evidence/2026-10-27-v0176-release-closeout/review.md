# Review — 2026-10-27 v0.17.6 release closeout

Reviewed against `main` at `7dafa997`, with `pantheon-base-v0.17.5` (tag object `42495b25`, target
`ed636967`) as the previous release. The release range is `ed636967..7dafa997`; the release target is
the merge commit of this packet, not `7dafa997`, because `Release Gate Summary` must be green on the
commit that gets tagged.

## Scope audit

`git diff --stat ed636967..7dafa997` reports 303 files, +13767 / −635 across five merges. The bulk is
`c1b1d702` (#427, 271 files): new backend files under `modules/system/iam/tenant`
(`tenant_ops_handler.go`, `tenant_ops_view.go`, `tenant_plan_model.go`, `tenant_plan_store.go`), the
`000030` migration pair, the tenant-operations frontend module, the shared `PasswordInput`, and the
governance-artifact zeroing. `be75b54d` (#424) is 28 files confined to `system/config/dict`,
`system/iam/{permission,role,user}`, `system/org/{dept,post}`, `pkg/impexp` and their tests.
`601ae446`, `9371594e` and `7dafa997` are docs and dependency manifests only.

This packet itself touches no production code: `VERSION`, `CHANGELOG.md`, `README.md`,
`README.en.md`, the new `RELEASE_NOTES_v0.17.6.md`, and the packet/manifest/evidence set.

## Claim audit

| Release-note / packet claim | Evidence |
|---|---|
| Schema moves 29 → 30 | `000030_tenant_plan_definitions` is the last numbered migration; `TestRunMigrationsAlignsRuntimeSchemaWithCurrentContracts` PASS 7.04s on real MySQL |
| The plan table is platform-global and the seed is per-code, never an UPDATE | read of the migration header and body: `CREATE TABLE IF NOT EXISTS \`tenant_plans\``, four guarded INSERTs, no `UPDATE`; `TestPlanStore_SeedDefaultsIsIdempotentAndNeverUndoesTheOperator` PASS |
| Thresholds are unchanged for existing tenants | the four seeded rows carry the values the old `GetDefaultQuota` switch produced; `TestPlanStore_QuotaForResolvesThroughTheTable` PASS |
| `-1` unlimited, `0` rejected, codes constrained | `TestPlanStore_CreateRequiresEveryCeiling` and `TestPlanStore_CreateRejectsIllegalCodes` PASS; `planCodePattern` is `^[a-z][a-z0-9_-]{1,31}$` |
| Retirement is refused while tenants carry the code | `TestPlanStore_RetiringAnAssignedPlanIsRefused` PASS (`PlanStore.Update` → `ErrPlanInUse`) |
| Five new routes bound to five new permission codes | `permission_workbench.go:637-641`; `TestOverview_*`, `TestMemberListing_*`, `TestListPlans_*` PASS (package ok in 12.512s) |
| The menu seed and the router agree | `seed.go:151` creates `tenant-ops` (M, sort 25) and parents overview / tenant / tenant-member; `TestTenantOpsMenuSeedContract` PASS 0.82s; `check-menu-contract` passes at 19 menus / 23 routes / 102 permissions / 23 component keys |
| Compat scope is pinned in the six services | `TestDeptCompatScopePinsGlobalPopulation`, `TestDeptImportCompatStaysInGlobalTree`, `TestPostService_ImportPostsStampsRequestTenant` PASS (dept 0.704s, post 0.583s) |
| An orphan parent no longer blocks import/export | `TestBuildDeptPathMaps_OrphanParentIsPathBoundary` PASS |
| Role saves reach the enforcement view | `TestRoleService_CreateRoleSyncsKnownPermissionAPIPolicies` 0.84s, `...PreservesManualPolicies` 0.81s, `TestRoleTenantScope_RolePolicySyncUsesTenantSubject` 0.75s PASS |
| Same-tenant switch is a client rejection, not a 500 | `TestTenantSwitchErrorCodeClassifiesClientRejections` PASS |
| Security-event confirmation returns the governed code | `TestBatchAcknowledgeSecurityEvents` PASS 0.30s |
| Reset password clears the lock counters | `TestUserService_ResetPassword` PASS 1.29s |
| Every password surface announces itself | `check-password-toggle` 0 findings across 257 files; no raw `Input.Password` remains |
| Boundary baseline is empty and enforced | `config/boundary-baseline.json` `entries: []`; `check-boundaries --strict` and `--strict --baseline` both report no findings |
| Frontend contract chain and build are green | all 14 `prebuild` scripts pass; `tsc -b` exit 0; `eslint --max-warnings 0` exit 0; `vite build` in 774ms |
| Backend is green at the CI form | build/vet/gofmt clean; `golangci-lint run --new-from-rev=main ./...` exit 0 with no findings; full suite 46 ok / 0 FAIL / 0 SKIP |
| Quotas are still display-only | no rejection path was added; the contract text and `tenant_ops_view.go` comments state it, and no gate test asserts enforcement |

## Findings

No blocking finding in the release content. Residuals and follow-ups:

- **F1 (P2, follow-up)**: publication facts do not exist yet. `README.md`, `README.en.md`,
  `.harness/STATUS.md` and `CHANGELOG.md` describe the tag and the four assets ahead of publication;
  the tag object, asset SHA-256 values and the `Foundation Release Verify` run id must be written in
  the follow-up commit, as v0.17.5 did through PR #423. Approving this packet does not assert them.
- **F2 (P2, follow-up)**: SonarCloud has not analysed this branch, so the quality-gate statement in the
  release notes is carried from the previous green run and must be re-read from the PR checks before
  merging.
- **F3 (P3, environment)**: the 16 `module.generate.server_export_failed` failures without
  `PANTHEON_NODE_BIN` are the already-documented F5 limitation, reproduced and then cleared by
  re-running `modules/lowcode/...` with `PANTHEON_NODE_BIN` and `PANTHEON_WORKSPACE_ROOT` (ok 15.256s).
  Recording a backend suite reading without those variables would be a false negative, so the reading
  in this packet is the configured one.
- **F4 (P3, gate observation)**: `check-inheritance-contract` run with `--root .` inside
  `pantheon-base` reports a finding against `pantheon-base/.github/pull_request_template.md` because
  the gate is workspace-level. It is not a defect and not this packet's job to fix; the correct
  invocation (`--root ..`, 0 findings) is now written into the packet's Verification Plan so the next
  round does not misread it again. This is the shape of gap FR-016 documents.
- **F5 (P3, accepted)**: local ThreadSanitizer still cannot start (error 87); the race gate stays CI
  Linux.
- **F6 (P3, accepted)**: quota enforcement, self-service password recovery and the FR-016 / FR-017 CI
  wiring remain out of scope by explicit decision.

## Verdict

Approved with documented P2 follow-up. The release content is exactly what the five merged PRs carry,
each release-note claim maps to a test or a file read recorded in `commands.json`, the packet changes
no production code, and the local gate set is green. The follow-up is publication-state only: F1 and
F2 must be closed by the CI readings and the post-publish facts commit before this release is declared
consumable, and `pantheon-ops` consumption is tracked separately, not asserted here.

## Machine Readable

```json
{
  "taskId": "2026-10-27-v0176-release-closeout",
  "verdict": "approved with documented P2 follow-up",
  "structuralReview": {
    "affectedSubgraph": [
      "release/version-material",
      "system/iam/tenant",
      "system/iam/permission",
      "system/org/dept",
      "system/org/post",
      "platform/menu-contract",
      "frontend/components/patterns/forms"
    ],
    "checks": ["cycle", "hub", "sensitive-flow"],
    "findings": [
      "F1 (P2, follow-up): publication facts (tag object, four asset checksums, Foundation Release Verify run) do not exist yet; README, STATUS and CHANGELOG describe the release ahead of them and must be corrected forward in the follow-up commit.",
      "F2 (P2, follow-up): SonarCloud has not analysed this branch; the quality-gate line in RELEASE_NOTES_v0.17.6.md is carried from the previous green run until CI reports it."
    ],
    "notes": "The packet adds only version material and governance artifacts, so it introduces no module edge. The released subgraph does: tenant_plans becomes a new hub read by the overview, member-listing and plan-editor paths, all three of them platform-scoped reads behind five new permission codes, which is why sensitive-flow was checked against the tenant-confinement rule (platform-global table with no tenant_id, confinement applied by explicit WithTenantScope in the services). No path in the released content takes two parent locks, so the v0.17.5 lock-order conclusion still holds and no cycle appears. The MenuNode promotion removes a platform -> system/iam edge instead of adding one, and the baseline is empty, so a future edge of that shape fails the gate rather than being whitelisted."
  },
  "linkage": {
    "taskManifest": ".harness/tasks/2026-10-27-v0176-release-closeout/manifest.json",
    "evidence": ".harness/evidence/2026-10-27-v0176-release-closeout/commands.json",
    "reviewFile": ".harness/evidence/2026-10-27-v0176-release-closeout/review.md",
    "changeRef": "none",
    "planRefs": [
      "docs/VERSION_MANAGEMENT_GUIDE.md",
      "docs/harness/tasks/2026-10-24-v0175-release-closeout.task.md",
      ".harness/evidence/2026-10-24-single-tenant-scope-closeout/summary.md"
    ]
  }
}
```
