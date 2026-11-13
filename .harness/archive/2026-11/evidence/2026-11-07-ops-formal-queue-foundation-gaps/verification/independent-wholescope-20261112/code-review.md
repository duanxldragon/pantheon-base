---
title: Whole-scope independent CODE review 2026-11-12
doc_type: Evidence
layer: platform
status: Active
updated_at: 2026-11-12
---

Task: `2026-11-07-ops-formal-queue-foundation-gaps`. Lane: independent CODE review of the whole source scope.

Scope: `git diff main...HEAD` at commit `06925edf` on `chore/close-formal-queue-foundation-gaps` (PR #504), 121 source files, +8426/-256, excluding `.harness/evidence` and `.harness/tasks`. Executor: local reviewer panel (maintainer-selected mode) because the installed external review lanes were unavailable for whole-scope review in prior batches.

Not covered: frontend visual spec/screenshot baseline item-by-item comparison, docs contract sentence-level diffing, full 563 lines of `candidate-artifact.test.mjs`, live CI runs, Ops consumer side.

## Verdict: APPROVE WITH FINDINGS

Confirmed clean:

- Permission-cache revocation repair (`login_runtime.go`): authoritative DB read with owning-tenant filter; Redis array read/write and `dropStalePlatformOnlyPerms` fully removed; `permission_cache_revocation_test.go` red->green is genuine (stale seeded, revoked in DB, perms empty and stale key untouched, regrant re-reads authority).
- `pkg/permissionroutes/registry.go`: two-phase validate->commit under write lock, zero side effects on failed batch, deep-copied Snapshot/Lookup, prefix/wildcard/traversal rejection tested; `role_policy_sync_test.go` covers grant and revoke.
- Tenant lifecycle: Update/Delete share the `SELECT ... FOR UPDATE` transaction with in-lock tombstone check; the delayed-activation revive defect is covered on both branches; accepting `ErrTenantNotFound || ErrConflict` does not weaken the invariant assertion.
- `authtoken.RefreshSessionActivity`: atomic Lua compare of raw token + KEEPTTL; uint64 comparison avoids Lua number precision issues.
- `businessauth` port: blacklist key accepts only `redis.Nil`; `ValidActivity` is read-only; mode drift fails closed. No real credentials in evidence (fixture noise only).

## Findings

| id  | sev | title                                                                                                | location                                                                                                     | disposition                                                                                                            |
| --- | --- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| C1  | P2  | Per-request full Casbin policy reload (>=3 loads per business request)                               | `backend/pkg/database/business_policy.go:15`, `backend/modules/auth/login/business_authorization.go:130-150` | Accepted design (fail-closed, no cache); capacity budget or request-scoped snapshot deferred to a follow-up task       |
| C2  | P2  | Global-first short-circuit hides tenant bindings and wider tenant data scope                         | `business_policy.go:62-66`                                                                                   | Preserves pre-existing semantics; must be pinned in the SYSTEM_AUTH contract (tracked with A-4)                        |
| C3  | P2  | auditpolicy outcome single-slot overwrite loses Conflict/Upstream classes                            | `backend/pkg/auditpolicy/policy.go`, `pkg/common/http/response.go:57,123`                                    | Follow-up: first-non-unknown or priority table                                                                         |
| C4  | P2  | Protected-route `FailWithError` drops i18n error key                                                 | `response.go:103-107`                                                                                        | Follow-up: keep code-owned key, strip cause                                                                            |
| C5  | P2  | foundation-release `O_NOFOLLOW ?? 0` silently degrades on Windows; defense reduces to fstat re-check | `scripts/foundation-release/build-candidate-artifact.mjs:38-47,135-158`                                      | CodeQL race alerts judged false positives for the CI-owned mkdtemp pipeline dir; add explicit comment on degraded path |
| C6  | P2  | `pkg/contracts` -> `internal/middleware` layering inversion (pkg->internal->pkg)                     | `backend/pkg/contracts/business_tenant_groups.go:10`                                                         | No import cycle; sink `ReadBusinessDataScope` to a pkg leaf in a follow-up                                             |

Inheritance boundary verified: `modules/system/*` has zero business imports.
