# Review — 2026-09-10-tenant-ready-guardrails

Reviewer posture: generator/runtime contract reviewer; adversarial check for remaining pseudo-capability surface and measurement honesty.

## Contract review

1. **No tenant pseudo-capability remains**: grep over `backend/` + `frontend/src/` for scaffold-level `tenant` data-scope references returns only the retirement comment in `contract.go` and the schema.ts comment. The five locales and the wizard no longer carry the option. Runtime enum (`pkg/common/data_scope.go`) was never touched — correct, it never had a tenant mode.
2. **Single source of truth**: wizard options ⊂ `DataScopeMode` TS union ⊂ backend `isValidDataScopeMode` accepted set (`none/owner/dept/custom`). A generated module cannot request a scope the runtime cannot honor; the new backend test proves fail-closed at registration.
3. **Fail-closed on new modules, no retro damage**: only registration validation changed; existing modules and DB untouched. DSN-less test path still skips DB tests cleanly — no local dev breakage.

## Guardrail docs review

- The four mandatory questions map 1:1 to the design's section 5 rules and are phrased as review requirements, not implementation requirements — consistent with single-tenant runtime.
- Scope matrix marks unresolved items "pending contract freeze" instead of guessing — the correct posture for feeding task 1 without prejudging decisions.

## Coverage reconciliation review (adversarial)

- The change makes the gate *measure more*, not pass easier dishonestly: DB-backed tests now run in CI, and the threshold was raised 11 → 50 based on a measured 55.6% DB-backed baseline. It would have been easy to raise the threshold without building the bridge (which would eventually red CI) or to mark phase1 done without any bridge (the exact failure mode the plan called out) — neither happened.
- Numbers in the manifest reconciliation note match the measured artifacts; the note records the measurement command and environment.
- Not fully closed by this task: the first CI run must confirm green (G1), and the `COVERAGE_THRESHOLD` repo variable may override the default (G2). Both are recorded as explicit gaps; neither blocks queue 1-2 (docs), and queue 3 (canary) will run its tests through the same reconciled path.

## Human gate audit

- Two gate-policy decisions (CI measurement approach; phase1 status flip) were resolved by explicit maintainer selection at session kickoff — recorded in summary.md. No other gate touched; no schema/auth/IAM change made.

## Verdict

Task 0 complete with explicit gaps G0 (no browser visual evidence for option removal), G1 (first CI run pending), G2 (repo variable override check). Proceed to task 1 (`tenant-contract-design`).
