# 摘要：AUD-001 不是一个 bug，是四处独立断裂

## 一句话

“生成即注册”这条链路此前**从未成立过一次**：产物编不过（导入路径错）、编过也起不来（中间件签名错）、起得来也拦不住（路由组自己拼链）、跑起来也没表（默认迁移模式下没人建表）。四处缺陷互相掩盖——因为第一步就编译失败，后面三处永远不会暴露。

## 关键判断

**1. 根因是“模板与注册器不同源”，不是“写错了几个字符串”。**
同一份 schema，模板写出 `pantheon-base/internal/middleware`，而注册器 `internal/scaffold/workspace.go` 写出的注册表用的是真实模块路径。两处各自手写，所以能长期不一致而无人发现。修法因此不是“把字符串改对”，而是让模板从**单一常量** `GO_MODULE_PATH` 派生全部 Go 导入，并加一条读 `backend/go.mod` 的测试钉住它——否则下一个改模块名的人会再犯一次。

**2. 中间件链不该由模板拼。**
原模板自己 `r.Group(...).Use(middleware.TokenAuthMiddleware())`，于是既漏了 `rdb` 参数，也把“业务域到底该挂哪些中间件”这件事复制到了生成器里。改成调用 `contracts.ProtectedGroup` / `contracts.DataScopedGroup` 后，链的形状回到 `pkg/contracts` 一处定义——顺带让 W2 的租户结论（业务域不挂租户中间件）对生成物自动生效，不需要在生成器里再写一遍“不要加 TenantContextMiddleware”。

**3. 建表：选 Bootstrap 而不是 `.sql`，是有代价的选择。**
`RegisterBackendModules` 在默认（版本化迁移）模式下只跑 `Bootstrap`、不跑 `Migrate`，而 `FuncModule.Bootstrap` 在 `BootstrapFunc == nil` 时直接返回 nil。生成物只设了 `MigrateFunc`，所以默认模式下生成的表**永远不会被创建**——这是最隐蔽的一处，因为它只在“重启后”显现，而重启前页面一切正常。
任务包给的两个选项里，选 `.sql` 需要给运行时生成的模块分配一个迁移编号并塞进 golang-migrate 链，而编号分配本身就是并发不安全的手工动作；因此选了 `BootstrapFunc`（内部仍调 `AutoMigrate`）。**代价**：与 `docs/DEPLOYMENT_GUIDE.md:44`“生产环境不得启用 GORM AutoMigrate”存在张力，处置见下“剩余风险”。

**4. 编译闸门必须放在“写盘之后、状态推进之前”。**
`validateGeneratedModuleSource` 原本只校验 `backend/` 与 `frontend/` 两个目录存在——而生成器当然会建这两个目录，所以这条校验恒真。闸门改成在 workspace 的 `backend/` 下执行 `go build ./modules/<scope>/<name>`，失败即 `common.NewBadRequest("module.register.source_uncompilable")`，`registration` 因此停在未注册状态。位置很关键：放在 `db.Save` 之后就会出现“页面显示已接入、重启后服务起不来”。

**5. 顺手修掉的两处“恒不命中”分支。**
`dynamic_module_handler.go` 里三个 `switch err.Error()` 与裸键比较，而 `common.NewBadRequest(key)` 的 `Error()` 带 `bad_request: ` 前缀，所以这三个 switch **从来没命中过**——新闸门的错误会被当成 500 类错误返回给前端。改为 `common.ErrMessage(err)` 后，`module.register.source_uncompilable` 才能正确映射到 400 + 可读文案。

## 边界（本次没做什么）

- 没给生成物加 `.sql` 迁移文件（理由见上第 3 条）。
- 没修生成物的 `gofmt` 不干净（AUD-001b，P3）：根因是模板写死结构体字段对齐空格，修它要按最长字段名算列宽，属于模板重构而非本包缺陷；且 pre-commit 的 `gofmt -w` 会在提交时归位，CI 的 gofmt 对 PR 只报告。已单列，不在本包混入。
- 没改生成器的前端模板（`frontendGenerator.ts`）。
- 没改 `PANTHEON_AUTO_MIGRATE` 的语义，也没改 `RegisterBackendModules`。
- 没把生成物提交进仓库；运行态验证全在临时副本 `/tmp/w1-ws` 内完成。

## 剩余风险

| 风险 | 程度 | 说明 |
|---|---|---|
| `BootstrapFunc` → `AutoMigrate` 与 `DEPLOYMENT_GUIDE.md:44` 冲突 | 中 | 默认模式下生成模块会触发 GORM AutoMigrate，而该文档写明“生产环境不得启用”。当前是任务包预先批准的选项之一，但**文档未豁免**。两条出路：给该文档加一句“运行时生成模块的 Bootstrap 例外”，或改为在 Bootstrap 里执行显式 `CREATE TABLE IF NOT EXISTS`（仓库已有先例：`internal/middleware/data_scope_middleware.go:68`）。已登记为 AUD-001c，建议在冻结前择一落地。 |
| 生成物 `gofmt` 不干净 | 低 | AUD-001b，P3。提交时会被 lint-staged 归位，但首次提交会产生无关格式 diff。 |
| 编译闸门的成本 | 低 | 每次注册多一次 `go build`（含依赖，首次可能数十秒），上限 180s。这是有意的：宁可注册慢，也不要“页面说已接入、重启起不来”。 |
| 工具链缺失时的错误语义 | 低 | `PANTHEON_GO_BIN` 非绝对路径 / PATH 无 `go` 也归为 `source_uncompilable`。对调用方结论相同（这份源码现在不能接入），但排障需看服务端日志。 |
