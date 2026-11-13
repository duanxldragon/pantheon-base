## Summary

**Architectural Status: CLEAR for the supplied shared contract.** The three reported repairs are present, and I found no material source defect introduced by them. This verdict excludes the imported validator, shared CSS, other Base domains, release readiness, and overall Ops P0 completion.

## Analysis

1. **Validation notifications follow accepted props without the reported identity loop.**  
   `ConditionBuilder.tsx:104` derives a signature from validation results; `:105` preserves the notification array while that signature remains unchanged. Equivalent fresh field arrays therefore do not create a new effect dependency.

   The callback-update effect precedes the notification effect (`ConditionBuilder.tsx:108`, `:109`). A changed callback is available for the next validation notification, while callback identity alone does not trigger one. Editing emits a proposed AST through `onChange`, without separately notifying validation (`:111`, `:117`); validation remains tied to the supplied `value`.

   The supplied tests cover fresh parent-state updates, callback replacement, externally changed props, and rejected edits (`conditionEditing.test.tsx:13`, `:28`, `:39`, `:50`).

2. **Direct React element values retain rendering and avoid default editable serialization.**  
   Read-only rendering passes a valid React element directly to React (`ConditionBuilder.tsx:85`). Editable rendering gives the provider first ownership of the value editor; without one, a direct React element displays the caller’s unavailable-value label instead of entering the input (`:138`). The formatter also explicitly excludes React elements from `JSON.stringify` (`:44`, `:48`).

   The provider receives the original rule and a callback that replaces its value through an immutable rule copy (`ConditionBuilder.tsx:134`, `:138`). Corresponding tests assert actual read-only element rendering, absence of serialized element props, and provider replacement (`conditionEditing.test.tsx:76`, `:82`, `:91`).

3. **Editing remains opt-in and controlled.**  
   Editing requires `onChange`, `editorLabels`, and ready state (`ConditionBuilder.tsx:110`). The tree traversal constructs replacement groups and filtered child arrays rather than modifying supplied nodes (`:114`). The header action is disabled when editing is unavailable (`:146`).

   Frozen-AST editing and read-only/forbidden behavior have supplied regression coverage (`conditionEditing.test.tsx:101`, `:116`).

4. **Step titles and metric labels remain React content.**  
   The rail’s section is named through its rendered title (`ExecutionStepRail.tsx:29`, `:32`, `:34`). Step titles render directly (`:50`), and attempts/duration labels render inside fragments alongside numeric values (`:53`, `:54`). Those paths do not stringify ReactNodes.

   Optional status labels use the caller’s value, with the existing status identifier as fallback (`ExecutionStepRail.tsx:13`, `:52`). Tests cover localized status, distinct ReactNode section titles, and rendered metric-label elements (`conditionEditing.test.tsx:123`, `:127`, `:136`).

## Root Cause

The current source separates notification identity from render-time prop identity, and separates React presentation from editable string formatting. These are the mechanisms implicated by the reported findings; no remaining defect in those mechanisms is evident here.

Field/operator/value validation correctness cannot be independently established: `ConditionBuilder.tsx:3` imports `validateConditionAst`, whose implementation was not supplied.

## Recommendations

1. **No corrective change required for these bounded repairs** — retain the supplied regression coverage.
2. **Keep validator certification separate** — reviewing `conditionAst` is necessary before extending this verdict to field/value validation semantics.

## Trade-offs

| Choice                                                             | Benefit                                                                | Concrete cost or limitation                                                                |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Validation-result signature (`ConditionBuilder.tsx:104`)           | Avoids notifications caused by equivalent fresh props                  | Validation and serialization execute on every render; comparison preserves result ordering |
| Provider editor with element fallback (`ConditionBuilder.tsx:138`) | Preserves provider ownership and prevents direct element serialization | Default editing cannot replace an element value                                            |
| Optional status labels (`ExecutionStepRail.tsx:52`)                | Preserves existing callers                                             | Missing labels display the status identifier                                               |

The seven failed-before regressions, final 24 operational units, lint/type-check/build, and two rendered editor specs are **reported execution**, not verification I performed. The supplied source and regression assertions are sufficient to stop this bounded review.
