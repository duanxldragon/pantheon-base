# Method Playbook

Chinese version: [METHOD_PLAYBOOK.zh.md](./METHOD_PLAYBOOK.zh.md)

This playbook turns a set of tools into a single operating method.

Read these method foundations first:

1. [HARNESS_CORE_MODEL.md](./HARNESS_CORE_MODEL.md)
2. [CONTEXT_ENGINEERING_PROTOCOL.md](./CONTEXT_ENGINEERING_PROTOCOL.md)
3. [METHOD_FIRST_DELIVERY_POLICY.md](./METHOD_FIRST_DELIVERY_POLICY.md)
4. [MINIMAL_COMPLEXITY_LADDER.md](./MINIMAL_COMPLEXITY_LADDER.md)
5. [HARNESS_COVERAGE_MODEL.md](./HARNESS_COVERAGE_MODEL.md)
6. [CROSS_AGENT_RATCHET_MODEL.md](./CROSS_AGENT_RATCHET_MODEL.md)
7. [DESIGN_DEV_QA_GITHUB_GOVERNANCE.md](./DESIGN_DEV_QA_GITHUB_GOVERNANCE.md)
8. [HARNESS_TEMPLATE_TAXONOMY.md](./HARNESS_TEMPLATE_TAXONOMY.md)
9. [TOOL_ADAPTER_MATRIX.md](./TOOL_ADAPTER_MATRIX.md)

## Default Stack

- change-management layer: change identity, proposal, design, tasks, archive
- planning/execution layer: brainstorming, planning, execution, debugging, verification
- UI quality layer: visual, interaction, accessibility, and state quality gates
- browser/runtime evidence layer: browser evidence, QA, observability, review
- local harness checks: task packet, evidence, adoption

## Default Workflow

The default workflow is method-first. Do not start production-code changes for non-trivial work until the intake, profile, verification, review, and ratchet plan are clear.

### 0. Collaboration Protocol

Every non-trivial task should first establish a lightweight collaboration protocol so context does not get lost between the human, planner, executor, and reviewer.

- State what the human must answer: goal, unacceptable risk, acceptance standard, and high-impact gates that require a stop.
- State what the agent owns: reading repository sources of truth, assembling the task packet, running commands, saving evidence, and turning review results into a decision-ready summary.
- State stop points: missing authority, production or external-system action, data deletion or migration, scope expansion, insufficient evidence, or conflict between implementer and reviewer conclusions.
- State handoff artifacts: task packet, evidence directory, review artifact, and decision log must link to each other.
- State the lightweight path: trivial or L0/L1 work may skip full closure, but still needs scope, verification, and known gaps.

### 0.1 Minimal Complexity

Before implementation, apply [MINIMAL_COMPLEXITY_LADDER.md](./MINIMAL_COMPLEXITY_LADDER.md):

- Record the highest rung that satisfies the task: skip, reuse, stdlib, native platform, installed dependency, one local expression, or minimum new code.
- Prefer deletion, reuse, standard library, native platform features, and existing dependencies before new abstractions or dependencies.
- Keep trust-boundary validation, authorization, audit, accessibility, i18n, runtime evidence, and explicit user requirements out of the simplification target.
- For non-trivial logic, leave the smallest runnable check that would fail if the logic regresses.
- If the chosen simplification has a known ceiling, record the trigger with a `minimal-complexity:` comment or equivalent debt ledger entry.

### 0.2 Execution Guardrails

Before implementation, apply [EXECUTION_GUARDRAILS.md](./EXECUTION_GUARDRAILS.md):

- Write down confirmed facts, working assumptions, and open questions when ambiguity exists.
- Record the smallest viable approach before introducing a new abstraction or dependency.
- Constrain the intended diff before editing adjacent files.
- Convert "done" into an observable success signal before writing code.

### 0.3 Context Strategy

Before implementation, apply [CONTEXT_ENGINEERING_PROTOCOL.md](./CONTEXT_ENGINEERING_PROTOCOL.md):

- decide which entry sources actually govern this task instead of replaying broad history
- prefer `entry -> summary -> raw` retrieval rather than opening raw logs first
- if the task carries sensitive or non-retainable input, record the redaction or local-only handling rule before saving evidence
- use checkpoints or rewind for reversible exploration when available, then write the chosen path back into repo state

### 1. Intake

- Decide whether the work is `trivial` or `non-trivial`
- Use the repository's triviality policy when one exists; otherwise default to `non-trivial`
- If non-trivial, create or select a change identity such as an OpenSpec change
- Select the smallest applicable harness template or overlay
- Decide whether the current task is method/process work or production-code work. Method/process work should record code-level failures as deferred backlog unless they block method validation.

### 2. Design

- Use a structured brainstorming or design workflow
- Produce design/spec output
- Keep scope explicit
- Apply the Design Gate in [DESIGN_DEV_QA_GITHUB_GOVERNANCE.md](./DESIGN_DEV_QA_GITHUB_GOVERNANCE.md); for small tasks this can be a short written boundary, not a large document

### 3. Planning

- Use a structured planning workflow
- Produce a concrete implementation plan

### 4. Task Packet

- Create a task packet from the plan
- Select a quality profile or explicitly record `none`
- Record the portable failure class and ratchet decision when the task addresses repeated failure
- Add short sections for `Assumptions and Open Questions`, `Minimum Viable Approach`, and `Success Criteria` unless the task is genuinely trivial
- For long-running, high-context, cross-session, or sensitive work, add a short `Context Strategy` section so retrieval order and privacy boundaries are explicit
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

- Start implementation only after method readiness is explicit; if method readiness is missing, return to intake or task packet refinement
- Use disciplined execution against the plan
- For debugging, route into `systematic-debugging`
- Treat implementation as the generator loop only; do not treat it as approval
- Keep the diff surgical; if a file cannot be justified by scope, verification, or evidence closure, do not touch it
- When the repository has CodeGraph, use it to constrain the change to the affected subgraph instead of trying to maintain a full-repo graph for small edits

### 6. UI Quality

- If UI is touched, run the repository's UI quality gate
- If browser paths matter, collect browser or runtime evidence
- Treat UI, browser, runtime, or human acceptance evidence as the QA Acceptance Gate when no dedicated QA role exists

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
- Classify any PR or CI failure as `method-gate`, `repo-quality-gate`, `runtime-evidence-gate`, `external-flaky`, or `not-applicable`
- Archive the OpenSpec change when complete
- If the same failure pattern recurs, ratchet it into a guide, template, sensor, or gate instead of only patching code again
- Use [CROSS_AGENT_RATCHET_MODEL.md](./CROSS_AGENT_RATCHET_MODEL.md) to decide whether the promotion belongs in the portable method, a consumer template, a consumer repository, or an agent adapter
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
