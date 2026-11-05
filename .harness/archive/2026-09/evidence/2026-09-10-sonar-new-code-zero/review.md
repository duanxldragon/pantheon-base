# Review — 2026-09-10-sonar-new-code-zero

## Scope confirmation

- Touched: 1 Go production file (os.Root adoption in lowcode registry),
  1 Go test file (identifier rename), 3 smoke-core frontend test files
  (helper restructure + call sites).
- Not touched: API contracts, permissions, i18n, menus, DB schema,
  Sonar/gitleaks configuration, auth flows.

## Risk classification

Medium: os.Root is a behavioral-equivalent containment API swap; the
smoke helper split is test-code only with unchanged wait/locator
semantics (proven by the live 23/23 run).

- `Root.ReadFile(name)` resolves `name` inside the root directory and
  refuses `..` and escapes by construction — strictly stronger than the
  previous validate-then-`fs.ReadFile` sequence it replaces.
- `attemptTreeRowReveal` returns `null` on failure; the wrapper keeps
  the original 3-attempt cadence, 800ms backoff, and final
  `expect(...).toBeVisible({ timeout: 15000 })` assertion.
- The dropped `ancestorText` parameter was already unused (documented
  intent only); call-site semantics unchanged.

## Gate honesty

- No `nosec`, no Sonar ignore markers — all 4 findings fixed at source.
- The two frontend spec changes are call-site signature updates only;
  assertion semantics unchanged and verified live.

## Residual risks

- SonarCloud new-code gate acceptance is verified post-merge; if the Go
  analyzer still reports S2083 on `Root.ReadFile`, the follow-up is
  pattern-level (e.g. hardcoded allowlist of relative paths), not a
  suppression.
- k8s/shell/deps from the previous rounds are untouched here and remain
  green on main.

## Machine Readable

```json
{
  "taskId": "2026-09-10-sonar-new-code-zero",
  "verdict": "blocked",
  "verdictRationale": "'SonarCloud new-code gate acceptance is verified post-merge'; summary defers final confirmation to the next main analysis, so the gate is still outstanding.",
  "linkage": {
    "taskManifest": ".harness/tasks/2026-09-10-sonar-new-code-zero/manifest.json",
    "evidence": ".harness/evidence/2026-09-10-sonar-new-code-zero/commands.json",
    "reviewFile": ".harness/evidence/2026-09-10-sonar-new-code-zero/review.md",
    "changeRef": "none",
    "planRefs": [
      ".harness/tasks/2026-09-10-sonar-new-code-zero/manifest.json"
    ]
  }
}
```

> This block was backfilled on 2026-11-04 during the archive-coverage repair. It restates the verdict already written above in machine-readable form and links the artifacts that existed for this task; no conclusion, finding or verification claim was added, removed or reworded. The prose remains authoritative.
