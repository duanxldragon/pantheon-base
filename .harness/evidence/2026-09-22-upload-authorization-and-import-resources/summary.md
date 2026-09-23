# Evidence — 2026-09-22-upload-authorization-and-import-resources

## 契约结论（本任务的核心交付）

**`/system/upload` 是 authenticated capability**（`TokenAuthMiddleware` + `TenantContextMiddleware`，无 Casbin），实现与 seed 已一致，本次以测试锁定：

- 证据链：路由注册于 `systemAuth` 组（`system_modules.go:353-356`，组注释明确 TenantContextMiddleware 是 upload 写路径必需）；前端调用方为个人中心头像（`ProfileCenter.tsx` scope=profile/avatar）与用户表单头像（`UserFormModal.tsx` scope=user/avatar），均为普通用户流程；menu/permission seed 无任何 upload 权限键（`seed.go` 全表扫描）。
- 若未来把路由移入 Casbin 组，必须同批补 seed 权限键——双向漂移都有锁定测试拦截。

**local/S3 下载路径校验已存在且未改动**：`NormalizeObjectKey`（段级 `..`/控制字符/非法字符拒绝）+ `EnforceTenantObjectScope`（multi 模式强制 `t{id}/` 前缀）+ `filepath.IsLocal` + nosniff/attachment 头，有既有测试覆盖（`upload_tenant_scope_test.go`、`upload_s3_download_authorization_test.go`）。

## 变更摘要

1. 7 个导入 handler 显式接管 multipart part 生命周期：`dict_handler.go`（2 处）、`i18n_handler.go`、`permission_handler.go`、`role_handler.go`、`user_handler.go`、`dept_handler.go`、`post_handler.go` 各 1 处，`fileHeader.Open()` 成功后立即 `defer file.Close()`。原依赖 `impexp.ReadCSV` 内部 defer close 的间接契约改为显式所有权，覆盖未来提前 return 路径。
2. `pkg/impexp/csv_limits.go`：新增 `MaxImportBytes()`/`MaxImportRows()` 访问器，把 10MB/5000 行 cap 从包私有常量变为可断言契约（上限本体未变）。
3. 新增测试：
   - `modules/system/config/setting/upload_authorization_contract_test.go` — 路由组语义（无 Casbin 可达 / 有 Casbin fail-closed）、double-close 安全、导入上限生效（超大 payload 返回 `ErrTooManyRows`）。
   - `modules/system/config/setting/upload_authorization_testhelpers_test.go` — `io.SectionReader` 版 multipart.File 测试辅助。
   - `modules/system/seed_upload_permission_test.go` — seed 全表无 upload 权限键的漂移守卫。
4. `modules/system/system_modules.go` 仅 gofmt 格式化（前序 T2 改动的格式收敛），无语义变化。

## 导入上限证据（验收标准第 4 条）

- 全局 body limit：`middleware.BodySizeLimit(middleware.DefaultMaxBodyBytes)`（`cmd/server/main.go:121`）。
- 导入层兜底：`impexp.ReadCSV` 的 `maxImportBytes = 10 << 20`（`ErrTooManyRows`）与 `maxImportRows = 5000`，测试 `TestImportLimitsAreEnforced` 锁定。

## 验证证据

```text
env: PANTHEON_TEST_DSN=root:***@tcp(127.0.0.1:3306)/pantheon_base, REDIS_ADDR=127.0.0.1:6379

go build ./...                                                            → PASS
go test ./modules/system/config/setting/... ./pkg/impexp/                 → ok 8.207s / 0.028s
go test ./modules/system/                                                 → ok 3.668s（seed 守卫）
go test ./modules/system/org/...                                          → ok
go test ./modules/system/iam/user ./modules/system/iam/role ./modules/system/i18n
                                                                          → ok（i18n 186s）
go test ./modules/system/iam/permission                                   → ok 7.178s
go vet ./modules/system/config/setting ./modules/system/iam/... ./modules/system/org/... ./modules/system/i18n
                                                                          → exit 0
```

（i18n/iam 套件首次整体跑超 600s 命令超时，改为分包执行后全部绿。）

## 显式 Gap

1. 未授权上传的端到端负例（无 token 401）依赖 TokenAuthMiddleware 既有测试覆盖，未在 handler 层重复建 HTTP 栈。
2. human gate（权限点语义确认）留给维护者：当前 authenticated-capability 定位如需收紧为 `system:setting:upload`，需同步前端调用方与 seed，建议单独决策。
