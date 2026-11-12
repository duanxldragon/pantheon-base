---
title: 发布 Base v0.18.7 与 Ops 正式消费
doc_type: Remediation
layer: platform
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
status: Active
updated_at: 2026-11-12
---

# Task Packet: 2026-11-12-v0187-release-ops-consumption

## Goal

Publish the immutable reviewed Base v0.18.7 that carries the closed formal-queue foundation contracts (PR #504), then consume it in pantheon-ops through official artifacts.

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
- Quality Profile: ci-workflow
- Portable Failure Class: release-consumer-handoff
- Owner Layer: foundation-source
- Ratchet Decision: registry-only
- Coverage Dimensions:
  - behaviour
  - maintainability
  - architecture-fitness

## Workspace Context

- Target Repository: pantheon-base
- Repository Role: foundation-source
- Upstream Dependencies: pantheon-harness
- Downstream Consumers: pantheon-ops
- Sync Expectation: required
- Release Requirement: foundation-release
- Downstream Sync Note: Standard official187 acquisition/rebuild; validation before replacement/merge

## Contract Anchors

- `docs/designs/FOUNDATION_RELEASE_MODEL.md`
- `docs/harness/PANTHEON_BASE_DELIVERY_WORKFLOW.md`
- `docs/harness/VERIFICATION_EVIDENCE_SPEC.md`
- `docs/contracts/SYSTEM_IAM_CONTRACT.md`

## Scope

### In

- VERSION 0.18.7, changelog, docs index and release notes for the PR #504 foundation contract closeout
- Release-blocking CI remediations merged with the preparation: CodeQL go/log-injection sink sanitization in `backend/internal/middleware/request_context_middleware.go` and the smoke `expectPageBodyReady` loading-state stall repair in `frontend/tests/smoke/system/system-pages-helpers.ts`
- Standard producer Release Gate on the exact merged commit and four-asset immutable GitHub release
- Official Ops lock/acquisition/rebuild/full validation/merge

### Out

- Business semantics in Base, Ops shared overrides
- Policy/gate weakening, solo-override, S3 waiver or freeze signature
- Production databases/credentials/deployment
- Historical completed acceptance artifacts

## Expected Files

### Create

- docs/harness/tasks/2026-11-12-v0187-release-ops-consumption.task.md
- .harness/tasks/2026-11-12-v0187-release-ops-consumption/manifest.json
- .harness/evidence/2026-11-12-v0187-release-ops-consumption/commands.json
- .harness/evidence/2026-11-12-v0187-release-ops-consumption/summary.md
- .harness/evidence/2026-11-12-v0187-release-ops-consumption/review.md
- docs/release-notes/RELEASE_NOTES_v0.18.7.md

### Modify

- VERSION
- CHANGELOG.md
- .harness/STATUS.md
- docs/README.md
- docs/README.en.md
- backend/internal/middleware/request_context_middleware.go
- backend/internal/middleware/request_context_middleware_test.go
- frontend/tests/smoke/system/system-pages-helpers.ts

### Do Not Touch

- scripts/
- .github/workflows/
- config/
- Historical v0.18.6 release/consumption artifacts

## Implementation Notes

- Reuse the standard release producer and Ops assembler; the only product-code change is logging the already-registered audit route tokens through the existing `logging.SanitizeLogValue` sink sanitizer, which breaks the CodeQL taint path without behavior change.
- The smoke helper reads the empty-state text via `evaluate()` with a short timeout so the transient Arco loading empty state can no longer stall the raw `innerText()` actionability wait for the full 30s test budget (observed on the main push of c8a71003 in both attempts).
- CODE/ARCH approval of the PR #504 whole scope is recorded in the predecessor task; this packet's preparation review covers only the version metadata and the two CI remediations. Publication and consumer acceptance stay pending until exact hosted evidence.
- Minimum Complexity Rung: reuse
- Implementer: Dispatcher bounded version/governance metadata plus the two gate repairs
- Reviewer: independent CODE and ARCH on the preparation snapshot
- Stop points: no production operations or gate weakening authorized
- Release Gate follow-on: main@2338d108 SonarCloud analysis reported 63 unresolved issues (zero-unresolved hard gate); all 63 were fixed by behavior-preserving refactors on branch `fix/sonar-zero-v0187` following the 2026-10-20 zero-issues rule-to-fix mapping (no batch marks, no excludes, no gate changes).

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
- Targeted backend middleware race tests plus frontend type-check/build
- GitHub required CI on the preparation PR and Release Gate on the exact merged main commit
- Ops official acquisition/rebuild plus readonly CGO full race/frontend/overlay/drift/applicable smoke

## Linkage

- Task ID: 2026-11-12-v0187-release-ops-consumption
- Task Manifest: .harness/tasks/2026-11-12-v0187-release-ops-consumption/manifest.json
- Evidence Directory: .harness/evidence/2026-11-12-v0187-release-ops-consumption/
- Review File: .harness/evidence/2026-11-12-v0187-release-ops-consumption/review.md
- OpenSpec Change: none
- Superpowers Plan: none
- Plan References: .harness/tasks/2026-11-12-v0187-release-ops-consumption/manifest.json
- Predecessor Task: 2026-11-07-ops-formal-queue-foundation-gaps (PR #504 whole-scope independent review)

## Evidence Required

实际执行命令、退出状态与日志、CodeQL 告警闭环证据、Release Gate/资产校验结果与显式 gap。不伪造测试、独立 review、发布或消费通过。

## Human Gates

- Maintainer-authorized scope for official release and Ops consumption derives from the 2026-11-07 review closeout instruction; gate weakening, production operations and freeze signature remain outside scope.

## Completion Checklist

- [x] Layer and boundary declared
- [x] Quality profile or explicit `none` declared
- [x] Ratchet decision declared for repeated failures
- [x] Contract anchors read
- [ ] Verification run or exception recorded
- [ ] Evidence saved or summarized
- [ ] Review completed
- [ ] Base source/version preparation reviewed and merged with required GitHub checks passed
- [ ] Immutable pantheon-base-v0.18.7 has successful Release Gate, four official assets and verified checksums
- [ ] Ops consumes exact official v0.18.7 via standard rebuild with full validation before replacement/merge

## Status

preparation in progress; no release or consumption is claimed until exact hosted evidence exists.
