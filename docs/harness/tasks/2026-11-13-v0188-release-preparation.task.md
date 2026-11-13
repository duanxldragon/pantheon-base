---
title: Prepare Base v0.18.8 and close the November 7 delivery continuation
doc_type: Remediation
layer: platform
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
status: Archived
updated_at: 2026-11-13
---

# Task Packet: 2026-11-13-v0188-release-preparation

## Goal

Reconcile completed planned work and official v0.18.7 consumption, verify and integrate dependency updates, and prepare an immutable v0.18.8 patch for publication after exact-commit hosted gates.

## Priority

P1; L2 release and inheritance coordination.

## Primary Layer

platform

## Dependency Layers

- inheritance-sync

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
- Downstream Sync Note: Official v0.18.7 handoff closure is separately evidenced; v0.18.8 candidate backend/frontend compatibility builds passed, with final clean-main input binding still required before release.

## Contract Anchors

- `docs/designs/FOUNDATION_RELEASE_MODEL.md`
- `docs/harness/AI_QUALITY_GOVERNANCE.md`
- `docs/harness/VERIFICATION_EVIDENCE_SPEC.md`
- `docs/contracts/PLATFORM_CONTRACT.md`

## Scope

### In

- Accurate closure of the November 7 review continuation and the existing v0.18.7 consumer handoff
- Reviewed dependency updates from PR #501, #502 and #503
- VERSION 0.18.8, release notes, changelog and current documentation/status indexes
- Preparation evidence, independent review and candidate consumer build evidence

### Out

- New product or business features
- Production databases, deployment or credentials
- Gate weakening, solo-override, S3 waiver or maintenance-freeze signature
- FR028 implementation or premature legacy endpoint retirement
- Rewriting historical failed evidence or completed acceptance records

## Structural Scope

- Affected Subgraph: version metadata -> foundation manifest/bundle -> official consumer rebuild
- Boundary Crossings: base -> ops
- Risk Nodes: immutable release identity and dependency runtime compatibility
- Graph Focus: no application call-graph change; review the release/consumer boundary

## Expected Files

### Create

- docs/harness/tasks/2026-11-13-v0188-release-preparation.task.md
- .harness/tasks/2026-11-13-v0188-release-preparation/manifest.json
- .harness/evidence/2026-11-13-v0188-release-preparation/commands.json
- .harness/evidence/2026-11-13-v0188-release-preparation/summary.md
- .harness/evidence/2026-11-13-v0188-release-preparation/review.md
- .harness/evidence/2026-11-13-v0188-release-preparation/pr-body.md
- docs/release-notes/RELEASE_NOTES_v0.18.8.md

### Modify

- VERSION
- CHANGELOG.md
- .harness/STATUS.md
- docs/README.md
- docs/README.en.md
- docs/release-notes/README.md
- docs/release-notes/README.en.md
- .harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/manifest.json
- .harness/tasks/2026-11-12-v0187-release-ops-consumption/manifest.json
- docs/harness/tasks/2026-11-12-v0187-release-ops-consumption.task.md
- .harness/evidence/2026-11-12-v0187-release-ops-consumption/summary.md

- docs/harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps.task.md

### Do Not Touch

- backend/
- frontend/src/
- scripts/
- .github/workflows/
- config/
- Historical released notes and failed evidence

## Implementation Notes

- Merged dependency PRs: #501 (5beb3aa24af4dc1b72c6ac53fb6153d4d58e1558), #502 (1cc4d6fb320113865eac8226af4f6f499b74f455), #503 (bbd8a5e29b7658fb16c5741c3ffa6f6d7459dd8b). PR #502's corrected head 44188eff passed all final hosted gates, including Smoke Sanity and PR Smoke Modules: 27 SUCCESS, 2 conditional SKIPPED, zero unsuccessful.
- Ops PR #183 merged at fc3fa867630580f7bcf1d40082a77f6b2548ac56 after official v0.18.7 acquisition/rebuild/full validation and successful final GitHub Actions.
- Root Playwright advances to 1.65.0; frontend jsdom 31 retains the existing Node 24.15.0 or later requirement on the Node 24 line. CodeQL init/analyze stay on the same official immutable v4.39.3 commit.
- Preserve historical failed evidence and limitations; add a dated current-delivery supersession instead of retroactively changing historical results.
- Minimum Complexity Rung: reuse. No application-code, schema, permission, menu or i18n contract change belongs to this preparation.

## Method Readiness

- Consumer-Specific Controls: official foundation asset/tag/manifest verification and standard assembler
- Required Sensors: existing docs/task/evidence/review checks, dependency verification, consumer builds and exact hosted gates
- Required Evidence: actual commands and source bindings, independent CODE/ARCH, consumer merge receipt
- Minimal Complexity Rung: reuse
- Ratchet Decision: registry-only
- Deferred Code Issues: FR028 explicitly deferred; separate operational and business residuals remain

## Execution Roles

- Implementer Posture: docs-only Writer/Dispatcher; separate dependency PR owners
- Reviewer Posture: independent CODE/ARCH and mechanical checks

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
- Frontend dependency lint/type-check/unit/build and rendered evidence
- Consumer backend/frontend builds from the target candidate
- Exact-commit hosted CI, quality, security, smoke and Release Gate before publication

Executed checks and their source limits are recorded in commands.json. Nine full-repository governance checks passed on the preparation draft; target-candidate consumer backend/frontend compatibility builds passed. Independent CODE APPROVE and ARCH APPROVE/CLEAR bind reviewed tree a9d8ba825b7b6f05e9dc14b70d995cc2cc0b73fe; mechanical closure remains subject to final-tree confirmation. Actual merge, clean-main candidate input binding, exact-main hosted CI, Release Gate and immutable publication are subsequent delivery conditions, not evidence inferred from this draft.

## Linkage

- Task ID: 2026-11-13-v0188-release-preparation
- Task Manifest: .harness/tasks/2026-11-13-v0188-release-preparation/manifest.json
- Evidence Directory: .harness/evidence/2026-11-13-v0188-release-preparation/
- Review File: .harness/evidence/2026-11-13-v0188-release-preparation/review.md
- OpenSpec Change: none
- Superpowers Plan: none
- Plan References: .harness/tasks/2026-11-13-v0188-release-preparation/manifest.json
- Predecessor Task: 2026-11-12-v0187-release-ops-consumption

## Evidence Required

Actual commands/exit codes and logs, dependency heads/merge commits, official consumer asset/rebuild/merge receipt, candidate consumer builds and independent review on the same snapshot. Browser evidence is recorded where dependency changes affect rendered behavior. No failed call or predecessor check is approval of a new source.

## Human Gates

The user has authorized GitHub merges, obsolete Base branch/worktree cleanup and a new release after successful CI. Production operations, gate policy weakening, S3 waiver and maintainer freeze signature remain outside scope.

## Foundation Release Handoff

- Shared change owner: pantheon-base
- Foundation release required: yes
- Consumer sync status: v0.18.8 sealed candidate compatibility builds passed; official v0.18.8 consumption not claimed. v0.18.7 officially validated and merged in Ops #183 with the separately linked receipt
- Release/lock stop point: successful exact-commit hosted gates and Release Gate before immutable publication

## Completion Checklist

- [x] Layer and boundary declared
- [x] Quality profile or explicit none declared
- [x] Ratchet decision declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
- [x] Existing v0.18.7 official consumer task closed with validation and merge evidence
- [x] Dependency PRs reviewed, verified and merged
- [x] v0.18.8 candidate consumer backend/frontend builds passed
- [x] Preparation independently approved and ready for normal required-check PR merge

This preparation task can close after candidate verification, its local checks and independent CODE/ARCH approval. The overall delivery remains open until the PR is actually merged, Base retains only main with no obsolete worktrees, exact-main hosted CI succeeds, and the new immutable release passes Release Gate and asset verification. The downstream delivery receipt binds the actual merged SHA; no follow-up documentation PR is required merely to record this task's own merge.

## Status

Preparation task completed after candidate builds, successful local checks and independent CODE/ARCH approval of tree a9d8ba825b7b6f05e9dc14b70d995cc2cc0b73fe. This Archived packet retains its preparation checkpoint. Final-tree confirmation, actual PR checks/merge, main-only cleanup, clean-main/remote-SHA and candidate binding, exact-main hosted gates, Release Gate and immutable publication remain downstream conditions.

## Candidate consumer compatibility — 2026-11-13

Sealed candidate-43be57e28ef949b68b1d145fdd5fb0d82d03272950be37772a05b3fe10ae8ec4 passed CGO readonly backend compilation and supported Node 24.22.3 frontend installation/lint/type-check/build. All 1176 selected Base inputs match actual merged HEAD 1cc4d6fb plus explicit VERSION 0.18.8; 2113 assembled source leaves retained aggregate 9c5f0877b04ec392be60c01dacd941cf3161198393b81af544bb98ebad571c05 before/after builds. Sealed files, four adapter hashes and the official v0.18.7 lock are unchanged. Original Node 24.14 engine-warning installation evidence is preserved as diagnostic only. The final receipt, source-leaf assembly receipt and raw command logs are retained under .harness/evidence/2026-11-13-v0188-release-preparation/consumer-candidate/. Final clean-main input binding remains required; no official v0.18.8 consumption or independent preparation approval is inferred.

## Candidate provenance clarification — 2026-11-13

The original final-build receipt is preserved byte-for-byte. Its Go 1.26.5 value names the bootstrap executable outside the module; readonly checks in the exact candidate backend verify effective Go 1.26.10 with GOTOOLCHAIN=auto, as required by go.mod. The supplemental effective-go-toolchain receipt and both command logs are retained under consumer-candidate/. The original source-before-build.json gzip also proves all 2113 selected source leaves had aggregate 9c5f0877b04ec392be60c01dacd941cf3161198393b81af544bb98ebad571c05 at 05:13:53.345Z, before the backend build began at 05:14:09.0076081Z. No build rerun or sealed artifact edit is inferred from these supplemental checks.

The downstream final release check must verify actual branch main, zero staged/unstaged/untracked files, local HEAD equal to the current remote main SHA and all selected candidate input bytes matching that actual commit. A script phase label does not replace these independent conditions. Root retains the actual delivery receipt separately after merge.

Raw JSON preservation: six imported CRLF receipts are retained as sibling .json.gz artifacts; their LF convenience JSON preserves the same parsed values. raw-json-artifacts.json maps the compressed/original and derived hashes. Original-byte checks bind gzip decompression, including the effective-Go receipt, so Git EOL normalization cannot invalidate those hashes.

## Source-bound smoke correction — 2026-11-13

Claude implemented the narrow PR #502 CSSOM assertion correction at 44188eff3e8618736b495043c6655a1538ce6857: four strict matchers accept only canonical flex-end/flow-end serialization. The real Chromium 158 probe rejects nine negative values and proves geometry equality in four flex directions; final source transpilation and targeted ESLint pass. Production CSS, visual thresholds and other assertions are unchanged. Independent CODE APPROVE and ARCH APPROVE/CLEAR cover that exact delta with zero findings. Hosted Smoke Sanity and PR Smoke Modules then passed at that head; PR #502 merged on 2026-11-13T05:06:08Z as 1cc4d6fb320113865eac8226af4f6f499b74f455. Local receipts, review reports and actual Claude execution output are in .harness/evidence/2026-11-13-v0188-release-preparation/smoke-css/; the hosted result and merge receipt are retained as pr502-merged.json.gz in the parent evidence directory.
