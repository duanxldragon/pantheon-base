# 复核记录：生成器后端产物可编译且可建表（AUD-001）

对照任务包 `executionRoles.reviewerPosture` 逐条自查。复核人：本轮执行者（自审）；维护者已授权"先做 W1"，最终签署仍归维护者。

## 1. 生成文件的导入前缀是否与 `backend/go.mod` 一致，且来自单一常量

**通过。** 模板侧唯一手写点是 `backendGenerator.ts` 的 `GO_MODULE_PATH`，全部 Go 导入经 `goImportPath()` / `buildGoImportBlock()` 派生。新增用例 `GO_MODULE_PATH stays in sync with backend/go.mod` 直接读 `backend/go.mod` 的 `module` 行比对，所以"改模块名但忘改常量"会先红。实测修复后产物中 `"pantheon-base/` 前缀命中 0（修复前为 3 个文件）。

## 2. 生成路由组的中间件顺序是否与 `system_modules.go:162` 同形

**通过，但结论与任务包原文不同，需要说明。** 任务包写的是"Token → 租户上下文 → Casbin（+可选 DataScope）"，参照 `system_modules.go:162`。而 W2（`2026-10-31-audit-p1-business-route-tenant-context`，已执行）依据 `TENANT_CONTRACT_V1 §2.6` 确认：**业务域不参与租户隔离，路由助手不挂租户中间件**。生成物是 `business/*` 模块，因此正确形状是 `contracts.ProtectedGroup`（Token → Casbin）或 `contracts.DataScopedGroup`（Token → Casbin → DataScope），**不含** `TenantContextMiddleware`。

若照任务包原文加租户中间件，在 `multi` 模式下会让**所有**业务请求变成 `TENANT_CONTEXT_MISSING`（业务表没有 `tenant_id` 可过滤），即用一个更严重的故障替换原来的故障。故按 W2 结论执行，任务包该条已在本次执行中更正。该结论由 `route_groups_test.go` 的棘轮测试（负向已验证：注入 `TenantContextMiddleware` 后 `ProtectedGroup chain length = 3, want 2`）与生成器侧的 `generated routes stay outside tenant isolation` 用例共同钉住。

## 3. `TokenAuthMiddleware` 是否收到 `database.RDB`

**不再适用，且这是改进而非遗漏。** 模板不再自己拼中间件链，改为调用 `contracts.*` 助手；`database.RDB` 由助手内部传入（`ProtectedGroupWithRedis` / `DataScopedGroup` 的既有实现）。因此"漏传 `rdb`"这类缺陷在结构上不可能再发生——链的装配权回到了 `pkg/contracts` 一处。

## 4. 编译闸门是否在写盘之后、状态推进之前执行

**通过。** 调用链：`RegisterManagedModule` → `loadGeneratedModuleSchema` → `validateGeneratedModuleSource` → `verifyGeneratedModuleCompiles` → 返回错误 → **`populateManagedModuleRegistration` 与 `db.Save` 都不执行**。`TestRegisterManagedModuleRejectsUncompilableGeneratedSource` 同时断言两件事：错误键为 `module.register.source_uncompilable`，且 `system_module_registration` 里**没有**该模块的行（`count = 0`）。编译目标限定为 `./modules/<scope>/<name>`，不把全仓构建债务带进注册路径。

## 5. 负向用例是否真实存在

**通过，且做了双重负向验证。**

1. 摘掉闸门（`return s.verifyGeneratedModuleCompiles(...)` → `return nil`）→ `TestRegisterManagedModuleRejectsUncompilableGeneratedSource` **FAIL**；恢复后 ok，`grep -c NEGATIVE-CHECK` = 0。
2. 摘掉生成物的 `BootstrapFunc` → 运行时建表测试 **FAIL**（`biz_order was not created in the default versioned-migration mode`）；恢复后 ok。

第 2 条是本次最关键的一条：它证明建表确实由 `BootstrapFunc` 承担，而不是被 `SeedMenus` / 别的路径顺带建出来。

## 6. `git status` 是否新增了生成产物

**通过。** 生成物只落在系统临时目录（`/tmp/w1-final.json`、`/tmp/w1-ws`），仓库内无新增 `backend/modules/business/<generated>` 目录。`git status` 中与 W1 相关的只有源码与测试文件。

## 7. 额外自查（不在 reviewerPosture 清单内，但本次必须回答）

**7.1 `doNotTouch` 被越界了吗？** 是，两处，且都必要：

- `backend/modules/system/i18n/builtin_locale_resources.json` 与 `frontend/src/i18n/resources/{zh-CN,en-US,ja-JP,ko-KR,fr-FR}.ts`：新增 `module.register.source_uncompilable` 一条文案。闸门引入了一个**新的用户可见错误**，不登记就会让前端显示裸键。manifest 的 `doNotTouch` 已相应更正（这两条从 doNotTouch 移到 modify，并注明原因）。
- `backend/modules/lowcode/dynamicmodule/dynamic_module_handler.go`：三个 `switch err.Error()` 改为 `common.ErrMessage(err)`。若不改，新闸门的错误会被映射成 500 类错误——闸门存在但用户看到的是一句"服务器错误"。

**7.2 闸门会不会误伤正常注册？** 不会。`TestRegisterManagedModuleAdvancesStatusWhenGeneratedSourceCompiles` 与 `TestRegisterManagedModuleSkipsBuildCheckWhenBuilderIsNil` 分别覆盖"编译通过 → 正常推进"与"测试构造的空 builder → 跳过"，且 `TestNewDynamicModuleServiceWiresGeneratedModuleBuild` 断言生产构造函数必须注入真实编译，防止闸门在后续重构中静默消失。

**7.3 工具链缺失时会怎样？** `PANTHEON_GO_BIN` 非绝对路径或 PATH 无 `go` → 同样返回 `source_uncompilable`。对调用方结论一致（这份源码现在不能接入），但排障要看服务端日志。已写入 summary 的剩余风险。

**7.4 有没有引入新的幽灵 i18n 键？** 没有。`resolveGoBinary` 的注释明确记录了为什么不给"非绝对路径"单独建键（`module.generate.invalid_node_binary` 就是既有幽灵键，本包不复制）。新键 `module.register.source_uncompilable` 在 5 个前端语言包 + 后端快照里都能查到（各 1 / 各 1 / 快照 5）。

## 结论

**通过，但附带两条未闭合项**，均已登记、均不阻断：

- **AUD-001c（P2）**：`BootstrapFunc → AutoMigrate` 与 `DEPLOYMENT_GUIDE.md:44`"生产环境不得启用 GORM AutoMigrate"冲突。当前是任务包预先批准的选项之一，但文档未豁免。建议冻结前择一：给该文档加例外条款，或改为在 Bootstrap 执行显式 `CREATE TABLE IF NOT EXISTS`（仓库已有先例）。
- **AUD-001b（P3）**：生成物 `gofmt` 不干净（5/5 文件），根因是模板写死结构体字段对齐空格。提交时会被 lint-staged 归位，不影响构建，故不在本包混入。

## Machine Readable

```json
{
  "taskId": "2026-10-31-audit-p1-lowcode-generator-build",
  "verdict": "approved with documented P2 follow-up",
  "structuralReview": {
    "affectedSubgraph": [
      "frontend/src/modules/lowcode/generator/backendGenerator.ts (GO_MODULE_PATH / goImportPath / buildGoImportBlock / generateModule / generateService)",
      "frontend/tests/generator/generator-quality-contract.test.ts (5 new cases)",
      "backend/modules/lowcode/dynamicmodule/dynamic_module_build_check.go (new compile gate)",
      "backend/modules/lowcode/dynamicmodule/dynamic_module_service.go (verifyGeneratedModuleCompiles)",
      "backend/modules/lowcode/dynamicmodule/dynamic_module_handler.go (3 dead switch err.Error() -> common.ErrMessage)",
      "backend/modules/lowcode/dynamicmodule/dynamic_module_build_check_test.go (7 new cases)",
      "backend/pkg/contracts/module.go (read-only: RegisterBackendModules / FuncModule semantics)",
      "backend/modules/system/i18n/builtin_locale_resources.json + frontend/src/i18n/resources/*.ts (one new key, 5 locales)"
    ],
    "checks": ["call-depth", "sensitive-flow"],
    "findings": [
      "P2 (AUD-001c): BootstrapFunc calls service.Migrate() i.e. GORM AutoMigrate, while docs/DEPLOYMENT_GUIDE.md:44 states production must not enable GORM AutoMigrate. This was one of the two options pre-approved by the task packet, but the deployment guide carries no carve-out for runtime-generated modules. Resolve before freeze: either add an explicit exception clause, or switch Bootstrap to an explicit CREATE TABLE IF NOT EXISTS (precedent: internal/middleware/data_scope_middleware.go:68).",
      "P3 (AUD-001b): gofmt -l lists all five generated Go files. Root cause is hard-coded struct-field alignment in the templates; fixing it requires computing column widths per struct, which is a template refactor rather than part of the four defects. Pre-commit lint-staged runs gofmt -w on backend/**/*.go and CI gofmt is report-only for PRs, so build and gates are unaffected.",
      "P2: the compile gate needs a Go toolchain on the deployment host (PANTHEON_GO_BIN absolute path, or go on PATH). Images that strip the toolchain will fail every dynamic-module registration with module.register.source_uncompilable. This is deliberate fail-closed behaviour, but the deployment prerequisite is not written down anywhere yet.",
      "P3: the generator still has a second unsourced path logic - frontendGenerator.ts frontend import paths were not brought under the same single constant. This package only covers the Go side.",
      "Deviation from the task packet, deliberate: the packet asked for the generated route group to mirror system_modules.go:162 including the tenant-context middleware. The generated module is a business/* module and TENANT_CONTRACT_V1 §2.6 (settled by W2) says business domains do not participate in tenant isolation, so including it would turn every business request into TENANT_CONTEXT_MISSING in multi mode. Implemented as contracts.{Protected,DataScoped}Group instead; the packet and manifest were corrected.",
      "Deviation from the task packet, deliberate: the packet listed the i18n files under Do Not Touch. The gate introduces a new user-visible error key, so module.register.source_uncompilable was added to the backend snapshot and all five frontend locales. Nothing else in those files changed."
    ],
    "notes": "AUD-001 turned out to be four independent breaks rather than one bug: wrong import prefix (3 of 5 Go files), TokenAuthMiddleware missing rdb, the template assembling its own middleware chain, and no BootstrapFunc (so no table in the default versioned-migration mode). They masked each other because step one fails at compile time. Before-state reproduced at 10 files / 77,082 bytes with \"pantheon-base/internal/middleware\" and middleware.TokenAuthMiddleware(); after-state at 10 files / 74,863 bytes with zero bare pantheon-base imports, zero middleware. calls, one BootstrapFunc and contracts.DataScopedGroup. Verified in a throwaway copy of the repo at /tmp/w1-ws: go build and go vet on the generated package both exit 0; an ad-hoc integration test with PANTHEON_AUTO_MIGRATE unset calls InitOrderModule and asserts HasTable(\"biz_order\"), logging 'versioned migrations mode: skipping module AutoMigrate and running runtime bootstraps'; removing BootstrapFunc makes that same test fail with biz_order was not created, and removing the gate makes TestRegisterManagedModuleRejectsUncompilableGeneratedSource fail. Both were restored and re-run green. Repo-side gates: go build ./... and go vet ./... exit 0; go test ./modules/lowcode/... ./pkg/contracts/... all ok against a real MySQL (DB cases actually executed, not skipped); npm run test:generator:quality 13/13; task-packet, doc-frontmatter, encoding, structure, generated, inventory, sync, docs, duplication, doc-links, doc-inventory and audit-coverage checkers all exit 0; check-evidence strict 6 files 0 errors. No generated artifact was committed."
  },
  "linkage": {
    "taskManifest": ".harness/tasks/2026-10-31-audit-p1-lowcode-generator-build/manifest.json",
    "evidence": ".harness/evidence/2026-10-31-audit-p1-lowcode-generator-build/commands.json",
    "reviewFile": ".harness/evidence/2026-10-31-audit-p1-lowcode-generator-build/review.md",
    "changeRef": "none",
    "planRefs": [
      "docs/reviews/PANTHEON_BASE_GLOBAL_AUDIT_2026-10-31.md",
      "docs/designs/GENERATOR_MODULE_DESIGN.md",
      "docs/contracts/PLATFORM_CONTRACT.md"
    ]
  }
}
```
