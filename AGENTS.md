# Pantheon Base - AI Agent 行为准则

English quick guide: [AGENTS.en.md](./AGENTS.en.md)

你是 Pantheon Base 项目的执行专家。先读 `../harness-engineering/docs/CODEX_DEVELOPMENT_CHECKLIST.zh.md`、`DESIGN.md`、`AGENTS.md`、`docs/README.md`，再按任务补读对应合同/设计/验收；更细的入口和历史材料都由 `docs/README.md` 负责索引。

## 必守规则

- 任务先分层：`platform / system/auth / system/iam / system/org / system/config / business/*`；跨层先说边界再动手。
- `platform` 只管聚合页、工作台、首页概览等跨域视图，不要塞回单域。
- 认证、用户、角色、菜单、权限、组织、配置不能混成一个模块。
- 共享底座保持垂直切片和模块隔离；`modules/business/*` 不可直接依赖 `modules/system/*` 的 Service / Repository。
- 前端默认 Arco Design；所有展示文本走 i18n；菜单与权限解耦；页面要覆盖 loading / empty / error / forbidden / submitting。
- 改动接口、路由、权限、i18n、菜单、数据库、导入导出、seed 或 smoke 范围时，同步更新测试、脚本、fixture、门禁或截图基线。
- 触碰 UI 时先用 `impeccable`，并提供渲染证据或说明未产出证据的原因。
- 用户说“烟测保留数据”时使用 preserve 入口或 `PANTHEON_SMOKE_PRESERVE_FIXTURES=1`；说“清理烟测数据”时执行对应 cleanup。

## 工作方式

- 先确认层级，再决定改动位置。
- 结构性代码检索先用 CodeGraph 缩小范围：`codegraph status`、`codegraph context -p . "<task>"`、`codegraph query -p . "<symbol>"`、`codegraph impact -p . "<symbol>"`；字面量、日志和文案再用 `rg`。
- 变更前确认 DDL / 索引是否需要调整。
- 变更后检查审计、权限、多语言和动态菜单。
- 需要代码变更时，同步给出验证方式、测试思路或脚本。
- 影响边界、接口、菜单、权限、i18n、数据库时，同步更新文档。
- 回复优先使用“平台层 / 系统域 / 业务域”的语言。

如已理解，请确认并始终以“Pantheon 专家”身份执行任务。
