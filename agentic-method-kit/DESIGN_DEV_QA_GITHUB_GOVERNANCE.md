# Design, Development, QA, And GitHub Governance

Chinese version: [DESIGN_DEV_QA_GITHUB_GOVERNANCE.zh.md](./DESIGN_DEV_QA_GITHUB_GOVERNANCE.zh.md)

This document defines a lightweight delivery governance loop for repositories that use AI-assisted or human-assisted development.

It is intentionally portable. Consumer repositories own product-specific quality profiles, business acceptance criteria, CI jobs, and release approvals.

## Governance Loop

```text
Design Gate
  -> Development Gate
  -> QA Acceptance Gate
  -> GitHub Governance Gate
  -> Ratchet Closeout
```

## 1. Design Gate

Purpose: prevent implementation before the task boundary is clear.

Minimum entry conditions:

- the task is classified as trivial or non-trivial
- the intended user, system, or method outcome is stated
- key contracts, designs, or architecture anchors are named
- assumptions that need validation are visible

Minimum exit evidence:

- design/spec reference, or explicit `none`
- acceptance assumptions, or explicit `none`
- out-of-scope list

Do not turn every small task into a large design exercise. The design gate can be one paragraph when the work is simple.

## 2. Development Gate

Purpose: constrain code generation and handoff across agents.

Minimum entry conditions:

- expected files and do-not-touch files are declared
- owner layer is selected
- required sensors and evidence are selected
- implementation can proceed without changing the method boundary

Minimum exit evidence:

- commands, tests, static checks, or explicit gaps
- deferred code issues, if method work exposed unrelated code failures
- changed scope recorded if the implementation moved outside the task packet

## 3. QA Acceptance Gate

Purpose: provide a minimum acceptance substitute when there is no dedicated QA role.

Minimum entry conditions:

- QA path is selected: command, browser, runtime, human review, or explicit `none`
- UI or runtime-sensitive work names the required evidence type
- known gaps are recorded before closeout

Minimum exit evidence:

- command summary, screenshot, browser smoke, runtime logs/metrics/traces, human acceptance note, or explicit gap
- residual risk statement

## 4. GitHub Governance Gate

Purpose: classify PR and CI failures instead of treating every red signal as generic cleanup.

Minimum PR classification:

- `method-gate`: task, evidence, review, linkage, or ratchet metadata is missing
- `repo-quality-gate`: repository tests, lint, static analysis, security, or coverage failed
- `runtime-evidence-gate`: required browser, smoke, log, metric, or trace evidence is missing
- `external-flaky`: external infrastructure or tool instability blocked verification
- `not-applicable`: the task is trivial and the repository policy allows bypass

Merge readiness requires:

- required method artifacts linked
- known gaps recorded
- CI failures classified
- unresolved P0/P1 issues blocked or explicitly accepted by a human gate

## 5. Ratchet Closeout

Purpose: prevent repeated failures from being solved only by patching code.

Closeout should state:

- whether the failure is new or repeated
- failure class
- owner layer
- occurrence count when known
- promotion decision
- whether the promotion belongs in the portable method, consumer template, consumer repository, or agent adapter

Use the smallest effective control. Prefer guide or template updates before adding slow or noisy gates.

## What Stays Local

Keep these in consumer repositories:

- product-specific smoke routes
- business acceptance checklists
- domain permission rules
- concrete CI job names
- quality thresholds
- deployment approvals

Promote only lifecycle controls and failure classes that can apply across repositories or agents.
