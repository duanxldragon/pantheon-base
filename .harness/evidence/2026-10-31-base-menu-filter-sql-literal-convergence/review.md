# Review — 2026-10-31-base-menu-filter-sql-literal-convergence

评审对象：底座分支 `fix/base-menu-filter-sql-literal-convergence`（自 `main @ 2bc77797`），
业务面一个提交 `c335e5b9`，随后是本包文档与 evidence。

## 逐条 reviewer posture 读数

1. **diff 面只有那一个文件。**
   `git show --stat c335e5b9` → `backend/modules/business/retired_modules.go | 24 +++++++++++++-------`，
   `1 file changed, 17 insertions(+), 7 deletions(-)`。六个 hunk 与
   `diff <(git show origin/main:…) <(ops 副本)` 一一对应；`grep -rn applyMenuFieldFilter backend/`
   只命中本文件的 3 个调用点与定义处，没有其它包引用，改私有签名不外溢。无新增 import。
   → **通过**

2. **SQL 文本逐条等价。**
   三个字段展开后仍是 `module IN ?` / `path IN ?` / `component IN ?`，绑定方式仍是
   `?` 参数化；改动只是将「列名 + 固定尾巴」的拼装换成整句字面量。
   等价性不是推断：ops 检查器对同一文件在收敛前报 2 条违规、收敛后报 0 条，
   正是这条判定的机器读数（commands[4]、commands[5]）。→ **通过**

3. **成对探针读数已入 evidence，临时目录已清理。**
   `commands.json` 第 5 条为收敛前（`:172 Or()`、`:174 Where()`，2 violations，status `failed`
   如实记录），第 6 条为收敛后（0 violations）；第 13 条记录 `rm -rf .tmp/sqlprobe-*`
   后 `git status --short` 只剩本包文件与既有未提交 i18n 改动。→ **通过**

4. **消费者 shared-drift 由 FAIL 转 OK，且白名单未被增删。**
   收敛前：`FAIL shared drift check: 1 modified … DRIFT_MODIFIED backend/modules/business/retired_modules.go`。
   收敛后（底座提交 `c335e5b9` 之后）：`OK shared drift check: 812 shared files identical to base,
   10 allowlisted drift, 161 business-overlay files skipped`。两次输出的 10 条
   `ALLOWED_DRIFT` 是同一批条目，本包既没新增也没删除。另按 weekly
   `Base Compatibility Rebuild` 的 CI 组合复现：`rebuild-from-base.mjs --base ../pantheon-base`
   产出的干净消费者树里该文件已是新形式，`check-shared-drift --root <rebuilt>` 与
   `check-gorm-sql-literal --root <rebuilt>` 双双通过（commands[16]）；按 lock 重放时该文件仍是
   旧形式（commands[15]），这是发布资产冻结在切版时刻的正确行为，不是本包的漏点。→ **通过**

5. **没有动 `.foundation/allowed-drift.json`。**
   本包的立场就是不用白名单静音这条 drift；该文件在本分支零改动，且此前一次尝试写入它的
   操作被拦下后未重试。`git show --stat` 单文件即为证明。→ **通过**

6. **没有把检查器塞进底座 CI。**
   `.github/workflows/*` 与 `package.json` 零改动；「引入底座门禁」作为需两位批准的
   高风险决定写入 knownGaps 与 Human Gates，不在本包夹带。→ **通过**

7. **`-race` 缺口如实记录，未被说成已覆盖。**
   `CGO_ENABLED=1 go test -race -count=1 ./...` 以 status `failed` 记入 commands[8]，
   附原始 `ThreadSanitizer failed to allocate … (error code: 87)`，并说明失败列表是该初始化
   错误的连带、改动前后一致；覆盖方式写为「无 -race 全量 47 包 ok + CI race 作业」。→ **通过**

8. **未 stage 既有未提交 i18n 改动；未动版本与发布文件。**
   `git status --short` 里那 6 个 i18n 文件仍在未跟踪于本提交的状态；`VERSION`、
   `CHANGELOG.md`、`docs/release-notes/**` 与 `sonar-project.properties` 均零改动。→ **通过**

## 残留判断

- 底座文件保留指向 ops 独有脚本的注释，在本仓是悬空引用。取舍记录在 summary 与
  knownGaps：字节对齐是 shared-drift 的判定单位，注释差异本身就会重新产生 FAIL。
  真正消解它的方式是把检查器引入底座，而不是在两仓写不同的注释。
- weekly `Base Compatibility Rebuild` 的下一次 schedule 读数未被本包声称变绿：那条工作流
  的 `Compile rebuilt backend` 一步在 10-19/10-26 因当时的 ops 树未对齐而失败，现在 ops 已
  对齐 v0.18.1，但需要一次实际 schedule 运行来回读。

## Machine Readable

```json
{
  "taskId": "2026-10-31-base-menu-filter-sql-literal-convergence",
  "verdict": "approved with documented P2 follow-up",
  "structuralReview": {
    "affectedSubgraph": [
      "backend/modules/business/retired_modules.go",
      "backend/modules/business (menu filter query construction)",
      "pantheon-ops/scripts/business-overlay/check-shared-drift.mjs (consumer gate reading)",
      "pantheon-ops/scripts/check-gorm-sql-literal.mjs (invariant source)",
      ".github/workflows/inheritance-drift-detection.yml (Base Compatibility Rebuild drift step)",
      "docs/harness/tasks/2026-10-31-base-menu-filter-sql-literal-convergence.task.md",
      ".harness/tasks/2026-10-31-base-menu-filter-sql-literal-convergence/manifest.json",
      ".harness/evidence/2026-10-31-base-menu-filter-sql-literal-convergence/"
    ],
    "checks": ["sensitive-flow", "hub", "cycle"],
    "findings": [
      "P2: base still has no gorm-sql-literal gate, so this invariant holds in base by review and by evidence only until the checker is introduced into base CI - that decision touches package.json and .github/workflows/* and needs two approvals, so it is left to the maintainer.",
      "P2: the converged file keeps a comment naming scripts/check-gorm-sql-literal.mjs, which does not exist in base; byte-identity is the unit the drift checker compares, so divergent comments would re-create DRIFT_MODIFIED. Recorded as a known gap, not silently rewritten.",
      "P2: the weekly Base Compatibility Rebuild is not claimed green by this package - its last two scheduled runs failed at Compile rebuilt backend before ops aligned to v0.18.1; the next Monday 08:57 schedule reading still has to be collected.",
      "P3: local -race cannot run on this host (ThreadSanitizer allocation error 87 under Windows/cygwin); coverage is the uncached full go test ./... (47 packages ok) plus the CI race job.",
      "P3: no foundation release is cut here. The consumer drift gate compares against base HEAD, so green needs no release - base main and ops main now hold identical bytes. The locked release asset is a different matter: v0.18.1 (baseCommit 93505225) still carries the concatenation form, so a lock-resolved rebuild reproduces the old file until the next release carries this change.",
      "P3: the six pre-existing uncommitted i18n files in the base working tree belong to other in-flight work and are neither staged nor endorsed."
    ],
    "notes": "Inheritance drift converged at its source instead of being allowlisted. pantheon-ops had restructured two GORM menu-filter clauses in a base-owned shared file into whole-clause package constants, because an ops-only checker asserts that SQL text and column names are literals or package constants; base kept the column-name concatenation, so the consumer's drift gate reported DRIFT_MODIFIED on exactly that file. This package ports the consumer form into base, byte-identical to the consumer copy, which removes the drift at the shared source, gives base the same SQL-construction invariant, and leaves .foundation/allowed-drift.json untouched. Behaviour is unchanged: module IN ?, path IN ? and component IN ? are what the concatenation produced, values still bind only through ?, and the rewritten helper is package-private with no other callers. Readings: consumer gate FAIL 1 modified before / OK 812 identical + 10 pre-existing allowlisted after; ops checker 2 violations before / 0 after on the same file; base go vet + build clean, uncached go test ./... 47 packages ok, gofmt clean, single-file diff 17 insertions / 7 deletions. No suppression marker, no threshold change, no workflow or release file touched."
  },
  "linkage": {
    "taskManifest": ".harness/tasks/2026-10-31-base-menu-filter-sql-literal-convergence/manifest.json",
    "evidence": ".harness/evidence/2026-10-31-base-menu-filter-sql-literal-convergence/commands.json",
    "reviewFile": ".harness/evidence/2026-10-31-base-menu-filter-sql-literal-convergence/review.md",
    "changeRef": "none",
    "planRefs": [
      "docs/harness/VERIFICATION_EVIDENCE_SPEC.md",
      "docs/contracts/PLATFORM_CONTRACT.md"
    ]
  }
}
```
