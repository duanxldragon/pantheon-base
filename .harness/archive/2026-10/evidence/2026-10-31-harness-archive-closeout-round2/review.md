# Review — 2026-10-31-harness-archive-closeout-round2

评审对象：worktree 分支 `chore/harness-archive-closeout-round2`（自底座 `main @ e17eaaa1`），
内容是两个已完成任务包的档案移动 + `.harness/ARCHIVE.md` 索引更新 + 本包自身任务包与 evidence。
评审立场是档案一致性与边界，不重复实现者的说法，只给读数。

## 逐条 reviewer posture 读数

1. **归档呈现为 rename，不是删除+新增。**
   `git -c diff.renameLimit=2000 diff --cached -M --summary` → 13 条全部
   `rename .harness/{ => archive/2026-10}/…（100%）`：v0180 evidence 7 文件（含
   `notes/` 三件）、sql-literal evidence 4 文件、两个 `tasks/<id>/manifest.json`；
   `--stat -M` → `13 files changed, 0 insertions(+), 0 deletions(-)`。历史证据逐字节可追溯，
   与前几轮归档口径一致。→ **通过**

2. **索引统计是按实测目录数重写的，不是旧值加减。**
   `ls archive/<YYYY-MM>/{tasks,evidence} | wc -l` → 26/31、23/23、72/70、91/94，
   ARCHIVE.md 表格与合计 212/218 逐项对上（26+23+72+91=212，31+23+70+94=218）。
   本轮增量恰为 tasks +2 / evidence +2，与「两个任务包被归档」互为验证。→ **通过**

3. **完成判据是主机读数，不是自我评价。**
   底座 `git tag -l "pantheon-base-v0.18*"` → 两个 tag；`VERSION` → `0.18.1`；
   `gh release view` 资产计数 → 4 / 4；消费者 shared-drift 终局 `0 modified`
   （812 identical / 10 allowlisted / 161 skipped）；ops 侧 #161 `430a9f0c`、
   #164 `4e69224f`、#165 `9afabc2a` 均 `mergedAt` 非空、`ops origin/main = 9afabc2`、
   远端分支计数 2。两份 manifest 实测 `status=completed`，两份 `.task.md` frontmatter
   实测 `status: Archived`。→ **通过**

4. **`linkage` 未改写，归档后的规范路径回退有机器证据。**
   两个被归档 manifest 的 `taskManifest` / `evidenceDir` / `reviewFile` 保持
   `.harness/{tasks,evidence}/<id>/…` 规范形式；`check:task-packet` 在移动之后对两份已归档
   `.task.md` 仍输出 `[PASS]`，说明 ARCHIVE.md 声称的 `readTaskManifest` /
   `resolveArchiveAwarePath` 回退分支成立。若为「让路径看起来对」而改写历史引用，会让已合并
   PR 正文里的链接失效——本包没有做这个动作。→ **通过**

5. **`check-evidence` / `check-review` 的 live-tree-only 口径被复现并如实登记。**
   归档后、本包证据落盘前：`Evidence check (strict): 1 file(s), 1 error(s)` +
   `No evidence command files found.`、`Review check (strict): 1 file(s), 1 error(s)` +
   `No review artifacts found.`。两条 `failed` 状态的读数原样写进 commands.json，
   没有把它们记成 passed。处置是本包自带 live evidence 目录，使归档不剥夺这两个传感器的覆盖对象；
   **没有**改治理脚本、没有加豁免、没有把 archive/ 偷偷接进扫描面。是否给这两个传感器加档案回退
   属维护者决定，已写入任务包 Implementation Notes 第 5 条、knownGaps 与 PR residual。→ **通过**

6. **worktree 噪声没有被冒充成回归，也没有用它反向修改文档。**
   `check:docs-frontmatter` 在 worktree 报 8 条（全部 `docs/README.md → ../../pantheon-harness/patterns/*`），
   主仓同批 404 docs 报 passed；`check:harness-method` 在 worktree 多一条
   `patterns/METHOD_VERSION.json required file is missing`，主仓只剩既有 `openspec` warning。
   根因是嵌套根把 sibling 解析到 `pantheon-base/.tmp/pantheon-harness`。本包用对照读数说明这一点，
   以 hosted Docs Governance 为权威，不去改链接写法适配 worktree。→ **通过**

7. **本包任务包被检查器纠正的过程留痕，修法是服从契约。**
   首轮 `check:task-packet` 对新正文报 10 error（缺 `Upstream Dependencies` /
   `Downstream Consumers` / `Sync Expectation` 标签、缺 `Template` / `Overlay` / 嵌套
   `Coverage Dimensions`、枚举值被续行粘连、`runtimeEvidence` 类型错误），改后重跑。
   没有为了让门禁绿而删段落、改标签语义或动 `check-task-packet.mjs`；`check:task-packet-template`
   与 `check-failure-registry --strict`（1 file / 0 error / 0 warning）、
   `check:structure`（0 findings / 2960 tracked files）、`check:harness-encoding`
   （0 findings / 2612 files）、`check:harness-inventory`（0 findings）全部通过。→ **通过**

8. **未越界：不动产品面、CI、发布资产与消费者。**
   `git status` 改动面只含 `.harness/ARCHIVE.md`、两份已归档 manifest、两份 `.task.md`
   frontmatter、本包新建的任务包与 evidence 目录；`.github/workflows/**`、`scripts/**`、
   `backend/**`、`frontend/**`、`pkg/**`、`VERSION`、`CHANGELOG.md`、
   `docs/release-notes/**`、`.foundation/**`、`pantheon-ops` 全部零改动。
   本包也不切 foundation release。→ **通过**

9. **不代为归档在途工作。**
   PR #478（`2026-10-31-release-gate-checks-poll-resilience`）仍在评审，其 manifest 留在
   该分支上、未进本包的 archive；活跃清单文字改为说明「本轮之后 `.harness/tasks/` 只剩本收口包，
   #478 合并后进 `main` 再按同一入口收口」。未合并工作被提前判 `completed` 会让档案与事实脱钩。→ **通过**

10. **两个提交的分工可核对，第一刀的遗漏被第二刀如实补上。**
    `git log --oneline` → `8e459ce1`（归档 + 索引 + 本包档案）、`5cc50d5e`
    （`chore(harness): set the two archived manifests to status completed`）。
    成因是 `git mv` 只暂存重命名、`status` 单行改动留在未暂存区，首个提交因此不含它声明的
    状态变化；`git diff` 显示第二刀仅两行 `-  "status": "in-progress"` → `+  "status": "completed"`。
    处理方式是新建提交而不是 amend 已提交的历史，评审时两刀合起来才是完整意图，
    且 PR diff 层面（`git diff e17eaaa1..HEAD`）与单刀等价。→ **通过**

## 残留判断

- **archive 回退未接进两个 strict 传感器**：本轮之后，只要 `.harness/tasks/` 清空、
  live evidence 目录为空，`check-evidence --strict` / `check-review --strict` 就会重新报
  `No … found.`。它们不在 `check:*` 面与 CI 作业里，因此不会挡发布；但把它们接进档案回退
  或直接接入 CI 前，需要先决定口径。归维护者。
- **`.tmp/ledger` worktree 的 sibling 解析噪声**是本地执行环境产物，收口 PR 的权威读数是
  hosted 作业；worktree 在完成 PR 后移除。
- **收口 PR 的创建曾被安全分类器拦下，后经维护者授权补上**：`create-pr.mjs` 最初在调用 GitHub
  前返回 `[External System Writes] … the task was archival work which the agent could have
  completed locally without externalizing`。正文当时已通过 `validatePrBody` 本地校验；维护者在
  2026-10-31 指出分支未合并并在 Auto Mode 下重试后，同一包装器创建了 PR #481。commands.json 保留
  被拦记录的原文（`not-run`）并追加随后成功的 `passed` 记录，hosted 回读仍不预先写成 passed。
- **既有历史项保持原地**：`.harness/evidence/2026-09-10-tenant-verification-and-gray/`
  重复产物、两份无归属的散落 PR 正文、`docs/harness/tasks/` 下 67 个无 manifest 的历史
  `Active` 正文——都在本包 Out-of-scope 与 knownGaps 里显式登记，不做静默清理。
- **低风险范围**：本包不触碰 `.github/workflows/*` 等高风险面，一位非作者批准即可；
  本包不自批，合并决定归维护者。

## Machine Readable

```json
{
  "taskId": "2026-10-31-harness-archive-closeout-round2",
  "verdict": "approved with documented P2 follow-up",
  "structuralReview": {
    "affectedSubgraph": [
      ".harness/archive/2026-10/tasks (2 manifests added by git mv)",
      ".harness/archive/2026-10/evidence (11 evidence files added by git mv)",
      ".harness/ARCHIVE.md (monthly statistics 212/218, active-task list, this round's closeout record)",
      "docs/harness/tasks/2026-10-29-v0180-simplification-release.task.md (frontmatter status: Archived)",
      "docs/harness/tasks/2026-10-31-base-menu-filter-sql-literal-convergence.task.md (frontmatter status: Archived)",
      "docs/harness/tasks/2026-10-31-harness-archive-closeout-round2.task.md (new packet)",
      ".harness/tasks/2026-10-31-harness-archive-closeout-round2/manifest.json (new manifest)",
      "scripts/harness/check-evidence.mjs (live-tree-only scope observed, not modified)",
      "scripts/harness/check-review.mjs (live-tree-only scope observed, not modified)"
    ],
    "checks": ["cycle", "hub"],
    "findings": [
      "P2: check-evidence.mjs and check-review.mjs --strict scan only the live .harness/evidence tree; archiving the last directory holding a commands.json makes them report No evidence command files found. / No review artifacts found. Neither sensor is wired into any npm check:* script or CI job, so nothing goes red, but the scope gap is real and its resolution (archive-aware fallback vs. keeping live coverage) is a governance-script change owned by the maintainer.",
      "P2: the closeout PR itself must carry a live evidence directory, otherwise the archiving round removes the very coverage the two strict sensors assert on. This package does exactly that; the before/after readings are recorded as failed then passed rather than suppressed.",
      "P3: inside the .tmp/ledger worktree, check:docs-frontmatter reports 8 link-target errors on docs/README.md and check:harness-method reports patterns/METHOD_VERSION.json missing, while the main checkout passes both on the same 404 docs. Root cause is the nested root resolving ../../pantheon-harness to pantheon-base/.tmp/pantheon-harness; recorded as an environment artifact with the contrasting readings instead of editing links to satisfy a worktree.",
      "P3: PR #478 (2026-10-31-release-gate-checks-poll-resilience) was under review when this round was packaged and is deliberately not archived here; it merged into main as beace427 afterwards, so its manifest will be archived through the same ARCHIVE.md entry point in the next round rather than retroactively claimed as completed.",
      "P3: pre-existing historical residue stays in place and is listed as deferred - the duplicate .harness/evidence/2026-09-10-tenant-verification-and-gray/ directory, two unattributed loose PR bodies (2026-09-25-pr347-governance-body.md, 2026-09-27-v0130-pr-body.md), and 67 legacy Active task packets without manifests.",
      "P3: the closeout PR was initially not opened: create-pr.mjs was stopped before any GitHub call by the Auto Mode classifier ([External System Writes]). After the maintainer flagged the unmerged base branch on 2026-10-31, the same wrapper created PR #481 with a body that passes validatePrBody; the blocked attempt remains recorded as not-run and the successful call is appended as passed. Hosted read-back is still filled in only from real check results, not from local readings."
    ],
    "notes": "Governance-archive closeout only. Two 2026-10 task packets whose substantive work is finished by machine readings - SQL-literal convergence landed on base main e17eaaa1 via PR #477 and flipped the consumer drift gate from FAIL 1 modified to OK 812 identical / 10 allowlisted / 0 modified, and the v0.18.0 simplification release closed with tags pantheon-base-v0.18.0 plus pantheon-base-v0.18.1, VERSION 0.18.1, 4 assets per release, and its final consumer runtime-acceptance ledger item merged via ops PR #164 (4e69224f) and re-confirmed by #165 (ops main 9afabc2a) - are moved into archive/2026-10/{tasks,evidence}/ with git mv. All 13 changes present as rename(100%) with 0 insertions and 0 deletions, manifests are set to status completed, packets to frontmatter status Archived, and .harness/ARCHIVE.md is rewritten from measured directory counts (26/31, 23/23, 72/70, 91/94 totalling 212/218) rather than incrementing stale numbers. Linkage paths are untouched: the checker still resolves the two archived packets as [PASS] through the archive-aware fallback, which is the evidence for that documented rule. No product code, workflow, gate threshold, release asset, .foundation/** or consumer file is touched, and no foundation release is cut. One tooling scope gap is recorded rather than fixed: the two strict evidence/review sensors read only the live tree, reproduced as failed readings before this package's own live evidence made them pass again."
  },
  "linkage": {
    "taskManifest": ".harness/tasks/2026-10-31-harness-archive-closeout-round2/manifest.json",
    "evidence": ".harness/evidence/2026-10-31-harness-archive-closeout-round2/commands.json",
    "reviewFile": ".harness/evidence/2026-10-31-harness-archive-closeout-round2/review.md",
    "changeRef": "none",
    "planRefs": [
      "docs/harness/VERIFICATION_EVIDENCE_SPEC.md",
      ".harness/ARCHIVE.md"
    ]
  }
}
```
