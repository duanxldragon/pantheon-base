# Review — 2026-09-10-sonar-resolved-repair

## Scope confirmation

- Touched: `backend/modules/system/org/dept/dept_service.go` (2 call sites),
  `backend/modules/system/i18n/i18n_service.go` (1 call site),
  `backend/modules/lowcode/dynamicmodule/dynamic_module_registry.go`
  (guard inlining).
- Not touched: scanner/quality-gate configuration, `nosec` suppressions
  (explicitly rejected as a remedy), any runtime validation logic, frontend,
  business modules, workflows.

## Risk classification

Shared-system-layer files (`system/org`, `system/i18n`) → per repo rules
this is a governance-tracked change; handled as an L1 closeout with a full
harness packet since the change is mechanical and behavior-preserving.

## Alternatives considered

1. `//nosec` annotations — rejected: suppresses the signal instead of making
   the guard visible; repo policy is fix, not suppress.
2. Ignoring until Sonar updates its analyzer — rejected: Release Gate is a
   hard gate; the finding set is stable across analyses.
3. Chosen: restructure so the guard is analyzer-trackable. Cost: 3 small
   call-site changes; benefit: no suppression, no config drift.

## Correctness notes

- `Where("id = ?", pk).First(&x)` produces the same SQL shape as
  `First(&x, pk)` (primary-key predicate) with an explicit placeholder —
  GORM treats both as parameterized; error behavior (`ErrRecordNotFound`)
  unchanged.
- Registry path: guard result semantics identical; the only change is that
  the `if !ok { return }` decision now sits directly before the
  `os.ReadFile` sink instead of behind a tuple return consumed elsewhere.

## Verification evidence

See `commands.json` and `summary.md`: build, vet, full backend test suite,
and gofmt all clean on commit `991ff93c`.

## Residual risks

- SonarGo may still report one of the sites if its dataflow model changes;
  mitigation is that the parameterized-query form is the documented fix for
  S3649 and the inline guard the documented fix for S2083.
- 13 baseline CODE_SMELL issues remain open (Out of scope here); if the gate
  requires zero total issues, that is a separate follow-up task, not a gap
  of this one.
