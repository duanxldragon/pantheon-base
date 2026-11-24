---
title: Owned business runtime settings supply
doc_type: Remediation
layer: system/config
status: Active
updated_at: 2026-11-17
linked_contracts:
  - docs/contracts/SYSTEM_CONFIG_CONTRACT.md
  - docs/contracts/TENANT_CONTRACT_V1.md
---

# Task Packet: 2026-11-17-business-runtime-settings

## Goal

Provide startup-owned ordinary business configuration defaults and a request-bound system supplier without business imports of system repositories.

## Primary Layer

system/config

## Workspace Context

- Target Repository: pantheon-base
- Repository Role: foundation-source
- Upstream Dependencies: pantheon-harness
- Downstream Consumers: pantheon-ops
- Sync Expectation: required
- Release Requirement: foundation-release

## Dependency Layers

Public contracts, system/config setting store and validation, trusted tenant middleware and strict mode reader.

## Harness Profile

- Template: custom
- Overlay: pantheon-base
- Coverage Dimensions:
  - behaviour
  - architecture-fitness
  - runtime-quality

## Contract Anchors

- `docs/contracts/SYSTEM_CONFIG_CONTRACT.md`
- `docs/contracts/TENANT_CONTRACT_V1.md`
- `AGENTS.md`

## Scope

### In

- Immutable declarations, exact-key namespace restrictions and one system supplier.
- Required two-mode startup, transactional insert-if-missing, metadata rejection, request snapshot/mode verification, isolated MySQL regressions and CN/EN contract.

### Out

- Official publication, production, Ops lock/tree replacement, Host tenant migration, UI redesign and unrelated existing edits.

## Expected Files

### Create

- backend/pkg/contracts/business_runtime_settings.go and tests.
- backend/modules/system/config/setting/business_runtime_settings.go and tests.
- backend/modules/system/business_runtime_settings.go and tests, linked task/evidence.

### Modify

- backend/modules/system/system.go required composition stage.
- backend/modules/system/config/setting/setting_seed.go declared default presentation.
- Canonical SYSTEM_CONFIG_CONTRACT CN/EN.

### Do Not Touch

- Existing auth/job/release changes, Ops shared snapshot, release lock, production and historical archive bytes.

## Implementation Notes

Primary Codex acts as Base Generator, independently reviewed by architect and code-reviewer. Reuse unique key, standard validators, strict ModeReader and required runner. Declarations precede system startup; failures stop serving. Request readers are immutable per-request, never shared mutable SetConfigReader injection. Detailed plan: .harness/tasks/2026-11-17-business-runtime-settings/plan.md.

## Verification Plan

- Windows CGO required-MySQL race TestBusinessRuntimeSettings for contracts/setting/system.
- Complete race for those three related packages and go vet.
- Matching-key reserved namespace fix test after review finding; component tests do not prove whole authentication chain or Ops Host isolation.
- Scoped task/evidence/review/contract metadata gates, independent two-lane review.

## Linkage

- Task ID: 2026-11-17-business-runtime-settings
- Task Manifest: .harness/tasks/2026-11-17-business-runtime-settings/manifest.json
- Superpowers Plan: none
- Plan References: .harness/tasks/2026-11-17-business-runtime-settings/plan.md
- Evidence Directory: .harness/evidence/2026-11-17-business-runtime-settings/
- Review File: .harness/evidence/2026-11-17-business-runtime-settings/review.md
- Change Reference: none
- OpenSpec Change: none

## Evidence Required

Actual commands/outcomes, source hashes, real MySQL defaults/tenant/rollback/concurrency witnesses, independent review and explicit publication/consumer/full-product gaps.

## Human Gates

Official publication, final Ops tree replacement and product/production acceptance remain separate maintainer gates. No release or production action is performed by this task.

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed

Code recommendation COMMENT; architecture CLEAR. Review completion does not approve release.

- [ ] Official foundation publication and downstream consumption
