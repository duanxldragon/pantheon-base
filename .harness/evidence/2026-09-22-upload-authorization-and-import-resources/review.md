# Review — 2026-09-22-upload-authorization-and-import-resources

## 结论

实现者视角：本任务的核心交付是**把隐式契约变成被测试锁定的显式契约**，而不是改行为。
`/system/upload` 定位为 authenticated capability（`TokenAuthMiddleware` + `TenantContextMiddleware`，
无 Casbin），与 menu/permission seed 现状一致；8 处 `fileHeader.Open()` 改为显式 `defer Close()`
所有权；导入上限从私有常量提升为可断言契约。

评审视角：**契约证据链完整，行为等价，无权限放宽**。上传仍然需要认证与租户上下文，租户下载
作用域（`EnforceTenantObjectScope` + `NormalizeObjectKey`）未被触碰。

## 对照验收标准

| 验收标准 | 证据 | 判定 |
| --- | --- | --- |
| 上传授权与 permission seed 一致 | 路由组语义测试（无 Casbin 可达 / 有 Casbin fail-closed）+ seed 全表无 upload 权限键守卫，均 PASS | 通过 |
| 租户下载作用域保持 | 既有 `upload_tenant_scope_test.go` / `upload_s3_download_authorization_test.go` 未改动且在全包运行中通过 | 通过 |
| 每个打开的导入文件都被关闭 | 8 处 handler 显式 defer Close；`TestReadCSVOwnership_DoubleCloseIsSafe` PASS | 通过 |
| 上限与负例存在 | `TestImportLimitsAreEnforced` PASS（10MB/5000 行，`ErrTooManyRows`） | 通过 |

## 评审关注点与处置

1. **是不是把“没权限”变成了“有权限”？** 不是。修改前后路由都在 `systemAuth` 组
   （仅 TokenAuth + TenantContext）；本任务只是用测试把这个事实钉住，并加了一条反向守卫：
   若未来移入 Casbin 组而不补 seed，测试会红。
2. **显式 Close 是否引入 double close？** `fileHeader.Open()` 每次返回新的 part reader，
   `impexp.ReadCSV` 内部的 defer 与外层 defer 叠加时 `TestReadCSVOwnership_DoubleCloseIsSafe`
   证明安全；显式所有权主要覆盖“解析前提前 return”的未来路径。
3. **上限有没有被放宽？** 没有。`maxImportBytes = 10MB`、`maxImportRows = 5000` 数值未变，
   只是从包私有常量变为 `MaxImportBytes()` / `MaxImportRows()` 访问器，便于断言与跨包复用。
4. **system_modules.go 的改动**只是前序任务的 gofmt 收敛，无语义变化——已在 summary.md 标注，
   避免 reviewer 误判为隐藏行为改动。

## 残余风险

- 权限定位若需收紧（例如引入 `system:setting:upload`），必须同时改前端两个调用方与 seed，
  并在同一批次补测试；当前决定留给维护者 human gate。
- 未在 handler 层重建“无 token → 401”的 HTTP 栈，依赖 TokenAuthMiddleware 既有覆盖。
- 权限定位已于 2026-09-23 由维护者确认：保持 authenticated capability，不收紧为 scoped 权限（见 manifest humanGateDecision）。
- `-race` 已在本地执行通过：config/setting 12.244s、modules/system 6.016s、internal/middleware 2.503s、pkg/impexp，无 data race。

## Decision

approved with documented P2 follow-up

## Machine Readable

```json
{
  "taskId": "2026-09-22-upload-authorization-and-import-resources",
  "verdict": "approved with documented P2 follow-up",
  "structuralReview": {
    "affectedSubgraph": [
      "system upload route authorization contract",
      "system import handlers file-handle ownership",
      "pkg/impexp import caps"
    ],
    "checks": ["cycle", "hub", "call-depth", "sensitive-flow"],
    "findings": [],
    "notes": "Behavior-equivalent contract pinning: no authorization was widened (route group and seed unchanged), no import cap was relaxed, and the export/download scope helpers were untouched. Drift is now guarded from both the route side and the seed side."
  },
  "linkage": {
    "taskManifest": ".harness/tasks/2026-09-22-upload-authorization-and-import-resources/manifest.json",
    "evidence": ".harness/evidence/2026-09-22-upload-authorization-and-import-resources/commands.json",
    "reviewFile": ".harness/evidence/2026-09-22-upload-authorization-and-import-resources/review.md",
    "changeRef": "none",
    "planRefs": [".harness/ENTERPRISE_REMEDIATION_PLAN_2026-09-22.md"]
  }
}
```
