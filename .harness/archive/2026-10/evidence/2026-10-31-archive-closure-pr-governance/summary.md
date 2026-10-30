# Verification Summary: 2026-10-31-archive-closure-pr-governance

## What changed and why

`.harness/ARCHIVE.md` says completed tasks move to `.harness/archive/<YYYY-MM>/` and that
everyone keeps citing the canonical `.harness/tasks/<id>/manifest.json` and
`.harness/evidence/<id>/...` spellings afterwards. Six `completed` task trees were still
sitting in the live tree, so this round moved them with `git mv` (34 files, including the
`notes/` subdirectory of `2026-10-29-v0181-restore-request-guard`).

Preparing the closure PR then hit the second half of FR-019's class. `scripts/check-pr-governance.mjs`
validated `Task Manifest`, `Evidence`, `Verification evidence` and `Review Artifact` with a bare
`fs.existsSync` on the canonical path, and for a non-trivial PR it does not accept `none` for
those fields. So the moment a task is archived, the PR that records that task's closure is
rejected — the convention and the sensor contradicted each other. The repair is the same
resolver the 2026-10-29 round gave `check-task-packet` and `check-doc-links`: try the literal
path first, and only when it is absent fall back to `resolveArchiveAwarePath`, which searches
the monthly archive for the same task id under the matching tree (`tasks/` or `evidence/`).

## Measured readings

- Before/after on a real archived body: the archived `pr-body.md` of
  `2026-10-30-workflow-sonar-githubactions` (its linkage still names canonical paths) was fed to
  the HEAD export of the sensor and to the repaired one. HEAD: `exit 1` with four
  `file does not exist in repository` findings. Repaired: `exit 0`,
  `OK pantheon-base PR body governance fields are present`. Both probe files were deleted after
  the run.
- `npm run test:pr-governance`: 8 tests, 8 pass (6 before this package). The two additions run in
  opposite directions — an archived manifest plus archived `commands.json` / `summary.md` /
  `review.md` must validate with zero findings, and a task id that exists neither live nor
  archived must still report `does not exist in repository`. The fallback widens resolution; it
  does not weaken the requirement.
- `npm run test:scripts`: 183/183 (baseline 181).
- 12 governance checks (`check:task-packet`, `check:task-packet-template`,
  `check:docs-frontmatter`, `check:harness-docs`, `check:harness-inventory`,
  `check:harness-encoding`, `check:structure`, `check:failure-registry`, `check:generated`,
  `check:generated-modules`, `check:ui-quality-gate`, `check:duplication`) plus
  `check-evidence --strict` and `check-review --strict`: all exit 0 after the moves and the code
  change.
- Archive counters after the moves: `archive/2026-10/tasks` 88, `archive/2026-10/evidence` 91
  (previously 82 / 85); totals recomputed to 209 / 215 and written into `ARCHIVE.md`.
- Live tree after the moves: only `2026-10-29-v0180-simplification-release` remains in
  `.harness/tasks/` (plus this package), which matches the documented convention.

## Residual gap, measured rather than inferred

Running `check-evidence --strict` explicitly against the archived `commands.json` produces three
errors — `root.linkage.taskManifest does not exist`, `root.linkage.reviewFile does not exist`, and
`root.linkage.evidenceDir must match the commands.json directory` — for three files that all exist
under `archive/2026-10/`. `check-evidence`, `check-review` and `generate-pr-body` still use bare
`fs.existsSync` on canonical paths. Two consequences are worth stating plainly: the default glob
scans only the live tree, so no gate turns red today, and by the same token archived evidence
leaves the checked surface entirely. Fixing the three consumers needs its own fixture suites, and
making archived evidence scannable again is a governance-surface expansion; both are left to the
maintainer and recorded in FR-024 instead of being folded into a records round.

FR-024 is registered with occurrence 2 and points at FR-019, because the 2026-10-29 round patched
the checkers that went red instead of enumerating every consumer of canonical task/evidence
references. The enumeration is now in the registry entry, which is the durable part.

One more measured mechanism note: `check:harness-adoption --strict` reported 2 findings before
this package existed (both naming `backend/modules/system/i18n/builtin_locale_resources.json`) and
0 after. The i18n files did not change and are still unstaged — the checker pairs "implementation
change present" with "task manifest change present" across the whole worktree, so adding any
manifest silences it. The i18n exclusion is therefore enforced by this package's `Out` list and by
staging discipline, not by that gate; tightening the pairing is a separate sensor question.

## Scope discipline

- Nothing under `.github/workflows/`, `backend/**` (except the excluded, untouched i18n files) or
  `frontend/src/**` changed; no threshold, no gate semantics, no Sonar query was touched.
- The 67 older task packets still marked `status: Active` were not bulk-flipped: only the two
  2026-10-30 packages have terminal readings recorded in this session, so only those two were
  archived in the document sense.
- `VERSION`, `CHANGELOG.md` and `docs/release-notes/**` are untouched — no foundation release is
  cut here; absorbing the sensor and workflow repairs into `pantheon-ops` needs an irreversible
  tag and stays a maintainer decision.
- `pantheon-ops`'s `runtime-acceptance` item is a consumer-repo ledger entry and is not decided by
  this package.

## Post-merge

- PR #474 检查读数：20 pass / 10 skipping（改动范围门控跳过 backend、frontend、smoke、Go Lint 等面），
  0 failure。CodeQL 与 CodeQL Security 均 success，本包改动的 `.mjs` 文件在抽取范围内且无新增 alert。
- Auto-merge 由既有 PR Automation 落地（`enabledAt 2026-10-30T16:14:30Z`，SQUASH）：
  `mergedAt 2026-10-30T16:19:37Z`，`main` 提交 `05ee0ec1b30abbbcf86d0d228ec1be1951ed87a0`。
- 合并后 `main` 工作流（`createdAt 2026-10-30T16:19:40Z`）：CI、Code Quality Gates、Core Smoke Tests、
  Full Smoke Suite、Lint Workflows、Security Gates、Release Gate 全部 completed/success。
- `Release Gate` run `41088861582` 的 6 个作业结论全部 success；`SonarCloud Gate` 作业
  （`124186127947`）日志读数 `Unprocessed SonarCloud issues: 0` 与
  `✓ No unresolved SonarCloud issues`。
- 独立 API 复核（不依赖日志）：`branch=main` 未处理问题 total 0、`qualitygates/project_status`
  = OK。这与 #473 的终局读数一致，说明修复在后续 push 分析上没有回弹。
- 本包的终局形态自检：归档提交（`chore/harness-closeout-archive-closure`）把
  `2026-10-31-archive-closure-pr-governance` 的 manifest 与 evidence 迁入
  `.harness/archive/2026-10/`，而 PR body 继续引用 canonical `.harness/tasks|evidence` 路径——
  即 #474 新增的归档回退分支在真实 PR 上被 `PR Governance Prereq` 判定通过，而不只是被单测覆盖。
