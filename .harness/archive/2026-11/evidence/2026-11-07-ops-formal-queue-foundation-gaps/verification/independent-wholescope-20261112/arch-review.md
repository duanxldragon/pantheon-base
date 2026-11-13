---
title: Whole-scope independent ARCH review 2026-11-12
doc_type: Evidence
layer: platform
status: Active
updated_at: 2026-11-12
---

Task: `2026-11-07-ops-formal-queue-foundation-gaps`. Lane: independent ARCH review of the whole source scope.

Scope: `git diff main...HEAD` at commit `06925edf` (PR #504), excluding `.harness/evidence` and `.harness/tasks`. Context read first: `AGENTS.md`, `DESIGN.md`, `SYSTEM_IAM_CONTRACT.md`, `TENANT_CONTRACT_V1.md`, `TENANT_RESOURCE_SCOPE_MATRIX.md`, `OPERATIONAL_WORKBENCH_COMPONENTS_DESIGN.md`, task `plan.md`. Executor: local reviewer panel (maintainer-selected mode).

Not covered: live runtime end-to-end (MySQL/Redis/Prometheus), Ops-side consumption changes, evidence content authenticity, CODE-lane fine-grained defects.

## Boundary and In/Out

- Grep confirms no `modules/business` imports in `system/*` and `pkg/*`; permissionroutes acts as a provider-owned classifier (literal `business:<domain>` prefixes + same-domain path validation) with zero Base-side registration, matching the plan's "Base owns classifier / Ops registers its own keys".
- V2.0-O4 business-tenant increments, permission-cache repair and controlled ConditionBuilder editing are all explicitly authorized in `plan.md`; no drift into business semantics, Ops shared overrides or gate exemptions.
- `.gitignore` change only untracks evidence copies carrying fixture credentials/gitleaks noise; receipts remain. Not a gate weakening.
- Docs drift is good: TENANT_CONTRACT §2.7/§2.1, SYSTEM_AUTH OwnerLifecycle port, MODULE_CONTRACT, SCOPE_MATRIX, DESIGN.md all synchronized; docs consistently state "un-released, unconsumed".

## Verdict: APPROVE WITH FINDINGS — overall CLEAR (no P0/P1 blocker; A-1 should be closed or explicitly deferred before the official foundation release)

| id  | sev      | title                                                                                                                                                           | location                                                                                                                                     | recommendation                                                                                                                           |
| --- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| A-1 | P1       | permissionroutes registry lacks `Seal()` and real-route validation, asymmetric with auditpolicy and the governance design's "startup registration only" promise | `backend/pkg/permissionroutes/registry.go:29-128` vs `docs/designs/PERMISSION_WORKBENCH_GOVERNANCE_DESIGN.md` §7 and `auditpolicy/policy.go` | Add `Seal()` called alongside `SealBusinessTenantProviders` plus `ValidateRoutes`, or downgrade the doc claim with an explicit gap entry |
| A-2 | P2       | Contract package carries runtime implementation (gin/redis/authtoken) and imports `internal/middleware`                                                         | `backend/pkg/contracts/businessauth/businessauth.go:95-190`                                                                                  | Split session/checkpoint runtime into `pkg/businessauthruntime`; keep port package pure                                                  |
| A-3 | P2       | auditpolicy classifies 5xx as `denied` although `OutcomeUpstream/Storage` exist                                                                                 | `backend/pkg/auditpolicy/policy.go` (`Metadata` status fallback)                                                                             | Map by status band (>=500 -> upstream/storage)                                                                                           |
| A-4 | P2       | SYSTEM_IAM_CONTRACT does not register the workbench/role-sync binding source extension                                                                          | `docs/contracts/SYSTEM_IAM_CONTRACT.md`; `permission_workbench.go:664-690`                                                                   | Add one pointer line to PERMISSION_WORKBENCH_GOVERNANCE_DESIGN §7                                                                        |
| A-5 | P2       | Candidate tooling not wired into any CI/release orchestration yet                                                                                               | `scripts/foundation-release/*.mjs`                                                                                                           | Provide cut/publish orchestration or explicit deferral before release; design itself is fail-closed, atomic and reversible               |
| A-6 | P2(info) | Generator `tenant` DataScopeMode enablement consistent; verify real-run evidence is referenced by the release gate                                              | `backend/internal/scaffold/contract.go:91`, frontend `schema.ts`                                                                             | Reference `verify-tenant-generated-runtime.mjs` results before claiming V2 generation is available                                       |

Confirmed clean: permission-cache repair minimal and directional; tenant Update/Delete lock+post-commit revocation matches contract §2.1; telemetry middleware ordering and legacy single-span assertions consistent; frontend ConditionBuilder/ExecutionStepRail/Dashboard dataSource changes are additive, read-only by default, backward compatible, i18n complete in all five languages.
