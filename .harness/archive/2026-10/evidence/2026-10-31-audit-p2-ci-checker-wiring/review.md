# Review — 2026-10-31-audit-p2-ci-checker-wiring

## Reviewer posture

| 检查项 | 结论 | 依据 |
| --- | --- | --- |
| `checker-triage.md` 覆盖全部 11 个，没有“待定” | 通过 | 11 行各有归宿：9 接线 / 1 workspace-only / 1 mirror-only / 0 删除；理由列写的是体检读数，不是印象 |
| 每个新接线 checker 都有负向验证 | 通过 | 三条负向全在 `commands.json`：任务包状态与证据不一致（exit 1）、review 缺机读块（exit 1）、证据 JSON 损坏（exit 1）；恢复后均转绿 |
| 没有把全部 checker 塞进 `prebuild` | 通过 | 9 条进 `quality.yml`，`frontend/package.json` 的 `prebuild` 一行未动 |
| `go test -race` 只在一条 workflow 执行 | 通过 | `ci.yml` 的 coverage 步骤去掉 `-race`（保留 `-short` 与产物），`quality.yml` 保留全量 `go test -race ./...` |
| coverage 上传未受影响 | 通过 | `Upload Go coverage artifact` 仍读 `backend/coverage.out`，该文件仍由同一步骤产出 |
| checker 清单与实际一致 | 通过 | `scripts/harness/README.md` 新增接线表；`check-doc-inventory --strict` 0 finding，说明没有未登记的脚本 |
| 断言逻辑未被修改 | 通过 | 只改了 `check-task-packet.mjs`（接入 W4 判据，属 W4 显式延后给 W8 的门禁接线）与 `scripts/frontmatter-check.mjs`（属 W5）；其余 checker 零改动 |
| 未删除任何 checker | 通过 | 删除数 0，因此不触发“减少门禁需 failure-registry 登记”的人工门 |
| 失败的检查被修而不是被放过 | 通过 | `check-review` 与 `check-runtime-evidence` 原本是红的：前者补 3 份 review 的机读块，后者补 `runtimeGap`；两者都是让事实可机读，不是降低断言 |
| workflow 单测仍通过 | 通过 | `node --test tests/scripts/quality-workflow.test.mjs`：5 tests / 5 pass |

## 偏离与处置

1. **`check-task-packet.mjs` 的断言被扩充**：任务包 `Out` 写“不修改 checker 的断言逻辑”。例外理由是
   W4 的 `residualFindings` 明确把“门禁接线”交给本包，用户请求也点名“把 task-evidence-state 判据接进
   任务包检查”。实现方式是不改既有断言、只追加生命周期比对，用的判据函数就是 W4 交付的那份，
   因此不存在两套“完成”定义。

2. **改动了三份历史 review.md 与一份历史 commands.json**：它们不是本轮产物，但新接线的 strict 门禁
   需要它们机读合规。改动是**补字段**（`## Machine Readable` 块、`runtimeGap` 说明），没有改任何结论或读数。

3. **`check-doc-frontmatter` 选择不接线**：看似“少接一个”，但双跑同一规则是 W5 刚修掉的 spec-duplication；
   已在 README 与 triage 表写明 mirror-only，并指向唯一实现。

4. **`FR-026` 是新增登记而非修改既有条目**：既有 `FR-016/FR-017` 不在本仓 registry 内（grep 无命中），
   所以按同一失败模式新开一条，Occurrences 记 2。

## Gap

- 远端 workflow 的真实运行与 required checks 生效需在 PR 上复核。
- `.github/workflows/*` 的两位非作者批准（其一为 CI/发布负责）尚未取得。
- `check-graph-review` 在 `structuralScope` 出现前不产生判据。

## Machine Readable

```json
{
  "taskId": "2026-10-31-audit-p2-ci-checker-wiring",
  "verdict": "approved",
  "structuralReview": {
    "affectedSubgraph": [
      ".github/workflows/ci.yml",
      ".github/workflows/quality.yml",
      "package.json",
      "scripts/harness/check-task-packet.mjs",
      "scripts/harness/README.md",
      "docs/harness/failure-registry.md",
      "docs/harness/tasks/2026-10-31-audit-p2-ci-checker-wiring.task.md",
      ".harness/tasks/2026-10-31-audit-p2-ci-checker-wiring/manifest.json",
      ".harness/evidence/2026-10-31-audit-p2-ci-checker-wiring/"
    ],
    "checks": [
      "cycle",
      "hub",
      "sensitive-flow"
    ],
    "findings": [
      "P2 approval gate: .github/workflows/* still needs two non-author approvals, one from the CI/release owner; this packet only lands the change.",
      "P3 remote run: the nine new Docs Governance steps were verified locally (positive and negative) and not yet observed on a hosted run."
    ],
    "notes": "CI and checker wiring only: nine previously unreachable checkers are wired into Docs Governance, the inheritance checker stays workspace-only, the portable frontmatter mirror stays unwired by decision, the duplicate -race run is removed from the coverage step while keeping the coverage artifact, and check-task-packet now enforces status-versus-evidence consistency using the predicate W4 delivered."
  },
  "linkage": {
    "taskManifest": ".harness/tasks/2026-10-31-audit-p2-ci-checker-wiring/manifest.json",
    "evidence": ".harness/evidence/2026-10-31-audit-p2-ci-checker-wiring/commands.json",
    "reviewFile": ".harness/evidence/2026-10-31-audit-p2-ci-checker-wiring/review.md",
    "changeRef": "none",
    "planRefs": [
      "docs/reviews/PANTHEON_BASE_GLOBAL_AUDIT_2026-10-31.md",
      "docs/harness/AI_QUALITY_GOVERNANCE.md"
    ]
  }
}
```
