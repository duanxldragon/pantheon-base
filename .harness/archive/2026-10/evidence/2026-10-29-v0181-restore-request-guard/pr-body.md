## 变更摘要

- 改动层级：platform（前端共享 API 模块两行导出 + 版本/发布文档 + 治理登记；无后端、schema、路由、权限、菜单、i18n 改动）
- 改动模块：`frontend/src/api/request.ts`、`VERSION`、`CHANGELOG.md`、`docs/release-notes/`（新增 v0.18.1 说明 + 双语索引）、`.harness/STATUS.md`、`docs/harness/failure-registry.md`、`docs/harness/AI_QUALITY_GOVERNANCE.md`、任务包 `2026-10-29-v0181-restore-request-guard` 与其证据（含 `notes/` 三份发布文本）
- 目标问题：`pantheon-base-v0.18.0` 发布后，`pantheon-ops` 重建时前端构建红在
  `TS2614: Module '"../../../../api/request"' has no exported member 'isForbiddenRequestError'`。
  S1 去导出波次（#439，`b0a1952a`）以"零调用方"删除该谓词，但检索只覆盖本仓；消费仓
  `business/deploy/task/DeployTaskDetail.tsx:29` 仍导入并在 :182 分支。
- 预期影响：恢复两行导出，切 `pantheon-base-v0.18.1`（patch，`release/0.18`），让消费仓能够对覆盖
  13 个精简波次的版本完成后端与前端构建；消费仓无需改代码。

## Harness 链路

- Task ID：`2026-10-29-v0181-restore-request-guard`
- Task Manifest：`.harness/tasks/2026-10-29-v0181-restore-request-guard/manifest.json`
- Evidence：`.harness/evidence/2026-10-29-v0181-restore-request-guard/commands.json`
- Verification evidence：`.harness/evidence/2026-10-29-v0181-restore-request-guard/summary.md`
- Review Artifact：`.harness/evidence/2026-10-29-v0181-restore-request-guard/review.md`
- OpenSpec change：none
- Trivial change：no
- Quality Profile：ci-workflow
- Ratchet Decision：guide-updated
- GitHub Signal：repo-quality-gate

## Harness adoption markers

> 保留本区块的英文 marker，供 `scripts/harness/check-adoption.mjs` 做机械检查。

- task id: 2026-10-29-v0181-restore-request-guard
- task manifest: .harness/tasks/2026-10-29-v0181-restore-request-guard/manifest.json
- evidence: .harness/evidence/2026-10-29-v0181-restore-request-guard/commands.json
- boundaries: 只改前端共享 API 模块的两行导出、版本与发布文档、治理登记与任务证据；未改 backend / 迁移 / workflow / sonar 配置 / 依赖
- backend response contract: unchanged（无后端改动）
- backend DTO contract: unchanged（无后端改动）
- permission contract: unchanged（未新增或删除权限码）
- audit coverage: unchanged（无审计链路改动）
- visual evidence: not-applicable（无 UI 改动）
- inheritance contract: `sharedPaths` 仍 52 项；`pantheon-ops` 只需推进 lock 版本、release line、commit 与两份校验和
- base drift: 分支基于 `main` @ `b4bb2392`（v0.18.0 发布提交）
- Base/ops inheritance: 发布后 `pantheon-ops` 推进锁到 0.18.1 并重建，属消费仓独立提交

## 边界说明

- [x] 本次改动仅涉及单一层级
- [ ] 本次改动涉及跨层，已说明边界与依赖

补充说明：缺陷是共享前端导出面的编译契约，修复必须落在 base（消费仓的 `replaceRoots` 会覆盖业务仓
内的 base 文件，且 `.foundation/allowed-drift.json` 拒绝通用漂移）。版本判定为 patch 的依据写在
`docs/harness/tasks/2026-10-29-v0181-restore-request-guard.task.md`：`docs/VERSION_MANAGEMENT_GUIDE.md`
§2.3 把 bug fix 列为 patch，本次只恢复被误删的谓词，不新增能力。

## 验证记录

- [x] `git status --short` / `git diff -- frontend/src/api/request.ts` → 唯一源码改动是两行新增导出
- [x] workspace 导入扫描：`pantheon-ops` 从 `api/request` 导入 12 个名字，恢复后全部存在于 base 导出
- [x] 消费仓 staging 树（v0.18.0）`npm run build` → `TS2614`（失败读数）；恢复导出后同一构建
  `✓ built in 751ms`（通过读数）
- [x] 消费仓 staging 后端 `go build ./...` → exit 0（`go mod tidy` 补齐 business 模块的间接依赖后）
- [x] base `frontend`：`npm run lint` 无输出、`npm run type-check` 无诊断、`npm run build` `✓ built in 1.16s`
- [x] `cat VERSION` → `0.18.1`；`pantheon-base-v0.18.1` 在 CHANGELOG、发布说明、STATUS 各一处，
  双语索引已指向新版本
- [x] `check:task-packet`（三个活动包全 PASS，0 error）、`check:task-packet-template`、
  `check:harness-docs`（0 finding）、`check:structure`（0/2921）、`check:harness-encoding`（0/2573）、
  `check:docs-frontmatter`（399 docs / 279 带 frontmatter）、`check:harness-inventory`（0 finding）、
  `check:harness-adoption`（0 finding / 0 warning）
- [x] `node scripts/harness/check-failure-registry.mjs --strict` → 1 file, 0 error, 0 warning（FR-021 入表）
- [x] `node scripts/harness/check-evidence.mjs --strict`、`check-review.mjs --strict` → exit 0
- [ ] 发布后：四件产物、`Foundation Release Verify`、`pantheon-ops` 对 0.18.1 的后端与前端构建
  —— 见 `commands.json` 的 `knownGaps`，脚本链在合并后执行并回填

## 审核留痕

- Copilot review：见 PR 机器人读数；本 PR 为两行导出恢复 + 版本/治理文档
- CodeQL 结果：无后端与敏感流改动；以 PR checks 为准
- GitHub checks 结果：见 PR checks 读数
- Auto-merge：disabled（发布收口需要人工确认目标 commit 与版本级别）
- Duplication Gate 结果：以 PR checks 为准
- 是否高风险改动：否（单个导出恢复，无迁移、无权限、无 workflow、无 secrets）
- Residual risk / follow-up：
  - 发布使用维护者已登录的 `gh` 会话（`default_workflow_permissions=read`），tag 与 Release 一经创建不可回退。
  - 该修复的验收读数是消费仓对 0.18.1 的构建；在消费仓完成重建前不宣称 v0.18.1 已验证。
  - 本机 `github.com:443` 间歇超时（`api.github.com` 正常），git 操作需要重试。
  - `pantheon-ops` 的锁推进与构建记录在证据里，提交留给该仓库自身的评审。

## 检查清单

- [x] 已明确本次改动归属 `platform`，未把系统域职责混写
- [x] 未改任何门禁规则、workflow、Sonar 配置，未使用 `NOSONAR` 或规则排除
- [x] 未删除、未覆盖任何文件（两行纯新增）
- [x] 无后端、i18n、菜单、授权、数据库或迁移变化
- [x] 已确认不会泄露敏感配置、账号密码或 Token：diff 只含导出、版本号、发布说明与证据文本
- [x] 已用 workspace 级检索确认恢复的导出是消费仓唯一缺失的 `api/request` 符号
- [x] 已登记 `FR-021` 并在 `AI_QUALITY_GOVERNANCE.md` §5.4 写明规则，未放宽既有门禁
