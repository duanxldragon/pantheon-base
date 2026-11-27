---
title: Authorize durable business jobs in multi-tenant mode
doc_type: Acceptance
layer: system/auth
status: Active
updated_at: 2026-11-27
linked_contracts:
  - docs/contracts/SYSTEM_AUTH_CONTRACT.md
  - docs/designs/FOUNDATION_RELEASE_MODEL.md
---

# Task Packet: 2026-11-27-tenant-business-job-authorization

## Goal

Allow durable business jobs to refresh the current owner's grant in their
persisted tenant. Publish the compatible Foundation update for Ops T14.

## Primary Layer

system/auth

## Workspace Context

- Target Repository: pantheon-base
- Repository Role: foundation-source
- Upstream Dependencies: reviewed Harness policy receipt in `.harness/method-consumption.json`
- Downstream Consumers: pantheon-ops
- Sync Expectation: required
- Release Requirement: foundation-release

## Dependency Layers

Auth owns the current tenant, owner, membership, role, permission and data-scope
checks. The shared business contract exposes the grant. Business services own job
persistence, dispatch, source and target checks, and provider calls. Platform
publishes the tested Foundation snapshot.

## Harness Profile

- Template: event-processor
- Overlay: pantheon-base
- Quality Profile: auth-security
- Delivery Tier: L2
- Coverage Dimensions:
  - behaviour
  - architecture-fitness
  - runtime-quality

## Contract Anchors

- `docs/contracts/SYSTEM_AUTH_CONTRACT.md`
- `docs/designs/FOUNDATION_RELEASE_MODEL.md`
- `docs/VERSION_MANAGEMENT_GUIDE.md`

## Scope

### In

- Extend `JobAuthorizationReader` to active tenants with a current owner grant.
- Keep support for platform jobs in compat mode and deny invalid mode/tenant pairs.
- Verify tenant isolation and revocation, then publish Foundation v0.19.1.

### Out

- Ops implementation, provider and production acceptance. Ops T14 tracks consumption and file distribution behavior.
- Changes to session APIs, permission catalogs, schemas or migrations.

## Expected Files

### Create

- The task packet, manifest, runtime receipts, review and PR body.
- Foundation v0.19.1 release, upgrade and consumer notes.

### Modify

- `backend/modules/auth/login/business_job_authorization.go` and its tests.
- `backend/pkg/contracts/businessauth/job_authorization.go` and the auth contract.
- Base VERSION, changelog, release note indexes and task index.

### Do Not Touch

- Published tags and assets, existing runtime data and other worktrees.

## Implementation Notes

- Minimal Complexity Rung: reuse the existing authorization reader, membership and policy checks.
- Owner Layer: system/auth and its shared optional business port.
- Required Sensors: configured CGO race, system smoke, secret and permission checks, and release asset validation.
- Required Evidence: red and green MySQL tests, full race result, independent review, exact-commit hosted gates and official assets.
- Ratchet Decision: sensor-added.
- GitHub Signal: repo-quality-gate.

## Verification Plan

- Prove valid grants, same-name role isolation, cross-tenant denial, refreshed
  scope after restart, revocation, tenant suspension and compat on local MySQL.
- Run backend race with isolated schemas and task-owned local Redis.
- Run scoped Go lint, method, task, docs, evidence and security checks.
- Pass PR checks and exact-commit Full Smoke and Release Gate. Verify the two
  release archives and their SHA256 files against the immutable tag.

## Linkage

- Task ID: 2026-11-27-tenant-business-job-authorization
- Task Manifest: .harness/tasks/2026-11-27-tenant-business-job-authorization/manifest.json
- Evidence Directory: .harness/evidence/2026-11-27-tenant-business-job-authorization/
- Review File: .harness/evidence/2026-11-27-tenant-business-job-authorization/review.md
- Change Ref: none
- OpenSpec Change: none
- Superpowers Plan: none
- Plan References: none

## Evidence Required

The [summary](../../../.harness/evidence/2026-11-27-tenant-business-job-authorization/summary.md) records test scope,
fixture cleanup, candidate identity, hosted verification and publication status.
Ops independently verifies the rebuilt consumer and the provider boundary.

## Human Gates

- The maintainer authorized Base-first implementation, official release and Ops consumption.
- Required checks and independent reviews govern merge and publication. Final
  file distribution and provider acceptance belongs to Ops T14.

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
