# S2-error-mapping-dedup — summary

Task: 2026-10-27-s2-error-mapping-dedup · Branch: `refactor/s2-error-mapping` (base `origin/main` `04aa64b1`) · 3 commits

## What landed

| Commit | Pattern | Content |
|---|---|---|
| `43856299` | shared error values | `common.MessageParamInvalid` / `common.MessageRequestFailed` added; 20 per-handler declarations across 10 files deleted (incl. const blocks in setting/i18n/tenant/role that keep their module keys); same-package referencers (dict_service, role_*, tenant_ops_handler, role_handler_notfound_test.go) migrated |
| `bdbe5c73` | not-found translation | `database.NotFoundIfMissing` (0 callers) → `database.TranslateNotFound(err, replacement)`; 11 translation-shaped sites migrated (6× NewNotFound/404, 4× NewBadRequest/400, 1× plain error/500); 24 remaining `gorm.ErrRecordNotFound` references are control-flow/domain-sentinel/handler-mapping and stay local |
| `77cea558` | context helpers | `menu.getRoleKeysFromContext` deleted → `common.GetRoleKeys`; `user.getUserIDFromContext` → adapter over `common.GetUserID` (keeps `(uint64, bool)` shape); zero-caller `http.GetUserID` deleted |

Measured diff: 31 files changed, +208 / −290 (net −82).

## Packet premise vs measured reality

- "eleven handler files declare the two error values" → measured **20 declarations across 10 files** (some in shared const blocks the audit's grep missed; #451 had already removed i18n/setting/tenant standalone copies that later returned as block members — see capture-before/declarations.txt).
- "gorm.ErrRecordNotFound translated in more than thirty places" → measured **35 references**, of which only **11 are translation-shaped**; the other 24 are control-flow branches, the `ErrTenantNotFound` domain sentinel family, or handler-side mapping. Only identical shapes were replaced (packet implementationNotes), the rest documented in response-diff.md §2.
- "five context/message helpers exist in two or three copies" → menu/user local copies now point at the common implementations; the `http`-vs-`common` i18n copy is **structurally blocked** (re_export.go cycle) and stays with a documented collapse condition (response-diff.md §5).

## Equivalence argument (per changed call site)

Full per-site tables: `response-diff.md`. In short:

1. Constants: all 20 before-declarations carried exactly `"param.invalid"`/`"request.failed"`; the new constants hold the same strings; `ResolveErrorMessageKey` literals now reference the constant (same value).
2. TranslateNotFound: replacement is caller-supplied, so every site keeps its own error constructor; pass-through is identity (`require.Same` tested); wrapped not-found via `%w` covered by tests.
3. Context helpers: token middleware (`token_middleware.go:194-204`) sets `userId` (uint64), `roleKeys` ([]string), `roleKey` (first key, string) — the shared implementations read the same keys with equivalent semantics for every reachable input; the 3 existing user pure tests and menu suite pass unchanged.

## Kept-by-design (with why-comments already in place)

- `roleErrorResponse`: real 404 branch (tenant-isolation acceptance F14) + CodeForError path.
- `menuErrorCode` / `menuErrorMessage` / `isMenuValidationError`: real menu validation whitelist (10 keys → 400).
- `pkg/common/http` private i18n helpers: import cycle via `pkg/common/re_export.go` (verified by attempted build: "import cycle not allowed"); NOTE comment records the collapse condition.

## Verification

- `go build ./...`, `go vet ./...`: clean at every commit checkpoint.
- `go test -count=1 ./...` (DB-backed, PANTHEON_TEST_DSN from `.env.test`): all packages ok, 0 FAIL, after every commit and on the final tree.
- `node scripts/harness/check-task-packet.mjs --root .`: 66 file(s), 0 error(s), 41 warning(s) (baseline).
- `check-evidence.mjs --strict` / `check-review.mjs --strict`: PASS (run at closeout).

## Expected-files drift

- Packet lists `system/iam/dept` / `system/iam/post` → actual `system/org/dept` / `system/org/post`.
- Packet lists `system/config/i18n/i18n_handler.go` → actual `system/i18n/i18n_handler.go`.
- `pkg/database/notfound.go` + `notfound_test.go` rewritten (created in #452 with zero callers as the sensor for this wave).
- `permission_handler.go` no longer declares the values (its `failPermissionServiceError` already uses them from the shared set) — it appears in the diff only for identifier replacement.

## Follow-ups recorded

- `pkg/common/http` ⇄ `pkg/common` helper collapse: blocked by the re_export cycle; needs either the envelope moving into `pkg/common` or a shared leaf package — architecture decision, out of this wave's scope.
- The 24 non-translation `ErrRecordNotFound` sites: intentional keeps, no action proposed.
