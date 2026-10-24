## 变更摘要

- 改动层级：platform（`system/config`、`system/org`、`system/iam`、共享 `pkg/impexp`）
- 改动模块：`backend/modules/system/config/dict`、`backend/modules/system/org/{dept,post}`、
  `backend/modules/system/iam/{user,role,permission}`、`backend/pkg/impexp`
- 目标问题：单租户（compat）模式下字典与部门无法删除。根因不是主键缺失，而是六个服务把
  compat 上下文当成 nil 丢弃，平台视图没有钉到 `tenant_id = 0`；同时修复字典排序 IDOR、
  部门/岗位导入导出未作用域化、导入行未写租户、孤儿祖先阻断路径映射。
- 预期影响：单租户视图只读写 `tenant_id = 0`；租户视图只读写本租户；跨租户删除/排序被收敛为
  既有的 not-found/空结果。无 schema、路由、权限码、菜单 seed、错误信封或前端变化。

## Harness 链路

- Task ID：2026-10-24-single-tenant-scope-closeout
- Task Manifest：.harness/tasks/2026-10-24-single-tenant-scope-closeout/manifest.json
- Evidence：.harness/evidence/2026-10-24-single-tenant-scope-closeout/commands.json
- Verification evidence：.harness/evidence/2026-10-24-single-tenant-scope-closeout/summary.md
- Review Artifact：.harness/evidence/2026-10-24-single-tenant-scope-closeout/review.md
- OpenSpec change：none
- Trivial change：no
- Quality Profile：permission-policy
- Ratchet Decision：sensor-added
- GitHub Signal：repo-quality-gate

## Harness adoption markers

> 保留本区块的英文 marker，供 `scripts/harness/check-adoption.mjs` 做机械检查。

- task id: 2026-10-24-single-tenant-scope-closeout
- task manifest: .harness/tasks/2026-10-24-single-tenant-scope-closeout/manifest.json
- evidence: .harness/evidence/2026-10-24-single-tenant-scope-closeout/
- boundaries: platform tenant-scope binding for dict/dept/post/user/role/permission plus dept/post import-export path maps; no schema, route, permission-code, menu-seed, workflow or frontend change
- backend response contract: unchanged; cross-tenant access converges to the existing not-found/empty result
- backend DTO contract: unchanged
- permission contract: unchanged
- audit coverage: unchanged
- visual evidence: not-applicable (no frontend change); single-tenant browser suites were run as behaviour evidence
- inheritance contract: no sharedPaths or contract document change
- base drift: branch cut from main
- Base/ops inheritance: pantheon-ops needs no change; it gains the fix by advancing its foundation pin

## 边界说明

- [x] 本次改动仅涉及单一层级
- [ ] 本次改动涉及跨层，已说明边界与依赖

补充说明：全部改动在 `platform`。服务层只改租户作用域绑定与导入导出的作用域传递；共享
`pkg/impexp` 只把“父节点不在已加载集合内”从错误改为路径边界。数据库 schema 保持 29，前端未改。

## 受影响子图

`system/config/dict`、`system/org/{dept,post}`、`system/iam/{user,role,permission}` 统一通过
`tenant.WithTenantScope` / 各自 `scoped()` 过滤；`pkg/impexp` 仍是叶子工具，不新增模块边。
无新增锁，排序交换仍在既有事务内，不引入锁序环。

## 验证记录

- [x] 后端构建与静态检查：`gofmt -l` 无输出，`go build ./...` 与 `go vet ./...` 通过
- [x] 目标 Go 包真库测试：`pkg/impexp`、`system/config/dict`、`system/org/dept`、`system/org/post`、
  `system/iam/user`、`system/iam/permission`、`system/iam/role` 全部 ok（0 FAIL / 0 SKIP）
- [x] API smoke：`tests/smoke/system/api` 11/11 通过（批量删除、六类导入导出、日志清理与样例文件）
- [x] 单租户浏览器：system-config + system-org 26/26；iam/role-authorization/audit/i18n/platform/
  routes/form-state 63/63
- [x] 生成模块：governance-real、auto-recycle-real、governance-host-real 3/3（服务端设置
  `PANTHEON_NODE_BIN`/`PANTHEON_WORKSPACE_ROOT`）；master-detail、many-to-many 各 1/1（按其
  `--setup` 命令）
- [x] 首次全量浏览器：339 通过 / 12 失败 / 3 跳过 / 8 未运行；12 个失败已全部归类为环境或不适用
  （5 个 node 解析问题 + 7 个多租户专属用例），详见 summary
- [x] 治理检查：frontmatter、task-packet template、task packet、structure、generated、failure
  registry、evidence（strict）、review（strict）全部通过
- [x] 敏感信息扫描：evidence、task packet、manifest 与 PR 材料 0 命中
- [ ] CodeQL / SonarCloud / CI required checks：待 PR 运行
- [ ] 多租户模式浏览器复验：本轮只做单租户验收，多租户 Go 回归仍通过

## 已知风险与环境限制

- **R1（P3，环境）**：Windows + Git Bash 下 Go 的 `exec.LookPath("node")` 解析不到 node，生成
  接口会返回 `module.generate.server_export_failed`。启动服务时需设置绝对路径
  `PANTHEON_NODE_BIN` 与 `PANTHEON_WORKSPACE_ROOT`；这不是租户作用域回归。
- **R2（P3，环境）**：7 个多租户专属浏览器用例在 compat 模式不适用（租户管理员登录 401 或缺少
  租户切换器）。
- **R3（P3，编排）**：`run-smoke-suite.mjs` 在 Playwright 有失败时仍返回 0，结果按套件输出解析；
  `business-generated-basic` 在生成模块为 0 时跳过并连带后续用例未运行。
- **R4（P3，数据）**：本机开发库存在一条孤儿部门行（id=235），已用有界 UPDATE 挂回本租户根部门；
  代码侧已容忍该形状，其他环境的同类历史数据不会再阻断导入导出。
- **R5（P3，设计）**：`system_dict_item` 仍无唯一键；排序并发不是受支持操作。

## 审核留痕

- Copilot review：requested
- CodeQL 结果：待 CI
- GitHub checks 结果：待 CI
- Auto-merge：enabled by PR Automation
- Duplication Gate 结果：待 CI
- Review 结论：approved（`.harness/evidence/2026-10-24-single-tenant-scope-closeout/review.md`）
- 是否高风险改动：yes（命中 `system/config`、`system/iam` 与共享 `pkg/*`，按 repo-pr-gate 需两名
  非作者 review，其中一名为领域/安全/架构负责人）
- Residual risk / follow-up：见上节 R1–R5
- 回滚方式：按文件回退；无 schema/迁移，回退不需要数据修复

## 检查清单

- [x] 已明确本次改动归属 `platform`
- [x] 未把认证、IAM、组织、配置等系统域职责混写
- [x] 前端新增展示文案已使用 i18n：未涉及前端
- [x] 菜单、页面授权、操作授权、接口授权边界保持清晰
- [x] 涉及数据库/权限/菜单/接口变更时，文档已同步：无 schema / 路由 / 权限码变化，任务包与
  evidence 已同步
- [x] 已确认不会泄露敏感配置、账号密码或 Token
