# Pantheon Base 文档索引

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

### 2.4 继续深入

- 需要更全的目录时，直接看 `./designs/README.md` 和 `./acceptances/ACCEPTANCE_CHECKLIST.md`。

## 4. 交付、验收与运维

### 4.1 开发与验收

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

- [系统导入导出 Smoke 指南](./acceptances/SYSTEM_IMPORT_EXPORT_SMOKE_GUIDE.md)
- [gstack Windows 使用清单](./designs/GSTACK_WINDOWS_GUIDE.md)

## 6. 本地启动

1. 执行 `docker compose up -d`，或手动执行 `database/system_init.sql` 初始化 MySQL；底座默认库名为 `pantheon_base`。
2. 设置 `PANTHEON_DSN`，例如 `user:pass@tcp(127.0.0.1:3306)/pantheon_base?charset=utf8mb4&parseTime=True&loc=Local`。
3. 可选设置 `PANTHEON_REDIS_ADDR=127.0.0.1:6379` 与 `PANTHEON_REDIS_PASSWORD=DHCCdhcc2025`。
4. 生产环境设置 `PANTHEON_INITIAL_ADMIN_PASSWORD`，长度不少于 12 位；开发环境未设置时会创建 `admin / 123456`。
5. 后端执行 `go run ./backend/cmd/server`。
6. 前端进入 `frontend/` 执行 `npm install` 和 `npm run dev`。
7. 启动后可访问 `GET /api/v1/health` 验证进程、数据库与 Redis 状态。

## 7. 当前系统能力概览

- 支持 access / refresh token 会话轮换与注销失效。
- 支持用户、角色、部门、岗位、菜单、权限、字典、设置、i18n、上传、动态模块、生成器等系统底座能力。
- 支持安全中心、自助会话管理、登录日志审计与个人中心资料维护。
- 支持平台首页真实统计卡片与最近登录活动概览。
- 支持动态菜单、页面权限、按钮权限、接口权限分层治理。
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
