# Pantheon Base - 开发全书 (Index)

欢迎来到 Pantheon Base。这是一个专为个人开发者设计的、高性能、高解耦、多语言支持的后台管理系统底座。

## 📖 文档导航
- [🏗️ 总体架构与后端规范](./BACKEND.md) - 模块化单体、垂直切片、API 规范。
- [🎨 前端设计与 UI 规范](./FRONTEND.md) - Arco Design 实践、动态路由、解耦注册。
- [🧩 前端 UI 详细规范](./FRONTEND_UI_SPEC.md) - 页面骨架、导航、状态、表单、表格、响应式、权限态。
- [🎯 后台 UI 专项整改方案（2026-04-23）](./BACKOFFICE_UI_REMEDIATION_PLAN_20260423.md) - 登录页、应用壳层、工作台和系统页的专业化统一整改方案。
- [📊 平台仪表盘设计](./PLATFORM_DASHBOARD_DESIGN.md) - `platform` 层聚合视图、首页统计卡片与最近安全活动设计。
- [🔐 Auth 模块拆分设计](./AUTH_MODULE_DESIGN.md) - 认证与会话能力域拆分、API 边界、重构阶段计划。
- [🧱 模块契约设计](./MODULE_CONTRACT.md) - 后端装配、前端注册、菜单/权限/i18n/seed 的统一契约。
- [🧭 动态菜单成熟度评估（2026-04-22）](./DYNAMIC_MENU_MATURITY_20260422.md) - `platform` 动态菜单现状判断、CMDB 样板接入评估与下一阶段演进蓝图。
- [🧪 业务模块设计模板](./BUSINESS_MODULE_TEMPLATE.md) - 新增 `business/*` 模块时的标准文档结构、接入清单与边界要求。
- [🗃️ CMDB 业务模块设计](./business/CMDB_MODULE_DESIGN.md) - 第一个 `business/*` 样例模块，验证业务资产、菜单、权限、i18n 与审计接入。
- [🛡️ 权限模型设计](./PERMISSION_MODEL.md) - 导航、页面、按钮、接口四层权限与命名规范。
- [🌐 错误码与多语言设计](./ERROR_CODE_AND_I18N.md) - 后端错误 key、前端翻译责任、fallback 与提示规范。
- [📄 前端页面模板规范](./FRONTEND_PAGE_TEMPLATES.md) - 列表、树表、详情、配置、工作台、认证和状态页模板。
- [🧩 前端组件规划](./FRONTEND_COMPONENT_PLAN.md) - 页面骨架、状态组件、表格/表单/详情组件与沉淀顺序。
- [🔒 安全中心设计](./SECURITY_CENTER_DESIGN.md) - 会话、设备、登录日志、密码安全与审计能力设计。
- [⚙️ 字典与系统设置设计](./DICT_AND_SETTING_DESIGN.md) - 字典、平台设置、缓存、权限和配置底座设计。
- [✅ 设计与实现验收清单](./ACCEPTANCE_CHECKLIST.md) - 设计评审、模块接入、权限/i18n/审计与发布前统一验收标准。
- [🧾 平台层冒烟归档报告（2026-04-20）](./QA_SMOKE_REPORT_20260420.md) - 一次完整的 `platform` / `system/*` 冒烟验收记录、证据与结论。
- [🗺️ 实施路线图](./IMPLEMENTATION_ROADMAP.md) - P0/P1/P2 分阶段计划、依赖顺序、完成定义。
- [🧭 模块目录升级说明（2026-04-21）](./MODULE_LAYOUT_UPGRADE_20260421.md) - `auth` / `dashboard` 顶层化后的逻辑层与物理目录对照、升级影响与验证建议。
- [🧰 老环境升级运维 SOP（2026-04-21）](./UPGRADE_RUNBOOK_20260421.md) - 面向运维执行人的顺序版 runbook，适合发布窗口内直接照单执行。
- [📋 老环境升级执行 Checklist（2026-04-21）](./UPGRADE_EXECUTION_CHECKLIST_20260421.md) - 数据库自动迁移、菜单自动重挂、回归页面与 API 兼容检查清单。
- [🗄️ 数据库设计说明](./DATABASE.md) - 表结构定义、索引规范、i18n 存储。
- [🚀 业务开发与 AI 协作](./WORKFLOW.md) - 如何增加新功能、AI Prompt 指南、测试规范，已包含平台层冒烟 SOP。
- [🧭 系统模块审计](./SYSTEM_MODULE_AUDIT.md) - 系统管理功能点的完成度矩阵与缺口清单。
- [🪟 gstack Windows 使用清单](./GSTACK_WINDOWS_GUIDE.md) - Windows 下用 gstack 内置 Chrome 做冒烟与巡检的稳定执行方式。

## 🛠️ 技术栈快照
- **后端**: Go (Gin) + GORM + Casbin + Redis + JWT。
- **前端**: React + Arco Design + Zustand + i18next.
- **基础**: MySQL 8.0, Docker Compose.

## 🚀 本地启动
1. 执行 `docker compose up -d`，或手动执行 `database/system_init.sql` 初始化 MySQL，默认管理员账号为 `admin / 123456`。
2. 设置 `PANTHEON_DSN`，例如 `user:pass@tcp(127.0.0.1:3306)/pantheon?charset=utf8mb4&parseTime=True&loc=Local`。
3. 可选设置 `PANTHEON_REDIS_ADDR=127.0.0.1:6379` 与 `PANTHEON_REDIS_PASSWORD=DHCCdhcc2025` 启用 i18n 缓存与 Token 黑名单。
4. 后端执行 `go run ./backend/cmd/server`，启动时会校验 `casbin_rule` 结构并同步管理员默认权限策略。
5. 前端进入 `frontend/` 执行 `npm install` 与 `npm run dev`。

## ✅ 当前系统能力
- 支持 access/refresh token 会话轮换与注销失效。
- 支持用户、角色、部门、岗位、菜单、权限六套系统管理页面与对应接口。
- 支持安全中心、自助会话管理、登录日志审计与个人中心资料维护。
- 支持平台首页真实统计卡片与最近登录活动概览。
- 支持 Casbin 多角色判定，以及基于 `scope=nav/manage` 的菜单树返回策略。
- 已新增第一个 `business/cmdb` 业务样例，用于验证业务模块注册、菜单权限、字典依赖和审计接入。
- 已新增动态菜单契约检查脚本，可通过 `cd frontend && npm run check:menu-contract` 校验 frontend manifest 与 backend menu seed 一致性。
- 已在后端菜单保存、前端构建 `prebuild` 与 GitHub Actions 中接入动态菜单组件键门禁。
- 当前已进入“文档先行”阶段，优先按设计文档补全模块边界和 UI 规范，再逐步实现代码。
