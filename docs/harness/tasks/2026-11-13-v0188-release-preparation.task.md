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
- 2026-11-13 bounded L1 continuation: correct only the named smoke helper timeout option placement, retain sanitized diagnosis, prove actual-helper behavior and reseal/rebuild the final consumer candidate

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

- .harness/evidence/2026-11-13-v0188-release-preparation/smoke-empty-readiness/prior-preparation-review.md
- .harness/evidence/2026-11-13-v0188-release-preparation/smoke-empty-readiness/smoke-trace-diagnosis.md
- .harness/evidence/2026-11-13-v0188-release-preparation/smoke-empty-readiness/smoke-trace-diagnosis.json
- .harness/evidence/2026-11-13-v0188-release-preparation/smoke-empty-readiness/summary.md
- .harness/evidence/2026-11-13-v0188-release-preparation/smoke-empty-readiness/governance-checks.json

- docs/harness/tasks/2026-11-13-v0188-release-preparation.task.md
- .harness/tasks/2026-11-13-v0188-release-preparation/manifest.json
- .harness/evidence/2026-11-13-v0188-release-preparation/commands.json
- .harness/evidence/2026-11-13-v0188-release-preparation/summary.md
- .harness/evidence/2026-11-13-v0188-release-preparation/review.md
- .harness/evidence/2026-11-13-v0188-release-preparation/pr-body.md
- docs/release-notes/RELEASE_NOTES_v0.18.8.md

### Modify

- frontend/tests/smoke/system/system-pages-helpers.ts (only the Locator.evaluate timeout argument expression)
- .harness/tasks/2026-11-13-v0188-release-preparation/manifest.json
- docs/harness/tasks/2026-11-13-v0188-release-preparation.task.md
- .harness/evidence/2026-11-13-v0188-release-preparation/commands.json
- .harness/evidence/2026-11-13-v0188-release-preparation/summary.md
- .harness/evidence/2026-11-13-v0188-release-preparation/review.md
- .harness/evidence/2026-11-13-v0188-release-preparation/pr-body.md
- docs/release-notes/RELEASE_NOTES_v0.18.8.md
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
- Other frontend/tests/smoke files; only the named helper timeout expression is authorized
- Raw authenticated traces and backend logs must not enter tracked evidence

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

- Implementer Posture: Writer/Dispatcher owns governance; separate dependency PR owners and the bounded smoke helper executor own their code changes
- Reviewer Posture: independent CODE/ARCH and mechanical checks

## Verification Plan

- Actual corrected helper browser proof: detached empty recovers; persistent invalid empty fails; persistent valid empty passes
- Refreshed sealed candidate and standard consumer readonly backend/frontend compatibility builds
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
- [x] Refreshed v0.18.8 candidate consumer backend/frontend builds passed
- [x] Continuation independently approved for source/preparation and ready for normal required-check PR merge

This preparation task can close after candidate verification, its local checks and independent CODE/ARCH approval. The overall delivery remains open until the PR is actually merged, Base retains only main with no obsolete worktrees, exact-main hosted CI succeeds, and the new immutable release passes Release Gate and asset verification. The downstream delivery receipt binds the actual merged SHA; no follow-up documentation PR is required merely to record this task's own merge.

## Status

Current task completed for the bounded 2026-11-13 smoke-empty-readiness source/preparation continuation. Actual-helper browser proof, refreshed candidate compatibility builds and independent five-source security/CODE/ARCH approvals pass. Final whole-tree confirmation, actual merge and hosted delivery remain downstream. The reopening and previous preparation-only completion below are historical checkpoints.

Historical preparation task completed after candidate builds, successful local checks and independent CODE/ARCH approval of tree a9d8ba825b7b6f05e9dc14b70d995cc2cc0b73fe. This Archived packet retains its preparation checkpoint. Final-tree confirmation, actual PR checks/merge, main-only cleanup, clean-main/remote-SHA and candidate binding, exact-main hosted gates, Release Gate and immutable publication remain downstream conditions.

## Candidate consumer compatibility — 2026-11-13

Sealed candidate-43be57e28ef949b68b1d145fdd5fb0d82d03272950be37772a05b3fe10ae8ec4 passed CGO readonly backend compilation and supported Node 24.22.3 frontend installation/lint/type-check/build. All 1176 selected Base inputs match actual merged HEAD 1cc4d6fb plus explicit VERSION 0.18.8; 2113 assembled source leaves retained aggregate 9c5f0877b04ec392be60c01dacd941cf3161198393b81af544bb98ebad571c05 before/after builds. Sealed files, four adapter hashes and the official v0.18.7 lock are unchanged. Original Node 24.14 engine-warning installation evidence is preserved as diagnostic only. The final receipt, source-leaf assembly receipt and raw command logs are retained under .harness/evidence/2026-11-13-v0188-release-preparation/consumer-candidate/. Final clean-main input binding remains required; no official v0.18.8 consumption or independent preparation approval is inferred.

## Candidate provenance clarification — 2026-11-13

The original final-build receipt is preserved byte-for-byte. Its Go 1.26.5 value names the bootstrap executable outside the module; readonly checks in the exact candidate backend verify effective Go 1.26.10 with GOTOOLCHAIN=auto, as required by go.mod. The supplemental effective-go-toolchain receipt and both command logs are retained under consumer-candidate/. The original source-before-build.json gzip also proves all 2113 selected source leaves had aggregate 9c5f0877b04ec392be60c01dacd941cf3161198393b81af544bb98ebad571c05 at 05:13:53.345Z, before the backend build began at 05:14:09.0076081Z. No build rerun or sealed artifact edit is inferred from these supplemental checks.

The downstream final release check must verify actual branch main, zero staged/unstaged/untracked files, local HEAD equal to the current remote main SHA and all selected candidate input bytes matching that actual commit. A script phase label does not replace these independent conditions. Root retains the actual delivery receipt separately after merge.

Raw JSON preservation: six imported CRLF receipts are retained as sibling .json.gz artifacts; their LF convenience JSON preserves the same parsed values. raw-json-artifacts.json maps the compressed/original and derived hashes. Original-byte checks bind gzip decompression, including the effective-Go receipt, so Git EOL normalization cannot invalidate those hashes.

## Source-bound smoke correction — 2026-11-13

Claude implemented the narrow PR #502 CSSOM assertion correction at 44188eff3e8618736b495043c6655a1538ce6857: four strict matchers accept only canonical flex-end/flow-end serialization. The real Chromium 158 probe rejects nine negative values and proves geometry equality in four flex directions; final source transpilation and targeted ESLint pass. Production CSS, visual thresholds and other assertions are unchanged. Independent CODE APPROVE and ARCH APPROVE/CLEAR cover that exact delta with zero findings. Hosted Smoke Sanity and PR Smoke Modules then passed at that head; PR #502 merged on 2026-11-13T05:06:08Z as 1cc4d6fb320113865eac8226af4f6f499b74f455. Local receipts, review reports and actual Claude execution output are in .harness/evidence/2026-11-13-v0188-release-preparation/smoke-css/; the hosted result and merge receipt are retained as pr502-merged.json.gz in the parent evidence directory.

## Smoke empty readiness continuation — 2026-11-13

This L1 test-helper repair reuses the existing L2 release-preparation parent after PR #509 merged. Main ae2fa81d9903d63b4bec8f01d61082f48a999e2f failed hosted Smoke Sanity (Code Quality Gates run 43377206553, job 131728309093). Three sanitized traces show a visible Arco empty node followed by an attached-element wait that exhausts the test timeout; each list response returns HTTP 200 with populated data. The helper passes the timeout as evaluation data instead of the third options argument. Diagnosis attributes the expression to PR #505 commit 2338d108a. The executor owns the single timeout argument correction and actual-helper adversarial browser proof; Writer owns this dated governance supplement. Final Full Smoke success is coordinator-provided context, not proof that Smoke Sanity passed.

The previous candidate43be57 PASS and 84-file preparation CODE/ARCH approval remain historical. Because the helper is one of 1176 selected foundation inputs, final acceptance requires a new sealed candidate, standard consumer compatibility builds and source-bound independent CODE/ARCH. Independent five-source CODE-security/ARCH approvals are retained; the mechanical preparation verdict is approved, with final whole-tree confirmation and hosted delivery downstream.

- Assumptions: the supplied trace diagnosis narrows the defect to the helper call; no broader application defect is established.
- Minimum Viable Approach: one expression correction, existing retry assertion, existing release assembler and consumer verifier.
- Structural Scope: system smoke route -> expectPageBodyReady -> Locator.evaluate -> existing toPass retry; base helper -> sealed foundation input -> consumer assembly.
- Success Criteria: old detached-empty behavior fails the bounded reproducer; corrected actual helper recovers; persistent invalid empty still fails and valid empty passes; refreshed candidate builds and independent source review pass.
- Evidence: .harness/evidence/2026-11-13-v0188-release-preparation/smoke-empty-readiness/summary.md. Retain sanitized diagnosis only; raw traces and backend logs contain ephemeral auth material and stay local-only.
- Stop Condition: independently approved continuation ready for normal required-check PR submission. Actual PR merge, Base main-only/no obsolete worktrees, clean-main/remote-SHA input binding, exact-main hosted CI/Release Gate and immutable publication remain downstream to avoid requiring a task to record its own future merge.

## Candidate filesystem security dependency — 2026-11-13

Latest user authorization adds GitHub security remediation through separate L2 task [2026-11-13-candidate-filesystem-security](./2026-11-13-candidate-filesystem-security.task.md). Nine high CodeQL js/file-system-race alerts in three named candidate files require actual security regression evidence and independent approval. The security executor owns that source; this parent owns release candidate reseal/compatibility and final delivery. Neither the old candidate nor historical preparation approvals certify these changes.

## Smoke browser evidence — 2026-11-13

Five native browser scenarios pass their expected outcomes on exact helper SHA256 0e2c20882e7fb20ad5884c64dc85388ca8acd2ecdab074e8887520dc19a59981. See smoke-empty-readiness/browser-receipt.json and its retained raw artifacts. Old detachment fails after30.046s; corrected existing retry recovers after2.171s; known empty/populated pass and unknown persistent empty still rejects. Final refreshed candidate builds and independent source approvals pass.

## Security source / test wiring handoff — 2026-11-13

The security dependency records actual nine-alert remediation, candidate65/68 and wired foundation122/125 passes with3 Windows leaf-symlink capability skips. Root package-only test wiring is included in five-source tree 93b617c283b20866f3b209047e931246dbf9b009; existing CI must execute the Linux cases. The bb028 seal before that wiring is provisional and retained; final five-leaf-delta candidate and standard consumer builds pass. Independent source CODE-security/ARCH approvals pass; final whole-tree confirmation remains pending.

## Final target candidate — 2026-11-13

Final target candidate-af7b5e4ba7e5b086df902b3190c5daf9f0cbc757ae0fe6d91208a329ed6e7a61 is sealed after package wiring:1176 stable inputs, 5 changed/1171 unchanged leaves, descriptor fa1d30d65ee38ecf067d2fbaa17bce3b345696efb986da7a182891313014927f, tar 69e67550b3c49b729586e7258faaea64c9f76b90895c75d89037fd8ba5026151. Original hashes and proposed-tree binding are retained; standard consumer builds and source CODE-security/ARCH approvals pass; final whole-tree confirmation and hosted delivery remain pending. Proposed source93b617 is not a final clean-main release binding.

## Source/preparation closeout — 2026-11-13

Source/preparation is complete and independently approved for normal required-check merge. Five-source tree 93b617c283b20866f3b209047e931246dbf9b009 and final candidateaf7b5e4b have SOURCE/CODE-security APPROVE and ARCH APPROVE/CLEAR. Standard consumer readonly CGO backend build (effective Go1.26.10, GOTOOLCHAIN=auto) and fresh Node24.22.3 npm ci/lint/type-check/build all pass. Before/after1176 Base/snapshot leaves,963 Ops leaves and2115 assembled leaves remain stable; assembled aggregate e242a4b78ce2c990a6245021383279fca0a31b97c9f97b7c6b3f2a42cb194562. Shared856/856 leaves match, zero exemptions;164 business skips and2 derived migrations are disclosed. Four adapter pins and official v0.18.7 lock remain unchanged; the adapter projection has2 tracked and2 untracked module changes. This proves compatibility only. Final whole-tree confirmation, actual merge/main-only cleanup, clean-main/remote-SHA1176-input binding, Linux leaf-symlink cases, hosted CodeQL automatic alert closure, exact-main CI/Release Gate and immutable release/assets remain downstream. Live task inventory is18 completed/0 in-progress.

Retained original reports: .harness/evidence/2026-11-13-candidate-filesystem-security/source-review-artifacts.json. Final build: .harness/evidence/2026-11-13-v0188-release-preparation/smoke-empty-readiness/final-consumer-build-receipt.json. Historical84-file approvals and failures remain scoped to their original checkpoints. FR028 deferred, S3 unwaived, maintenance freeze unsigned and separate Ops product acceptance remain explicit.
