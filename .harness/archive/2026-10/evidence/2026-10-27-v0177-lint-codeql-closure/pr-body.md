## 变更摘要

- 改动层级：platform（含 `system/config` 的一处声明注释）+ patch 发布材料
- 改动模块：`backend/modules/system/config/setting/setting_service.go`、`backend/pkg/logging/logger.go`、`frontend/scripts/tenant-matrix-fixture-setup.mjs`，加版本材料五件与本任务包
- 目标问题：`pantheon-ops` PR #149 的 `Go Lint` 与 `CodeQL` 上有三处告警归属 base，ops 关不掉——它的消费者树由锁定的 base 快照重建，`.foundation/allowed-drift.json` 写明 generic drift 不允许留在 ops，`rebuild:from-base` 会覆盖手工编辑。三处是 `setting.SettingService` 的 revive stutter（1 条）、`pkg/logging` 四个 sink 的 `go/log-injection`（1 条新增 + 2 条同规则已被维护者 dismiss）、`tenant-matrix-fixture-setup.mjs` 七处 `js/file-access-to-http`
- 预期影响：只加注释，不改行为。`git diff --stat main` 在三个代码文件上是 **+13 / −0**；schema 停在 30，无路由、无权限码、无菜单 seed、无 i18n 文案、无导出符号改名。`golangci-lint --new-from-rev=main` 由 1 issue 归零；CodeQL 的结论从 GitHub 的 dismiss 状态搬进源码，行号漂移不会把它悄悄还原

## Harness 链路

- Task ID：2026-10-27-v0177-lint-codeql-closure
- Task Manifest：.harness/tasks/2026-10-27-v0177-lint-codeql-closure/manifest.json
- Evidence：.harness/evidence/2026-10-27-v0177-lint-codeql-closure/commands.json
- Verification evidence：.harness/evidence/2026-10-27-v0177-lint-codeql-closure/summary.md
- Review Artifact：.harness/evidence/2026-10-27-v0177-lint-codeql-closure/review.md
- OpenSpec change：none
- Trivial change：no
- Quality Profile：ci-workflow
- Ratchet Decision：no-repeat-observed
- GitHub Signal：repo-quality-gate

## Harness adoption markers

> 保留本区块的英文 marker，供 `scripts/harness/check-adoption.mjs` 做机械检查。

- task id: 2026-10-27-v0177-lint-codeql-closure
- task manifest: .harness/tasks/2026-10-27-v0177-lint-codeql-closure/manifest.json
- evidence: .harness/evidence/2026-10-27-v0177-lint-codeql-closure/
- boundaries: three base-owned source files gain comments only; version material and this packet are the rest of the diff
- backend response contract: unchanged
- backend DTO contract: unchanged
- permission contract: unchanged
- audit coverage: unchanged
- visual evidence: not-applicable, no UI or runtime surface changes
- inheritance contract: no sharedPaths change; the consumer picks this up through the v0.17.7 foundation asset
- base drift: branch cut from main 96ef1d66, the v0.17.6 publication-facts closeout
- Base/ops inheritance: this is the base-first landing side; pantheon-ops advances foundation-release.lock.json to pantheon-base-v0.17.7 and re-runs rebuild:from-base in its own packet

## 边界说明

- [x] 本次改动仅涉及单一层级
- [ ] 本次改动涉及跨层，已说明边界与依赖

补充说明：三处改动全部是注释级，归属层由被标注文件本身决定（`pkg/logging` 与 `frontend/scripts` 属 platform，`system/config/setting` 只是顺带涉及）。为什么必须落在 base 而不是 ops：ops 的 `business/*` 才能承载 generic drift 例外，而这三条路径是 base 快照所有；在 ops 侧改会在下一次 `rebuild:from-base` 被覆盖，且违反 `.foundation/allowed-drift.json`。

## 验证记录

- [x] 后端构建：`cd backend && go build ./...` → exit 0；`go vet ./...` → exit 0；`gofmt -l .` → 无输出
- [x] CI 口径 lint：`golangci-lint run --max-issues-per-linter 0 --max-same-issues 0 --new-from-rev=main ./...` → **0 issues**（同一条命令在 `main` 上报出 `setting_service.go:45:6 … (revive)`，这就是抑制生效的直接证据）
- [x] 净化器回归：`go test -count=1 -run 'Sanitize' ./pkg/logging/...` → ok 0.020s（`TestSanitizeLogMessage`、`TestSanitizeLogFields`）
- [x] 前端类型：`cd frontend && node node_modules/typescript/bin/tsc -b` → exit 0
- [x] 治理链：docs frontmatter 363 docs / 266 frontmatter 通过；encoding 0 findings / 2382 files；structure 0 findings / 2720 files；task packet 0 errors；PR governance template OK；duplication `Result: PASS`；UI quality gate no findings；generated artifacts 0 findings / 11 artifacts
- [x] 后端测试：`-race` 本机不可用（cgo 关闭），race 读数由 Linux CI `Backend Tests` 提供，已作为显式 gap 记录在 `summary.md`
- [ ] CodeQL 结果已检查并解释：见下
- [x] 如有 open CodeQL alert，已说明是新增问题、既有 baseline、误报还是已补 follow-up：本轮 8 条属误报且已在源码写明依据
- [ ] GitHub required checks 通过：待 CI
- [x] Copilot review 已请求：见 PR Automation
- [x] 已启用或确认将启用 squash auto-merge：见下

## 审核留痕

- Copilot review：requested
- CodeQL 结果：本轮 8 条 base 归属告警（1 条 `go/log-injection` + 7 条 `js/file-access-to-http`）按误报处理，依据写在被标注行上方；`go/path-injection` 的 high 那条属 ops 所有，已用真实加固关闭（文件名压到最后一段路径、`filepath.Clean` 之前拒绝 `..`、两个回归用例经回退差分自证），不是靠注释消音
- GitHub checks 结果：待 CI，五个必需 context 全绿后 squash 合并
- Auto-merge：enabled by PR Automation
- Duplication Gate 结果：PASS（本地 `node scripts/check-duplication.mjs`）
- 是否高风险改动：否（仅注释与发布材料，无行为面变化）
- Residual risk / follow-up：`SonarCloud Scan` 自 2026-09-17 起每次 PR run 都因 `GET https://api.sonarcloud.io/analysis/jres` 返回 403 失败（`SONAR_TOKEN` 缺失或无效），属凭据/门禁策略问题，需维护者提供有效 token；本轮不改 Sonar 规则、项目配置或 workflow。`SettingService` 改名 deferred，若将来执行需作为破坏性 minor 并同步删除该 nolint。

## 检查清单

- [x] 已明确本次改动归属 `platform`
- [x] 未把认证、IAM、组织、配置等系统域职责混写
- [x] 前端新增展示文案已使用 i18n（无前端展示改动）
- [x] 菜单、页面授权、操作授权、接口授权边界保持清晰（未触碰）
- [x] 涉及数据库/权限/菜单/接口变更时，文档已同步（本轮无此类变更，schema 停在 30）
- [x] 已确认不会泄露敏感配置、账号密码或 Token
