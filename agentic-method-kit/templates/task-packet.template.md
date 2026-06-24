# Task Packet: <task-name>

## Goal

<one sentence>

## Primary Layer

app | domain/<name> | service/<name> | package/<name> | infra | docs | method | repository-defined layer

## Dependency Layers

- none

## Harness Profile

- Template: admin-platform | api-service | backend-service | event-processor | cli-tool | library | data-pipeline | infra-change | mobile-app | dashboard | ui-heavy-product | docs-governance | custom
- Overlay: none
- Quality Profile: repository-defined profile | none
- Portable Failure Class: instruction-gap | task-boundary-gap | architecture-drift | test-gap | static-sensor-gap | runtime-evidence-gap | security-boundary-gap | ci-signal-noise | method-health-gap | none
- Owner Layer: portable-method | consumer-template | consumer-repository | agent-adapter | no-action
- Coverage Dimensions:
  - behaviour
  - maintainability
  - architecture-fitness
  - runtime-quality
  - method-health

## Contract Anchors

- `path/to/contract.md`

## Scope

### In

- explicit work

### Out

- explicit non-goals

## Assumptions and Open Questions

- Confirmed Facts: `none | facts already verified from code, contracts, logs, or user input`
- Working Assumptions: `none | current assumption that keeps work moving`
- Open Questions: `none | ambiguity that should stop execution or change the plan`

## Expected Files

### Create

- `path`

### Modify

- `path`

### Do Not Touch

- `path`

## Implementation Notes

- notes

## Minimum Viable Approach

- Selected Rung: `skip | reuse | stdlib | native platform | installed dependency | small local code | new dependency`
- Why This Is Enough: `<one sentence>`
- Upgrade Trigger: `none | condition that would justify the next rung`

## Success Criteria

- Behaviour Outcome: `<observable result>`
- Verification Signal: `<command, test, or evidence that proves the result>`
- Regression Watch: `<behavior that must remain unchanged>`

## Context Strategy

- Entry Sources: `AGENTS.md`, `CLAUDE.md`, current task packet, latest review summary | none
- Retrieval Order: `entry -> summary -> raw`
- Sensitive Context: `none | redacted or local-only handling rule`

## Method Readiness

- Consumer-Specific Controls: repository contract | checker | smoke path | none
- Required Sensors: command | review | runtime evidence | none
- Required Evidence: command summary | screenshot | smoke result | runtime gap | review summary
- Ratchet Decision: no-repeat-observed | guide-updated | sensor-added | gate-updated | template-updated | adapter-updated | registry-only
- Deferred Code Issues: none | symptom plus recommended follow-up task

## Delivery Governance

- Design Gate: spec reference | short boundary note | none
- Development Gate: expected files declared | do-not-touch declared | none
- QA Acceptance Gate: command | browser | runtime | human review | none
- GitHub Governance Gate: method-gate | repo-quality-gate | runtime-evidence-gate | external-flaky | not-applicable

## Structural Scope

- Affected Subgraph: `<entry -> core path -> exit/side effect>` | `none`
- Boundary Crossings: `none | ui -> api | service -> datastore | package -> external-service | plugin -> host | downstream -> upstream`
- Risk Nodes: `none | auth handler | payment service | permission service | job scheduler | generator orchestrator | deployment workflow`
- Graph Focus: `none | cycle-check | hub-check | call-depth | sensitive-input-flow`

## Verification Plan

- `command`

## Linkage

- Task ID: <task-id>
- OpenSpec Change: openspec/changes/<name>/ | none
- Plan References: docs/superpowers/plans/<file>.md, .omx/plans/<file>.md, .codex-flow/journal/<file>.jsonl | none
- Evidence Directory: .harness/evidence/<task-id>/
- Review File: .harness/evidence/<task-id>/review.md | none

## Evidence Required

- command result summary
- screenshots if UI changed
- smoke result if browser flow changed
- review summary

## Human Gates

- none

## Completion Checklist

- [ ] Layer and boundary declared
- [ ] Quality profile or explicit `none` declared
- [ ] Ratchet decision declared for repeated failures
- [ ] Delivery governance gates declared
- [ ] Contract anchors read
- [ ] Verification run or exception recorded
- [ ] Evidence saved or summarized
- [ ] Review completed
