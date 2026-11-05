# Review — 2026-10-31-v0182-consumer-closeout

评审对象：worktree 分支 `chore/v0182-consumer-closeout`（自底座 `main @ 94a492ef`），内容为三个已完成
任务包的档案移动、`.harness/ARCHIVE.md` 与 `.harness/STATUS.md` 更新，以及本包自身的任务包与 evidence。
评审立场是收口判据与档案一致性，不重复实现者的说法，只给读数。

## 逐条 reviewer posture 读数

1. **消费项的勾选依据是主机读数，不是自评。**
   `gh pr view 166` → `mergedAt 2026-10-31T01:59:39Z`、`mergeCommit 5676ffc`；`gh pr view 167` →
   `mergedAt 2026-10-31T04:27:54Z`、squash 为 `81d2941`。`gh pr checks 167` → SonarCloud Code
   Analysis、Go Lint、Backend Tests、Smoke Sanity、CodeQL、Docs Governance 全 pass。
   任务包里勾选的那一项写的正是这两个 PR，而不是转述。→ **通过**

2. **归档呈现为 rename，不是删除+新增。**
   `git -c diff.renameLimit=3000 diff --cached -M --summary` → 19 条归档变更全部 93–100% 的重命名，
   `--stat` 的改动集中在新增的 task.md 与本包 manifest；被归档的历史证据逐字节可追溯。→ **通过**

3. **索引统计是按实测目录数重写的，不是旧值加减。**
   `git ls-tree -d origin/main .harness/archive/2026-10/{tasks,evidence}` → 91 / 94；
   移动后 `ls | wc -l` → 94 / 97；合计 26+23+72+94 = 215、31+23+70+97 = 221，与 ARCHIVE.md
   更新后的表格逐项对上；本轮增量恰为 tasks +3 / evidence +3。→ **通过**

4. **三个包的完成状态与清单一致。**
   三份 manifest 实测 `status=completed`，三份 `.task.md` 实测 `status: Archived`；
   三份包在归档前的 Completion Checklist 已全部勾选，本轮没有重写已完成的事实。
   `release-gate` 包的 FR-025 与 `tests/scripts/release-gate-workflow.test.mjs` 已在 main 上，
   `round2` 包的自身 PR #481 已合并。→ **通过**

5. **规范路径回退在归档后仍成立。**
   `check:task-packet` 在移动之后对四份任务包正文全部 `[PASS]`，其中三份的 manifest/evidence
   已不在 `.harness/` live 树；`linkage` 字段一字未改，已合并 PR 正文里的链接继续有效。→ **通过**

6. **`--strict` 传感器的 live-tree-only 口径被复现并如实登记。**
   归档后、本包证据落盘前：`check-evidence --strict` → `1 error / No evidence command files found.`，
   `check-review --strict` → `1 error / No review artifacts found.`。两条 failed 原样写进
   commands.json；处置是本包自带 live evidence，**没有**改脚本、没有加豁免、没有把 `archive/`
   偷偷接进扫描面。→ **通过**

7. **worktree 噪声没有被冒充成回归。**
   `check-adoption` 在 worktree 报 `../pantheon-harness/patterns/tool-adapter-matrix.md` missing，
   根因是嵌套根把 sibling 解析到 `pantheon-base/.tmp/pantheon-harness`；主仓同命令只报既有的
   `openspec` warning，以 hosted Docs Governance 为权威，未改链接写法去适配 worktree。→ **通过**

## 结论

verdict：**approved with documented P2 follow-up**。收口依据全部是合并提交与 PR 检查读数；
唯一未闭合的工程项是 `check-evidence` / `check-review` 的档案回退，属治理脚本变更，留给维护者。

## Machine Readable

```json
{
  "taskId": "2026-10-31-v0182-consumer-closeout",
  "verdict": "approved with documented P2 follow-up",
  "structuralReview": {
    "affectedSubgraph": [
      ".harness/archive/2026-10/tasks (3 manifests added by git mv)",
      ".harness/archive/2026-10/evidence (16 evidence files added by git mv)",
      ".harness/ARCHIVE.md (monthly statistics 215/221, active-task list, this round's closeout record)",
      "docs/harness/tasks/2026-10-31-v0182-menu-contract-shared-surface.task.md (consumer checkbox ticked, status: Archived)",
      "docs/harness/tasks/2026-10-31-harness-archive-closeout-round2.task.md (status: Archived)",
      "docs/harness/tasks/2026-10-31-release-gate-checks-poll-resilience.task.md (status: Archived)",
      ".harness/STATUS.md (v0.18.2 consumer status)",
      ".harness/tasks/2026-10-31-v0182-consumer-closeout/manifest.json (new manifest)",
      "scripts/harness/check-evidence.mjs (live-tree-only scope observed, not modified)",
      "scripts/harness/check-review.mjs (live-tree-only scope observed, not modified)"
    ],
    "checks": ["cycle", "hub"],
    "findings": [
      "P2: check-evidence.mjs and check-review.mjs --strict scan only the live .harness/evidence tree; archiving the last live commands.json made them report No evidence command files found. / No review artifacts found. Neither sensor is wired into any npm check:* script or CI job, so nothing goes red, but the scope gap is real and its resolution (archive-aware fallback vs. keeping live coverage) is a governance-script change owned by the maintainer.",
      "P2: this closeout package carries its own live evidence so the archiving round does not remove the very coverage those two strict sensors assert on; the before/after readings are recorded as failed then passed rather than suppressed.",
      "P3: inside the .tmp/closeout-0182 worktree, check-adoption reports ../pantheon-harness/patterns/tool-adapter-matrix.md missing because the nested root resolves the sibling to pantheon-base/.tmp/pantheon-harness; the main checkout reports only the existing openspec warning on the same tree, so the worktree reading is recorded as an environment artifact.",
      "P3: pantheon-ops still holds two merged remote branches (chore/consume-base-v0.18.2, fix/sonar-k8s-new-code); git push --delete was stopped by the Auto Mode Git Destructive classifier, which needs the maintainer to name the targets. Branch Hygiene was dispatched on main and performs the same deletion through scripts/cleanup-github-branches.mjs.",
      "P3: pre-existing historical residue stays in place and is listed as deferred - the duplicate .harness/evidence/2026-09-10-tenant-verification-and-gray/ directory, two unattributed loose PR bodies (2026-09-25-pr347-governance-body.md, 2026-09-27-v0130-pr-body.md), and 67 legacy Active task packets without manifests."
    ],
    "notes": "Governance-archive closeout only. Three task packets whose substantive work is finished by machine readings are moved into archive/2026-10/{tasks,evidence}/ with git mv: the v0.18.2 release packet's last open item - the consumer rebuild - is closed by pantheon-ops PR #166 (5676ffc: lock to v0.18.2, 789 files rebuilt, overlay 53, business-overlay 13/13, drift 813 identical / 10 allowlisted / 161 skipped, backend 64 packages, frontend lint/type-check/build 0) and PR #167 (81d2941: SonarCloud Code Analysis, Go Lint, Backend Tests, Smoke Sanity, CodeQL and Docs Governance green); the round-2 archive packet was closed by its own PR #481 (94a492ef); the release-gate poll-resilience packet landed with #478 and FR-025. All 19 archived changes present as renames (93-100%) with no content rewrite, manifests are set to status completed, packets to frontmatter status Archived, and .harness/ARCHIVE.md is rewritten from measured directory counts (91/94 to 94/97, totals 212/218 to 215/221). Linkage paths are untouched: check:task-packet still resolves all four packets as PASS through the archive-aware fallback. No product code, workflow, gate threshold, release asset, .foundation/** or consumer file is touched, and no foundation release is cut."
  },
  "linkage": {
    "taskManifest": ".harness/tasks/2026-10-31-v0182-consumer-closeout/manifest.json",
    "evidence": ".harness/evidence/2026-10-31-v0182-consumer-closeout/commands.json",
    "reviewFile": ".harness/evidence/2026-10-31-v0182-consumer-closeout/review.md",
    "changeRef": "none",
    "planRefs": [
      "docs/harness/VERIFICATION_EVIDENCE_SPEC.md",
      ".harness/ARCHIVE.md"
    ]
  }
}
```
