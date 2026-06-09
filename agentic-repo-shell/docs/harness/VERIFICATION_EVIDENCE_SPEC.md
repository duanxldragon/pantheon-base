# Verification Evidence Spec

English version: [VERIFICATION_EVIDENCE_SPEC.en.md](./VERIFICATION_EVIDENCE_SPEC.en.md)

类型：Contract
归属层：method
状态：Active

本文定义任务验证证据的格式。证据格式必须工具无关。

## 1. 证据目录

默认目录：

```text
.harness/evidence/<task-id>/
  summary.md
  commands.json
  screenshots/
  smoke-results/
  logs/
  review.md
```

`.harness/evidence/` 可按项目策略选择是否提交。CI artifacts 可以使用相同结构。

## 2. `summary.md`

```md
# Verification Summary: <task-id>

## Scope

- Primary layer:
- Changed files:

## Commands

| Command | CWD | Result | Notes |
|---|---|---|---|
| `npm test --workspace services/billing` | `services/billing` | passed |  |

## Graph Checks

- Used CodeGraph: yes | no
- Affected subgraph:
- Structural checks: `cycle` / `hub` / `call-depth` / `sensitive-flow`
- Findings: none | `<finding>`

## Browser Evidence

- none

## Known Gaps

- none

## Completion Status

complete | blocked | partial
```

## 3. `commands.json`

```json
{
  "taskId": "YYYY-MM-DD-task-name",
  "repo": "example-repository",
  "agent": {
    "tool": "codex",
    "adapter": ".agents/adapters/codex.md"
  },
  "commands": [
    {
      "command": "npm test --workspace services/billing",
      "cwd": ".",
      "status": "passed",
      "durationMs": 0,
      "notes": ""
    }
  ],
  "graphChecks": {
    "usedCodeGraph": true,
    "affectedSubgraph": [
      "route -> handler -> service -> repo"
    ],
    "checks": ["cycle", "hub", "call-depth", "sensitive-flow"],
    "findings": [],
    "notes": ""
  },
  "browserEvidence": [],
  "runtimeSensitive": true,
  "runtimeLogs": ["logs/auth-smoke.log"],
  "runtimeMetrics": ["p95=120ms"],
  "runtimeGap": "",
  "linkage": {
    "taskPacket": "docs/harness/tasks/YYYY-MM-DD-task-name.task.md",
    "evidenceDir": ".harness/evidence/YYYY-MM-DD-task-name/",
    "reviewFile": ".harness/evidence/YYYY-MM-DD-task-name/review.md",
    "changeRef": "openspec/changes/<name>/",
    "planRefs": ["docs/superpowers/plans/<file>.md"]
  },
  "knownGaps": [],
  "completedAt": "YYYY-MM-DDTHH:mm:ssZ"
}
```

`agent.tool` 可取值：

- `codex`
- `claude-code`
- `cursor`
- `github-copilot`
- `openhands`
- `aider`
- `human`
- `other`

当任务包含 UI、路由、权限态或浏览器验证时，`browserEvidence` 条目至少应包含：

```json
{
  "viewport": "desktop",
  "url": "/billing/customers",
  "screenshot": "screenshots/billing-customers-desktop.png",
  "consoleErrors": [],
  "checkedStates": ["loading", "empty", "error", "permission"]
}
```

如当前环境无法产出截图，可在单条记录中使用 `visualGap` 替代 `screenshot`，或在 `knownGaps` 中补充全局原因。

当任务属于 runtime-sensitive 时，`commands.json` 推荐额外记录：

```json
{
  "runtimeSensitive": true,
  "runtimeLogs": ["logs/auth-smoke.log"],
  "runtimeMetrics": ["p95=120ms"],
  "runtimeTraces": ["trace/auth-login-01"],
  "runtimePerformance": ["login p95 < 150ms"],
  "runtimeGap": "staging trace export unavailable"
}
```

其中：

- `runtimeSensitive`：是否显式声明本任务带有运行态风险
- `runtimeLogs` / `runtimeMetrics` / `runtimeTraces` / `runtimePerformance`：运行态信号
- `runtimeGap`：当前环境拿不到信号时的显式说明

## 4.2 Artifact Linkage

`commands.json` 应显式记录 artifact linkage：

- `linkage.taskPacket`
- `linkage.evidenceDir`
- `linkage.reviewFile`
- `linkage.changeRef`
- `linkage.planRefs`

如任务属于结构性、高风险或跨层改动，建议同时记录 `graphChecks`，用于保存本轮受影响子图和结构性检查结论。`graphChecks` 的目标是解释“审查了哪条链路、发现了什么”，不是输出全仓架构指标报表。

规则：

- `taskId` 必须与 `linkage.taskPacket` 文件名和 `linkage.evidenceDir` 目录名一致
- `reviewFile` 如存在应放在对应 evidence 目录下
- `changeRef` 如无 OpenSpec change，写 `none`
- `planRefs` 如无 superpowers plan，可为空数组

## 4. UI 证据

影响 UI、路由、权限态、i18n、浏览器交互时，必须保存或引用：

- 最终 URL
- console errors
- screenshot
- smoke result
- viewport 信息

本地可使用 gstack browse、Playwright、浏览器插件或人工截图，但证据落点必须一致。

## 4.1 Minimum UI Evidence Fields

For UI-affecting tasks, evidence must include:

- viewport label (`desktop`, `mobile`, or equivalent)
- screenshot path or explicit visual gap record
- final URL or route
- console error result
- checked states: `loading`, `empty`, `error`, `permission`, if relevant

## 5. 未运行验证

未运行验证时，必须记录原因：

```md
## Not Run

| Command | Reason | Risk |
|---|---|---|
| `npm run build` | dependencies not installed | frontend build regressions not ruled out |
```

不能用“时间不够”“应该没问题”作为验证豁免。

对于 runtime-sensitive 任务，也不能只写“测试通过”，却既没有 runtime signal，也没有 runtime gap。
