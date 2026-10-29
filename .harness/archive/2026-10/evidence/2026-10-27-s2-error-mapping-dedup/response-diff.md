# Response diff — S2-error-mapping-dedup

All changes are identifier-level refactors. The observable envelope (HTTP status, business code, message key) is unchanged at every site. Before-state captured on the pristine branch point (`origin/main` = `04aa64b1`): `capture-before/declarations.txt` (20 declarations / 10 files), `capture-before/notfound-sites.txt` (72 raw `gorm.ErrRecordNotFound` references in module code, 55 `errors.Is`-shaped).

## 1. Shared error message keys (commit 1)

Twenty per-handler declarations collapsed onto `common.MessageParamInvalid` ("param.invalid") / `common.MessageRequestFailed` ("request.failed").

| File (before) | Declaration before | After |
|---|---|---|
| audit_handler.go:11-12 | `const errRequestFailed = "request.failed"` / `const errParamInvalid = "param.invalid"` | deleted; refs → `common.Message*` |
| dict_handler.go:13-14 | same pair | deleted; refs → `common.Message*` |
| setting_handler.go:22-23 (const block with `errUploadFileNotFound`) | same pair | block keeps `errUploadFileNotFound` only; refs → `common.Message*` |
| i18n_handler.go:16 (block with `errIDInvalid`, `errI18nNotFound`) | `errParamInvalid` | block keeps the two module keys; refs → `common.MessageParamInvalid` |
| menu_handler.go:10-11 | same pair | deleted; refs → `common.Message*` |
| permission_handler.go:11-12 | same pair | deleted; refs → `common.Message*` |
| role_handler.go:15-16 (block with `errRoleNotFound`) | same pair | block reduced to `errRoleNotFound`; refs → `common.Message*` |
| tenant_platform_handler.go:13-14 (block with tenant audit keys) | same pair | block keeps tenant keys; refs → `common.Message*` (incl. tenant_ops_handler.go refs) |
| user_handler.go:11 | `errParamInvalid` | deleted; refs → `common.MessageParamInvalid` |
| dept_handler.go:11-12 | same pair | deleted; refs → `common.Message*` |
| post_handler.go:11-12 | same pair | deleted; refs → `common.Message*` |

Same-package referencers also migrated: `dict_service.go`, `role_export.go`, `role_helper.go`, `role_service.go`, `tenant_ops_handler.go`, and the test file `role_handler_notfound_test.go` (now asserts `common.MessageRequestFailed`).

Value equivalence: all 20 declarations carried exactly `"param.invalid"` / `"request.failed"` (see capture file), and `common.ResolveErrorMessageKey`'s two `"request.failed"` literals now reference `MessageRequestFailed` (same value). Module-specific keys (`errRoleNotFound`, `errI18nNotFound`, `errUploadFileNotFound`, `id.invalid`, tenant audit keys) stay local by design.

## 2. Not-found translation (commit 2)

`pkg/database.NotFoundIfMissing` (0 callers) became `TranslateNotFound(err, replacement)`: the `errors.Is(err, gorm.ErrRecordNotFound)` + pass-through shape exists once; each site keeps its own output class. Eleven translation-shaped sites migrated:

| Site | Before | After | Envelope |
|---|---|---|---|
| dynamic_module_lifecycle.go:58 | `if errors.Is(...) { return ModuleRegistration{}, common.NewNotFound(msgModuleNotFound) } ; return ..., err` | `return ModuleRegistration{}, database.TranslateNotFound(err, common.NewNotFound(msgModuleNotFound))` | 404 role unchanged |
| dynamic_module_lifecycle.go:87 | same shape, `return common.NewNotFound(...)` | `return database.TranslateNotFound(err, ...)` | 404 unchanged |
| generator_datasource_service.go:81 | same shape | `return nil, database.TranslateNotFound(...)` | 404 unchanged |
| generator_datasource_service.go:248 | same shape | same | 404 unchanged |
| generator_introspection_service.go:94 | same shape | same | 404 unchanged |
| dept_tree.go:153 | same shape | same | 404 unchanged |
| user_service.go:326 | same shape | same | 404 unchanged (tenant-invisible user ≡ missing, contract §5 preserved) |
| permission_workbench.go:697 | same shape → `common.NewBadRequest(errPermissionRoleInvalid)` | `database.TranslateNotFound(err, common.NewBadRequest(...))` | 400 unchanged |
| user_helper.go:306 | same shape → `common.NewBadRequest("user.post.invalid")` | same | 400 unchanged |
| dept_service.go:417 | same shape → `common.NewBadRequest("dept.leader.user_invalid")` | same | 400 unchanged |
| post_service.go:609 | same shape → `common.NewBadRequest("post.dept.invalid")` | same | 400 unchanged |
| mfa_service.go:225 | same shape → `errors.New("auth.mfa.challenge_invalid")` | same | 500-with-key unchanged |

`TranslateNotFound` semantics: `errors.Is(err, gorm.ErrRecordNotFound)` → replacement; every other error passed through by `require.Same`-grade identity (tested, incl. wrapped not-found via `fmt.Errorf("%w")`, nil, and plain errors).

Sites intentionally NOT migrated (measured against the packet's "30+" estimate; full list in `capture-before/notfound-sites.txt`; after the wave 43 raw / 37 errors.Is-shaped references remain in module code):

- Control-flow branches (return nil/false/create/continue): login_service.go:124,163,524,564; login_runtime.go:828; mfa_service.go:101,274; session_service.go:366; dynamic_module_sync.go:106,384; dynamic_module_service.go:216,311; setting_seed.go:159,180; i18n_export.go:184; i18n_seed.go:238,476; dict_service.go:986; role_helper.go:28; dept_import.go:164,168; dept_service.go:530,533; tenant_service.go:254,1028,1094,1215; login_tenant_switch.go:208,224; role_handler.go:46.
- Domain sentinels: tenant_provision.go:233 / tenant_service.go:343,358,609 return `ErrTenantNotFound` (module sentinel, not an i18n translation).
- Handler-side mapping: i18n_handler.go:257,310,332 respond inside the handler (`common.Fail(c, common.CodeError, errI18nNotFound)`) — different shape, different code.

## 3. Context helpers (commit 3)

| Helper | Before | After | Equivalence note |
|---|---|---|---|
| menu_handler `getRoleKeysFromContext` | local copy reading `roleKeys` ([]string) then `roleKey` (string, `!= ""`) | deleted; call site uses `common.GetRoleKeys(c)` | Token middleware sets `roleKeys` as `[]string` and `roleKey` as a first role key (`token_middleware.go:196,204`); shared impl differs only by trimming the string branch, which seeded role keys never exercise |
| user_handler `getUserIDFromContext` | read `userId`, type-assert, `(uint64, bool)` | thin adapter: `common.GetUserID(c)` + `!= 0` | middleware sets `userId` as uint64 (`token_middleware.go:194`); real ids are nonzero, so ok-flag semantics identical for every reachable input; 3 existing pure tests pass unchanged |
| `common/http.GetUserID` | duplicate of `common.GetUserID` with zero callers | deleted | `common.GetUserID` is the single implementation |

## 4. Mapping wrappers — kept, not deleted

- `roleErrorResponse` (role_handler.go): keeps a documented 404 branch (`gorm.ErrRecordNotFound`/`common.ErrNotFound` → `role.not_found`, tenant-isolation acceptance F14) plus the `CodeForError` path. Real mapping, why-comment in place — kept per packet.
- `menuErrorCode` / `menuErrorMessage` / `isMenuValidationError` (menu_handler.go): real menu-specific validation whitelist (10 keys → 400), why-comments in place — kept per packet.

## 5. Structural exception: pkg/common/http privates

`isI18nMessageKey` / `lastMessageSegment` / `resolveErrorMessageKey` in `pkg/common/http/response.go` stay. `pkg/common/re_export.go` re-exports this package's envelope (`common.Fail`, codes, `Response`) to the entire codebase, so `pkg/common/http` cannot import `pkg/common` without an import cycle (verified: the build fails with "import cycle not allowed" when attempted). The four `common`-side helpers all have live consumers (ResolveErrorMessageKey: login_handler; ErrMessage: 17 files; GetUserID: 5 files; GetRoleKeys: 4 files), so neither side can simply be deleted. A `NOTE` comment in response.go records the collapse condition (envelope moves into common, or a shared leaf package — an architecture decision beyond this wave's refactor scope).
