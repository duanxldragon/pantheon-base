# Method Playbook

Chinese version: [METHOD_PLAYBOOK.zh.md](./METHOD_PLAYBOOK.zh.md)

This playbook turns a set of tools into a single operating method.

Read these method foundations first:

1. [HARNESS_CORE_MODEL.md](./HARNESS_CORE_MODEL.md)
2. [HARNESS_COVERAGE_MODEL.md](./HARNESS_COVERAGE_MODEL.md)
3. [HARNESS_TEMPLATE_TAXONOMY.md](./HARNESS_TEMPLATE_TAXONOMY.md)
4. [TOOL_ADAPTER_MATRIX.md](./TOOL_ADAPTER_MATRIX.md)

## Default Stack

- change-management layer: change identity, proposal, design, tasks, archive
- planning/execution layer: brainstorming, planning, execution, debugging, verification
- UI quality layer: visual, interaction, accessibility, and state quality gates
- browser/runtime evidence layer: browser evidence, QA, observability, review
- local harness checks: task packet, evidence, adoption

## Default Workflow

### 1. Intake

- Decide whether the work is `trivial` or `non-trivial`
- Use the repository's triviality policy when one exists; otherwise default to `non-trivial`
- If non-trivial, create or select a change identity such as an OpenSpec change
- Select the smallest applicable harness template or overlay

### 2. Design

- Use a structured brainstorming or design workflow
- Produce design/spec output
- Keep scope explicit

### 3. Planning

- Use a structured planning workflow
- Produce a concrete implementation plan

### 4. Task Packet

- Create a task packet from the plan
- Fill linkage fields:
  - task id
  - openspec change
  - evidence directory
  - review file
- For `non-trivial`, cross-layer, runtime-sensitive, permission/menu/i18n/audit/generator/dynamic-module work, record a minimum `Structural Scope`:
  - affected subgraph
  - boundary crossings
  - risk nodes
  - graph focus
- Record the implementer posture, reviewer posture, and stop points when the repository contract expects them

### 5. Implementation

- Use disciplined execution against the plan
- For debugging, route into `systematic-debugging`
- Treat implementation as the generator loop only; do not treat it as approval
- When the repository has CodeGraph, use it to constrain the change to the affected subgraph instead of trying to maintain a full-repo graph for small edits

### 6. UI Quality

- If UI is touched, run the repository's UI quality gate
- If browser paths matter, collect browser or runtime evidence

### 7. Evidence

- Save command results in `.harness/evidence/<task-id>/commands.json`
- Save human-readable summary in `summary.md`
- Save review output in `review.md`
- `review.md` must contain an embedded machine-readable JSON block
- For structural, high-risk, or cross-layer changes, add `graphChecks` to evidence to record which chain was reviewed, which structural checks ran, and what findings were discovered

### 8. Mechanical Checks

- Run:
  - `check-task-packet`
  - `check-evidence`
  - `check-review`
  - `check-adoption`
  - `check-template-health`
  - `check-runtime-evidence`
  - `check-doc-links`
  - `check-doc-inventory`
  - `check-sync-drift`
- For method upkeep, periodically run a harness coverage review using [HARNESS_COVERAGE_MODEL.md](./HARNESS_COVERAGE_MODEL.md)

### 9. Review

- Findings-first
- Review must point at the same task packet and evidence
- Use an external evaluator by default for non-trivial work; if only self-review is used, record why and what residual risk remains
- For structural, high-risk, or cross-layer work, review should at minimum say:
  - what affected subgraph actually changed
  - whether a new cycle or larger cycle cluster was introduced
  - whether a new hub node was created
  - whether the critical call chain became meaningfully deeper
  - whether unvalidated input can now cross a key boundary into a sensitive action

### 10. Close

- Merge or ship
- Archive the OpenSpec change when complete
- If the same failure pattern recurs, ratchet it into a guide, template, sensor, or gate instead of only patching code again
- After major model or tool upgrades, review whether old harness workarounds can be downgraded, replaced, or removed

## Minimum Machine-Readable Closure

Every non-trivial task should have:

- one change identity or explicit `none`
- one task packet
- one evidence directory
- one review artifact

All four must reference each other through explicit fields, not just by filename convention.

The portable minimum is:

- task packet `## Linkage`
- task packet `## Structural Scope`, when the task needs structural review
- evidence `linkage`
- evidence `graphChecks`, when the task needs structural review
- review `## Machine Readable` JSON block
