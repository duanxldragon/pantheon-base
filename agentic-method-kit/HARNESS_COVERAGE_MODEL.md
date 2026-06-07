# Harness Coverage Model

Chinese version: [HARNESS_COVERAGE_MODEL.zh.md](./HARNESS_COVERAGE_MODEL.zh.md)

This document defines how to evaluate whether a harness is useful, not just complete.

Task packets, evidence, review artifacts, and checks prove that a workflow exists. Coverage analysis asks whether the workflow catches the failures that matter.

## 1. Coverage Dimensions

Evaluate harness coverage across five dimensions.

| Dimension | Question |
|---|---|
| Behaviour | Does the application do what users need? |
| Maintainability | Is the codebase still easy for humans and agents to change? |
| Architecture fitness | Are boundaries, dependencies, and non-functional requirements preserved? |
| Runtime quality | Are logs, metrics, traces, performance, and reliability visible to agents? |
| Method health | Is the harness itself coherent, current, and not too heavy? |

## 2. Failure Registry

Each repository should maintain or derive a failure registry.

Minimum fields:

```text
failure_id
category
example
impact
current_guide
current_sensor
current_gate
detected_by
missed_by
recommended_harness_change
status
```

The registry can start as a Markdown table. It can later become JSON or a database if needed.

## 3. Sensor Types

### 3.1 Computational Sensors

These are deterministic and usually cheap.

Examples:

- unit tests
- type checks
- lint
- dependency scanners
- structural tests
- architecture import rules
- contract checks
- schema drift checks

Use them for:

- every commit
- local inner loops
- CI gates
- repeated structural failures

### 3.2 Inferential Sensors

These rely on model judgment or human judgment.

Examples:

- agent review
- design critique
- product sense review
- security review that requires context
- architecture review of tradeoffs

Use them for:

- semantic duplication
- overengineering
- poor product behavior
- UI quality
- unclear tradeoffs
- behavioural review where deterministic tests are insufficient

### 3.3 Runtime Sensors

These let agents inspect running software.

Examples:

- browser automation
- screenshots
- console errors
- logs
- metrics
- traces
- synthetic journeys

Use them for:

- UI flows
- performance
- reliability
- incident reproduction
- user journey verification

## 4. Coverage Matrix

For each important failure mode, map the current controls.

| Failure mode | Feedforward guide | Feedback sensor | Gate | Current gap |
|---|---|---|---|---|
| Agent edits wrong layer | architecture contract | import rule or review | task packet layer field | add static layer check |
| UI looks generic | design principles | evaluator or screenshot review | visual gate | calibrate evaluator examples |
| Generated test is weak | testing guide | mutation or review | review gate | add approved fixtures |
| Docs drift from code | doc ownership guide | doc drift scan | CI doc check | add scheduled janitor task |

The value of the matrix is not completeness. The value is seeing where the harness relies only on human attention.

## 5. Sensor Effectiveness

Track whether sensors are useful.

Useful signals:

- number of defects caught before human review
- number of false positives
- number of false negatives found later
- average time to fix after sensor feedback
- frequency of repeated failures after a sensor was added
- cases where a sensor never fires

Interpretation:

- A sensor that never fires may mean the codebase is healthy.
- It may also mean the sensor is too weak, too narrow, or not run in the right lifecycle phase.
- A sensor with many false positives should become advisory or be tightened before it becomes a gate.

## 6. Lifecycle Placement

Put sensors where their cost and value fit.

| Phase | Typical sensors |
|---|---|
| Before implementation | architecture map, task packet, done criteria |
| During implementation | typecheck, focused tests, lint, local scripts |
| Before PR | broader tests, smoke, evidence check, review |
| CI | repeat fast checks, integration checks, contract checks |
| Scheduled | drift scan, dead-code scan, dependency review, doc gardening |
| Runtime | logs, metrics, traces, SLO checks, anomaly scans |

Shift feedback left when it is fast and reliable. Keep expensive or noisy sensors later.

## 7. Ratchet Loop

Harness coverage improves through a ratchet loop.

```text
observe failure
  -> classify failure
  -> decide guide/sensor/gate/template change
  -> implement the smallest useful control
  -> measure whether recurrence drops
  -> remove or downgrade controls that stop carrying weight
```

The ratchet should prevent repeated mistakes without turning the harness into a rule dump.

## 8. Minimum Coverage Review

Run this review periodically or after a major model/tool upgrade.

Checklist:

- Which failures reached human review more than once?
- Which failures were caught only by inferential sensors and could become deterministic checks?
- Which deterministic checks are too slow for their current phase?
- Which guides are long but not backed by sensors?
- Which gates block often without preventing real defects?
- Which harness components encode assumptions that the current model may no longer need?
- Which runtime signals are invisible to agents?

The output should be a small set of harness changes, not a broad rewrite.
