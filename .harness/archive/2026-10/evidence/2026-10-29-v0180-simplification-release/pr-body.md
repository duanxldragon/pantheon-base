## 变更摘要

- 改动层级：platform（版本与发布文档；未改任何产品源码）
- 改动模块：`VERSION`、`CHANGELOG.md`、`docs/release-notes/`（新增 v0.18.0 说明 + 双语索引）、
  `.harness/STATUS.md`、发布任务包 `2026-10-29-v0180-simplification-release` 与其证据
  （含 `notes/` 三份发布文本）
- 目标问题：v0.17.8（`e256d1fb`）之后 `main` 合入了 13 个代码精简波次与 W1–W8 租户波次，但没有任何
  foundation release 覆盖它们，`pantheon-ops` 无法对包含这些波次的版本做构建验证；这也是精简程序清单
  唯一未关闭项
- 预期影响：切出 `pantheon-base-v0.18.0`（`release/0.18`，minor），随后发布四件可消费产物、核验
  `Foundation Release Verify`，并把 `pantheon-ops` 的锁推进到 0.18.0 后跑 `rebuild:from-base`、
  `go build ./...` 与前端构建；本次 diff 不含后端、前端、迁移、workflow 或门禁改动

## Harness 链路

- Task ID：`2026-10-29-v0180-simplification-release`
- Task Manifest：`.harness/tasks/2026-10-29-v0180-simplification-release/manifest.json`
- Evidence：`.harness/evidence/2026-10-29-v0180-simplification-release/commands.json`
- Verification evidence：`.harness/evidence/2026-10-29-v0180-simplification-release/summary.md`
- Review Artifact：`.harness/evidence/2026-10-29-v0180-simplification-release/review.md`
- OpenSpec change：none
- Trivial change：no
- Quality Profile：ci-workflow
- Ratchet Decision：no-repeat-observed
- GitHub Signal：repo-quality-gate

## Harness adoption markers

> 保留本区块的英文 marker，供 `scripts/harness/check-adoption.mjs` 做机械检查。

- task id: 2026-10-29-v0180-simplification-release
- task manifest: .harness/tasks/2026-10-29-v0180-simplification-release/manifest.json
- evidence: .harness/evidence/2026-10-29-v0180-simplification-release/commands.json
- boundaries: 只动版本与发布文档（VERSION / CHANGELOG / docs/release-notes / .harness/STATUS）与发布任务包证据；未改 backend / frontend / workflow / sonar 配置 / 依赖
- backend response contract: unchanged（无后端改动，发布说明只描述已合入的响应契约）
- backend DTO contract: unchanged（无后端改动）
- permission contract: unchanged（本次发布未新增或删除权限码）
- audit coverage: unchanged（无审计链路改动）
- visual evidence: not-applicable（无 UI 改动）
- inheritance contract: 未改 `sharedPaths`（仍 52 项）；`pantheon-ops` 只需推进 lock 版本、release line、commit 与两份校验和
- base drift: 分支基于 `main` @ `f6bbc1cd`（PR #467 合并后的提交）
- Base/ops inheritance: 发布后 `pantheon-ops` 推进锁并重建，属消费仓独立提交

## 边界说明

- [x] 本次改动仅涉及单一层级
- [ ] 本次改动涉及跨层，已说明边界与依赖

补充说明：发布收口只改版本元数据与发布文档，产品源码均为已合入改动。版本判定为 minor 的依据写在
`docs/harness/tasks/2026-10-29-v0180-simplification-release.task.md`：`docs/VERSION_MANAGEMENT_GUIDE.md`
§2.3 把"架构优化（不影响消费仓）"和"治理增强"列为 minor，而批次同时还带着 v0.17.8 之后未发布的
租户行为修正（W1 删除归档守卫、W2 成员完整性、W4 无角色绑定不发租户上下文、W8 删除未挂载遗留 handler）。

## 验证记录

- [x] `cat VERSION` → `0.18.0`；`pantheon-base-v0.18.0` 在 CHANGELOG、发布说明与 STATUS 各一处，
  双语索引均已指向新版本
- [x] 结构指标在 `f6bbc1cd` 复测：`ParseUint(c.Param("id")` 2、inline `Offset((page` 4、
  `tenantOwnerID` 0、`errParamInvalid` 0、后端生产 Go 52,332 行
- [x] 迁移未变：`git diff --name-only e256d1fb f6bbc1cd -- backend/pkg/database/migrations` 无输出
  （schema 仍 30）
- [x] `check:task-packet`：0 error、13 warning（与基线持平，新包无新增警告）
- [x] `check:task-packet-template`、`check:harness-docs`、`check:structure`（0/2911）、
  `check:harness-encoding`（0/2563）、`check:docs-frontmatter`（397 docs / 278 带 frontmatter）、
  `check:harness-inventory`、`check:harness-adoption`、`check:harness-visual`、
  `check:ui-quality-gate`、`check:duplication`、`check:failure-registry` → 全部通过
- [x] `node scripts/harness/check-evidence.mjs --strict`、`check-review.mjs --strict` → exit 0
- [x] 后端 `go build ./...` / `go vet ./...` / `go test -count=1 ./...` 在 `f6bbc1cd` 为 47 ok / 0 FAIL
  （程序收口证据），本包未改产品源码
- [ ] 发布后：四件产物、`Foundation Release Verify`、`pantheon-ops` 构建 —— 见 `commands.json` 的
  `knownGaps`，脚本链在合并后执行并回填

## 审核留痕

- Copilot review：见 PR 机器人读数；本 PR 仅版本与发布文档
- CodeQL 结果：无代码改动，预计无新增告警；以 PR checks 为准
- GitHub checks 结果：见 PR checks 读数
- Auto-merge：disabled（发布收口需要人工确认目标 commit 与版本级别）
- Duplication Gate 结果：`Result: PASS`
- 是否高风险改动：否（无产品源码、无迁移、无 workflow、无 secrets）
- Residual risk / follow-up：
  - 版本级别 0.18.0 是对 §2.3 的判断，维护者可在验收时改判。
  - 发布使用维护者已登录的 `gh` 会话（`default_workflow_permissions=read`），tag 与 Release 一经创建
    不可回退。
  - 本机 `github.com:443` 间歇超时（`api.github.com` 正常），git 操作需要重试。
  - `pantheon-ops` 的锁推进与构建记录在证据里，提交留给该仓库自身的评审。

## 检查清单

- [x] 已明确本次改动归属 `platform`，未把系统域职责混写
- [x] 未改任何门禁规则、workflow、Sonar 配置，未使用 `NOSONAR` 或规则排除
- [x] 未删除、未覆盖任何文件
- [x] 无前端、i18n、菜单、授权、数据库或迁移变化
- [x] 已确认不会泄露敏感配置、账号密码或 Token：diff 只含版本号、发布说明与证据文本
- [x] 发布说明陈述的两处租户行为变更均来自已合并波次，不是本包引入
- [x] 行数窗口的"下界"口径在三份发布文本里都保留，没有被写成精简收益
