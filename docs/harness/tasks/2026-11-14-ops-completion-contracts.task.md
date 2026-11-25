---
title: Authorize durable business jobs from current owner permissions
doc_type: Remediation
layer: system/auth
status: Active
updated_at: 2026-11-14
linked_contracts:
  - docs/contracts/SYSTEM_AUTH_CONTRACT.md
  - docs/contracts/TENANT_CONTRACT_V1.md
---

# Task Packet: 2026-11-14-ops-completion-contracts

## Goal

Provide the optional auth-owned live authorization port needed by durable Ops FileDist jobs, without persisting sessions or copying system authorization into business code.

## Primary Layer

system/auth

## Workspace Context

- Target Repository: `pantheon-base`
- Repository Role: `foundation-source`
- Upstream Dependencies: `pantheon-harness`
- Downstream Consumers: `pantheon-ops`
- Sync Expectation: `required`
- Release Requirement: `foundation-release`

## Contract Anchors

- `AGENTS.md`
- `docs/contracts/SYSTEM_AUTH_CONTRACT.md`
- `docs/contracts/TENANT_CONTRACT_V1.md`
- `backend/pkg/contracts/business_tenant_groups.go`
- `.harness/tasks/2026-11-14-ops-completion-contracts/manifest.json`

## Dependency Layers

Public business contracts, IAM policy/data scope, strict configuration mode reader, trusted business-owned job records.

## Harness Profile

- Template: custom
- Overlay: pantheon-base
- Quality Profile: runtime-quality
- Owner Layer: system/auth
- Coverage Dimensions:
  - behaviour
  - architecture-fitness
  - runtime-quality

## Scope

### In

- Optional `JobAuthorizationReader` and its startup accessor.
- Trusted numeric owner, registered business action, fresh enabled/non-deleted owner and role/key/policy/data-scope reads.
- Initial support is live compat mode and resource tenant 0 only.

### Out

- New HTTP endpoint, session authorization changes, tokens stored in jobs, multi-tenant jobs.
- Business target/source decisions, production changes, commit/push/publication, local Ops shared overrides.

## Expected Files

### Create

`backend/pkg/contracts/businessauth/job_authorization.go`, `backend/modules/auth/login/business_job_authorization.go`, their regression tests and linked task/evidence artifacts.

### Modify

`backend/pkg/contracts/business_tenant_groups.go` and tests for optional startup access; `docs/contracts/SYSTEM_AUTH_CONTRACT.md` for durable job semantics.

### Do Not Touch

Existing dirty release naming changes, Ops shared snapshot, production, historical fixtures and unrelated auth/session code.

## Assumptions and Open Questions

The coordinator confirmed existing durable schedules survive logout and cold restart. This change adds current-owner authorization at execution; owner disable/deletion, permission revocation, invalid mode and uncertain storage deny. It does not infer an actor from a legacy username.

## Implementation Notes

- Minimal Complexity Rung: reuse existing auth-owned reader and authoritative IAM/data-scope reads.
- Keep the session Reader unchanged; add one optional capability on the existing auth-owned adapter.
- Add one optional registry accessor; never fall back to the metadata-only lifecycle reader.
- No table, token, policy cache or new HTTP surface is added.
- Business code depends on the public read port only; it never imports system repositories.

## Structural Scope

- Affected Subgraph: business startup registry -> optional JobAuthorizationReader -> auth adapter -> existing authoritative user/IAM/data scope reads.
- Boundary Crossings: business calls a public read port; it does not import system repositories.
- Risk Nodes: trusted job owner, registered action, current mode, permission revocation and nil data scope.
- Graph Focus: CodeGraph context for businessAuthorizationReader/readBindings/grantBusinessAuthorization.

## Context Strategy

- Entry Sources: AGENTS.md, current task, SYSTEM_AUTH_CONTRACT.md and existing business authorization implementation.
- Retrieval Order: entry -> summary -> raw.
- Retrieval Helpers: CodeGraph CLI.
- Promotion Target: public auth contract and regression tests.
- Sensitive Context: never retain token, password or DSN in evidence.

## Verification Plan

- `CGO_ENABLED=1 go test -race -p=1 -count=1 ./pkg/contracts/businessauth ./pkg/contracts ./modules/auth/login`（工作目录 `backend`，`PANTHEON_TEST_DSN_REQUIRED=true` + 隔离真实 MySQL）
- `go vet ./pkg/contracts/businessauth ./pkg/contracts ./modules/auth/login`（工作目录 `backend`）
- 失败前 witness：`red-capability.log`；真实 MySQL 矩阵：`green-job-auth.log`
- 覆盖范围：能力可用性、无 session 的新鲜 DataScope、owner/role/key/policy 撤销矩阵、未注册/歧义 action 拒绝、存储不可用与取消、可选启动兼容与私有 JSON 类型
- 最终完整 Base 与下游发布/消费门禁由协调方持有，不在本包内代签

## Success Criteria

The auth adapter grants only current authorized enabled owners in compat tenant 0, returns a fresh nonnil DataScope and fails opaquely on all uncertain inputs/stores. Logout/session absence does not revoke a durable job. Exact registered action and trusted current targets/source remain distinct required checks.

## Linkage

- Task ID: 2026-11-14-ops-completion-contracts
- Task Manifest: .harness/tasks/2026-11-14-ops-completion-contracts/manifest.json
- Superpowers Plan: none
- Plan References: ../pantheon-ops/.harness/tasks/2026-11-14-ops-latest-foundation-and-plans/current-execution-plan.md
- Evidence Directory: .harness/evidence/2026-11-14-ops-completion-contracts/
- Review File: .harness/evidence/2026-11-14-ops-completion-contracts/review.md
- Change Reference: none
- OpenSpec Change: none

## Evidence Required

Raw red/green command outcomes, source bindings, isolated SQL behavior and cleanup, opaque denials, targeted CGO race/vet/build, independent review and explicit full release/consumer gap.

## Human Gates

The coordinator obtains any required final publication decision after the Base patch is concrete and verified. This task does not publish a release or sign production/final product acceptance.

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [ ] Review completed
- [x] Failed-before witness and fresh regressions recorded (`red-capability.log`, `green-job-auth.log`)
- [x] Targeted vet/contract/module tests passed on real MySQL (`green-job-auth.log`); an unrelated later TSan infra allocation failure is not a code red
- [ ] Independent review complete (workflow-required, not superseded by coordinator evidence)
- [ ] Official release and Ops consumption complete (human/maintainer gate)
