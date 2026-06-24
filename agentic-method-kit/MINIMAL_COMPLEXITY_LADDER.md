# Minimal Complexity Ladder

Chinese version: [MINIMAL_COMPLEXITY_LADDER.zh.md](./MINIMAL_COMPLEXITY_LADDER.zh.md)

This guide captures a tool-agnostic simplicity control inspired by [Ponytail](https://github.com/DietrichGebert/ponytail). It adopts the method, not the plugin runtime: repositories may install an adapter if they want, but Harness Engineering treats the ladder as a portable guide and review sensor.

## Principle

Write the smallest correct change after understanding the real flow. Small is not the same as careless: validation, security, data-loss handling, accessibility, and requested behavior remain mandatory.

## Ladder

Before adding code, stop at the first rung that satisfies the task:

1. Does this need to exist at all? If not, skip it and record why.
2. Does the codebase already have a helper, pattern, contract, component, or script? Reuse it.
3. Does the language standard library provide it? Use the standard library.
4. Does the platform provide it natively? Use the browser, database, OS, framework, or runtime feature.
5. Does an already-installed dependency solve it? Use the existing dependency.
6. Can the change be one clear expression or one small local edit? Prefer that.
7. Only then, write the minimum new code that works.

The ladder runs after context resolution. Do not use it to avoid reading the affected code, tracing callers, or understanding boundary rules.

## Bug Fix Rule

A bug report usually names a symptom. Before editing a shared function, check its callers and fix the root cause at the shared boundary when that is smaller and safer than patching each caller.

## Review Sensor

For implementation review, flag only complexity that can be concretely removed:

- `delete`: dead code, unused flexibility, speculative feature.
- `stdlib`: hand-rolled behavior already provided by the language standard library.
- `native`: code or dependency replaced by a platform feature.
- `reuse`: duplicate helper, component, script, query, or contract already in the repository.
- `yagni`: abstraction, config, extension point, or layer with no current second use.
- `shrink`: same behavior with a smaller local expression.

Each finding should state the location, what to remove, and what replaces it. Do not use this sensor to hide correctness, security, accessibility, or evidence gaps.

## Deliberate Shortcut Debt

When a simplification has a known ceiling, mark it near the code with a short comment:

```text
minimal-complexity: <ceiling>; upgrade when <trigger>
```

Examples:

- `minimal-complexity: linear scan is fine below 10k rows; add indexed lookup when query time exceeds 100ms`
- `minimal-complexity: process-local cache; replace with distributed cache when multiple app instances need coherence`

Shortcuts without a trigger rot into hidden debt. A repository may scan these comments into a debt ledger.

## When Not To Minimize

Do not simplify away:

- trust-boundary validation
- authorization and permission checks
- audit and data-loss protection
- accessibility basics
- i18n coverage where the repository requires it
- runtime evidence for runtime-sensitive changes
- explicit user requirements

For non-trivial logic, leave the smallest runnable check that would fail if the behavior regresses.

## Integration

Use this ladder as:

- a guide before implementation
- a task-packet field for the chosen rung
- a review sensor for over-engineering findings
- a ratchet target when repeated over-building reaches review

If a repository installs Ponytail or another simplification tool, record it as an `agent-adapter`. The portable method remains this ladder and its evidence/review rules.
