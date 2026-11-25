---
title: Preserve archive bytes during default formatting
doc_type: Remediation
layer: platform
status: Active
updated_at: 2026-11-19
linked_contracts:
  - docs/contracts/DOCUMENT_GOVERNANCE_CONTRACT.md
---

# Task Packet: 2026-11-19-archive-formatter-protection

## Goal

Protect archived task/evidence bytes from default Prettier and lint-staged writes,
keeping active document formatting and the Base-first inheritance boundary.

## Primary Layer

platform

## Workspace Context

- Target Repository: pantheon-base
- Repository Role: foundation-source
- Upstream Dependencies: pantheon-harness
- Downstream Consumers: pantheon-ops
- Sync Expectation: deferred
- Release Requirement: foundation-release

## Dependency Layers

Shared repository engineering configuration and Ops business-consumer governance;
platform and system product behavior unchanged.

## Harness Profile

- Template: custom
- Overlay: pantheon-base
- Coverage Dimensions:
  - maintainability
  - architecture-fitness
  - method-health

## Contract Anchors

- `AGENTS.md`
- `docs/contracts/DOCUMENT_GOVERNANCE_CONTRACT.md`
- `docs/harness/PANTHEON_BASE_DELIVERY_WORKFLOW.md`

## Scope

### In

- Standard root Prettier ignore for historical archive files and snapshots.
- Actual formatter/lint-staged fixture checks with negative witness and index bytes.
- Shared rule, scoped evidence, independent review and downstream gap.

### Out

- Publishing, merging, Ops foundation lock/tree replacement, gate policy changes,
  unrelated edits and historical byte rewrites.

## Expected Files

### Create

- .prettierignore
- tests/scripts/harness-archive-formatting.test.mjs
- Linked task, manifest and current evidence.

### Modify

- Canonical delivery workflow CN/EN archive protection rule.

### Do Not Touch

- Historical archive bytes, existing product changes, Ops shared tree and official lock.

## Implementation Notes

Primary Codex owns configuration, regression and governance records. Independent
code-reviewer and architect evaluate this scope. Reuse installed Prettier and
lint-staged; no new dependency or wrapper. Detailed plan is in the linkage below.

## Verification Plan

- node --test tests/scripts/harness-archive-formatting.test.mjs
- Scoped task/evidence/review and document metadata/template checks.
- Independent code and architecture review with source/evidence binding.
- Ops historical SHA integrity and unchanged governance delta.
- No backend/frontend source changes; no product tests or visual claims in this scope.

## Linkage

- Task ID: 2026-11-19-archive-formatter-protection
- Task Manifest: .harness/tasks/2026-11-19-archive-formatter-protection/manifest.json
- Superpowers Plan: none
- Plan References: .harness/tasks/2026-11-19-archive-formatter-protection/plan.md
- Evidence Directory: .harness/evidence/2026-11-19-archive-formatter-protection/
- Review File: .harness/evidence/2026-11-19-archive-formatter-protection/review.md
- Change Reference: none
- OpenSpec Change: none

## Evidence Required

Exact commands, results, source hashes, negative defect witness, archive/index bytes,
independent reviewer reports and explicit downstream/publication gaps.

## Human Gates

Formal release, consumer lock/rebuild verification and final acceptance remain open.
The parent Ops history audit excludes publication, merging and lock replacement.

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
- [ ] Formal publication and downstream consumer adoption
