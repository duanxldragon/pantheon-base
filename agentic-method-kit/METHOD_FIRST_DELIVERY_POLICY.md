# Method-First Delivery Policy

This policy prevents agentic work from falling into code-error chasing before the operating method is clear.

It applies to every repository that adopts the Agentic Method Kit. Consumer repositories may add stricter rules, but should not weaken this lifecycle order.

## 1. Principle

For non-trivial work, improve the method and process before changing production code.

Default order:

```text
method boundary
  -> task intake
  -> quality profile
  -> verification strategy
  -> review and ratchet plan
  -> workflow or sensor design
  -> code implementation
  -> evidence and closeout
```

Code changes are last because code-level failures are often symptoms of unclear task boundaries, missing profiles, weak verification placement, or absent ratchet decisions.

## 2. Scope

This policy applies when work touches any of these:

- architecture boundaries
- CI or quality gates
- security, permissions, schema, data integrity, or release flow
- user-facing UI or runtime behavior
- cross-repository inheritance or downstream consumer behavior
- repeated failures from earlier tasks, PRs, sessions, or agents

Trivial work can skip the full method-first sequence only when the repository triviality policy allows it and no risk boundary is touched.

## 3. Required Method Readiness

Before production code changes, the task should have:

- a clear owner layer: portable method, consumer template, consumer repository, agent adapter, or no-action
- a task packet or equivalent task boundary artifact
- a selected quality profile or explicit `none`
- known contract anchors
- required sensors and evidence
- human gates or explicit `none`
- a ratchet decision for repeated failures

If any item is missing, the next action should be method/process clarification, not code editing.

## 4. Sensor Placement Before Sensor Implementation

Do not add a new checker, test, smoke, or CI gate until its lifecycle placement is explicit.

Decide first:

| Question | Required Answer |
|---|---|
| What failure does this catch? | failure class and example |
| Where should it run? | local, PR, scheduled, release, runtime, review |
| Is it deterministic or inferential? | sensor type |
| What is the false-positive risk? | low, medium, high |
| What happens on failure? | advisory, required gate, human review |
| Who owns it? | portable method, consumer template, consumer repository, agent adapter |

A slow or noisy sensor should be advisory or scheduled until it proves useful.

## 5. Ratchet Before Patch

When a failure recurs, do not immediately patch the code again.

First answer:

```text
Was this caused by a missing guide?
Was this caused by a missing task boundary?
Was this caused by a missing or misplaced sensor?
Was this caused by an overloaded gate?
Was this caused by agent adapter loss during handoff?
Should the fix live in portable method, consumer template, consumer repository, or agent adapter?
```

Only after this classification should implementation start.

## 6. Code Deferral Rule

If production code is already failing during a method/process improvement task, record the failure as deferred unless it blocks method validation.

Deferred code work should include:

- symptom
- suspected owner layer
- recommended profile
- required verification
- whether it needs a new task packet

This prevents method work from being consumed by incidental build, lint, smoke, or dependency failures.

## 7. Completion Criteria

A method-first task is complete when:

- the lifecycle order is documented
- task intake and profile requirements are explicit
- repeated failures have an owner layer and ratchet decision
- code-level follow-up is either unnecessary or recorded as deferred backlog
- verification evidence covers the method/process artifact, not unrelated production code

Do not claim production code quality improved unless production-code verification was actually run.
