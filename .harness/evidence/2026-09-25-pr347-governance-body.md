## 变更摘要

- 改动层级：governance（harness 治理脚本与 evidence）+ backend 轻量重构
- 改动模块：scripts/frontmatter-check.mjs、scripts/harness/check-doc-frontmatter.mjs、backend/internal/middleware/data_scope_middleware.go、.harness/evidence/2026-09-24-production-readiness-audit/
- 目标问题：①任务归档与 v0.13.0 准备工作完成后，PR 缺少 required checks 运行记录被 ruleset 阻塞；②工作区遗留未提交改动（frontmatter 检查器不接受 doc_type: Plan；data_scope_middleware 存在 Sonar S1192 重复字面量）；③2026-09-24 生产就绪审查 evidence 未入库
- 预期影响：PR 治理字段补全后 required checks 正常运行并可合并；文档 frontmatter 门禁支持 Plan 类型；middleware 消除重复字面量告警；生产就绪审查证据链完整保留

## Harness 链路

- Task ID：2026-09-25-task-archiving-and-v0130-prep
- Task Manifest：.harness/tasks/2026-09-25-task-archiving-and-v0130-prep/manifest.json
- Evidence：.harness/evidence/2026-09-25-task-archiving-and-v0130-prep/commands.json
- Verification evidence：.harness/evidence/2026-09-25-task-archiving-and-v0130-prep/summary.md
- Review Artifact：.harness/evidence/2026-09-25-task-archiving-and-v0130-prep/review.md
- OpenSpec change：none
- Trivial change：no
- Quality Profile：ci-workflow
- Ratchet Decision：no-repeat-observed
- GitHub Signal：repo-quality-gate

## Harness adoption markers

> 保留本区块的英文 marker，供 `scripts/harness/check-adoption.mjs` 做机械检查。

- task id: 2026-09-25-task-archiving-and-v0130-prep
- task manifest: .harness/tasks/2026-09-25-task-archiving-and-v0130-prep/manifest.json
- evidence: .harness/evidence/2026-09-25-task-archiving-and-v0130-prep/commands.json
- boundaries: governance scripts + harness evidence + backend middleware refactor，不触碰共享合同与系统域服务
- backend response contract: none
- backend DTO contract: none
- permission contract: none
- audit coverage: none
- visual evidence: none
- inheritance contract: none
- base drift: none
- Base/ops inheritance: none

## 边界说明

- [x] 本次改动仅涉及单一层级

> 治理脚本与 evidence 归 governance 层；data_scope_middleware.go 仅做常量提取（无行为变更，`go build`/`go vet` 通过），不涉及系统域服务行为、菜单、权限、i18n、审计。

## 验证记录

- [x] 后端测试：`go build ./internal/middleware/ && go vet ./internal/middleware/`（常量提取无行为变更）
- [x] 前端构建：本次不涉及前端代码，`check-doc-frontmatter.mjs` 本地实跑 exit 0
- [x] 其他专项验证已补充：`node scripts/harness/check-doc-frontmatter.mjs` exit 0（仅 2 个 legacy WARN，与本次无关）
- [x] CodeQL 结果已检查并解释：PR 上 CodeQL SUCCESS，无 open alert
- [x] Full Smoke 仅在必要时手动或预发布执行，未错误纳入 PR 必过门禁
- [ ] GitHub required checks 通过（本次 push 已触发，等待结果）
- [x] Copilot review 已请求，或已说明当前仓库/账号不可用：automatic-policy
- [x] 已启用或确认将启用 squash auto-merge

补充说明：核心 smoke 与全量门禁由 Quality Gates / Security Gates / CI 三个 required workflow 覆盖。

## 审核留痕

- Copilot review：automatic-policy
- CodeQL 结果：SUCCESS（PR #347 两次 commit 均通过，无 open alert）
- GitHub checks 结果：Quality Gates / Security Gates / CI 由本次 push 触发，等待变绿；Pull Request Automation 修复 PR body 后重跑
- Auto-merge：enabled
- Duplication Gate 结果：data_scope_middleware.go 的重复字面量已通过常量提取消除，等待 check-duplication 确认
- 是否高风险改动：no
- Residual risk / follow-up：v0.13.0 release 创建与 ops 同步按 RELEASE_v0.13.0_PREP.md 时间线另行执行；main 分支的 merge queue required checks 命名（Unit Tests / CI Summary）与当前 workflow job 名的差异待维护者确认

## 检查清单

- [x] 已明确本次改动归属 governance 层（harness 脚本与 evidence）
- [x] 未把认证、IAM、组织、配置等系统域职责混写
- [x] 前端新增展示文案已使用 i18n（本次无前端文案）
- [x] 菜单、页面授权、操作授权、接口授权边界保持清晰
- [x] 涉及数据库/权限/菜单/接口变更时，文档已同步（本次无此类变更）
- [x] 已确认不会泄露敏感配置、账号密码或 Token
- [x] 已确认本次 PR 由 GitHub required checks、CodeQL 和分支保护负责最终合并门禁
