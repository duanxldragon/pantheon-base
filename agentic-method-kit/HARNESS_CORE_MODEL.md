# Harness Core Model

Chinese version: [HARNESS_CORE_MODEL.zh.md](./HARNESS_CORE_MODEL.zh.md)

This document defines the tool-agnostic core model for Harness Engineering.

The method does not depend on Claude Code, Codex, Cursor, Copilot, OpenHands, Aider, or any other single agent runtime. Those tools are adapters. The harness is the repo-owned control system around the model.

## 1. Definition

In this method:

```text
coding agent = model + runtime + harness
```

The model provides language and reasoning capability.

The runtime provides tool execution, file access, shell access, sandboxing, browser access, session handling, and optional agent orchestration.

The harness is the project-owned system of guides, sensors, state, gates, templates, and review loops that steers the runtime toward the desired codebase state.

## 2. Core Objects

### 2.1 Guides

Guides are feedforward controls. They increase the chance that the agent starts in the right direction.

Examples:

- repo entry files such as `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, or equivalent
- contracts, design docs, and acceptance docs
- task packets and implementation plans
- affected-subgraph notes and boundary-crossing summaries
- architecture maps and domain rules
- how-to documents and project-local skills
- generated references such as schema snapshots or API maps

Rules:

- Guides should be short at the entry point and deep by link.
- Load guide context progressively: entry metadata first, task-specific instructions second, linked resources only when needed.
- Every durable guide should have an owner or source of truth.
- Rules that repeatedly matter should eventually become sensors or gates.

### 2.2 Sensors

Sensors are feedback controls. They detect whether the agent's output moved the repository toward or away from the desired state.

Examples:

- tests, type checks, lint, static analysis, architectural checks
- CodeGraph-assisted structural review for cycles, hubs, call-depth, and sensitive-flow
- browser smoke tests, screenshots, console logs, accessibility checks
- observability queries, logs, traces, metrics
- review agents, human review, architecture review, security review
- drift scans, dead-code scans, dependency scans

Rules:

- Prefer fast deterministic sensors in the inner loop.
- Use inferential sensors where semantic judgment is required.
- If a recurring mistake reaches human review, either add a sensor or improve an existing one.

### 2.3 State

State is the durable memory that lets humans and agents resume work.

Examples:

- OpenSpec changes or equivalent change identity
- task packets
- structural-scope / affected-subgraph summaries
- evidence directories
- graphChecks results
- review artifacts
- decision logs
- completed plans and known technical debt

Rules:

- State must live in versioned repository files or explicit artifact locations.
- State must be linkable by stable IDs.
- Long-running work must survive context resets through state artifacts.
- Retrieve historical state in layers: index first, summary or timeline second, raw detail last.

### 2.4 Gates

Gates decide whether a task can move forward.

Examples:

- human gates for schema, permissions, deletion, dependencies, and security boundaries
- mechanical gates for task packet, evidence, review, and document linkage
- CI gates for tests, lint, contracts, and static checks
- review gates for unresolved P0/P1 findings

Rules:

- Gates should be explicit, not implied by convention.
- Gates must say what evidence they require.
- Gates should be as early as practical, but not so early that they block useful iteration.

### 2.5 Templates

Templates package guides, sensors, gates, and state conventions for a common repository topology.

Examples:

- admin platform template
- API service template
- event processor template
- dashboard template
- UI-heavy product template
- CLI tool template
- library / SDK template
- data pipeline template
- infrastructure change template
- mobile app template
- documentation governance template

Rules:

- Templates are starting points, not permanent forks.
- Templates must be versioned.
- Template drift must be visible and upgradable.

## 3. Control Planes

The harness has six planes.

### 3.1 Instruction Plane

Defines what the agent should know before acting.

Typical artifacts:

- repo entry file
- architecture map
- contracts
- task packet
- skills or how-to guides

### 3.2 Task Plane

Defines what the current work is and what is out of scope.

Typical artifacts:

- OpenSpec change or equivalent
- task packet
- affected-subgraph / boundary-crossing statements
- implementation plan
- sprint contract or done criteria

### 3.3 Execution Plane

Defines how work is performed.

Typical artifacts:

- tool adapters
- shell commands
- sandbox configuration
- worktree strategy
- local scripts

### 3.4 Verification Plane

Defines how output is checked.

Typical artifacts:

- tests and smoke checks
- static analysis
- graphChecks
- visual evidence
- observability queries
- evidence summaries

### 3.5 Review Plane

Defines how judgment is applied.

Typical artifacts:

- findings-first review
- role-specific review
- structural findings such as cycle, hub, call-depth, and sensitive-flow
- human approval
- review artifact linkage

### 3.6 Governance Plane

Defines how the harness itself stays coherent.

Typical artifacts:

- method version
- adoption checks
- drift checks
- documentation frontmatter checks
- template upgrade notes
- harness coverage review

## 4. Lifecycle Events

The method treats harness execution as a lifecycle, not a one-shot prompt.

```text
TaskIntake
  -> ContextResolved
  -> PlanAccepted
  -> WorkStarted
  -> SensorRun
  -> EvidenceAttached
  -> ReviewRequested
  -> ReviewClosed
  -> HandoffCompleted
  -> DriftObserved
  -> HarnessUpdated
```

Not every task needs every event. Trivial tasks can skip task packets when repository rules allow it, but they still need scope, verification, and known-gap clarity.

### 4.1 Human-Agent Collaboration Loop

Human-agent collaboration is not "a human gives one sentence and the agent improvises," and it is not "the human repeatedly shuttles context between tools." The default loop should be:

```text
HumanIntent
  -> AgentClarifies
  -> BoundedTask
  -> AgentExecutes
  -> SensorsProduceEvidence
  -> ReviewerJudges
  -> HumanDecidesOnlyWhenNeeded
  -> StateUpdated
```

Collaboration rules:

- The human owns goals, priority, risk acceptance, product judgment, and high-impact gates; the human should not be responsible for manually moving context between tools.
- The agent or dispatcher turns intent into a bounded task packet, chooses the smallest useful sensors, executes or delegates work, and assembles evidence and review artifacts.
- When information is missing but progress is safe, the agent should first perform reversible repo-local exploration; escalate to the human only for missing goals, risk acceptance, credentials, external production authority, or destructive authorization.
- Every human decision must be written back into state: what was decided, what evidence supported it, which risks were accepted, and who owns the next step.
- If the human has to explain the same context repeatedly, the guide, template, adapter, or state linkage is insufficient; ratchet the method instead of relying on human memory.

### 4.2 Execution Guardrails

The harness should make four common failure modes explicit before they become review churn:

- ambiguity that was never surfaced
- complexity that was never justified
- diff expansion that was never scoped
- completion claims that were never verified

Portable execution guardrails for these cases live in [EXECUTION_GUARDRAILS.md](./EXECUTION_GUARDRAILS.md).

In practice, this means the harness should give the agent a place to record:

- confirmed facts, working assumptions, and open questions
- the smallest viable approach and its upgrade trigger
- the boundaries of the intended diff
- the observable signal that proves completion

### 4.3 Context Engineering

The harness should retrieve context in layers instead of front-loading every prior artifact.

Portable context-loading rules live in [CONTEXT_ENGINEERING_PROTOCOL.md](./CONTEXT_ENGINEERING_PROTOCOL.md).

In practice:

- start with repo entry guides and the current task packet
- retrieve summaries or timeline-style state before raw logs
- prefer file-local, task-local, or affected-subgraph-local history over broad replay
- write winning decisions back into repo state so future sessions do not depend on chat memory
- keep non-retainable or sensitive input out of shared durable state unless the repository explicitly requires and approves it

## 5. Agent Roles

The method supports these roles without requiring any specific runtime.

- Planner: expands intent into a bounded spec or plan.
- Generator: implements the agreed work.
- Evaluator: tests behavior against done criteria and probes edge cases.
- Reviewer: checks architecture, security, regressions, and evidence quality.
- Janitor: scans drift and proposes cleanup tasks.
- Human: owns goals, tradeoffs, risk acceptance, and final judgment for high-impact changes.

One tool may play multiple roles, but high-risk tasks should separate generator and evaluator/reviewer roles.

## 6. Ratchet Rule

Every repeated agent failure should be classified.

```text
failure -> guide update | sensor update | gate update | template update | no action
```

Do not add rules speculatively. Add rules when they trace to a real failure, a hard external constraint, or a known high-impact risk.

Do not keep rules forever by default. Periodically review whether each harness component is still load-bearing as models, tools, and repository structure improve.

## 7. Tool-Agnostic Mapping

Tool-specific features map into this model without becoming the method.

| Harness concept | Possible tool-specific forms |
|---|---|
| Guide | `AGENTS.md`, `CLAUDE.md`, Cursor rules, skill docs, repo contracts |
| Sensor | tests, lints, browser tools, review agents, CI jobs |
| State | plans, task packets, evidence, reviews, OpenSpec changes |
| Gate | hooks, CI checks, approval prompts, PR rules |
| Adapter | Claude Code command, Codex skill, Cursor rule, shell script, human checklist |

The portable method is the model above. Tools are implementation choices.
