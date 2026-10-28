## 变更摘要

- 改动层级：platform（文档布局与发布记录入口），无产品代码
- 改动模块：根目录 14 份 `RELEASE_NOTES_v*.md` 移入 `docs/release-notes/`；新增
  `docs/release-notes/README.md`、`README.en.md`；`README.md`、`README.en.md`、
  `docs/README.md`、`docs/README.en.md`、`docs/designs/REPOSITORY_LAYOUT{,en}.md`、
  `docs/reviews/ENTERPRISE_RELEASE_READINESS_REVIEW_2026-10-07.md` 与
  `RELEASE_NOTES_v0.14.0.md` 的链接同步；两处历史 `commands.json` 与两处历史
  `review.md` 的 `linkage.planRefs` 路径重指；任务包与证据三件
- 目标问题：根目录同时堆着入口文档和 14 份历史发布说明，目录可读性下降且没有统一索引。
  本 PR 把它们收进 `docs/release-notes/`，新增中英文索引并在 `docs/README` 与根 README
  挂接，同时把“发布说明进 `docs/release-notes/`、只追加不回改”写进布局规范
- 预期影响：只有文件位置与链接。发布脚本通过 `--release-notes` 接收正文，不读取仓库路径，
  发布行为不变；`backend/`、`frontend/`、workflow、schema、路由、权限、i18n 一行未动；
  `CHANGELOG.md` 与 `VERSION` 保持原样；历史证据只改 4 处 `planRefs` 路径，
  结论、命令读数与 knownGaps 均未变

## Harness 链路

- Task ID：`2026-10-28-release-notes-directory`
- Task Manifest：`.harness/tasks/2026-10-28-release-notes-directory/manifest.json`
- Evidence：`.harness/evidence/2026-10-28-release-notes-directory/commands.json`
- Verification evidence：`.harness/evidence/2026-10-28-release-notes-directory/summary.md`
- Review Artifact：`.harness/evidence/2026-10-28-release-notes-directory/review.md`
- OpenSpec change：none
- Trivial change：yes
- Quality Profile：none
- Ratchet Decision：no-repeat-observed
- GitHub Signal：not-applicable

## Harness adoption markers

> 保留本区块的英文 marker，供 `scripts/harness/check-adoption.mjs` 做机械检查。

- task id: 2026-10-28-release-notes-directory
- task manifest: .harness/tasks/2026-10-28-release-notes-directory/manifest.json
- evidence: .harness/evidence/2026-10-28-release-notes-directory/commands.json
- boundaries: 只移动文档并改链接；`check-boundaries --strict` 与基线形态均无新增 finding
- backend response contract: unchanged
- backend DTO contract: unchanged
- permission contract: unchanged
- audit coverage: unchanged
- visual evidence: not-applicable
- inheritance contract: 未改 sharedPaths 或继承合同；`pantheon-ops` 无需动作
- base drift: branch cut from main `a053805b`
- Base/ops inheritance: 无同步要求；`pantheon-ops` 的 foundation lock 不受文档路径影响

## 边界说明

- [x] 本次改动仅涉及单一层级
- [ ] 本次改动涉及跨层，已说明边界与依赖

补充说明：全部改动位于 `docs/`、根 README 与任务证据；不触碰系统域、生成器、权限链与发布流程。

## 验证记录

- [x] `node scripts/harness/check-doc-links.mjs --root . --strict` → 0 finding(s)
- [x] `node scripts/harness/check-doc-inventory.mjs --root . --strict` → 0 finding(s)
- [x] `npm run check:docs-frontmatter` → passed（386 docs / 270 带 frontmatter）
- [x] `npm run check:harness-encoding` → 0 finding(s)（2507 files）
- [x] `npm run check:structure` → 0 finding(s)（2855 tracked files）
- [x] `npm run check:task-packet-template`、`npm run check:task-packet` → exit 0
- [x] `npm run check:generated` → 0 finding(s)（11 artifacts）；`npm run check:ui-quality-gate` → 0 finding(s)
- [x] `node scripts/harness/check-evidence.mjs --strict` → 81 files / 0 error；
  `check-review.mjs --strict` → 81 files / 0 error（重指 4 处历史 planRefs 后归零）
- [x] `git status` 显示 14 个 `R`（rename），根目录 `ls RELEASE_NOTES_*.md` 为空
- [x] `grep` 核实无 markdown 链接仍指向根目录旧路径；保留项仅为历史叙述与 archive 快照
- [ ] 其他：无 UI/运行时变化，未跑前后端 smoke；本 PR 不需要运行时证据

## 审核留痕

- Copilot review：unavailable（纯文档目录整理）
- CodeQL 结果：无代码改动，预计无新增告警
- GitHub checks 结果：见 PR checks 读数
- Auto-merge：not-applicable（文档改动以 squash merge 收口）
- Duplication Gate 结果：文档改动，无重复代码增量
- 是否高风险改动：否，文档位置与索引
- Residual risk / follow-up：
  - 索引表为手工维护，下一次发布需要加一行并移动“当前最新”指针（记录于 review 的 P3 finding）。
  - `.harness/archive/2026-10/RELEASE_STATUS_v0.14.0.md` 的相对链接在移动前即为失效路径，
    作为历史快照保留，不回溯修改。
  - 4 处历史 `planRefs` 因 `check-evidence` / `check-review --strict` 按仓库路径解析而必须
    重指到 `docs/release-notes/`；只改路径，未改任何结论或读数（记录于 review 的 P3 finding）。

## 检查清单

- [x] 已明确本次改动归属 `platform`（文档布局），不涉及 `system/*` 或 `business/*`
- [x] 未把认证、IAM、组织、配置等系统域职责混写
- [x] 前端新增展示文案已使用 i18n：不适用，无前端文案改动
- [x] 菜单、页面授权、操作授权、接口授权边界保持清晰：不适用，未触碰
- [x] 涉及数据库/权限/菜单/接口变更时，文档已同步：不适用，无此类变更
- [x] 已确认不会泄露敏感配置、账号密码或 Token：diff 只含文档移动、索引与链接
