# Execution Guardrails

Chinese version: [EXECUTION_GUARDRAILS.zh.md](./EXECUTION_GUARDRAILS.zh.md)

This document adds a small set of execution guardrails to the portable Harness Engineering method.

These guardrails are adapted from the Karpathy-inspired guidance in `multica-ai/andrej-karpathy-skills` and rewritten here as repo-owned, tool-agnostic method assets.

## 1. Think Before Coding

Do not silently guess through ambiguity.

- Separate confirmed facts, working assumptions, and open questions.
- If ambiguity changes scope, safety, data handling, architecture, or user-visible behavior, stop and ask.
- If ambiguity only affects reversible local exploration, inspect the repository first and then decide whether escalation is still needed.
- If multiple interpretations are plausible, record them instead of picking one invisibly.

Harness mapping:

- task packet `## Assumptions and Open Questions`
- task packet `## Contract Anchors`
- stop points when human input is actually required

## 2. Simplicity First

Solve today's problem with the smallest load-bearing change.

- Prefer delete, reuse, standard library, native platform features, and existing dependencies before new local abstractions.
- Do not add configurability, indirection, or extension points without a second real use case.
- Do not add defensive branches for scenarios the surrounding system cannot produce.
- If the implementation feels bigger than the task, reduce it before continuing.

Harness mapping:

- [MINIMAL_COMPLEXITY_LADDER.md](./MINIMAL_COMPLEXITY_LADDER.md)
- task packet `## Minimum Viable Approach`

## 3. Surgical Changes

Touch only the files and lines that carry the requested behavior.

- Every changed file should trace back to scope, verification, or required evidence.
- Declare `Do Not Touch` boundaries before editing.
- Match repository style unless there is a direct requirement to change it.
- Remove only the dead code or imports made obsolete by your own change.

Harness mapping:

- task packet `## Scope`
- task packet `## Expected Files`
- task packet `## Structural Scope` when the change crosses boundaries

## 4. Goal-Driven Verification

Turn requests into falsifiable success criteria.

- Prefer reproduce-first or test-first loops for bug fixes.
- State what observable outcome proves the task is done.
- State what regression checks must stay green.
- Treat implementation as incomplete until the verification signal is collected or the gap is explicitly recorded.

Harness mapping:

- task packet `## Success Criteria`
- task packet `## Verification Plan`
- evidence and review linkage

## 5. Default Task-Packet Additions

For non-trivial work, the default packet should add three short sections:

- `## Assumptions and Open Questions`
- `## Minimum Viable Approach`
- `## Success Criteria`

These sections are meant to be short. They are there to prevent silent assumptions, premature abstraction, and vague "done" states.

## 6. Trivial Work

Trivial work does not need ceremony, but it should still follow the guardrails mentally:

- do not guess about risky ambiguity
- do not overbuild
- do not widen the diff without cause
- do not claim completion without a real check
