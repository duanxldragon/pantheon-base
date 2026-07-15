# Task Packet: grill-me inheritance reference in pantheon-base

## Goal

Document shared `grill-me` skill inheritance from `pantheon-harness` in `pantheon-base` without duplicating skill files.

## Primary Layer

platform

## Dependency Layers

- ../pantheon-harness/skills/grill-me/SKILL.md
- ../pantheon-harness/patterns/tool-adapter-matrix.zh.md
- docs/README.md

## Harness Profile

- Template: custom
- Overlay: pantheon-base
- Quality Profile: method-health
- Owner Layer: consumer-template
- Coverage Dimensions:
  - maintainability
  - method-health

## Contract Anchors

- `../pantheon-harness/skills/grill-me/SKILL.md`
- `../pantheon-harness/patterns/tool-adapter-matrix.zh.md`

## Scope

### In

- Add shared-skill inheritance note in `pantheon-base/docs/README.md` for `grill-me`.
- Do not copy skill files into `pantheon-base`.

### Out

- Do not create repo-local `grill-me` skill files in `pantheon-base`.
- Do not change runtime behavior.

## Assumptions and Open Questions

- Confirmed Facts:
  - `pantheon-harness` now contains usable `grill-me` SKILL.md files.
  - `pantheon-base/docs/README.md` is the local harness documentation index.
- Working Assumptions:
  - Shared skills are referenced, not duplicated.
- Open Questions:
  - none

## Expected Files

### Create

- `pantheon-base/docs/harness/tasks/2026-07-13-grill-me-inheritance-reference.task.md`
- `pantheon-base/.harness/evidence/2026-07-13-grill-me-inheritance-reference/commands.json`
- `pantheon-base/.harness/evidence/2026-07-13-grill-me-inheritance-reference/review.md`

### Modify

- `pantheon-base/docs/README.md`

### Do Not Touch

- `pantheon-base/.agents/skills/**`
- `pantheon-base/.codex/skills/**`

## Implementation Notes

- Keep this as an inheritance reference only.

## Minimum Viable Approach

- Selected Rung: docs-governance
- Why This Is Enough: no runtime change required
- Upgrade Trigger: none

## Success Criteria

- Behaviour Outcome:
  - `pantheon-base` documents the canonical `grill-me` location without copying it.
- Verification Signal:
  - `git diff -- docs/README.md` shows only the inheritance note.
  - `node scripts/harness/check-adoption.mjs --root .` passes.
- Regression Watch:
  - No repo-local skill files added.

## Context Strategy

- Entry Sources: base docs README, tool-adapter matrix
- Retrieval Order: entry -> summary -> raw
- Retrieval Helpers: none
- Promotion Target: docs/harness tasks and evidence directories
- Response Budget: terse
- Sensitive Context: none

## Method Readiness

- Consumer-Specific Controls: none
- Required Sensors: command | review
- Required Evidence: command summary | review summary
- Ratchet Decision: template-updated
- Deferred Code Issues: none

## Delivery Governance

- Design Gate: short boundary note
- Development Gate: expected files declared
- QA Acceptance Gate: command | human review
- GitHub Governance Gate: method-gate

## Structural Scope

- Affected Subgraph: docs/README -> shared skill reference
- Boundary Crossings: consumer-template -> portable-method
- Risk Nodes: none
- Graph Focus: none

## Verification Plan

- `git diff -- docs/README.md`
- `node "d:\workspace\go\pantheon-platform\pantheon-base\scripts\harness\check-adoption.mjs" --root "d:\workspace\go\pantheon-platform\pantheon-base"`

## Linkage

- Task ID: 2026-07-13-grill-me-inheritance-reference
- Task Manifest: .harness/tasks/2026-07-13-grill-me-inheritance-reference/manifest.json
- OpenSpec Change: none
- Plan References: none
- Evidence Directory: .harness/evidence/2026-07-13-grill-me-inheritance-reference/
- Review File: .harness/evidence/2026-07-13-grill-me-inheritance-reference/review.md

## Evidence Required

- command result summary
- review summary

## Human Gates

- none

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Inheritance reference added
- [x] No copied skill files
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
