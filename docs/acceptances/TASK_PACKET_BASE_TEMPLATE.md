---
title: Pantheon Base Task Packet Template
doc_type: Acceptance
layer: platform
status: Active
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
updated_at: 2026-06-03
---

# Pantheon Base Task Packet Template

English version: [TASK_PACKET_BASE_TEMPLATE.en.md](./TASK_PACKET_BASE_TEMPLATE.en.md)

这是一份给 `pantheon-base` 使用的最小 task packet 样例。

适用范围：

- `platform`
- `system/auth`
- `system/iam`
- `system/org`
- `system/config`
- `system/lowcode`

直接复制后补全即可：

```text
默认落点：docs/harness/tasks/YYYY-MM-DD-<task-name>.task.md
默认 evidence：.harness/evidence/<task-id>/
目标仓库：pantheon-base
层级：platform / system/auth / system/iam / system/org / system/config / system/lowcode
任务模式：review / implement / ui / smoke / docs
先读：
- pantheon-base/AGENTS.md
- pantheon-base/DESIGN.md
- pantheon-base/docs/README.md
- 对应 contract / design / acceptance

实现范围：
- 本次明确要完成的闭环
- 本次明确不做的部分

同步要求：
- 仅修改 pantheon-base
- 如果共享能力会影响 pantheon-ops，只记录“后续需要同步”或“本轮同步”

验证方式：
- Backend: `go test ...` / `go test ./...`
- Frontend: `npm run build`
- Smoke: `node scripts/run-smoke-suite.mjs ...` 或 `none`
- UI 任务补 rendered evidence，或明确说明无法渲染原因
- Runtime evidence: `none` / focused logs / smoke path / metrics sample / trace / explicit runtime gap

停点：
- none
- 或在 schema / contract / 删除文件 / 高风险操作前停下确认

实现与评审：
- 实现者视角：
- 评审视角：architecture / security / UX-QA / mechanical
```

补充约束：

- 如果任务触碰共享分页、共享上传、共享表格、共享 i18n、共享后台壳层，默认视为 base-owned。
- 如果本轮会改变 `pantheon-ops` 的继承行为，最终说明里必须明确是否需要 `base -> ops` 同步。
- 如果任务属于登录、权限、菜单路由、导入导出、生成器、动态模块、异步链路或外部集成，默认补一条 runtime-sensitive 证据计划。
- 如果这是同类错误的再次出现，任务包里要明确：本轮只是修复代码，还是顺带把问题升级成规则、脚本或 smoke。
