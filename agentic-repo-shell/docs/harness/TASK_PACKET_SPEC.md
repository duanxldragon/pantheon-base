# Task Packet Spec

English version: [TASK_PACKET_SPEC.en.md](./TASK_PACKET_SPEC.en.md)

类型：Contract
归属层：method
状态：Active

Task packet 是非 trivial 任务的工具无关输入格式。它让 Codex、Claude Code、Cursor、Copilot、OpenHands、Aider 和人工工程师共享同一份任务边界。

## 1. 存放位置

任务包默认存放在：

```text
docs/harness/tasks/YYYY-MM-DD-<task-name>.task.md
```

如果任务来自已有 superpowers plan，可以在 task packet 中引用该 plan，而不是重复全文。

## 2. 必填模板

```md
# Task Packet: <task-name>

## Goal

<one sentence>

## Primary Layer

app | domain/<name> | service/<name> | package/<name> | infra | docs | method | repository-defined layer

## Dependency Layers

- none

## Harness Profile

- Template: admin-platform | api-service | backend-service | event-processor | cli-tool | library | data-pipeline | infra-change | mobile-app | dashboard | ui-heavy-product | docs-governance | custom
- Overlay: none
- Coverage Dimensions:
  - behaviour
  - maintainability
  - architecture-fitness
  - runtime-quality
  - method-health

## Contract Anchors

- `path/to/contract.md`
- `path/to/design.md`
- `path/to/acceptance.md`

## Scope

### In

- <explicit work>

### Out

- <explicit non-goals>

## Structural Scope

- Affected Subgraph: `<entry -> core path -> exit/side effect>` | `none`
- Boundary Crossings: `none | ui -> api | service -> datastore | package -> external-service | plugin -> host | downstream -> upstream`
- Risk Nodes: `none | auth handler | payment service | permission service | job scheduler | generator orchestrator | deployment workflow`
- Graph Focus: `none | cycle-check | hub-check | call-depth | sensitive-input-flow`

## Expected Files

### Create

- `path`

### Modify

- `path`

### Do Not Touch

- `path`

## Implementation Notes

- <boundary or sequencing notes>

## Execution Roles

- Implementer Posture: `<implementer role or none>`
- Reviewer Posture: `<reviewer role or none>`

## Stop Points

- `none`
- 或在 schema / contract / delete / release gate 前停下

## State Plan

- Checkpoint Expectation: `none | path | artifact name`
- Resume Artifacts: `none | path`

## Verification Plan

### Backend

- `command`

### Frontend

- `command`

### Browser / Smoke

- `command or none`

## Linkage

- Task ID: `YYYY-MM-DD-task-name`
- OpenSpec Change: `openspec/changes/<name>/` | none
- Superpowers Plan: `docs/superpowers/plans/<file>.md` | none
- Evidence Directory: `.harness/evidence/<task-id>/`
- Review File: `.harness/evidence/<task-id>/review.md` | none

## Evidence Required

- command result summary
- screenshots if UI changed
- smoke JSON if browser flow changed
- runtime logs / metrics / traces / performance signal, or explicit runtime gap if the task is runtime-sensitive
- review summary

## Human Gates

- <gate or none>

## Completion Checklist

- [ ] Layer and boundary declared
- [ ] Contract anchors read
- [ ] Tests or checks updated
- [ ] Verification run or exception recorded
- [ ] Evidence saved or summarized
- [ ] Docs updated if contracts changed
- [ ] Review completed
```

`Execution Roles`、`Stop Points`、`State Plan` 是可选 section，但一旦仓库合同要求或任务显式声明这些 section，内容就必须完整、可解释、可校验。

`Structural Scope` 对 trivial 任务可写 `none`；对 `non-trivial`、跨层、runtime-sensitive、权限/菜单/i18n/审计/生成器/动态模块相关任务，默认应补最小受影响子图说明。它的目的不是要求维护全仓架构图，而是让实现者和 reviewer 审查同一个结构范围。

## 3. Trivial 任务

以下任务可以不创建 task packet：

- typo 修复
- 不影响行为的文档补充
- 只读诊断
- 单文件小范围格式修复

但如果 trivial 任务触碰权限、菜单、schema、i18n、审计、安全边界、发布流程或上游/下游合同关系，必须升级为 task packet。

## 4. Human Gate 规则

任务包必须显式列出 human gates。没有 gate 时写 `none`。

必须列为 gate 的事项：

- schema 或迁移变更
- 删除文件或目录
- 核心合同、公共 API 或上游合同变更
- 下游仓库、插件或扩展 override 上游共享行为
- 新依赖或新外部服务
- 影响权限、菜单、审计、i18n 的模型变更

## 5. 工具使用

工具 adapter 可以把 task packet 转换成自己的执行格式，但不得丢失：

- layer
- harness template and coverage dimensions
- scope
- execution roles when declared
- stop points when declared
- state/checkpoint expectations when declared
- contract anchors
- verification plan
- evidence required
- human gates

## 6. Machine-Readable Linkage

以下字段是 task packet 与后续 artifact 的最小闭环键：

- `Task ID`：主键，必须与文件名 `<task-id>.task.md` 一致
- `Evidence Directory`：必须指向 `.harness/evidence/<task-id>/`
- `Review File`：如保留 review artifact，必须指向 evidence 目录下文件
- `OpenSpec Change`：如任务来自 OpenSpec，必须显式记录 change 路径；否则写 `none`
- `Superpowers Plan`：如任务来自 `docs/superpowers/plans/*`，必须显式记录；否则写 `none`

这组 linkage 字段用于把 `OpenSpec change / superpowers plan / task packet / evidence / review` 串成可追踪链路。
