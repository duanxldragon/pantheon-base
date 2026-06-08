# Verification Evidence Spec

Chinese version: [VERIFICATION_EVIDENCE_SPEC.md](./VERIFICATION_EVIDENCE_SPEC.md)

Type: Contract
Layer: method
Status: Active

This document defines the format for task verification evidence. The evidence format must be tool-agnostic.

## 1. Evidence Directory

Default directory:

```text
.harness/evidence/<task-id>/
  summary.md
  commands.json
  screenshots/
  smoke-results/
  logs/
  review.md
```

Whether `.harness/evidence/` is committed can be chosen by project policy. CI artifacts may use the same structure.

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

`agent.tool` may be:

- `codex`
- `claude-code`
- `cursor`
- `github-copilot`
- `openhands`
- `aider`
- `human`
- `other`

When a task includes browser verification for UI, routes, permission states, or browser flows, `browserEvidence` should include at least:

```json
{
  "viewport": "desktop",
  "url": "/billing/customers",
  "screenshot": "screenshots/billing-customers-desktop.png",
  "consoleErrors": [],
  "checkedStates": ["loading", "empty", "error", "permission"]
}
```

If the current environment cannot produce screenshots, a single record may use `visualGap` instead of `screenshot`, or the global reason may be added to `knownGaps`.

For runtime-sensitive work, `commands.json` should also prefer recording:

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

Where:

- `runtimeSensitive`: explicitly marks runtime risk
- `runtimeLogs` / `runtimeMetrics` / `runtimeTraces` / `runtimePerformance`: runtime signals
- `runtimeGap`: an explicit explanation when signals cannot be collected in the current environment

## 4.2 Artifact Linkage

`commands.json` should record artifact linkage explicitly:

- `linkage.taskPacket`
- `linkage.evidenceDir`
- `linkage.reviewFile`
- `linkage.changeRef`
- `linkage.planRefs`

For structural, high-risk, or cross-layer changes, `commands.json` should also record `graphChecks` when practical. The goal is to show which affected subgraph was reviewed and what structural conclusions were reached, not to emit a full-repo graph report.

Rules:

- `taskId` must match the `linkage.taskPacket` filename and the `linkage.evidenceDir` directory name
- if `reviewFile` exists, it should live under the matching evidence directory
- if there is no OpenSpec change, `changeRef` must be `none`
- if there is no superpowers plan, `planRefs` may be an empty array

## 4. UI Evidence

When UI, routes, permission states, i18n, or browser interaction are affected, the task must save or reference:

- final URL
- console errors
- screenshot
- smoke result
- viewport information

Local workflows may use gstack browse, Playwright, browser extensions, or manual screenshots, but the evidence landing structure must remain consistent.

## 4.1 Minimum UI Evidence Fields

For UI-affecting tasks, evidence must include:

- viewport label (`desktop`, `mobile`, or equivalent)
- screenshot path or explicit visual gap record
- final URL or route
- console error result
- checked states: `loading`, `empty`, `error`, `permission`, if relevant

## 5. Verification Not Run

If verification was not run, the reason must be recorded:

```md
## Not Run

| Command | Reason | Risk |
|---|---|---|
| `npm run build` | dependencies not installed | frontend build regressions not ruled out |
```

“Not enough time” or “should be fine” are not valid verification exemptions.

For runtime-sensitive work, “tests passed” is also insufficient if there is neither a runtime signal nor an explicit runtime gap.
