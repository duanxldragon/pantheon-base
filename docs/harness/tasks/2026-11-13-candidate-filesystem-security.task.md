---
title: Harden foundation candidate file operations against filesystem races
doc_type: Remediation
layer: platform
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
status: Archived
updated_at: 2026-11-13
---

# Task Packet: 2026-11-13-candidate-filesystem-security

## Goal

Repair nine high-severity CodeQL js/file-system-race alerts in the candidate producer, descriptor and regression fixture; preserve immutable candidate and consumer contracts, then validate the exact source with tests and independent security review.

## Priority

P0; L2 security and foundation producer/consumer boundary.

## Primary Layer

platform

## Dependency Layers

- inheritance-sync

## Workspace Context

- Target Repository: pantheon-base
- Repository Role: foundation-source
- Upstream Dependencies: pantheon-harness
- Downstream Consumers: pantheon-ops
- Sync Expectation: required
- Release Requirement: foundation-release
- Downstream Sync Note: parent preparation reseals and verifies the corrected candidate before exact-main release; official consumption is separately tracked.

## Contract Anchors

- docs/designs/FOUNDATION_RELEASE_MODEL.md
- docs/designs/QUALITY_AND_SECURITY_STRATEGY.md
- docs/harness/AI_QUALITY_GOVERNANCE.md
- docs/harness/VERIFICATION_EVIDENCE_SPEC.md
- docs/contracts/PLATFORM_CONTRACT.md

## Harness Profile

- Template: admin-platform
- Overlay: pantheon-base
- Quality Profile: ci-workflow
- Portable Failure Class: security-boundary-gap
- Owner Layer: foundation-source
- Ratchet Decision: sensor-added
- Coverage Dimensions:
  - behaviour
  - maintainability
  - architecture-fitness

## Scope

### In

- CodeQL alerts #100–108: high security severity, js/file-system-race, on main ae2fa81d9903d63b4bec8f01d61082f48a999e2f.
- Narrow candidate filesystem operations and corresponding negative/race regressions in the three named files.
- Root package.json test:foundation-release selects the existing candidate suite; the existing CI command runs it without a workflow edit.
- Actual tests, immutable-contract evidence and independent security/CODE/ARCH; hosted rescan and closure readback remain required.

### Out

- Application behavior, schema, permissions, production data and credentials.
- New dependencies, alert dismissal, suppression, gate weakening or changing candidate/lock format.
- Changes outside the three candidate files, package.json test command and task/release-governance evidence.

## Structural Scope

- Affected Subgraph: candidate input/descriptor path -> validated file operations -> sealed candidate -> consumer reconstruction.
- Boundary Crossings: local filesystem -> trusted artifact identity; Base producer -> Ops consumer.
- Risk Nodes: file replacement, symlink races, immutable output writes and fixture reads.
- Graph Focus: cycle, hub, call-depth and sensitive-flow checks through actual manual source/import/call-body review; no CodeGraph result claimed. Hosted CodeQL remains a separate gate.

## Expected Files

### Create

- .harness/evidence/2026-11-13-candidate-filesystem-security/security-source-evidence.json.gz
- .harness/evidence/2026-11-13-candidate-filesystem-security/source-diff.patch.gz
- .harness/evidence/2026-11-13-candidate-filesystem-security/candidate-tests.txt.gz
- .harness/evidence/2026-11-13-candidate-filesystem-security/wired-foundation-tests.txt.gz
- .harness/evidence/2026-11-13-candidate-filesystem-security/tdd-red.txt.gz
- .harness/evidence/2026-11-13-candidate-filesystem-security/tdd-green.txt.gz
- .harness/evidence/2026-11-13-candidate-filesystem-security/focused-tests.txt.gz
- .harness/evidence/2026-11-13-candidate-filesystem-security/FileSystemRace-codeql-2.27.4.ql.gz
- .harness/evidence/2026-11-13-candidate-filesystem-security/security-source-evidence.json
- .harness/evidence/2026-11-13-candidate-filesystem-security/security-alerts-remediation-map.json
- .harness/evidence/2026-11-13-candidate-filesystem-security/wired-foundation-tests-receipt.json
- .harness/tasks/2026-11-13-candidate-filesystem-security/manifest.json
- docs/harness/tasks/2026-11-13-candidate-filesystem-security.task.md
- .harness/evidence/2026-11-13-candidate-filesystem-security/commands.json
- .harness/evidence/2026-11-13-candidate-filesystem-security/summary.md
- .harness/evidence/2026-11-13-candidate-filesystem-security/review.md
- .harness/evidence/2026-11-13-candidate-filesystem-security/security-alerts-before.json

### Modify

- package.json (root-owned test:foundation-release command expansion only)
- scripts/foundation-release/build-candidate-artifact.mjs
- scripts/foundation-release/candidate-descriptor.mjs
- scripts/foundation-release/candidate-artifact.test.mjs

### Do Not Touch

- backend/, frontend/, .github/workflows/, config/ and other candidate scripts.
- Production data, immutable released assets and official consumer lock.
- Historical acceptance, failed CI and existing source-bound approvals.

## Assumptions and Open Questions

- Baseline API receipt records nine open alerts on the current main; passing tests alone does not close them.
- Dependabot and secret-scanning zero counts are coordinator-provided API context.
- Exact runtime behavior and cross-platform race coverage depend on executor evidence; no implementation claim is made in this draft.

## Minimum Viable Approach

Reuse existing Node filesystem APIs, source validation and fixture suite. The security executor selects the narrow implementation; no new dependency or candidate protocol is introduced.

## Implementation Notes

- Latest user instruction explicitly authorizes GitHub security remediation.
- Security executor owns the three source files; Writer owns governance. No agent reverts concurrent edits.
- Root coordinates one combined PR with the bounded smoke continuation and refreshed candidate; Writer does not commit, push or merge.

## Method Readiness

- Consumer-Specific Controls: existing immutable candidate descriptor/archive identity and official consumer verifier.
- Required Sensors: targeted race tests, foundation release suite, manual boundary diff review and hosted CodeQL.
- Required Evidence: actual commands, source hashes, independent security/CODE/ARCH and current alert readback.
- Minimal Complexity Rung: reuse.
- Ratchet Decision: sensor-added through meaningful filesystem regression coverage.
- Deferred Code Issues: no broader filesystem hardening scope is inferred from these nine alerts.

## Execution Roles

- Implementer Posture: security executor source/testing; Writer governance.
- Reviewer Posture: independent security/CODE plus ARCH on the same frozen source.

## Verification Plan

- node --test scripts/foundation-release/candidate-artifact.test.mjs
- npm run test:foundation-release
- npm run check:docs-frontmatter
- npm run check:task-packet-template
- npm run check:task-packet
- npm run check:harness-evidence
- npm run check:harness-review
- npm run check:harness-docs
- npm run check:harness-encoding
- npm run check:harness-inventory
- npm run check:structure
- Manual security-boundary diff review: security-diff-scan is unavailable; do not claim it ran.
- Hosted CodeQL js/file-system-race rescan and exact-main alert closure readback.
- Parent 2026-11-13-v0188-release-preparation: refreshed sealed candidate and standard consumer backend/frontend compatibility builds.

Planned commands are not current verification results. Actual exits and source limits belong in commands.json.

## Success Criteria

- Adversarial filesystem scenarios exercise the actual corrected implementation and reject unsafe mutation.
- Existing candidate, descriptor, archive and consumer-lock contracts remain validated; foundation release tests pass.
- Independent security/CODE/ARCH approves the same frozen source; no dismissals, suppressions or gate changes.
- Reviewed preparation becomes ready for the combined normal required-check PR. Exact-main hosted CodeQL closure, release gate and publication remain downstream.

## Context Strategy

- Entry Sources: AGENTS.md, foundation release model, quality/security strategy, this task and current evidence.
- Retrieval Order: entry -> sanitized alert summary -> executor evidence.
- Retrieval Helpers: root-owned structural review; Writer reads only bounded sources and evidence.
- Promotion Target: meaningful candidate filesystem regression tests.
- Sensitive Context: no auth traces, credentials or production data in tracked evidence.

## Linkage

- Task ID: 2026-11-13-candidate-filesystem-security
- Task Manifest: .harness/tasks/2026-11-13-candidate-filesystem-security/manifest.json
- Evidence Directory: .harness/evidence/2026-11-13-candidate-filesystem-security/
- Review File: .harness/evidence/2026-11-13-candidate-filesystem-security/review.md
- OpenSpec Change: none
- Superpowers Plan: none
- Plan References: .harness/tasks/2026-11-13-candidate-filesystem-security/manifest.json
- Release Preparation Parent: .harness/tasks/2026-11-13-v0188-release-preparation/manifest.json

## Evidence Required

- Sanitized CodeQL alert baseline and current closure readback.
- Runnable filesystem tests with command exits, immutable byte/hash checks and source tree binding.
- Manual security boundary review plus hosted CodeQL; security-diff-scan unavailable is an explicit gap.
- Independent security/CODE/ARCH on the same source; preparation parent retains refreshed consumer candidate receipts.

## Human Gates

User authorization already covers security fixes, normal GitHub merges, obsolete Base branch/worktree cleanup and release after successful CI. Production mutation and gate policy changes remain outside scope.

## Completion Checklist

- [x] Layer and boundary declared
- [x] Quality profile and contract anchors declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
- [x] Local source-bound candidate/security regression suite passed; three Windows capability skips explicitly retained
- [x] Independent five-source security/CODE/ARCH approval recorded for source/preparation

## Status

Completed source/preparation. Source and test wiring, independent five-source approval and final refreshed candidate builds pass; the preparation stage is ready for the combined normal required-check PR. Final whole-tree confirmation, Linux leaf-symlink execution and hosted CodeQL closure remain downstream. Parent delivery remains open for actual merge, main-only cleanup, exact-main CI/Release Gate and immutable publication; this task does not require recording its own future merge before submission.

## Source and CI wiring evidence — 2026-11-13

The three candidate files use open-first bounded file-descriptor reads with actual file identity/type/link/size validation, observed path/ancestor rechecks and retained descriptor/hash pins. Fixture recreation uses exclusive fd creation/write. All nine alert paths are mapped in security-alerts-remediation-map.json; #102 is the CLI inventory read, #107 is the recreated fixture write and #108 is its fd read. Source remediation is not hosted alert closure.

Before package wiring, the candidate suite passed65/68 nodes with3 Windows leaf-symlink capability skips and the existing foundation command passed57/57. Root then extended only package.json test:foundation-release to include scripts/foundation-release/*.test.mjs. The unchanged ci.yml line187 already invokes that command. The wired run exits0 with125 nodes / 122 pass / 0 fail / 3 skips; Linux CI must execute the three leaf-symlink cases. package.json SHA256 aeacce2b72366bc648943d7860355efecab431d28e0d9dacc573bb7bea260a3c and five-source tree 93b617c283b20866f3b209047e931246dbf9b009 bind this checkpoint. Native preliminary review found no source defects but remains COMMENT because its required LSP tool is unavailable; real compiler/AST/tests are not described as LSP output. Current independent five-source security/CODE and ARCH approvals are retained.

The official CodeQL2.27.4 query is retained as an unexecuted reference. Security-diff-scan and CodeQL CLI are unavailable; manual source/threat-boundary receipt and hosted same-rule CodeQL are separate signals. Initial TDD failure remains retained.

## Source/preparation closeout — 2026-11-13

Source/preparation is complete and independently approved for normal required-check merge. Five-source tree 93b617c283b20866f3b209047e931246dbf9b009 and final candidateaf7b5e4b have SOURCE/CODE-security APPROVE and ARCH APPROVE/CLEAR. Standard consumer readonly CGO backend build (effective Go1.26.10, GOTOOLCHAIN=auto) and fresh Node24.22.3 npm ci/lint/type-check/build all pass. Before/after1176 Base/snapshot leaves,963 Ops leaves and2115 assembled leaves remain stable; assembled aggregate e242a4b78ce2c990a6245021383279fca0a31b97c9f97b7c6b3f2a42cb194562. Shared856/856 leaves match, zero exemptions;164 business skips and2 derived migrations are disclosed. Four adapter pins and official v0.18.7 lock remain unchanged; the adapter projection has2 tracked and2 untracked module changes. This proves compatibility only. Final whole-tree confirmation, actual merge/main-only cleanup, clean-main/remote-SHA1176-input binding, Linux leaf-symlink cases, hosted CodeQL automatic alert closure, exact-main CI/Release Gate and immutable release/assets remain downstream. Live task inventory is18 completed/0 in-progress.

Retained original reports: .harness/evidence/2026-11-13-candidate-filesystem-security/source-review-artifacts.json. Final build: .harness/evidence/2026-11-13-v0188-release-preparation/smoke-empty-readiness/final-consumer-build-receipt.json. Historical84-file approvals and failures remain scoped to their original checkpoints. FR028 deferred, S3 unwaived, maintenance freeze unsigned and separate Ops product acceptance remain explicit.
