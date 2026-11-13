# Pantheon Base 文档索引

当前 VERSION 为 `0.18.8`，包含已验证的依赖升级与 11 月 7 日交付收尾；见 [v0.18.8 发行说明](./release-notes/RELEASE_NOTES_v0.18.8.md) 和 [准备检查点证据](../.harness/evidence/2026-11-13-v0188-release-preparation/summary.md)。正式发行身份、提交和四个不可变资产以 [GitHub Release](https://github.com/duanxldragon/pantheon-base/releases/tag/pantheon-base-v0.18.8) 为准。前一版本 v0.18.7 在 `3203624e55438866edb951bd74e671eab38d2f16` 发布并通过 [Ops #183](https://github.com/duanxldragon/pantheon-ops/pull/183) 完成正式消费；见 [v0.18.7 交付证据](../.harness/evidence/2026-11-12-v0187-release-ops-consumption/summary.md)。

## Historical checkpoints

Official `pantheon-base-v0.18.6` is published at5553bc0e after exact Release Gate; Ops official consumption passed and merged[PR178](https://github.com/duanxldragon/pantheon-ops/pull/178). Three repositories verified main-only; final factual documentation closeout is independently approved; current administrative CI/merge/main-only recheck remain required. Original12/40 remain accepted; unwaived residuals retained. See [evidence](../.harness/evidence/2026-11-07-v0186-release-ops-consumption/summary.md).

当前（2026-11-07）：原12项任务的40条验收标准均保留并获独立 CODE/ARCH 批准。七项已通过PR497合并；最后五项治理收口待本PR门禁。Base v0.18.5正式发布，Ops PR177正式消费已合并；完整无overlay race、前端、脚本、迁移和四套标准smoke通过。冻结未签，S3无豁免，业务/策略残余明确。 See [evidence](../.harness/evidence/2026-11-05-base-freeze-release/resume11-five-task-applied.json).

### Historical checkpoints

当前（2026-11-07）：七个原任务已获独立 CODE/ARCH 批准并关闭；五个消费/总交付任务仍开放。Base v0.18.5 已正式发布，四资产已验证并重建 Ops，完整消费 race/runtime/CI 收口继续进行。冻结未签，S3 无豁免。 See [证据](../.harness/evidence/2026-11-05-base-freeze-release/resume9-seven-task-applied.json).

### Historical delivery checkpoint

当前功能收尾与发行：[任务拆解](./harness/tasks/2026-11-05-base-freeze-release.task.md) · [逐项闭环核对](../.harness/evidence/2026-11-05-base-freeze-release/closeout.md)。Base v0.18.4 已正式发布，Ops PR #171 已合并并锁定消费，租户 V1 保留。12 个任务的交付证据已对齐，最终关闭等待独立审查；S3 provider、维护冻结签署等残余项明确保留。

当前全局审计基线：[完整审计](./reviews/PANTHEON_BASE_GLOBAL_AUDIT_2026-11-04_FULL.md) 与 [全量资产矩阵](./reviews/PANTHEON_BASE_GLOBAL_AUDIT_2026-11-04_ASSETS.md)。整改现态：[Harness整改计划](../.harness/tasks/2026-11-04-global-audit-remediation/plan.md)。旧同日报告保留历史，整改完成不等于已签署维护冻结。

English version: [README.en.md](./README.en.md)

本文是 `docs/` 的统一入口。

目标不是把所有历史记录都堆在首页，而是先帮人快速判断：

- 当前要读的是 **设计规范**、**模块设计**，还是 **交付验收**；
- 哪些文档是长期有效的主文档；
- 哪些文档只是阶段样例、整改基线或历史记录。

## 1. 使用原则

- `docs/` 首页只放当前仍有持续使用价值的文档。
- 阶段性评估、专项验收、整改样例默认不作为一线入口，除非仍被流程、模板或验收清单直接引用。
- 同一主题如果已经有更新的设计文档、矩阵或基线，旧的“中间评估稿”不再继续保留。

## 1.1 目录级索引规则

后续新增文档时，先判断“它属于哪条治理链”，再决定目录，不要按日期或临时任务随手堆放。

### 删除优先于归档

- 没有复用价值、没有引用关系、没有基线意义、也不是升级 runbook 的一次性过程稿，直接删除。

## 2. 入口速查

### 2.0 首次进入

1. [项目总体设计](../DESIGN.md)
2. [AI Agent 行为准则](../AGENTS.md)
3. [Pantheon Base 多 Agent 交付流程](./harness/PANTHEON_BASE_DELIVERY_WORKFLOW.md)
4. [AI 质量治理策略](./harness/AI_QUALITY_GOVERNANCE.md)
5. [文档合同化治理方案](./contracts/DOCUMENT_GOVERNANCE_CONTRACT.md)
6. [designs/ 目录入口（中文优先）](./designs/README.md)
7. [仓库目录布局](./designs/REPOSITORY_LAYOUT.md)
8. [设计与实现验收清单](./acceptances/ACCEPTANCE_CHECKLIST.md)
9. [Pantheon Base Agent 执行清单](./acceptances/AGENT_EXECUTION_CHECKLIST.md)

### 2.1 按任务补读

- `platform` / 共享 UI：`./contracts/PLATFORM_CONTRACT.md`，`./designs/FRONTEND_UI_SPEC.md`，`./designs/BACKOFFICE_STYLE_CONSTRAINTS.md`，`./designs/PLATFORM_DASHBOARD_DESIGN.md`
- 根目录与文件放置：`./designs/REPOSITORY_LAYOUT.md`
- `system/auth`：`./contracts/SYSTEM_AUTH_CONTRACT.md`，`./designs/AUTH_MODULE_DESIGN.md`，`./designs/SECURITY_CENTER_DESIGN.md`
- `system/iam`：`./contracts/SYSTEM_IAM_CONTRACT.md`，`./designs/PERMISSION_MODEL.md`，`./designs/PERMISSION_WORKBENCH_GOVERNANCE_DESIGN.md`
- `system/org`：`./contracts/SYSTEM_ORG_CONTRACT.md`，`./designs/SYSTEM_ORG_DESIGN.md`
- `system/config`：`./contracts/SYSTEM_CONFIG_CONTRACT.md`，`./designs/DICT_AND_SETTING_DESIGN.md`，`./designs/I18N_MODULE_DESIGN.md`
- `lowcode` / generator：`./designs/LOWCODE_GENERATOR_GUIDE.md`，`./designs/GENERATOR_MODULE_DESIGN.md`，`./designs/DYNAMIC_MODULE_GOVERNANCE_DESIGN.md`
- `business/*`：对应 `./designs/BUSINESS_<MODULE>_DESIGN.md` 和 `./acceptances/BUSINESS_<MODULE>_ACCEPTANCE.md`
- 租户 / 多租户：`./contracts/TENANT_CONTRACT_V1.md`（权威合同）、`./api/TENANT_API.md`、`./TENANT_INITIALIZATION_GUIDE.md`、`./migrations/COMPAT_TO_MULTI_UPGRADE.md`；设计背景见 `./designs/MULTI_TENANT_DESIGN.md` 与 `./designs/TENANT_READY_SINGLE_TENANT_DESIGN.md`

### 2.2 Harness 方法层

Pantheon Harness 方法源文件（来自 workspace sibling `../../pantheon-harness/`）：

1. [patterns/README.md](../../pantheon-harness/patterns/README.md) — 方法包入口
2. [harness-core-model.md](../../pantheon-harness/patterns/harness-core-model.md) — 核心模型
3. [harness-coverage-model.md](../../pantheon-harness/patterns/harness-coverage-model.md) — 覆盖模型
4. [harness-template-taxonomy.md](../../pantheon-harness/patterns/harness-template-taxonomy.md) — 模板分类
5. [tool-adapter-matrix.md](../../pantheon-harness/patterns/tool-adapter-matrix.md) — 工具适配矩阵
6. [method-playbook.md](../../pantheon-harness/patterns/method-playbook.md) — 方法执行手册
7. [execution-guardrails.md](../../pantheon-harness/patterns/execution-guardrails.md) — 执行护栏
8. [context-engineering-protocol.md](../../pantheon-harness/patterns/context-engineering-protocol.md) — 上下文工程协议

Shared skills live in `../../pantheon-harness/skills/`; recommended shared skills:

- `../../pantheon-harness/skills/grill-me/SKILL.md` — plan/design/PR grilling

### 2.3 Harness 落地层

当前仓库的 Harness 合同与落地规则：

1. [docs/harness/HARNESS_ENGINEERING_CONTRACT.md](./harness/HARNESS_ENGINEERING_CONTRACT.md)
2. [docs/harness/HARNESS_METHOD_PLAYBOOK.md](./harness/HARNESS_METHOD_PLAYBOOK.md)
3. [../.agents/skills/README.zh.md](../.agents/skills/README.zh.md)
4. [scripts/harness/README.md](../scripts/harness/README.md)

目录职责说明：`docs/harness/` 保存可审阅、可版本化的 Harness 方法、合同和任务包规范；`.harness/` 只保存机器可读的任务状态、执行证据和运行产物。两者不是重复副本，检查器和交付流程分别依赖它们，因此不合并目录。

### 2.4 继续深入

- 需要更全的目录时，直接看 `./designs/README.md` 和 `./acceptances/ACCEPTANCE_CHECKLIST.md`。

## 4. 交付、验收与运维

### 4.1 开发与验收

- [企业级阶段性验收审查报告（2026-10-21，冻结判定；矩阵/问题清单/测试记录同目录）](./reviews/PANTHEON_BASE_FINAL_ACCEPTANCE_REVIEW_2026-10-21.md)
- [租户菜单边界、登录审计归属与套餐差异化修复验收（2026-10-22）](./reviews/PANTHEON_BASE_TENANT_PLAN_AND_AUDIT_FIXES_2026-10-22.md)
- [企业级最终验收评估报告（2026-10-07，被 2026-10-21 验收继任确认）](./reviews/ENTERPRISE_RELEASE_READINESS_REVIEW_2026-10-07.md)
- 历史多模型评审转写（审计凭证，2026-09-10 基线评审与六模型交叉评审）：[20260910](./reviews/pantheon-base-review-20260910.md) · [ChatGPT](./reviews/pantheon-base-review-chatgpt.md) · [Claude](./reviews/pantheon-base-review-claude.md) · [DeepSeek](./reviews/pantheon-base-review-deepseek.md) · [GLM](./reviews/pantheon-base-review-glm.md) · [Grok](./reviews/pantheon-base-review-grok.md) · [Kimi](./reviews/pantheon-base-review-kimi.md)
- 最终验收整改任务包（2026-10-07，已归档）：`harness/tasks/2026-10-07-release-readiness-remediation.task.md` — 可执行任务清单位于 `../.harness/tasks/2026-10-07-*/manifest.json`
- [设计与实现验收清单](./acceptances/ACCEPTANCE_CHECKLIST.md)
- [Pantheon Base Agent 执行清单](./acceptances/AGENT_EXECUTION_CHECKLIST.md)
- [Pantheon Base Task Packet 模板](./acceptances/TASK_PACKET_BASE_TEMPLATE.md)
- [Pantheon Base 多 Agent 交付流程](./harness/PANTHEON_BASE_DELIVERY_WORKFLOW.md)
- [GitHub 治理清单](./GITHUB_GOVERNANCE_CHECKLIST.md)
- [GitHub 仓库设置手册](./GITHUB_REPOSITORY_SETUP.md)
- [AI 质量治理策略](./harness/AI_QUALITY_GOVERNANCE.md)
- [安全问题报告政策](../SECURITY.md)
- [system/config 高敏治理验收基线](./acceptances/SYSTEM_CONFIG_GOVERNANCE_ACCEPTANCE.md)
- [business/* 业务模块验收矩阵](./acceptances/BUSINESS_MODULE_ACCEPTANCE_MATRIX.md)
- [代码评审标准](./acceptances/CODE_REVIEW_STANDARD.md)
- [业务开发与 AI 协作](./designs/WORKFLOW.md)
- [代码质量与安全治理策略](./designs/QUALITY_AND_SECURITY_STRATEGY.md)

### 4.2 壳层治理模板

- [平台层 UI 迁移验收矩阵（2026-04-30）](./acceptances/PLATFORM_ACCEPTANCE_MATRIX_20260430_UI_MIGRATION.md)
- [平台壳层双模式验收模板](./acceptances/PLATFORM_SHELL_DUAL_MODE_ACCEPTANCE_TEMPLATE.md)
- [平台壳层 PR 描述模板](./acceptances/PLATFORM_SHELL_PR_TEMPLATE.md)
- [平台壳层 PR Checklist 片段](./acceptances/PLATFORM_SHELL_PR_CHECKLIST_SNIPPET.md)

### 4.3 升级与运行

- [部署指南](./DEPLOYMENT_GUIDE.md)
- [开发库初始化指南](./DEV_DB_INIT_GUIDE.md)
- [版本管理指南](./VERSION_MANAGEMENT_GUIDE.md)
- [发布说明索引（v0.13.1 起）](./release-notes/README.md)
- [租户初始化指南](./TENANT_INITIALIZATION_GUIDE.md)
- [租户 API](./api/TENANT_API.md)
- [compat → multi 升级指南](./migrations/COMPAT_TO_MULTI_UPGRADE.md)
- [系统导入导出 Smoke 指南](./acceptances/SYSTEM_IMPORT_EXPORT_SMOKE_GUIDE.md)
- [gstack Windows 使用清单](./designs/GSTACK_WINDOWS_GUIDE.md)

### 4.4 测试与 Harness 指南

- [核心测试与验证流程](./harness/PANTHEON_BASE_DELIVERY_WORKFLOW.md)
- [测试使用指南](./testing-usage-guide.md)
- [测试策略优化](./testing-strategy-optimization.md)
- [测试实施报告](./testing-implementation-report.md)
- [Harness 治理指南](./HARNESS_GOVERNANCE_GUIDE.md)
- [Harness PR 生成器指南](./harness-pr-generator-guide.md)

### 4.5 租户专题历史记录

下列 7 份专题评估与冻结记录（原 `docs/TENANT_*.md`，已由文档生命周期包 `2026-10-31-audit-p2-doc-lifecycle-archive` 移入 `docs/reviews/`）是 2026-09/10 的审计与决策凭证。**它们不是一线入口**：其中的结论可能已被 `contracts/TENANT_CONTRACT_V1.md`（权威合同）与后续实现取代，读现状请以 §2.1 的合同与 §4.3 的指南为准。

- [租户系统评审（2026-09-29）](./reviews/TENANT_SYSTEM_REVIEW_2026-09-29.md)
- [租户成熟度终评（2026-09-29）](./reviews/TENANT_MATURITY_FINAL_2026-09-29.md)
- [租户评审摘要（2026-09-29）](./reviews/TENANT_REVIEW_SUMMARY_2026-09-29.md)
- [租户初始化发现（2026-10-13）](./reviews/TENANT_INITIALIZATION_FINDINGS_2026-10-13.md)
- [租户全链路复核（2026-10-14）](./reviews/TENANT_FULL_FLOW_REVIEW_2026-10-14.md)
- [租户登录初始化评估（2026-10-15）](./reviews/TENANT_LOGIN_INIT_EVALUATION_2026-10-15.md)
- [租户 scope 冻结决策（2026-10-15）](./reviews/TENANT_SCOPE_FREEZE_DECISION_2026-10-15.md) — 现行裁决，仍具有约束力，不适用上文“可能已被取代”

## 6. 本地启动

1. 执行 `docker compose up -d` 启动 MySQL 与 Redis；底座默认库名为 `pantheon_base`。
   **不要**再用 `database/system_init.sql` 建库——它只是历史参考，schema 的权威来源是版本化迁移 + runtime seed（见 [开发库初始化指南](./DEV_DB_INIT_GUIDE.md) 与 [部署指南](./DEPLOYMENT_GUIDE.md)）。
2. 设置 `PANTHEON_DSN`，例如 `user:pass@tcp(127.0.0.1:3306)/pantheon_base?charset=utf8mb4&parseTime=True&loc=Local`。
3. 可选设置 `PANTHEON_REDIS_ADDR=127.0.0.1:6379` 与 `PANTHEON_REDIS_PASSWORD=<你的本地 Redis 密码>`；请勿把真实密码写进文档或提交到仓库（可用值参考 `.env.example`，且不要复用生产密码）。
4. 生产环境设置 `PANTHEON_INITIAL_ADMIN_PASSWORD`，长度不少于 12 位；开发环境未设置时会创建 `admin / 123456`。
5. 进入 **`backend/`** 再执行 `go run ./cmd/server`（`backend/go.mod` 是 Go module 根，在仓库根执行 `go run ./backend/cmd/server` 会失败）。
   默认启动路径会自动执行版本化迁移与 runtime seed；只有显式设置 `PANTHEON_AUTO_MIGRATE=true` 才走 GORM AutoMigrate（仅限开发环境，生产禁用）。
6. 前端进入 `frontend/` 执行 `npm install` 和 `npm run dev`。
7. 启动后可访问 `GET /api/v1/health` 验证进程、数据库与 Redis 状态。

```bash
docker compose up -d
export PANTHEON_DSN='root:dev_password_change_me@tcp(127.0.0.1:3306)/pantheon_base?charset=utf8mb4&parseTime=True&loc=Local'
export PANTHEON_REDIS_ADDR='127.0.0.1:6379'
cd backend && go run ./cmd/server
```

## 7. 当前系统能力概览

- 支持 access / refresh token 会话轮换与注销失效。
- 支持用户、角色、部门、岗位、菜单、权限、字典、设置、i18n、上传、动态模块、生成器等系统底座能力。
- 支持安全中心、自助会话管理、登录日志审计与个人中心资料维护。
- 支持平台首页真实统计卡片与最近登录活动概览。
- 支持动态菜单、页面权限、按钮权限、接口权限分层治理。
- 支持租户（多租户）`compat` / `multi` 双模：租户 CRUD、初始化、成员、套餐、审计、租户切换；配额目前**只展示不强制**，业务域为单租户语义（见 [租户合同 V1](./contracts/TENANT_CONTRACT_V1.md) §2.6）。
- 支持前端 `check:menu-contract`、`check:i18n-hardcode` 等门禁。

## 8. 本轮整理说明

本轮已删除以下已失去主入口价值、且被后续设计/矩阵/验收文档覆盖的中间评估稿：

- `BACKOFFICE_UI_VISUAL_QA_20260423.md`
- `PLATFORM_GLOBAL_EVALUATION_20260427.md`
- `SYSTEM_MANAGEMENT_COMPLETENESS_EVALUATION_20260420.md`
- `SYSTEM_MANAGEMENT_EVALUATION_20260423.md`

后续若再产生阶段性盘点文档，建议遵守：

- 设计规范类进入主索引；
- 模板、样例、基线进入“历史基线与样例”；
- 一次性评估稿如果被后续文档完全覆盖，应在下一轮文档治理中删除。

旧的安全加固计划已移入 `../archive/2026-08-security/`，不再作为当前安全状态入口；当前状态以对应任务包、`.harness/evidence/` 和质量门禁结果为准。
