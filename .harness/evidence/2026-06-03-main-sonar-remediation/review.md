# Review: 2026-06-03-main-sonar-remediation

## Machine Readable

```json
{
  "taskId": "2026-06-03-main-sonar-remediation",
  "verdict": "changes requested",
  "structuralReview": {
    "affectedSubgraph": [
      "quality workflow -> remediation runner -> batch task evidence"
    ],
    "checks": [
      "call-depth",
      "cycle",
      "hub"
    ],
    "findings": [],
    "notes": "scaffolded from task packet Structural Scope; replace after graph review"
  },
  "linkage": {
    "taskPacket": "docs/harness/tasks/2026-06-03-main-sonar-remediation.task.md",
    "evidence": ".harness/evidence/2026-06-03-main-sonar-remediation/commands.json",
    "reviewFile": ".harness/evidence/2026-06-03-main-sonar-remediation/review.md",
    "changeRef": "none",
    "planRefs": [
      "docs/superpowers/plans/2026-06-03-main-sonar-remediation-method.md"
    ]
  }
}
```

## Findings

1. `scripts/run-sonar-remediation.mjs`
   原始 `backend-tests` phase 在这台 Windows 机器上并不稳定：`go test -race ./...` 先暴露出 `cgo` / Cygwin toolchain 不匹配，随后又出现用户目录 `go-build` cache 的 `Access is denied`。现在 runner 会在 Windows 本地显式降级到 `go test ./...`，并把这一点写进 evidence，同时把 Go cache 固定到 `.harness/cache/go-build`，避免方法链路被工作站环境噪声反复打断。

2. `docs/remediations/MAIN_SONAR_REMEDIATION_RUNBOOK_20260603.md`
   runbook 和 task packet 现在明确区分了三层信号：本地 baseline、local Sonar、merged-main Sonar。对 Windows 本地 `backend-tests` 的可移植降级也有了显式约束，不再把“本机无法跑 race”误判成代码回归。

3. Merged-main Sonar
   `sonar.yml` 已在 `2026-06-03 14:02:19 +08:00` 触发，GitHub Actions run `26866784416` 在 `2026-06-03 14:04:17 +08:00` 成功结束，SonarCloud 也生成了 `main` 分支的新 analysis（`2026-06-03 14:02:48 +08:00`，revision `2f70c2da40fe4c0a59d3c0c77522d27d3727f6f4`）。这说明链路本身已闭环到远端扫描层。

4. Current Sonar state
   新鲜的远端 Sonar 结论不是“链路失败”，而是“链路成功暴露质量债”：`alert_status=ERROR`、`coverage=3.5`、`duplicated_lines_density=16.3`、`open_issues=749`、`security_hotspots=0`。下一步应该进入有范围的 finding reduction 批次，而不是继续修 runner。

## Assumptions

- 当前 review 聚焦方法链路与证据状态，不宣称任何 Sonar finding 已完成代码整改
- `quality.yml` 仍是 backend `-race` 的权威 gate；本地 Windows fallback 只是让方法链路可执行并可记录

## Status

- Linkage: complete
- Local baseline execution: complete
- Local Sonar execution: blocked by missing workstation prerequisites
- Merged-main Sonar execution: complete
- Merged-main Sonar quality result: failing (`ERROR`)

## Recommended Next Step

- 以这次 fresh metrics 为基线，把 Sonar finding 再拆成真实整改批次，优先盯 `coverage` 与 `duplicated_lines_density`
- 若需要本地 Sonar 复现实验，再到具备 `pantheon-sonarcloud.env` 和 `Sonar-Scanner` 的环境里执行 `npm run run:sonar-remediation -- --task 2026-06-03-main-sonar-remediation --phase local-sonar --env-file pantheon-sonarcloud.env --execute`
