# Task Packet: 2026-11-07-ops-formal-queue-foundation-gaps

## Goal

Repair shared contracts required to complete the formal Ops queue; official release and consumption remain pending.

2026-11-09 scope extension explicitly authorized by the maintainer: extend the Base business-tenant contract and implement/accept O4 user/tenant-isolated history and saved views in the same Base/consumer batch. Adopt first in the observability query workspace; unrelated legacy business modules must not be described as isolated. The implementation-ready plan and critic review must cover all §2.6 prerequisites, including actual generator/bootstrap support, resource matrix/schema, version/deprecation and formal consumer transition.

## Primary Layer

platform

## Workspace Context

- Target Repository: `pantheon-base`
- Repository Role: `foundation-source`
- Upstream Dependencies: `pantheon-harness`
- Downstream Consumers: `pantheon-ops`
- Sync Expectation: required
- Release Requirement: foundation-release

## Dependency Layers

- system/iam
- inheritance-sync

## Contract Anchors

- `AGENTS.md`
- `DESIGN.md`
- `docs/designs/OPERATIONAL_WORKBENCH_COMPONENTS_DESIGN.md`
- `docs/contracts/SYSTEM_IAM_CONTRACT.md`
- `docs/contracts/TENANT_CONTRACT_V1.md`
- `docs/designs/TENANT_RESOURCE_SCOPE_MATRIX.md`

## Harness Profile

- Template: admin-platform
- Overlay: pantheon-base
- Quality Profile: ci-workflow
- Portable Failure Class: release-consumer-handoff
- Owner Layer: foundation-source
- Ratchet Decision: registry-only
- Coverage Dimensions:
  - behaviour
  - maintainability
  - architecture-fitness

## Scope

### In

- Shared operational UI, public permission-route and dashboard adapters, consumer packaging.
- Maintainer-authorized opt-in business tenant contracts, fresh authentication/authorization and audit, required tenant generator bootstrap, and isolated sealed candidate producer/consumer tooling. The approved revision4 implementation plan and exact ownership are linked below; Ops datasource/history/views adoption and actual isolation acceptance remain required.

### Out

- Business semantics in Base, Ops shared overrides, production mutation, gate exemptions.

## Expected Files

### Create

- Exact create paths are declared in `expectedFiles.create` of `.harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/manifest.json`: permission-route registry/tests, consumer artifact configuration, operational Dashboard adapters/tests and this task's governance/evidence files.

### Modify

- Exact modify paths are declared in `expectedFiles.modify` of the same manifest: IAM discovery/policy tests, operational UI and i18n, Dashboard extension points and canonical consumer documentation.

### Do Not Touch

- Production data.
- Shared inherited source in `pantheon-ops`.
- Historical completed acceptance artifacts.

## Implementation Notes

- Reuse existing public component, permission-route, Dashboard and archive-projection contracts; add no dependencies or business semantics to Base.
- Source ownership, verification selection and acceptance criteria remain in the existing manifest; this packet repair changes no implementation scope or approval status.
- Dispatcher owns governance/integration. Installed Generator roles and the bounded fallback recorded in the plan own source changes; independent source review and rendered UI evidence are required.

## Verification Plan

- Frontend lint/types/build, targeted meaningful unit/browser evidence.
- Backend CGO race/vet and mapping tests; producer/consumer contracts.
- Independent CODE/ARCH review; immutable release/consumer reconstruction after checks.

## Linkage

- Task ID: `2026-11-07-ops-formal-queue-foundation-gaps`
- Task Manifest: `.harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/manifest.json`
- Plan: `.harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/plan.md`
- OpenSpec Change: none
- Superpowers Plan: none
- Plan References: `.harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/plan.md`
- Tenant implementation plan: `.harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/o4-tenant-implementation-plan.md` (revision4, SHA256 `9aaa0e53b43c040a4d04949693d3ef6ab4b086336fe953c3e04105400e4caaf7`)
- Tenant decision: `.harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/o4-tenant-authorization.md`
- Independent plan CODE/ARCH: `.harness/evidence/2026-11-07-ops-formal-queue-foundation-gaps/o4-plan-revision4-independent-code-v2.md` and `o4-plan-revision4-independent-arch-v2.md`; these approve the plan only.
- Evidence Directory: `.harness/evidence/2026-11-07-ops-formal-queue-foundation-gaps/`
- Review File: `.harness/evidence/2026-11-07-ops-formal-queue-foundation-gaps/review.md`

## Evidence Required

- .harness/evidence/2026-11-07-ops-formal-queue-foundation-gaps/summary.md
- .harness/evidence/2026-11-07-ops-formal-queue-foundation-gaps/commands.json
- .harness/evidence/2026-11-07-ops-formal-queue-foundation-gaps/review.md
- Unit/race/build transcripts and rendered browser captures, with source revision limits and explicit gaps.

## Human Gates

- Final visual and functional acceptance.
- Production and policy exception decisions remain outside local implementation.
- No official publication or consumer lock replacement is inferred from local validation.

## Completion Checklist

- [x] Layer and boundary declared
- [x] Quality profile or explicit `none` declared
- [x] Ratchet decision declared for repeated failures
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
- [ ] Official immutable release and downstream consumption verified
- [ ] Final visual and functional acceptance recorded

## Status

completed for the Base-owned local scope on 2026-11-12; no shared consumer update, official release, independent approval or external acceptance is claimed.

Closeout 2026-11-12: the four local acceptance criteria are satisfied. Provider-owned permission routes are registered through `backend/pkg/permissionroutes` and consumed by role synchronization and workbench coverage without importing business code into `system/*`; the shared ConditionBuilder/ExecutionStepRail contracts, bounded Dashboard extension and consumer governance artifacts have unit and rendered evidence; the permission-cache revocation repair is verified red->green. Four test paths forecast by the manifest were delivered as consolidated coverage (`internal/scaffold/workspace_test.go:227`, `pkg/contracts/business_tenant_groups_test.go`, `pkg/contracts/module_required_test.go`) rather than duplicate files. Local gates: affected-set CGO race 17 packages exit 0 with no data race, vet and `go build ./...` exit 0, frontend eslint/type-check/vitest 240 passed/vite build exit 0, all six doc-harness checkers pass. Residuals: no independent CODE/ARCH approval, no normal candidate, no official release, no Ops consumption (lock still v0.18.6), no final visual/functional acceptance, Ops-side CMDB/O2/O3/O4/D2 product acceptance still open, real S3 skip unwaived and freeze unsigned. Evidence: `.harness/evidence/2026-11-07-ops-formal-queue-foundation-gaps/verification/continuation-20261112-closeout/checkpoint.md`.

2026-11-12: O2 shared-permission product repair is in implementation after design-r3 received independent CODE design APPROVE and ARCH APPROVE/CLEAR. The permission-cache revocation repair is implemented and locally verified: `Runtime.GetUserPerms` now reads the authoritative owning-tenant query only, the Redis permission-array read/write and `dropStalePlatformOnlyPerms` are removed, and `permission_cache_revocation_test.go` fails on the pre-repair source (`revoked permission survived through the cache`) and passes on the repair. Auth/login (254.286s), permissionroutes, iam/role, iam/permission and contracts tests pass on real MySQL 33316 and task-owned Redis 26317; `go vet` and `go build ./...` pass. Candidate 74d43c72 was generated normally (1166 sources, full CGO race 50 packages/2197 tests, one explicit unconfigured-S3 skip) but is not consumed. Still open: full `./...` CGO race, independent CODE/ARCH review of this repair, normal combined candidate, official release and Ops consumption. All six Ops P0 parents remain open and the official foundation lock is unchanged.

2026-11-12 closeout batch 2: the whole-scope independent CODE and ARCH lanes were executed by the maintainer-selected local reviewer panel on PR #504 (`main...06925edf`): CODE APPROVE WITH FINDINGS (six P2) and ARCH APPROVE WITH FINDINGS, overall CLEAR (one P1 A-1 permissionroutes Seal symmetry scheduled for the pre-release batch). Reports and disposition are recorded in `.harness/evidence/2026-11-07-ops-formal-queue-foundation-gaps/verification/independent-wholescope-20261112/` and the review.md section `Whole-scope independent review batch 2026-11-12`. CI remediation on the same branch: go-lint new-code findings cleared, `TestTenantOwnerLifecycleDelayedActivationCannotRevive` now asserts the wrapped `common.ErrConflict`, and evidence trees/raw race logs/hash manifests carrying fixture credentials and gitleaks false positives were untracked. Official immutable release, Ops consumption and final maintainer acceptance remain open gates.

## Current delivery supersession — 2026-11-13

The historical no-review/no-release statements above describe their original checkpoints. Whole-scope review and merged PR #504 are recorded in this task's review artifact; official v0.18.7 was published at immutable 3203624e with four verified assets. Ops PR #183 carries official acquisition/rebuild/validation evidence and awaits final merge. Final maintainer acceptance, separate Ops product acceptance, unwaived S3 coverage, unsigned freeze and deferred FR028 remain open in their declared scopes.

Official handoff update: Ops PR #183 merged at fc3fa867630580f7bcf1d40082a77f6b2548ac56 after source-bound official v0.18.7 validation and successful final GitHub Actions. This supersedes the immediately preceding pending-merge statement; separate maintainer/product/provider acceptance remains open in its own scope.
