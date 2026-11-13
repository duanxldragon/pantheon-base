# Base-first formal Ops queue continuation

Layer: shared platform and system/iam; L2. Reuse existing components, typed registration and producer contracts. Implement business semantics only in Ops. Source fixes precede review and official release/consumer synchronization. Production actions and gate weakening are excluded. Independent installed executors own disjoint source areas; dispatcher owns task/evidence integration.

Native executors and local Codex CLI failed with configured gpt-5.5 HTTP 503. Root uses the Generator fallback posture for bounded source changes. No independent approval is inferred. UI contracts remain backward compatible; editor labels plus onChange activate controlled editing and validation callbacks. Ops consumption still awaits an official released foundation.

## Dashboard retry feedback continuation

Independent source review identified delayed manual retry with no visible feedback. Preserve the per-widget request budget; do not reset nextAllowedAt on clicks. Show loading while a retry waits, clear the error control to prevent repeated clicks, and label retained snapshots as refreshing. Verify budget timing and retained snapshots in unit tests; capture desktop/mobile light/dark retry-waiting states. Existing bounded Generator fallback owns this source change. Formal release/consumption remains open.

## Condition editor review correction

Root bounded Generator fallback repairs two independently identified P2 lifecycle/ReactNode defects. Keep validation bound to accepted rendered props, expose a referenced heading for accessible names and use a string-only default input fallback while preserving readonly ReactNode fallback. Verify initial/external value/field updates, rejected controlled edits, cyclic values and ReactNode heading; operational units, full lint/build and desktop/mobile light/dark browser evidence. Supplied-source follow-up review required; timeout remains open. No Ops shared override or official release occurs.

## Authorized O4 tenant contract implementation

The maintainer explicitly selected Base business tenant contract extension plus same-batch actor/tenant isolation acceptance. The preserved revision4 plan `o4-tenant-implementation-plan.md` SHA256 `9aaa0e53b43c040a4d04949693d3ef6ab4b086336fe953c3e04105400e4caaf7` has independent CODE APPROVE and ARCH CLEAR. Three Generator lanes own fresh auth/audit APIs, tenant generator/required bootstrap, and sealed candidate tools; root owns canonical docs, manifests and acceptance integration. Ops adoption waits for independently reviewed APIs/tools. Original plan/review failures remain preserved; no implementation approval is inferred.

The shared old activity writer resurrection prerequisite is implemented and scoped-verified with actual Redis and 529 passing test events, zero skipped tests; independent `resume-token-independent-code.md` APPROVE applies only to its exact three files. Dirty-bootstrap has scoped real MySQL refusal/preservation evidence. Full source/runtime/official paired consumption and final functional/visual acceptance remain open. All parent tasks remain in-progress, and the official Ops foundation lock stays unchanged.

## O2 shared permission product repair — 2026-11-11/12

The consumed CMDB R3 run proved that stored business permission keys do not authorize public business routes: role35 was publicly emptied and read back exactly, yet the original session still failed the exact empty-key assertion at `/auth/me`. Ops public run result: 69 requests, 57 passing assertions, `exact current CMDB permission keys without wildcard` failed; the mutation was not replayed and all R2/R3 IAM objects plus the host1 fixture are retained.

Design-r3 is approved by independent CODE (design) and independent ARCH (APPROVE/CLEAR). Base owns the single registered-literal classifier, the shared `PolicyCoversRoute`, `StaticRouteMatcherFor`, the public guard, and the role-sync/workbench adapters; Ops registers its own 16 keys / 27 routes and six static GET guards. Base implementation and native tests are pending a new normal candidate; the already consumed R2/R3 attempts cannot certify this repair.

## Current permission cache revocation repair — 2026-11-12

Plan: `.harness/evidence/2026-11-07-ops-formal-queue-foundation-gaps/verification/auth-permission-cache-repair-20261112/plan.md`. Native source reads `user_perms:<id>` before ordinary database permissions, writes positive entries for five minutes, and has no caller of `InvalidateUserPermCache` on role/user updates, so a revoked permission can survive in Redis. The minimal repair removes only the Redis permission-array read/write from `Runtime.GetUserPerms`; no callback, dependency, schema or registry is added, and database errors stay errors rather than falling back to stale cache.

Verification requires preserved failed-before witnesses plus native grant/revoke/empty-revocation/regrant/user-role-unlink reads against a stale Redis entry, tenant filtering and database-error behavior, on CGO1/MinGW/Go1.26.10 with the authorized isolated Redis fixture. Fresh CODE/ARCH approval, a normal combined candidate, a fresh isolated runtime and a separately reviewed CMDB request are required before any revocation claim. No parent P0 closeout follows from this plan.

Implementation 2026-11-12: `GetUserPerms` now reads only the authoritative owning-tenant query; the Redis permission-array read/write and `dropStalePlatformOnlyPerms` are gone, and `InvalidateUserPermCache` remains a legacy-leftover cleanup surface only. `permission_cache_revocation_test.go` reproduces the defect on the pre-repair source (`revoked permission survived through the cache: [system:user:list system:user:delete]`) and passes on the repair, asserting the stale entry is neither read nor rewritten and that a regrant is immediately visible. Auth/login (254.286s), permissionroutes, iam/role, iam/permission and contracts tests pass with real MySQL 33316 and task-owned Redis 26317; `go vet` and `go build ./...` pass. Full `./...` CGO race, independent review, normal candidate, release and consumption remain open.

## Closeout — 2026-11-12

Base-owned local scope is complete and the task manifest is `completed`. Verification on the final working source: `go test -race -p 1` over auth, permissionroutes, system/iam, contracts, tenant, auditpolicy, middleware and scaffold — 17 packages exit 0, no data race; the same set without `-race` passes; `go vet` and `go build ./...` exit 0; frontend `eslint .`, `tsc -b`, `vitest run` (240 passed) and `vite build` exit 0; the six doc-harness checkers pass. The four test paths forecast by the manifest are covered by consolidated tests rather than duplicate files.

Declared residuals: independent CODE/ARCH review unavailable (no independent approval inferred), no normal combined candidate or official immutable release, Ops still on the unchanged v0.18.6 lock with no consumption of these repairs, final visual/functional maintainer acceptance not performed, Ops-side CMDB/O2/O3/O4/D2 product acceptance open, real S3 provider skip unwaived and maintenance freeze unsigned. Evidence: `verification/continuation-20261112-closeout/checkpoint.md`.
