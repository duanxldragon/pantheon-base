# Review: 2026-07-10-lint-baseline-clean

## Machine Readable

```json
{
  "taskId": "2026-07-10-lint-baseline-clean",
  "verdict": "approved",
  "structuralReview": {
    "affectedSubgraph": [
      "linter config -> backend error-ignore sites -> idiomatic _ = err"
    ],
    "checks": ["sensitive-input-flow"]
  },
  "residualRisk": "807 lint issues remain; tracked in LINT_DEBT.md with a batched plan"
}
```

## Reviewer notes

- **Scope discipline.** Committed only the reviewed backend `.go` + `.golangci.yml`
  - harness docs. Excluded unrelated frontend/DESIGN.md changes appearing in the
    working tree from a parallel task.
- **ignoreError() rejected.** The no-op helper (duplicated across 8 packages) only
  existed to dodge `errcheck.check-blank:true`. Resolution: relax the policy to allow
  idiomatic `_ = err`, then Codex reverted all sites. `grep -rn ignoreError backend/`
  is empty.
- **Behavior changes vetted.** Two non-lint changes rode in the diff and were each
  verified: (1) `request_context_middleware.go` dropped an unused stdlib-context trace
  write — nothing reads it, `c.Set` still populates gin context; (2) `i18n_service_test.go`
  `len < 0` → `== 0` — original was always-false dead code, new asserts non-empty.
  The `token_middleware` blacklist fix is a genuine improvement.
- **Verification.** build clean, vet clean, errcheck held at 13 (no regression).
- **Honesty.** The branch name "baseline-clean" oversells reality (807 issues remain);
  called out in the PR body and LINT_DEBT.md rather than buried.

## Verdict

Approved to land as the reviewed first slice of the lint baseline. Remaining debt is
follow-up work (Codex batches A–D per LINT_DEBT.md), not a blocker for this change.
