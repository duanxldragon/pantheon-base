## Summary

**Architectural Status: `BLOCK` for the supplied shared contract.** The source retains a validation feedback-loop path and does not preserve React elements supplied as condition values. ExecutionStepRail also coerces accepted ReactNode titles and metric labels into strings.

This verdict covers only the supplied sources; it does not approve release, other Base domains, or the entire P0.

## Analysis

1. **Validation stability still depends on the parent’s state-update shape.**  
   ConditionBuilder stabilizes equivalent validation arrays, but its notification effect also depends on `onValidationChange` ([ConditionBuilder.tsx:101](/D:/workspace/go/pantheon-platform/pantheon-base/frontend/src/components/operational/ConditionBuilder.tsx:101), [line 104](/D:/workspace/go/pantheon-platform/pantheon-base/frontend/src/components/operational/ConditionBuilder.tsx:104)).

   A parent callback such as `ids => setState({ invalidIds: ids })` produces a fresh state object and callback every render. Each callback replacement retriggers the effect, which updates the parent again—even when validation is unchanged. That contradicts the stated callback-recreation requirement.

   The supplied regression fixture uses `setInvalid(ids)` directly, allowing React to bail out when the stabilized array reference repeats. Its assertions therefore cover a narrower case ([conditionEditing.test.tsx:18](/D:/workspace/go/pantheon-platform/pantheon-base/frontend/tests/unit/components/operational/conditionEditing.test.tsx:18), [line 26](/D:/workspace/go/pantheon-platform/pantheon-base/frontend/tests/unit/components/operational/conditionEditing.test.tsx:26)).

2. **React elements supplied as condition values reach JSON serialization in both modes.**  
   The formatter sends objects through `JSON.stringify` without a React-element branch ([ConditionBuilder.tsx:44](/D:/workspace/go/pantheon-platform/pantheon-base/frontend/src/components/operational/ConditionBuilder.tsx:44)). Read-only rendering and the default editable input both use this formatter ([line 82](/D:/workspace/go/pantheon-platform/pantheon-base/frontend/src/components/operational/ConditionBuilder.tsx:82), [line 133](/D:/workspace/go/pantheon-platform/pantheon-base/frontend/src/components/operational/ConditionBuilder.tsx:133)).

   Consequently, a React element in `node.value` becomes serialized element data or a fallback, rather than retaining React rendering. In editable mode, successfully serialized element data becomes input text.

   **ReactNode fallback labels are handled correctly:** editable mode supplies an empty string, while read-only mode can render the fallback node. The corresponding test exercises a cyclic object and a ReactNode fallback—not a React element as the AST value ([conditionEditing.test.tsx:51](/D:/workspace/go/pantheon-platform/pantheon-base/frontend/tests/unit/components/operational/conditionEditing.test.tsx:51)).

3. **ExecutionStepRail loses accepted ReactNode content through string coercion.**  
   Its contract accepts ReactNode titles and metric labels ([ExecutionStepRail.tsx:7](/D:/workspace/go/pantheon-platform/pantheon-base/frontend/src/components/operational/ExecutionStepRail.tsx:7)). However, `String(title)` can produce an accessible name such as `[object Object]`, and metric-label interpolation similarly loses element content ([line 31](/D:/workspace/go/pantheon-platform/pantheon-base/frontend/src/components/operational/ExecutionStepRail.tsx:31), [line 52](/D:/workspace/go/pantheon-platform/pantheon-base/frontend/src/components/operational/ExecutionStepRail.tsx:52)). Optional status labels themselves render directly and correctly ([line 51](/D:/workspace/go/pantheon-platform/pantheon-base/frontend/src/components/operational/ExecutionStepRail.tsx:51)).

## Root Cause

Validation notifications remain coupled to callback identity rather than semantic validation changes. Presentation nodes and editable data also share string-formatting paths despite requiring different treatment.

## Recommendations

1. **Decouple validation notification from callback identity — low effort, prevents feedback loops.** Store the latest callback separately and notify on semantic validation changes. Add coverage using a recreated callback that updates a fresh parent-state object.
2. **Separate read-only rendering from editable formatting — medium effort, preserves value semantics.** Render React elements directly in read-only mode; keep unsupported editable values out of text serialization and use the provider-owned editor.
3. **Preserve rail nodes — low effort, fixes accessibility and label rendering.** Use `aria-labelledby` referencing the rendered title and render metric labels as JSX children.

## Trade-offs

| Choice                                   | Benefit                        | Cost                                                              |
| ---------------------------------------- | ------------------------------ | ----------------------------------------------------------------- |
| Notify only on validation changes        | Prevents identity-driven loops | Replacing a callback alone will not replay unchanged validation   |
| Provider-owned unsupported-value editing | Preserves domain types         | Provider must supply the editor                                   |
| Preserve rail ReactNode rendering        | Honors the existing API        | Requires title association and separate JSX label/value rendering |

Validation correctness inside `validateConditionAst` cannot be assessed because its implementation was not supplied. The reported runtime receipts are acknowledged; no execution claim is inferred from test source. Source diagnosis is complete within this bounded scope.
