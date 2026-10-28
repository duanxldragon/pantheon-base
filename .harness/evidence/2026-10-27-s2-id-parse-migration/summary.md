# S2 id-parse-migration — Summary

Task: `.harness/tasks/2026-10-27-s2-id-parse-migration/manifest.json`
Branch: `refactor/s2-id-parse-migration` (from origin/main, after #450)
Commits: one per handler file (packet note: "Replace one handler file per
commit… a bad file should not block the other ten").

## Census and outcome

| File | Sites | Outcome |
|------|-------|---------|
| `modules/system/iam/role/role_handler.go` | 6 | migrated |
| `modules/system/config/dict/dict_handler.go` | 5 | migrated |
| `modules/system/org/dept/dept_handler.go` | 3 | migrated |
| `modules/system/org/post/post_handler.go` | 2 | migrated |
| `modules/system/iam/permission/permission_handler.go` | 2 | migrated |
| `modules/system/iam/menu/menu_handler.go` | 2 | migrated |
| `modules/system/audit/audit_handler.go` | 2 | migrated |
| `modules/auth/login/login_handler.go` | 1 | migrated (`msgParamInvalid` = same `"param.invalid"` value) |
| `modules/system/iam/tenant/tenant_platform_handler.go` | 2 | migrated (parse half only; local `id==0`/`userId==0` rejection kept — same envelope) |
| `modules/system/iam/user/user_handler.go` | 4 + private wrapper | migrated; wrapper deleted; its 2 file-private tests removed with it |
| `modules/system/i18n/i18n_handler.go` | 2 | **kept local** — recorded exception |

27 inline sites → **25 migrated, 2 local**; plus one private helper deleted.
Net diff: 11 files, +66/−134.

## The recorded exception (i18n)

Both i18n sites fail with `errIDInvalid = "id.invalid"` **and** reject `id == 0`
(`if err != nil || id == 0`). The shared helper writes `param.invalid` and
deliberately passes zero through — it cannot reproduce this body with its
existing parameters. The packet's own rule applies: "Some handlers return a
module-specific error key… keep that site local and record it; do not add a
parameter for one caller." Post-migration census: exactly these 2 sites remain.

## Equivalence evidence

- **Pre-change 400 bodies captured** (`pre-migration-400-captures.md`) for the
  four packet-named modules: role, dict, dept (fresh nil-service probes,
  parse-first methods) and tenant (existing merged test). All four bodies are
  `{"code":400,"data":null,"message":"param.invalid"}` (HTTP 200 envelope) —
  byte-identical to what `common.ParseUintParam` writes.
- Every migrated site previously wrote `common.Fail(c, common.CodeParamInvalid,
  <"param.invalid">)`; the helper writes `common.Fail(c,
  common.CodeParamInvalid, common.ErrParamInvalid)` with `ErrParamInvalid =
  "param.invalid"`. Identical constructor arguments → identical envelope.
- The helper returns immediately after writing 400, like every inline block —
  no parse error is swallowed.
- No route path, parameter name, method, status, error code or i18n key
  changed (`doNotTouch` intact: no router file, no response.go, no
  migrations, no frontend).

## Packet drift (recorded per packet rule)

1. `expectedFiles.modify` named `iam/tenant/tenant_handler.go` — deleted in
   W8 (#445); nothing to migrate there.
2. `iam/dept` / `iam/post` paths — actual locations are `org/dept` /
   `org/post`; the real files were modified.
3. `user_service_pure_test.go` lost `TestParseUintParam_Valid/Invalid` — they
   exercised only the deleted private wrapper; the shared helper's tests cover
   the same inputs plus more (zero/float/overflow/missing). No surviving
   behaviour lost coverage.

## Verification matrix

| 验证项 | 结果 |
|--------|------|
| 每文件逐包 `go build` / `go vet` / `go test`（迁移时逐个跑） | 全绿后才提交 |
| 迁移后普查 `ParseUint(c.Param(` | 恰好 2（i18n 例外） |
| `gofmt -l backend/modules` | clean |
| 预换 400 body 捕获（role/tenant/dict/dept） | 四者一致，与 helper 输出逐字节相同 |
| `go test -count=1 ./...`（DSN, full base suite） | GO_TEST_EXIT=0, 46 packages ok |
| `node scripts/harness/check-task-packet.mjs` | 66 file(s), 0 error(s), 41 warning(s) |
| 净 diff | 11 files, +66/−134 |
