# Verification Summary — 2026-09-10-sonar-resolved-repair

## Task

After #302, the Release Gate's SonarCloud Gate job still failed with
"Release blocked: 17 unresolved SonarCloud issue(s)". Of those 17, the 4
**BLOCKER VULNERABILITY** findings are addressed here (the 13 CODE_SMELL
items are pre-existing baseline: OIDC TODO comments S1135, smoke-core wait
patterns S2925, duplicated string S1192, k8s probes S6897/S6596, and one
cognitive-complexity CRITICAL in OIDC — all present before this task and
out of scope).

## Root cause

All 4 findings are taint-analysis reports where a real guard exists but is
invisible to SonarGo's dataflow:

| Finding | Site | Problem |
|---|---|---|
| S3649 (SQL injection) | `dept_service.go` x2, `i18n_service.go` | GORM `First(pk)` with a `uint64` primary key: the analyzer treats the value as attacker-controlled, though it is a typed non-string ID parsed from the request by gin binding |
| S2083 (path traversal) | `dynamic_module_registry.go:157` | `os.ReadFile(path)` guarded by `resolveGeneratedWorkspacePath`, which returns `(string, bool)` — the guard/branch is not trackable through the tuple |

## Fix (behavior-preserving restructure)

1. `dept_service.go` (2 sites): `db.First(&x, pk)` →
   `db.Where("id = ?", pk).First(&x)` — parameterized predicate the
   analyzer can verify; identical SQL and error semantics.
2. `i18n_service.go` (1 site): same transformation.
3. `dynamic_module_registry.go`: inlined the `resolveGeneratedWorkspacePath`
   guard immediately before the `os.ReadFile` sink so the
   guard-check → sink flow is lexically adjacent (standard pattern SonarGo
   tracks); no logic change, helper retained for other callers.

## Verification

- `go build ./modules/system/org/dept/... ./modules/system/i18n/... ./modules/lowcode/...` ✅
- `go vet` on the same trees ✅
- `go test ./modules/... ./internal/...` — full suite green ✅
- `gofmt -l` on the three packages — no output ✅
- No behavior change: same queries (parameterized form), same guard result
  semantics for the registry path.

## Explicit gaps

- SonarCloud re-analysis runs **post-merge**; pre-merge verification is
  structural (guards now adjacent to sinks). Final confirmation is the next
  `main` analysis — Release Gate SonarCloud Gate job on the merge commit.
- The 13 remaining CODE_SMELL findings are pre-existing baseline and
  intentionally untouched (Out of scope in manifest).
