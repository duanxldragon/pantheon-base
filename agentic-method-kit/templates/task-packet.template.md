# Task Packet: <task-name>

## Goal

<one sentence>

## Primary Layer

platform | system/auth | system/iam | system/org | system/config | business/* | app

## Dependency Layers

- none

## Harness Profile

- Template: admin-platform | api-service | event-processor | dashboard | ui-heavy-product | custom
- Overlay: none
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

## Expected Files

### Create

- `path`

### Modify

- `path`

### Do Not Touch

- `path`

## Implementation Notes

- notes

## Structural Scope

- Affected Subgraph: `<entry -> core path -> exit/side effect>` | `none`
- Boundary Crossings: `none | platform -> system/auth | system/* -> pkg/* | base -> ops`
- Risk Nodes: `none | auth handler | permission service | menu registry | generator orchestrator`
- Graph Focus: `none | cycle-check | hub-check | call-depth | sensitive-input-flow`

## Verification Plan

- `command`

## Linkage

- Task ID: <task-id>
- OpenSpec Change: openspec/changes/<name>/ | none
- Superpowers Plan: docs/superpowers/plans/<file>.md | none
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
- [ ] Contract anchors read
- [ ] Verification run or exception recorded
- [ ] Evidence saved or summarized
- [ ] Review completed
