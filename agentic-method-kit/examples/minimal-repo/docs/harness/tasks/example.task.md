# Task Packet: example

## Goal

Demonstrate the minimum valid task packet.

## Primary Layer

platform

## Dependency Layers

- none

## Harness Profile

- Template: custom
- Overlay: none
- Coverage Dimensions:
  - method-health

## Contract Anchors

- `docs/contracts/example.md`

## Scope

### In

- validate the portable method kit fixture

### Out

- any real implementation work

## Assumptions and Open Questions

- Confirmed Facts: `example.task.md` is a fixture consumed by method checks
- Working Assumptions: no repository-specific runtime behavior is needed for this fixture
- Open Questions: none

## Expected Files

### Create

- `.harness/evidence/example/commands.json`
- `.harness/evidence/example/review.md`

### Modify

- none

### Do Not Touch

- `src/`

## Implementation Notes

- fixture only

## Minimum Viable Approach

- Selected Rung: `small local code`
- Why This Is Enough: the fixture only needs enough structure to exercise the checker
- Upgrade Trigger: `none`

## Success Criteria

- Behaviour Outcome: the sample task packet passes the mechanical checker
- Verification Signal: `node agentic-method-kit/scripts/check-task-packet.mjs --root agentic-method-kit/examples/minimal-repo`
- Regression Watch: required linkage and checklist fields stay present

## Execution Roles

- Implementer Posture: `fixture-author`
- Reviewer Posture: `mechanical`

## Stop Points

- `none`

## State Plan

- Checkpoint Expectation: `none`
- Resume Artifacts: `none`

## Structural Scope

- Affected Subgraph: `task packet -> evidence -> review`
- Boundary Crossings: `none`
- Risk Nodes: `none`
- Graph Focus: `cycle-check | hub-check`

## Verification Plan

- `node agentic-method-kit/scripts/check-task-packet.mjs --root agentic-method-kit/examples/minimal-repo`

## Linkage

- Task ID: example
- Task Manifest: .harness/tasks/example/manifest.json
- OpenSpec Change: openspec/changes/example-change/
- Superpowers Plan: docs/superpowers/plans/example-plan.md
- Evidence Directory: .harness/evidence/example/
- Review File: .harness/evidence/example/review.md

## Evidence Required

- command result summary
- review summary

## Human Gates

- none

## Completion Checklist

- [ ] Layer and boundary declared
- [ ] Contract anchors read
- [ ] Verification run or exception recorded
- [ ] Evidence saved or summarized
- [ ] Review completed
