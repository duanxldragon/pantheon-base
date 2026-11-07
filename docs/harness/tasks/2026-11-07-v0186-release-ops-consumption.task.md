---
title: 发布 Base v0.18.6、Ops 消费与三仓 main 收口
doc_type: Remediation
layer: platform
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
status: Active
updated_at: 2026-11-07
---

# Task Packet: 2026-11-07-v0186-release-ops-consumption

## Goal

Publish an immutable reviewed Base patch release, consume it in Ops through official artifacts, and consolidate all workspace repositories to main without losing prior work.

## Priority

P1；L2 发行与继承协调。

## Primary Layer

platform

## Dependency Layers

- inheritance-sync
- business/*

## Harness Profile

- Template: admin-platform
- Overlay: pantheon-base
- Coverage Dimensions:
  - behaviour
  - maintainability

## Workspace Context

- Target Repository: pantheon-base
- Repository Role: foundation-source
- Upstream Dependencies: pantheon-harness
- Downstream Consumers: pantheon-ops
- Sync Expectation: required
- Release Requirement: foundation-release
- Downstream Sync Note: Standard official186 acquisition/rebuild; tests before replacement/merge

## Contract Anchors

- `docs/designs/FOUNDATION_RELEASE_MODEL.md`
- `docs/harness/PANTHEON_BASE_DELIVERY_WORKFLOW.md`
- `docs/harness/VERIFICATION_EVIDENCE_SPEC.md`

## Scope

### In

- VERSION 0.18.6 and accurate release/changelog/task status documentation
- Standard producer Release Gate and four-asset immutable GitHub release
- Official Ops lock/acquisition/rebuild/full validation/merge
- Archive historical refs/dirty work; reconcile unique unpublished Harness docs; only main locally/remotely

### Out

- Platform/system/business runtime changes or new features
- Policy/gate weakening, solo-override, S3 waiver or freeze signature
- Production databases/credentials/deployment
- Reintroducing stale evidence states into main

## Expected Files

### Create

- docs/harness/tasks/2026-11-07-v0186-release-ops-consumption.task.md
- .harness/tasks/2026-11-07-v0186-release-ops-consumption/manifest.json
- .harness/evidence/2026-11-07-v0186-release-ops-consumption/commands.json
- .harness/evidence/2026-11-07-v0186-release-ops-consumption/summary.md
- .harness/evidence/2026-11-07-v0186-release-ops-consumption/review.md
- docs/release-notes/RELEASE_NOTES_v0.18.6.md

### Modify

- VERSION
- CHANGELOG.md
- .harness/STATUS.md
- docs/README.md
- docs/README.en.md

### Do Not Touch

- backend/
- frontend/
- scripts/
- .github/workflows/
- config/
- Historical original12 criteria/scope

## Implementation Notes

- Reuse standard release producer and Ops assembler; no new dependency/helper/product code.
- CODE/ARCH approve preparation only; publication and consumer acceptance stay pending until exact runtime/hosted evidence.
- Quality Profile: ci-workflow
- Portable Failure Class: release-consumer-handoff
- Owner Layer: platform / foundation-source
- Consumer-Specific Controls: official lock, full rebuild, readonly CGO race
- Required Sensors: governance, Release Gate, official acquisition, consumer validation
- Required Evidence: exact commits/hashes/commands/results and independent review
- Ratchet Decision: no-repeat-observed
- Delivery Governance: L2
- GitHub Signal: repo-quality-gate
- Deferred Code Issues: existing explicit residuals only
- Implementer: Dispatcher bounded version/governance; standard adapters
- Reviewer: independent CODE and ARCH
- Minimum Complexity Rung: reuse
- Minimum Runtime Evidence: actual official consumer and immutable hosted Full Smoke
- Stop points: no production or gate weakening authorized

## Verification Plan

- npm run check:docs-frontmatter
- npm run check:task-packet-template
- npm run check:task-packet
- npm run check:harness-evidence
- npm run check:harness-review
- npm run check:harness-docs
- npm run check:harness-encoding
- npm run check:harness-inventory
- npm run check:structure
- npm run test:foundation-release
- GitHub required CI and immutable main Full Smoke/Release Gate
- Ops official acquisition/rebuild plus readonly CGO full race/frontend/business-overlay/drift/smoke

## Linkage

- Task ID: 2026-11-07-v0186-release-ops-consumption
- OpenSpec Change: none
- Superpowers Plan: none
- Task Manifest: .harness/tasks/2026-11-07-v0186-release-ops-consumption/manifest.json
- Evidence Directory: .harness/evidence/2026-11-07-v0186-release-ops-consumption/
- Review File: .harness/evidence/2026-11-07-v0186-release-ops-consumption/review.md
- Change Ref: none
- Plan References: .harness/tasks/2026-11-07-v0186-release-ops-consumption/manifest.json

## Evidence Required

实际执行命令、退出状态、隔离复现/失败反证、下游影响和显式gap。不伪造测试/独立review通过。

## Human Gates

- User authorized push, merge, safe archived branch cleanup, release and Ops consumption; gate weakening/production and freeze signature remain outside scope.

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed

- [ ] Base source/version preparation is reviewed and merged with required GitHub checks passed
- [ ] Immutable pantheon-base-v0.18.6 has successful Release Gate, four official assets and verified checksums
- [ ] Ops consumes exact official v0.18.6 via standard rebuild; readonly CGO full race, frontend, overlay, drift and applicable smoke pass before replacement/PR/merge
- [ ] GitHub and local Base/Ops/Harness retain only main, with no open task PR and all historical work recoverably preserved
