# Task Packet Spec

Chinese version: [TASK_PACKET_SPEC.md](./TASK_PACKET_SPEC.md)

Type: Contract
Layer: method
Status: Active

A task packet is the tool-agnostic input format for non-trivial work. It lets Codex, Claude Code, Cursor, Copilot, OpenHands, Aider, and human engineers share the same task boundary.

## 1. Location

Task packets should live by default at:

```text
docs/harness/tasks/YYYY-MM-DD-<task-name>.task.md
```

If the task comes from an existing superpowers plan, the task packet may reference that plan instead of repeating it in full.

## 2. Required Template

```md
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
- Coverage Dimensions:
  - behaviour
  - maintainability
  - architecture-fitness
  - runtime-quality
  - method-health

## Contract Anchors

- `path/to/contract.md`
- `path/to/design.md`
- `path/to/acceptance.md`

## Scope

### In

- <explicit work>

### Out

- <explicit non-goals>

## Structural Scope

- Affected Subgraph: `<entry -> core path -> exit/side effect>` | `none`
- Boundary Crossings: `none | ui -> api | service -> datastore | package -> external-service | plugin -> host | downstream -> upstream`
- Risk Nodes: `none | auth handler | payment service | permission service | job scheduler | generator orchestrator | deployment workflow`
- Graph Focus: `none | cycle-check | hub-check | call-depth | sensitive-input-flow`

## Expected Files

### Create

- `path`

### Modify

- `path`

### Do Not Touch

- `path`

## Implementation Notes

- <boundary or sequencing notes>

## Execution Roles

- Implementer Posture: `<implementer role or none>`
- Reviewer Posture: `<reviewer role or none>`

## Stop Points

- `none`
- or pause before schema / contract / delete / release gate work

## State Plan

- Checkpoint Expectation: `none | path | artifact name`
- Resume Artifacts: `none | path`

## Verification Plan

### Backend

- `command`

### Frontend

- `command`

### Browser / Smoke

- `command or none`

## Linkage

- Task ID: `YYYY-MM-DD-task-name`
- OpenSpec Change: `openspec/changes/<name>/` | none
- Superpowers Plan: `docs/superpowers/plans/<file>.md` | none
- Evidence Directory: `.harness/evidence/<task-id>/`
- Review File: `.harness/evidence/<task-id>/review.md` | none

## Evidence Required

- command result summary
- screenshots if UI changed
- smoke JSON if browser flow changed
- runtime logs / metrics / traces / performance signal, or an explicit runtime gap if the task is runtime-sensitive
- review summary

## Human Gates

- <gate or none>

## Completion Checklist

- [ ] Layer and boundary declared
- [ ] Contract anchors read
- [ ] Tests or checks updated
- [ ] Verification run or exception recorded
- [ ] Evidence saved or summarized
- [ ] Docs updated if contracts changed
- [ ] Review completed
```

`Execution Roles`, `Stop Points`, and `State Plan` are optional sections, but once a repository contract requires them or a task declares them explicitly, their content must be complete, interpretable, and checkable.

`Structural Scope` may be `none` for trivial work. For `non-trivial`, cross-layer, runtime-sensitive, permission/menu/i18n/audit/generator/dynamic-module tasks, it should usually capture the smallest affected subgraph so implementers and reviewers inspect the same structural boundary.

## 3. Trivial Tasks

The following tasks may skip task-packet creation:

- typo fixes
- documentation additions that do not change behavior
- read-only diagnosis
- narrow single-file formatting fixes

But if a trivial task touches permissions, menus, schema, i18n, audit, security boundaries, release flow, or upstream/downstream contracts, it must be upgraded into a task packet.

## 4. Human Gate Rules

Task packets must list human gates explicitly. If none exist, write `none`.

The following must be listed as gates:

- schema or migration changes
- deleting files or directories
- core contract, public API, or upstream contract changes
- overriding upstream-defined shared behavior in a downstream repository, plugin, or extension
- new dependencies or external services
- model changes affecting permission, menu, audit, or i18n

## 5. Tool Usage

Tool adapters may translate a task packet into their execution format, but they must not lose:

- layer
- harness template and coverage dimensions
- scope
- execution roles when declared
- stop points when declared
- state/checkpoint expectations when declared
- contract anchors
- verification plan
- evidence required
- human gates

## 6. Machine-Readable Linkage

The following fields are the minimum closed-loop keys linking a task packet to later artifacts:

- `Task ID`: primary key; must match the `<task-id>.task.md` filename
- `Evidence Directory`: must point to `.harness/evidence/<task-id>/`
- `Review File`: if a review artifact is retained, it must point to a file under the evidence directory
- `OpenSpec Change`: if the task comes from OpenSpec, the change path must be recorded explicitly; otherwise use `none`
- `Superpowers Plan`: if the task comes from `docs/superpowers/plans/*`, it must be recorded explicitly; otherwise use `none`

These linkage fields connect `OpenSpec change / superpowers plan / task packet / evidence / review` into a traceable chain.
