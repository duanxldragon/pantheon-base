# S2 shared-handler-helpers — Summary

Task: `.harness/tasks/2026-10-27-s2-shared-handler-helpers/manifest.json`
Branch: `refactor/s2-shared-handler-helpers` (from origin/main `cbd74f85`)

## What was added (add-only, zero call-site change)

| Helper | Placement | Replaces (migration target) |
|--------|-----------|------------------------------|
| `ErrParamInvalid` / `ErrRequestFailed` (exported consts) | `backend/pkg/common/handler.go` | RC-017: the same two string consts redeclared in 11 handler files |
| `ParseUintParam(c, name) (uint64, bool)` | `backend/pkg/common/handler.go` | RC-014: ~35 inline `strconv.ParseUint(c.Param(...))` + six-line 400 blocks |
| `NormalizePagination(page, pageSize, max) (page, pageSize, offset)` | `backend/pkg/common/handler.go` | RC-013: ~13 pagination normalizers (defaults 1/10 shared; cap stays per-module) |
| `NormalizeSort(input, allowed, fallback) string` | `backend/pkg/common/handler.go` | RC-015: 6–8 sort whitelist helpers (column lookup + fallback only; direction semantics stay at call sites) |
| `NotFoundIfMissing(err, key) error` | `backend/pkg/database/notfound.go` | RC-024: 30+ `errors.Is(err, gorm.ErrRecordNotFound)` → `errors.New(key)` blocks |

`git status` on the branch: exactly five new files, zero modifications — the
packet's doNotTouch list (`backend/modules/**`, `pkg/common/http/response.go`,
`pkg/common/error.go`, migrations) is untouched.

## Package placement decision (recorded per packet)

- The three HTTP-adjacent helpers plus the two message-key consts go to
  `backend/pkg/common` (default placement; pkg/common already imports gin for
  its envelope writers, so no new dependency).
- `NotFoundIfMissing` goes to **`backend/pkg/database`**, not pkg/common:
  pkg/common is gorm-free today (verified by grep over the package) and the
  packet's implementation note says to keep it that way rather than force a
  gorm import or create a new package. `pkg/database` already imports gorm
  (see `duplicate_key.go` for the sibling predicate style).
- Deviation vs `expectedFiles.create`: `backend/pkg/database/notfound.go` +
  `notfound_test.go` are additional creates; anticipated by the packet note.

## Behaviour preservation

- **Captured replacement target** (`400-response-capture.md`): the mounted
  platform tenant handler on `GET /api/v1/system/tenant/abc` answers
  `HTTP 200` with body `{"code":400,"data":null,"message":"param.invalid"}`.
  `ParseUintParam` calls `common.Fail(c, common.CodeParamInvalid,
  common.ErrParamInvalid)` — literally the same constructor arguments the
  inline blocks use — and the unit test asserts the same envelope fields.
- **ParseUintParam does not reject zero.** The tenant `parseTenantID` adds an
  `id == 0` check; every other inline site does not. The helper preserves the
  majority shape; the zero-check stays local at call sites that have it.
  `user_handler.go`'s thin `parseUintParam` (returns error, writes nothing) is
  a different contract — its migration decision belongs to the id-parse wave.
- **NormalizePagination** reproduces the shared semantics of all 13 inline
  normalizers: `page <= 0 → 1`, `pageSize <= 0 → 10`, `pageSize > cap → cap`.
  The cap is a parameter (modules use different values; unifying would be a
  behaviour change). The `offset` return is additive; call sites may ignore it.
  No page upper bound is added — the inline blocks have none (the tenant
  members handler's bounded normalizer is a separate, stricter shape that the
  migration wave may keep local).
- **NormalizeSort** covers only column resolution (TrimSpace → map lookup →
  fallback). Direction handling differs per module (post: `== "desc"`;
  user: anything-but-"asc") and stays at call sites by design.
- **NotFoundIfMissing** passes non-not-found errors through by identity and
  translates only `gorm.ErrRecordNotFound` (including wrapped forms).

## Verification matrix

| 验证项 | 结果 |
|--------|------|
| `gofmt -l pkg/common pkg/database` | clean（handler_test.go 一次性格式化后） |
| `go build ./...` | OK |
| `go vet ./pkg/common/... ./pkg/database/...` | OK |
| `go test -count=1 ./pkg/common/... ./pkg/database/...` | ok（全部边界用例见下） |
| `go test -count=1 ./...`（DSN, full base suite） | GO_TEST_EXIT=0, 46 packages ok |
| `go build ./...`（pantheon-ops/backend） | OK |
| `node scripts/harness/check-task-packet.mjs` | 66 file(s), 0 error(s), 41 warning(s) |
| call-site change | 无（git status 仅五个新文件） |

Test-name edge-case inventory (packet runtimeEvidence item 2):
`TestParseUintParamAcceptsValidAndZero`（valid 42 / zero passes through）,
`TestParseUintParamRejectsInvalidInputs`（garbage / negative / float /
oversized-overflow）, `TestParseUintParamRejectsMissingParamValue`（route-less
empty param, driven directly）, `TestNormalizePaginationDefaultsAndCap`（zero /
negative / valid / oversized-capped / cap-below-default）,
`TestNormalizeSortWhitelistAndFallback`（exact / snake / padded / unknown
symbol / blank / nil map）, `TestSharedMessageKeyConstantsMatchInlineValues`,
`TestNotFoundIfMissingTranslatesRecordNotFound`,
`TestNotFoundIfMissingTranslatesWrappedRecordNotFound`,
`TestNotFoundIfMissingPassesOtherErrorsThroughUnchanged`（identity）,
`TestNotFoundIfMissingNilStaysNil`.
