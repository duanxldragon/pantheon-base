---
title: Verification Evidence Spec
doc_type: Contract
layer: platform
status: Active
updated_at: 2026-06-24
---

# Verification Evidence Spec

English version: [VERIFICATION_EVIDENCE_SPEC.en.md](./VERIFICATION_EVIDENCE_SPEC.en.md)

本文定义 Pantheon 任务验证证据的格式。证据格式必须工具无关。

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
| `go test ./...` | `pantheon-base` | passed |  |

## Graph Checks

- Used CodeGraph: yes | no
- Affected subgraph:
- Structural checks: `cycle` / `hub` / `call-depth` / `sensitive-flow`
- Findings: none | `<finding>`

## Session Economics

- Response mode: `terse | standard | detailed | none`
- Cost sensitivity: `low | medium | high | none`
- Tokens / cost / retries / delegations: `none | concise summary`
- Notes: `none | provenance or caveat`

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
  "repo": "pantheon-platform",
  "agent": {
    "tool": "codex",
    "adapter": ".agents/adapters/codex.md"
  },
  "commands": [
    {
      "command": "go test ./backend/...",
      "cwd": "pantheon-base",
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
  "sessionEconomics": {
    "responseMode": "terse",
    "costSensitivity": "medium",
    "inputTokens": 12000,
    "outputTokens": 3400,
    "cacheReadTokens": 9000,
    "cacheWriteTokens": 800,
    "estimatedCostUsd": 1.42,
    "retryCount": 1,
    "delegationCount": 0,
    "notes": "derived from tool-native session log"
  },
  "browserEvidence": [],
  "runtimeSensitive": true,
  "runtimeLogs": ["logs/auth-smoke.log"],
  "runtimeMetrics": ["p95=120ms"],
  "runtimeGap": "",
  "linkage": {
    "taskManifest": ".harness/tasks/YYYY-MM-DD-task-name/manifest.json",
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

当任务包含 UI/路由/权限态浏览器验证时，`browserEvidence` 条目至少应包含：

```json
{
  "viewport": "desktop",
  "url": "/system/user",
  "screenshot": "screenshots/user-desktop.png",
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

对于长会话、存在 delegation，或对成本敏感的任务，`commands.json` 还推荐补充：

```json
{
  "sessionEconomics": {
    "responseMode": "terse",
    "costSensitivity": "high",
    "inputTokens": 12000,
    "outputTokens": 3400,
    "cacheReadTokens": 9000,
    "cacheWriteTokens": 800,
    "estimatedCostUsd": 1.42,
    "retryCount": 1,
    "delegationCount": 2,
    "notes": "derived from tool-native session log"
  }
}
```

其中：

- `responseMode`：本轮默认叙述预算
- `costSensitivity`：是否显式把 token / cost 视为吞吐约束
- `inputTokens` / `outputTokens` / `cacheReadTokens` / `cacheWriteTokens` / `estimatedCostUsd`：可拿到就记录的会话经济性信号
- `retryCount` / `delegationCount`：用于暴露重试和分派是否在吞噬成本
- `notes`：注明数据来源、估算方式或缺口

## 4.2 Artifact Linkage

`commands.json` 应显式记录 artifact linkage：

- `linkage.taskManifest`
- `linkage.evidenceDir`
- `linkage.reviewFile`
- `linkage.changeRef`
- `linkage.planRefs`

如任务属于结构性、高风险或跨层改动，建议同时记录 `graphChecks`，用于保存本轮受影响子图和结构性检查结论。`graphChecks` 的目标是解释“审查了哪条链路、发现了什么”，不是输出全仓架构指标报表。

规则：

- `taskId` 必须与 `linkage.taskManifest` 路径中的 task id 和 `linkage.evidenceDir` 目录名一致
- `reviewFile` 如存在应放在对应 evidence 目录下
- `changeRef` 如无 OpenSpec change，写 `none`
- `planRefs` 如无 superpowers plan，可为空数组

如果仓库同时保留人类可读 task packet，保持它与 `taskManifest` 使用同一个 task id；证据校验闭环以 `taskManifest` 为 machine-readable 主键。

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

对于长会话、存在 delegation，或成本敏感任务，也不应只写“做完了”，却既没有 `sessionEconomics`，也没有显式说明当前工具拿不到这些信号。

本轮只同步文档，不改 `pantheon-base` 的 evidence checker。因此 `sessionEconomics` 目前是方法推荐项，而不是本仓库的机械必填项；需要强制时，再同步 `scripts/harness/check-evidence.mjs`。
