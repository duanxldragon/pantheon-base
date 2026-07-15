# Task Packet: Superpowers legacy linkage alignment in pantheon-base

## Goal

Audit `pantheon-base/docs/harness/tasks/*.task.md` for legacy `Superpowers Plan` linkage and align them to current Pantheon Harness plan-reference conventions while preserving historical plan paths where still referenced.

## Primary Layer

platform

## Dependency Layers

- ../pantheon-harness/architecture/harness/task-packet-spec.md
- ../pantheon-harness/architecture/harness/verification-evidence-spec.md
- scripts/harness/check-task-packet.mjs

## Harness Profile

- Template: custom
- Overlay: pantheon-base
- Quality Profile: method-health
- Owner Layer: consumer-template
- Coverage Dimensions:
  - maintainability
  - method-health

## Contract Anchors

- `../pantheon-harness/architecture/methodology/harness-methodology.zh.md`
- `../pantheon-harness/architecture/methodology/superpowers-migration.md`
- `scripts/harness/check-task-packet.mjs`

## Scope

### In

- Add normalized `Plan References` entries in task packets that currently only use `Superpowers Plan: none`.
- Confirm legacy `Superpowers Plan` entries remain valid only where a real historical plan path is still in use.
- Update `scripts/harness/check-task-packet.mjs` to prefer `Plan References` while still tolerating `Superpowers Plan`.

### Out

- Do not delete `docs/superpowers/specs/` or `docs/superpowers/plans/` files in this task.
- Do not modify backend/frontend runtime code.

## Assumptions and Open Questions

- Confirmed Facts:
  - `pantheon-base` has 22 task docs still containing `Superpowers Plan`.
  - `pantheon-harness` already treats Superpowers as legacy plan reference and prefers `Plan References`.
- Working Assumptions:
  - Base checker should become dual-format tolerant, then gradually normalize.
- Open Questions:
  - none

## Expected Files

### Create

- `pantheon-base/docs/harness/tasks/2026-07-13-superpowers-linkage-alignment.task.md`
- `pantheon-base/.harness/evidence/2026-07-13-superpowers-linkage-alignment/commands.json`
- `pantheon-base/.harness/evidence/2026-07-13-superpowers-linkage-alignment/review.md`

### Modify

- `pantheon-base/docs/harness/tasks/2026-07-10-p1-1-permission-anti-privilege-escalation.task.md`
- `pantheon-base/docs/harness/tasks/2026-07-10-p1-2-multi-instance-consistency.task.md`
- `pantheon-base/docs/harness/tasks/2026-07-10-p1-3-schema-single-source.task.md`
- `pantheon-base/scripts/harness/check-task-packet.mjs`

### Do Not Touch

- `pantheon-base/backend/**`
- `pantheon-base/frontend/src/**`
- `pantheon-base/docs/superpowers/**`

## Implementation Notes

- Normalize 3 active July task packets as representative alignment samples.
- Update checker to accept both legacy and normalized linkage keys.
- Leave remaining legacy docs for follow-up normalization.

## Minimum Viable Approach

- Selected Rung: docs-governance
- Why This Is Enough: this packet only standardizes metadata, not runtime behavior
- Upgrade Trigger: none

## Success Criteria

- Behaviour Outcome:
  - Sample base task packets pass checker with normalized plan linkage wording.
  - Base checker accepts both legacy and preferred linkage formats.
- Verification Signal:
  - `node scripts/harness/check-task-packet.mjs --root .` passes for sample tasks.
  - `node scripts/harness/check-adoption.mjs --root .` passes.
- Regression Watch:
  - No runtime code changed.
  - Historical superpowers docs retained.

## Context Strategy

- Entry Sources: base docs README, superpowers-migration.md, current task packet list
- Retrieval Order: entry -> summary -> raw
- Retrieval Helpers: none
- Promotion Target: docs/harness/tasks and checker script
- Response Budget: standard
- Sensitive Context: none

## Method Readiness

- Consumer-Specific Controls: checker
- Required Sensors: command | review
- Required Evidence: command summary | review summary
- Ratchet Decision: template-updated | guide-updated
- Deferred Code Issues: none

## Delivery Governance

- Design Gate: short boundary note
- Development Gate: expected files declared
- QA Acceptance Gate: command | human review
- GitHub Governance Gate: method-gate

## Structural Scope

- Affected Subgraph: task packet metadata -> checker validation -> docs index
- Boundary Crossings: consumer-template -> portable-method
- Risk Nodes: none
- Graph Focus: none

## Verification Plan

- `git diff -- docs/harness/tasks/2026-07-10-p1-1-permission-anti-privilege-escalation.task.md docs/harness/tasks/2026-07-10-p1-2-multi-instance-consistency.task.md docs/harness/tasks/2026-07-10-p1-3-schema-single-source.task.md scripts/harness/check-task-packet.mjs`
- `node "d:\workspace\go\pantheon-platform\pantheon-base\scripts\harness\check-task-packet.mjs" --root "d:\workspace\go\pantheon-platform\pantheon-base"`
- `node "d:\workspace\go\pantheon-platform\pantheon-base\scripts\harness\check-adoption.mjs" --root "d:\workspace\go\pantheon-platform\pantheon-base"`

## Linkage

- Task ID: 2026-07-13-superpowers-linkage-alignment
- Task Manifest: .harness/tasks/2026-07-13-superpowers-linkage-alignment/manifest.json
- OpenSpec Change: none
- Plan References: none
- Evidence Directory: .harness/evidence/2026-07-13-superpowers-linkage-alignment/
- Review File: .harness/evidence/2026-07-13-superpowers-linkage-alignment/review.md

## Evidence Required

- command result summary
- review summary
- explicit gap if checker update is deferred

## Human Gates

- approve normalizing base task metadata from legacy `Superpowers Plan` to `Plan References`

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Sample task packets updated
- [x] checker updated to prefer normalized linkage
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
