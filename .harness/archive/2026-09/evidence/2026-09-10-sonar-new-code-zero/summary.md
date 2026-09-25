# Verification Summary — 2026-09-10-sonar-new-code-zero

## Task

After #304, the Release Gate on `main@4b8061cd` still fails:
`Candidate Checks` requires the **SonarCloud Code Analysis** check (the
new-code quality gate) to be success on the release candidate, and the
post-merge main analysis reports **"Security Rating on New Code = E"**.

Note: the SonarCloud Gate job inside Release Gate passed this time
(0 total unresolved issues) — the failing condition is specifically the
**new-code** rating, i.e. issues introduced by recent commits.

## Findings (enumerated via sonarcloud.io api/issues/search, sinceLeakPeriod=true)

| Severity | Rule | Site | Root cause |
|---|---|---|---|
| BLOCKER | gosecurity:S2083 | `dynamic_module_registry.go:178` | The fs.FS restructure in #304 moved the sink but the **relativePath** argument itself carries the taint (HTTP source → `serverReq` → `Schema.Scope` → `relativePath` → `fs.ReadFile`); Sonar does not treat `filepath.IsLocal`/`..` checks as sanitizers |
| BLOCKER | typescript:S3516 | `smoke-core-fixtures.ts:252` | `revealTreeRow` returns the same `targetRow` locator on every path |
| CRITICAL | typescript:S3776 | `smoke-core-fixtures.ts:252` | `revealTreeRow` cognitive complexity 17 (limit 15) |
| MAJOR | go:S978 | `permission_service_test.go:647` | test identifier `clear` shadows a predeclared identifier |

## Fixes (source-level, no suppressions)

1. **os.Root adoption** — replaced the `fs.FS` helper with
   `openWorkspaceRoot` returning `*os.Root` (kernel-backed traversal-safe
   API, Go 1.24+; repo is on Go 1.26.5). The sink is now
   `Root.ReadFile`, whose lookup is anchored at the root and cannot
   escape it by construction; the taint argument no longer reaches an
   enumerated path-construction sink.
2. **revealTreeRow split** — per-attempt logic extracted into
   `attemptTreeRowReveal` returning `Locator | null`; the exported
   wrapper retries and has a single terminal `expect(...).toBeVisible()`
   exit. Dead `ancestorText` parameter removed; both call sites updated.
3. **Test rename** — `clear` → `policies` in the permission test.

## Verification evidence

- `go build ./... && go vet ./modules/...` — clean
- `go test ./modules/...` — **19/19 packages ok**; `gofmt -l` no output
- `tsc --noEmit` — no errors in edited files; ESLint clean on all 3
- Live core smoke on the local stack: the two restructured-helper specs
  **6 passed (54.0s)**, then the full suite **23 passed / 0 failed (2.8m)**

## Residual gaps

- SonarCloud new-code gate re-evaluation is post-merge; final
  confirmation is the next main analysis.
- os.Root containment is verified by the existing lowcode unit tests and
  live smoke, not by adversarial traversal payloads beyond that
  coverage.
