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

### `docs/superpowers/specs/`

- 只保留已经被项目采用、仍有设计锚点价值的 AI 产出设计稿。
- 文档必须能回答“它挂在哪份 `Contract` 下、后来落到了哪些 `Design / Acceptance / code change` 上”。
- 允许保留的典型内容：跨模块治理设计、一次实现周期的正式 design anchor、后续多人/多 agent 仍会反复引用的设计约束。
- 不允许进入该目录的内容：执行计划、每日同步记录、临时 checklist、纯 review 纪要、一次性 task packet。
- 如果某份 spec 只是实现过程中的中间推演，且已经被正式设计文档吸收，应删除而不是继续留在 `specs/`。

### `docs/archive/examples/`

- 只放“真实交付样例”或“可复用验收样例”。
- 进入条件：后续还能作为模板、样板、对照证据被复用。
- 典型内容：PR 样例、验收样例、整改结案样例、完整 smoke 样例。

### `docs/archive/baselines/`

- 只放“已经被新版本覆盖，但仍需要保留对照关系”的历史基线。
- 进入条件：当前文档、验收矩阵或治理说明里仍明确引用它作为前一阶段基线。
- 典型内容：旧矩阵、旧审计、旧治理结果快照。

### `docs/archive/upgrade/`

- 只放升级迁移材料。
- 典型内容：runbook、迁移说明、升级 checklist、兼容性切换说明。
- 与功能设计无关的普通过程文档，不应放入该目录。

### 删除优先于归档

- 没有复用价值、没有引用关系、没有基线意义、也不是升级 runbook 的一次性过程稿，直接删除。
- `archive/` 不是兜底垃圾桶；“舍不得删”不是归档理由。

## 2. 入口速查

### 2.0 首次进入

1. [项目总体设计](../DESIGN.md)
2. [AI Agent 行为准则](../AGENTS.md)
3. [文档合同化治理方案](./contracts/DOCUMENT_GOVERNANCE_CONTRACT.md)
4. [designs/ 目录入口（中文优先）](./designs/README.md)
5. [设计与实现验收清单](./acceptances/ACCEPTANCE_CHECKLIST.md)

### 2.1 按任务补读

- `platform` / 共享 UI：`./contracts/PLATFORM_CONTRACT.md`，`./designs/FRONTEND_UI_SPEC.md`，`./designs/BACKOFFICE_STYLE_CONSTRAINTS.md`，`./designs/PLATFORM_DASHBOARD_DESIGN.md`
- `system/auth`：`./contracts/SYSTEM_AUTH_CONTRACT.md`，`./designs/AUTH_MODULE_DESIGN.md`，`./designs/SECURITY_CENTER_DESIGN.md`
- `system/iam`：`./contracts/SYSTEM_IAM_CONTRACT.md`，`./designs/PERMISSION_MODEL.md`，`./designs/PERMISSION_WORKBENCH_GOVERNANCE_DESIGN.md`
- `system/org`：`./contracts/SYSTEM_ORG_CONTRACT.md`，`./designs/SYSTEM_ORG_DESIGN.md`
- `system/config`：`./contracts/SYSTEM_CONFIG_CONTRACT.md`，`./designs/DICT_AND_SETTING_DESIGN.md`，`./designs/I18N_MODULE_DESIGN.md`
- `lowcode` / generator：`./designs/LOWCODE_GENERATOR_GUIDE.md`，`./designs/GENERATOR_MODULE_DESIGN.md`，`./designs/DYNAMIC_MODULE_GOVERNANCE_DESIGN.md`
- `business/*`：对应 `./designs/BUSINESS_<MODULE>_DESIGN.md` 和 `./acceptances/BUSINESS_<MODULE>_ACCEPTANCE.md`

### 2.2 继续深入

- 需要更全的目录时，直接看 `./designs/README.md`、`./acceptances/ACCEPTANCE_CHECKLIST.md` 和本文件的 archive 段。

## 4. 交付、验收与运维

### 4.1 开发与验收

- [设计与实现验收清单](./acceptances/ACCEPTANCE_CHECKLIST.md)
- [GitHub 治理清单](./GITHUB_GOVERNANCE_CHECKLIST.md)
- [system/config 高敏治理验收基线](./acceptances/SYSTEM_CONFIG_GOVERNANCE_ACCEPTANCE.md)
- [business/* 业务模块验收矩阵](./acceptances/BUSINESS_MODULE_ACCEPTANCE_MATRIX.md)
- [代码评审标准](./acceptances/CODE_REVIEW_STANDARD.md)
- [业务开发与 AI 协作](./designs/WORKFLOW.md)
- [系统模块审计](./assessments/SYSTEM_MODULE_AUDIT.md)
- [平台缺口审计（2026-04-29）](./assessments/PLATFORM_GAP_AUDIT_20260429.md)

### 4.2 壳层治理模板

- [平台层 UI 迁移验收矩阵（2026-04-30）](./acceptances/PLATFORM_ACCEPTANCE_MATRIX_20260430_UI_MIGRATION.md)
- [平台壳层双模式验收模板](./acceptances/PLATFORM_SHELL_DUAL_MODE_ACCEPTANCE_TEMPLATE.md)
- [平台壳层 PR 描述模板](./acceptances/PLATFORM_SHELL_PR_TEMPLATE.md)
- [平台壳层 PR Checklist 片段](./acceptances/PLATFORM_SHELL_PR_CHECKLIST_SNIPPET.md)
- 壳层样例与 PR 样例统一放在第 5 节 archive examples，不再作为主入口直接链接

### 4.3 升级与运行

- 升级迁移材料统一放在第 5 节 `archive/upgrade/`，不作为主入口直接链接
- [系统导入导出 Smoke 指南](./acceptances/SYSTEM_IMPORT_EXPORT_SMOKE_GUIDE.md)
- [gstack Windows 使用清单](./designs/GSTACK_WINDOWS_GUIDE.md)

## 5. 保留的历史基线与样例

`docs/archive/` 现按用途拆分为：

- `archive/examples/`：真实交付样例、验收样例、整改结案样例
- `archive/baselines/`：旧矩阵、旧审计等仍需保留的历史基线
- `archive/upgrade/`：老环境升级说明、runbook 与执行 checklist

这样做的目标不是删除历史，而是让历史材料的用途一眼可分。

与 `docs/superpowers/specs/` 的边界也应固定：

- `specs/` 放当前仍有设计锚点价值的 AI design anchor
- `archive/examples/` 放已发生过、可复用的交付样例
- `archive/baselines/` 放被新版本覆盖但仍要保留对照关系的旧基线
- `archive/upgrade/` 放升级迁移材料
- 不满足以上任何一类的过程文档，默认删除

以下文档不是主设计入口，但仍有复用价值，因此保留：

- [平台层冒烟归档报告（2026-04-20）](./archive/examples/QA_SMOKE_REPORT_20260420.md)
  - 作为一次完整 `platform + system/*` 冒烟样例，被 [ACCEPTANCE_CHECKLIST.md](./acceptances/ACCEPTANCE_CHECKLIST.md) 和 [WORKFLOW.md](./designs/WORKFLOW.md) 引用。
- [平台层验收矩阵（2026-04-27）](./archive/baselines/PLATFORM_ACCEPTANCE_MATRIX_20260427.md)
  - 作为 2026-04-30 UI 迁移矩阵的上一阶段基线保留。
- [Platform + Auth 整改结案清单（2026-04-29）](./archive/examples/PLATFORM_AUTH_REMEDIATION_CLOSEOUT_20260429.md)
  - 作为一次整改结案样例保留，供后续阶段收口参考。
- [菜单 Icon 审计与治理结果（2026-04-28）](./archive/baselines/MENU_ICON_AUDIT_20260428.md)
  - 作为 `platform` 导航图标语义治理样例保留。

阶段性评估文档如果已被后续设计、验收或整改基线吸收，不再单列主入口。

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
