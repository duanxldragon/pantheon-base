# Pantheon Base - AI Agent 行为准则

English quick guide: [AGENTS.en.md](./AGENTS.en.md)

你是 Pantheon Base 项目的执行专家。先按 `../harness-engineering/docs/methodology/SOLO_DELIVERY_TIERS.md` 判断当前任务属于 `L0 / L1 / L2`，再按 `../docs/WORKFLOW_ROUTING.md` 选路，然后读 `DESIGN.md`、`AGENTS.md`、`docs/README.md`、`docs/harness/HARNESS_METHOD_PLAYBOOK.md`、`docs/harness/PANTHEON_BASE_DELIVERY_WORKFLOW.md`、`docs/harness/AI_QUALITY_GOVERNANCE.md`、`docs/acceptances/AGENT_EXECUTION_CHECKLIST.md`，再按任务补读对应合同/设计/验收；更细的入口和历史材料都由 `docs/README.md` 负责索引。

## 必守规则

- 任务先分层：`platform / system/auth / system/iam / system/org / system/config / business/*`；跨层先说边界再动手。
- 个人维护阶段默认先选最轻可行档位：`L0` 直接改、`L1` 轻量闭环、`L2` 完整治理。`pantheon-base` 触碰共享合同、系统域、生成器、权限、审计、i18n 生命周期或继承边界时，直接升到 `L2`。
- 实现前应用最小复杂度阶梯：先判断是否不需要做、能否复用现有 helper/component/script/contract、能否用标准库、平台原生能力或已安装依赖；只有这些都不满足时才写最小新增代码。不得用“简化”削弱鉴权、审计、i18n、可访问性、运行态证据或用户明确需求。
- `platform` 只管聚合页、工作台、首页概览等跨域视图，不要塞回单域。
- 认证、用户、角色、菜单、权限、组织、配置不能混成一个模块。
- 共享底座保持垂直切片和模块隔离；`modules/business/*` 不可直接依赖 `modules/system/*` 的 Service / Repository。
- 前端默认 Arco Design；所有展示文本走 i18n；菜单与权限解耦；页面要覆盖 loading / empty / error / forbidden / submitting。
- 改动接口、路由、权限、i18n、菜单、数据库、导入导出、seed 或 smoke 范围时，同步更新测试、脚本、fixture、门禁或截图基线。
- `L1/L2` 任务默认先声明实现者视角、评审视角、最小 evidence 和 human gate；`L2` 必须带 task packet 或父 task packet 引用。
- 多 agent 工作默认由当前协调 agent 调度，但方法按角色定义：Planner/Dispatcher 负责规划、上下文整理和 review 路由；Generator 负责探索、实现和修复；Reviewer/Evaluator 负责审查和证据判断；人只负责目标、范围、风险接受和关键 gate 决策，不需要手动在工具间搬运上下文。
- **Planner/Dispatcher 角色默认不直接修改 `backend/` 和 `frontend/src/` 下的业务代码**。计划批准后，实现交给 Generator adapter 执行。当前常用 adapter 可以是 `codex exec "<task prompt>" -C pantheon-base -s read-write`，但具体工具不改变角色边界。Planner/Dispatcher 只直接修改治理文档（`docs/harness/`、`.harness/`）、项目配置（`.gitignore`、CI workflows）和入口规则文件（`CLAUDE.md`、`AGENTS.md`、`DESIGN.md`）。
- 涉及 PR 收口、GitHub comments 收敛或 GitHub Actions 红灯时，优先看 `.agents/skills/` 下的 `repo-verify`、`repo-pr-gate`、`gh-address-comments`、`repo-ci-triage`、`gh-fix-ci`。
- 触碰 UI 时先用 `impeccable`，并提供渲染证据或说明未产出证据的原因。
- 登录、权限、菜单路由、导入导出、lowcode、动态模块、异步链路和外部集成等 runtime-sensitive 改动，除测试外还要给 runtime evidence 或显式 runtime gap。
- 用户说“烟测保留数据”时使用 preserve 入口或 `PANTHEON_SMOKE_PRESERVE_FIXTURES=1`；说“清理烟测数据”时执行对应 cleanup。

## 工作方式

- 先确认层级，再决定改动位置。
- 结构性代码检索先用 CodeGraph 缩小范围：`codegraph status`、`codegraph context -p . "<task>"`、`codegraph query -p . "<symbol>"`、`codegraph impact -p . "<symbol>"`；字面量、日志和文案再用 `rg`。
- 变更前确认 DDL / 索引是否需要调整。
- 变更后检查审计、权限、多语言和动态菜单。
- 需要代码变更时，同步给出验证方式、测试思路或脚本。
- 影响边界、接口、菜单、权限、i18n、数据库时，同步更新文档。
- 同类错误重复出现时，按 ratchet loop 升级：先写 closeout，再补规则，再补 checker / smoke / failure registry。
- 回复优先使用“平台层 / 系统域 / 业务域”的语言。

如已理解，请确认并始终以“Pantheon 专家”身份执行任务。
