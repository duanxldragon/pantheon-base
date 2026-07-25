## 变更摘要

- 改动层级：ci-workflow（质量治理配置 + 工作流供应链）
- 改动模块：`.sonarcloud.properties`（新增）、`.github/workflows/ci.yml`、`.github/workflows/quality.yml`、`.harness/{tasks,evidence}/2026-07-25-sonar-scope-and-s8545/`
- 目标问题：SonarCloud 存量 OPEN 812 中约 355 条来自非产品代码（仓库工具脚本 261、SQL 种子/迁移 47、i18n 资源 S2068 硬编码凭证误报 47），Release Gate 要求 OPEN=0 无法达成；同时 ci.yml/quality.yml 各有 1 条 githubactions:S8545（`go install golangci-lint@版本` 非锁文件强制安装）。
- 预期影响：自动分析范围收敛到交付产品代码后，下次 main 分析 OPEN 预计 812 → ~457；S8545 两条归零；lint 门禁语义不变（push 全仓 report-only、PR `--new-from-rev` 新代码强制）。剩余 ~457 条产品/测试/容器代码走后续改码批次。

## Harness 链路

- Task ID：2026-07-25-sonar-scope-and-s8545
- Task Manifest：.harness/tasks/2026-07-25-sonar-scope-and-s8545/manifest.json
- Evidence：.harness/evidence/2026-07-25-sonar-scope-and-s8545/commands.json
- Verification evidence：.harness/evidence/2026-07-25-sonar-scope-and-s8545/summary.md
- Review Artifact：.harness/evidence/2026-07-25-sonar-scope-and-s8545/review.md
- OpenSpec change：none
- Trivial change：no
- Quality Profile：ci-workflow
- Ratchet Decision：gate-updated
- GitHub Signal：repo-quality-gate

## Harness adoption markers

> 保留本区块的英文 marker，供 `scripts/harness/check-adoption.mjs` 做机械检查。

- task id: 2026-07-25-sonar-scope-and-s8545
- task manifest: .harness/tasks/2026-07-25-sonar-scope-and-s8545/manifest.json
- evidence: .harness/evidence/2026-07-25-sonar-scope-and-s8545/
- boundaries: ci-workflow 单层；未触碰 backend/frontend 产品源码（go tool 方案因降级 minio-go 已否决并回滚，go.mod/go.sum 零改动）
- backend response contract: not-applicable
- backend DTO contract: not-applicable
- permission contract: not-applicable
- audit coverage: not-applicable
- visual evidence: not-applicable（无 UI 改动）
- inheritance contract: not-applicable（base 自身仓库）
- base drift: not-applicable
- Base/ops inheritance: pantheon-ops 按维护者决策搁置，待 base 发行版本后基于 release 同步
- Copilot review: requested
- CodeQL 结果: not-applicable
- GitHub checks 结果: 提交后由 required checks 验证（Quality Gates / Security Gates）
- Auto-merge: enabled
- Duplication Gate 结果: not-applicable
- 是否高风险改动: 否（配置与工作流安装方式替换，行为等价；golangci-lint 版本仍锁 v2.6.2，action SHA 固定 v9.3.0 提交）
- Residual risk / follow-up: (1) autoscan 对 `.sonarcloud.properties` 有社区报告的偶发不生效——合并后必须回查 `api/issues/search statuses=OPEN` 计数，若未生效改用 SonarCloud UI Analysis Scope 同等排除；(2) 覆盖率为 0 根因=自动分析不导入覆盖率报告，切 CI-based 分析因 Sonar way `new_coverage>=80` 门条件与冻结期机械修复批次冲突而明确延后到解冻后（见 summary.md）；(3) 剩余 ~457 条按批次改码：小桶 → go:S1192 常量化 → 前端风格规则 → S3776 复杂度重构。

## 边界说明

- [x] 本次改动仅涉及单一层级
- [ ] 本次改动涉及跨层，已说明边界与依赖

## 验证记录

- [x] 后端测试：`go test ./...`（not-applicable：未触碰后端源码，go.mod/go.sum 零改动已用 `git diff` 验证）
- [x] 前端构建：`cd frontend && npm run build`（not-applicable：未触碰前端源码）
- [x] 轻量 smoke（not-applicable：无运行时改动）
- [x] 其他专项验证已补充：`node --test tests/scripts/quality-workflow.test.mjs` 3/3 通过；`npm run check:task-packet-template`、`check:structure`（1151 文件 0 finding）、`check:harness-encoding`（1053 文件 0 finding）、`check:pr-governance --event`（本 body）全部通过；两个工作流 YAML 解析通过
- [x] CodeQL 结果已检查并解释：本次为 YAML/properties 配置改动，无 CodeQL 语言范围内代码
- [x] 如有 open CodeQL alert，已说明：当前 0 open alert（2026-07-25 清仓轮基线）
- [x] Full Smoke 仅在必要时手动或预发布执行，未错误纳入 PR 必过门禁
- [x] GitHub required checks 通过（提交后由 CI 出具）
- [x] Copilot review 已请求，或已说明当前仓库/账号不可用
- [x] 已启用或确认将启用 squash auto-merge

补充说明：Codex relay 仍不可用（401/挂起），按维护者 2026-07-23 先例由 Claude 直接实施并在提交信息注明。

## 审核留痕

- Copilot review：requested
- CodeQL 结果：not-applicable
- GitHub checks 结果：提交后由 required checks 验证
- Auto-merge：enabled
- Duplication Gate 结果：not-applicable
- 是否高风险改动：否
- Residual risk / follow-up：见 Harness adoption markers 同名条目

## 检查清单

- [x] 已明确本次改动归属 `platform`、`system/auth`、`system/iam`、`system/org`、`system/config` 或 `business/*`
- [x] 未把认证、IAM、组织、配置等系统域职责混写
- [x] 前端新增展示文案已使用 i18n（not-applicable）
- [x] 菜单、页面授权、操作授权、接口授权边界保持清晰（not-applicable）
- [x] 涉及数据库/权限/菜单/接口变更时，文档已同步（not-applicable）
- [x] 已确认不会泄露敏感配置、账号密码或 Token
- [x] 已确认本次 PR 由 GitHub required checks、CodeQL 和分支保护负责最终合并门禁
