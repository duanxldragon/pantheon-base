# Task Packet: lint-baseline-clean — ignoreError revert + commit

> Author: Claude (planner/reviewer). Executor: **Codex**.
> Branch: `lint/baseline-clean`. Date: 2026-07-10.
> Context: wrap-up of the 2026-07-09 pantheon-base review (see root `*_REVIEW*.md`).

## Goal

Remove the 8 no-op `ignoreError(error){}` helpers introduced on `lint/baseline-clean`,
restoring the idiomatic `_ = err` form (now legal after `.golangci.yml` set
`errcheck.check-blank: false`), then commit the whole reviewed diff and open the PR.

## Primary Layer

platform (cross-cutting: system/auth, system/iam, system/i18n, lowcode, pkg/*)

## Harness Profile

- Template: admin-platform
- Overlay: pantheon-base
- Quality Profile: auth-security (touches token/session/permission/upload paths)
- Owner Layer: consumer-repository
- Portable Failure Class: static-sensor-gap (linter gamed with a no-op wrapper)

## Scope

### In

- Replace every `ignoreError(X)` call with idiomatic `_ = X` (statement form).
  For deferred closes, use `defer func() { _ = X }()`.
- Delete all 8 `func ignoreError(error) {}` definitions.
- Keep ALL other changes in the working tree unchanged (see "Do Not Touch").
- Commit + open PR against `main`.

### Out

- Do NOT attempt to clear the remaining 807 lint issues here (see `LINT_DEBT.md`).
- No new behavior, no refactors beyond the mechanical revert.

## Expected Files

### Modify (revert ignoreError only — 8 defs, 22 call sites)

| File                                                              | def line                 | call sites                              |
| ----------------------------------------------------------------- | ------------------------ | --------------------------------------- |
| `backend/internal/middleware/token_middleware.go`                 | 242                      | 174                                     |
| `backend/modules/auth/login/login_runtime.go`                     | 923                      | 103, 349, 354, 359, 368, 430, 691, 694  |
| `backend/modules/auth/login/login_service.go`                     | — (uses runtime pkg def) | 88                                      |
| `backend/modules/lowcode/dynamicmodule/dynamic_module_service.go` | 336                      | 240 (multi-line arg)                    |
| `backend/modules/system/i18n/i18n_service.go`                     | 229                      | 26                                      |
| `backend/modules/system/iam/permission/permission_service.go`     | 440                      | 337                                     |
| `backend/pkg/testmysql/mysql.go`                                  | 167                      | 47, 61, 89                              |
| `backend/pkg/testredis/redis.go`                                  | 51                       | 44, 45                                  |
| `backend/pkg/upload/service.go`                                   | 483                      | 209, 218, 266 (all in `defer func(){}`) |
| `backend/pkg/upload/service_test.go`                              | — (uses upload pkg def)  | 64                                      |

Note: `login_service.go:88` and `upload/service_test.go:64` call the `ignoreError`
defined in their sibling file within the same package — after deleting the def they
must also switch to `_ = X`.

Line numbers are pre-revert; treat them as anchors, match on the `ignoreError(` text.

### Do Not Touch (genuine fixes already reviewed & approved — keep verbatim)

- godoc comments across `authtoken/token.go`, `session_scope.go`, `capability.go`,
  `security/config.go`, `platformprefs/preferences.go`, `upload/service.go`, etc.
- `token_middleware.go`: De Morgan simplification + blacklist `val, err :=` bug fix.
- `token.go`: `json.Marshal` error returns (was `b, _ :=`).
- gosec perm hardening: `upload/service.go` 0o755→0o750; `i18n_service_test.go` 0o644→0o600.
- Justified `#nosec` annotations (G101 error-codes, G304 normalized paths).
- Dead-code removals (unused funcs/consts/fields) — build-verified unused.
- Type-conversion simplifications: `ModuleRegistrationResp(module)`, `I18nResp(item)`,
  `append(result, events...)`.
- `upload/service_test.go`: typed context key (SA1029).
- `i18n_service_test.go`: `len(resp.Keys) < 0` → `== 0` assertion fix.
- `request_context_middleware.go`: removed unused stdlib-context trace write
  (nothing reads it; `c.Set` still populates gin context — verified).
- `.golangci.yml`: `check-blank: false` (already committed-ready in working tree).

## Stop Points

- Stop before merging the PR (release/merge is a human gate).

## Verification Plan

### Backend

- `cd backend && go build ./...` (must be clean)
- `cd backend && go vet ./...` (must be clean)
- `cd backend && go test ./modules/system/i18n/... ./modules/system/iam/permission/... ./pkg/upload/... ./pkg/authtoken/...`
  (packages whose behavior-adjacent lines changed; run with a live MySQL/Redis if configured, else `-run` the pure-logic tests)
- `golangci-lint run ./backend/...` — errcheck count must NOT increase vs. the
  pre-revert baseline (13). The revert + `check-blank:false` should keep errcheck ≤ 13.

### Expected diff shape after revert

- 8 `func ignoreError` lines deleted.
- 22 call sites changed to `_ = X` (3 inside `defer func(){}` in upload/service.go).
- `grep -rn "ignoreError" backend/` returns nothing.

## Execution Roles

- Implementer Posture: implementer (Codex)
- Reviewer Posture: mechanical (Claude re-reviews the revert diff before PR)

## Commit / PR

- Commit message (single logical commit for the whole reviewed diff):
  ```
  refactor(backend): lint baseline cleanup — godoc, errcheck, gosec hardening

  - Drop no-op ignoreError() helpers; use idiomatic _ = err (errcheck check-blank:false)
  - Add exported-symbol godoc comments across auth/token/upload/system pkgs
  - Handle json.Marshal + Redis blacklist errors (real fix in token_middleware)
  - gosec: tighten upload dir/file perms; justified #nosec annotations
  - Remove build-verified dead code; simplify DTO copies via type conversion
  - Fix broken i18n test assertion (len < 0 -> == 0), typed context key (SA1029)

  Remaining lint debt tracked in docs/harness/tasks/2026-07-10-lint-baseline-clean/LINT_DEBT.md

  Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
  ```
- PR base: `main`. Reference the 2026-07-09 review reports.
