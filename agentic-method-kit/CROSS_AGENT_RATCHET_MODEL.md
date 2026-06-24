# Cross-Agent Ratchet Model

This document defines how Harness Engineering turns repeated AI-agent failures into reusable method assets across tools, agents, and product repositories.

The model is intentionally independent of any specific coding agent, runtime, CI provider, or business architecture. Product repositories are consumers of this method, not the method source of truth.

## 1. Portability Boundary

Harness assets fall into two classes.

| Class | Lives In | Purpose | Examples |
|---|---|---|---|
| Portable method asset | `agentic-method-kit/` | Reusable across agents and repositories | task packet schema, evidence schema, ratchet rules, review artifact shape, adapter contract |
| Consumer overlay | product repository | Project-specific architecture and quality controls | admin-platform quality profiles, auth policy tests, i18n hardcode checks, smoke routes |

Rules:

- A failure pattern belongs in the portable method only when it can recur across unrelated repositories or agent runtimes.
- A failure pattern belongs in the consumer overlay when it depends on product architecture, domain contracts, repository layout, or business workflows.
- Portable documents may include consumer examples, but examples must be labelled as examples and must not become universal requirements.

## 2. Failure Identity

Every repeated failure should be described with a stable identity before adding rules.

Minimum identity:

```text
failure_id
failure_class
agent_runtime
repository
task_profile
trigger
missed_by
detected_by
recommended_promotion
owner_layer
```

Recommended `failure_class` values:

- `instruction-gap`
- `task-boundary-gap`
- `architecture-drift`
- `test-gap`
- `static-sensor-gap`
- `runtime-evidence-gap`
- `security-boundary-gap`
- `ci-signal-noise`
- `method-health-gap`

`owner_layer` must be one of:

- `portable-method`
- `consumer-template`
- `consumer-repository`
- `agent-adapter`
- `no-action`

## 3. Promotion Ladder

Use the smallest control that prevents recurrence.

```text
observe repeated failure
  -> classify identity
  -> decide owner layer
  -> promote to guide, sensor, gate, template, adapter, or no-action
  -> measure recurrence
  -> retire or downgrade stale controls
```

Promotion rules:

- First occurrence: record in evidence, review, or closeout notes.
- Second occurrence: update a guide, task packet profile, review checklist, or template.
- Third occurrence: add or strengthen a deterministic sensor where practical.
- High-risk occurrence: skip directly to a gate when the failure affects security, permissions, schema, data integrity, release safety, or cross-repository inheritance.

Do not promote a product-specific rule into the portable method unless at least one of these is true:

- It applies across multiple repository templates.
- It applies across multiple agent runtimes.
- It describes a generic lifecycle control rather than a product convention.
- It prevents context loss during handoff, review, or resume.

## 4. Multi-Agent Compatibility

The harness must survive agent changes. Agent-specific capabilities are adapters.

Adapter responsibilities:

- Preserve task packet fields when converting into an agent-specific prompt or workflow.
- Preserve evidence and review artifact locations.
- Record unsupported capabilities explicitly instead of silently dropping them.
- Map portable roles such as planner, generator, evaluator, reviewer, and janitor into the agent runtime.
- Keep human gates visible when a runtime cannot enforce them mechanically.

The portable method must not require a single agent's private feature. If a control depends on a feature such as browser automation, subagents, CodeGraph, or MCP tools, the method must define the fallback evidence requirement.

## 5. Multi-System Compatibility

Consumer repositories should define their own quality profiles while inheriting portable controls.

Example overlay classes:

- `admin-platform`
- `api-service`
- `event-processor`
- `dashboard`
- `ui-heavy-product`
- `custom`

Each overlay should define:

```text
quality_profile
contract_anchors
required_sensors
optional_sensors
human_gates
runtime_evidence
promotion_target
```

Product-specific examples should remain in the consumer repository. For example, an admin platform may require permission-policy tests, while an event processor may require idempotency and replay tests. Both inherit the same ratchet lifecycle, evidence shape, and review loop.

## 6. Minimum Adoption Contract

A repository that adopts this method should provide:

- a repo-local failure registry
- task packet or equivalent task boundary artifact
- evidence location convention
- review artifact convention
- at least one fast deterministic inner-loop sensor
- a ratchet rule that turns repeated failures into guide, sensor, gate, template, adapter, or no-action decisions

This minimum adoption contract is the reusable part. Business-specific checks are not.

## 7. Success Metrics

Track method effectiveness across repositories:

- repeated failure recurrence rate after promotion
- percentage of repeated failures with an owner layer
- percentage of promoted failures that became deterministic sensors
- false positive and false negative rate by sensor
- median time from failure observation to promotion
- agent handoff success rate using the same task packet and evidence artifacts
- number of consumer-specific controls incorrectly promoted into the portable method

The method is healthy when new repositories inherit the lifecycle and artifact shape without inheriting unrelated business assumptions.
