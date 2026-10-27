---
title: v0.17.7 发布收口任务包（归属 base 的 lint 与 CodeQL 误报标注）
doc_type: Remediation
layer: platform
depends_on_layers:
  - system/config
status: Active
linked_contracts:
  - docs/designs/FOUNDATION_RELEASE_MODEL.md
  - docs/designs/REPOSITORY_LAYOUT.md
  - docs/VERSION_MANAGEMENT_GUIDE.md
updated_at: 2026-10-27
---

# Task Packet: 2026-10-27-v0177-lint-codeql-closure

## Goal

把 `pantheon-ops` PR #149 上仍归 base 所有的三处门禁红灯按 base-first 落到 base 主干，并切成一个可消费的
patch release `pantheon-base-v0.17.7`，让 ops 消费后 `Go Lint` 与 `CodeQL` 能够归零。

三处内容都是**注释级**的：

- `backend/modules/system/config/setting/setting_service.go`：`SettingService` 的 revive stutter 用
  `//nolint:revive` 就地抑制并写清理由。把它改成 `setting.Service` 是对每个下游消费者的公开 API 改名，
  不属于本轮范围。
- `backend/pkg/logging/logger.go`：四个 sink 调用点上方各加一条
  `// codeql go/log-injection: this is a false positive`。理由与 GitHub 上已由维护者 dismiss 的同规则
  告警一致：`SanitizeLogValue` 去掉 CR / LF / Unicode 行分隔符与其它控制字符，`sanitizeLogFields`
  对每个字段套用同一个净化器，`TestSanitizeLogMessage` 与 `TestSanitizeLogFields` 覆盖它。
- `frontend/scripts/tenant-matrix-fixture-setup.mjs`：七条
  `// codeql js/file-access-to-http: this is a false positive`。taint 源是该本地冒烟夹具自己写在
  gitignored `.tmp` 目录下的 manifest，读回来只用来调用它自己 provisioning 的后端。

## Primary Layer

platform

`pkg/logging` 与 `frontend/scripts` 是平台级基础设施；`system/config/setting` 只是被同一条 lint 规则
顺带涉及。选择 platform 而不是 system/config，因为本轮的实质是「让平台自带的告警标注与已 dismiss 的
先例保持一致」。

## Workspace Context

- Target Repository: `pantheon-base`
- Repository Role: `foundation-source`
- Upstream Dependencies: `pantheon-harness`
- Downstream Consumers: `pantheon-ops`
- Sync Expectation: `required`
- Release Requirement: `foundation-release`
- Downstream Sync Note: 无 schema 变更（仍是 30）、无路由、无权限码、无菜单 seed、无公开符号改名。
  ops 侧只需要推进 `foundation-release.lock.json` 到 v0.17.7 并 `npm run rebuild:from-base`。
- 本机限制：`go test -race` 需要 cgo，本机未启用，race 读数由 Linux CI 的 `Backend Tests` 提供；
  `modules/lowcode/...` 与生成模块用例需要 `PANTHEON_NODE_BIN` 与 `PANTHEON_WORKSPACE_ROOT`，
  否则以 `module.generate.server_export_failed` 失败（既有 F5 记录），那是 node 解析问题不是产品缺陷。
- GitHub 传输：git 与 api.github.com 是两条独立通道，会各自单独失效。

## Dependency Layers

- `system/config`：`setting.SettingService` 的类型声明处加一行 nolint 注释。

## Harness Profile

- Template: `admin-platform`
- Overlay: `pantheon-base`
- Quality Profile: `ci-workflow`
- Portable Failure Class: `gate-noise` / `false-positive-alert`
- Owner Layer: `foundation-source`
- Ratchet Decision: `no-repeat-observed`
- Coverage Dimensions:
  - maintainability
  - runtime-quality

交付层级：**L1**（注释级改动 + 一次 patch 发布；不触碰契约面、schema、权限或菜单）。

## Contract Anchors

- `docs/designs/FOUNDATION_RELEASE_MODEL.md`：四件资产、`Release Gate Summary` 前置、
  `Foundation Release Verify`。
- `docs/VERSION_MANAGEMENT_GUIDE.md` §2.4 与 §6：patch 先例（v0.17.1–v0.17.6 全部为 patch 序列）与
  ops 侧同步动作。
- `docs/designs/REPOSITORY_LAYOUT.md`：`backend/pkg/logging` 与 `frontend/scripts` 的归属层。

## Scope

### In

- 版本材料六件：`VERSION`、`CHANGELOG.md`、`RELEASE_NOTES_v0.17.7.md`、`README.md`、`README.en.md`
- 三处注释级抑制落进 base 主干
- task packet、manifest、evidence 三件与 `pr-body.md`
- 本地验证：`go build` / `go vet` / `gofmt`、CI 口径 `golangci-lint --new-from-rev=main`、
  前端 `tsc -b`、`check-duplication`
- 开 PR、看护 CI、合并
- 在合并提交上切割并发布 `pantheon-base-v0.17.7`，`check-release-assets` 与
  `Foundation Release Verify` 通过
- 发布事实（tag object、四件资产哈希、run id）回写

### Out

- 任何 SonarCloud 规则或项目配置变更（凭据问题另见 Human Gates）
- 重命名 `setting.SettingService`：公开 API 破坏性改名不在本轮
- 修改 CodeQL 查询、pack 或 `.github/codeql/*` 配置：抑制只写在代码层
- 改写已发布的 v0.17.0–v0.17.6 tag 与资产
- 为让门禁变绿而跳过测试、放宽阈值或删除功能
- `pantheon-ops` 侧改动：消费在消费者仓库自己的任务包里收口

## Expected Files

### Create

- `RELEASE_NOTES_v0.17.7.md`
- `docs/harness/tasks/2026-10-27-v0177-lint-codeql-closure.task.md`
- `.harness/tasks/2026-10-27-v0177-lint-codeql-closure/manifest.json`
- `.harness/evidence/2026-10-27-v0177-lint-codeql-closure/{commands.json,summary.md,review.md,pr-body.md}`

### Modify

- `backend/modules/system/config/setting/setting_service.go`（+2 行注释）
- `backend/pkg/logging/logger.go`（+4 行注释）
- `frontend/scripts/tenant-matrix-fixture-setup.mjs`（+7 行注释）
- `VERSION`、`CHANGELOG.md`、`README.md`、`README.en.md`

### Do Not Touch

- `docs/contracts/*`：本轮不改任何契约文本
- `backend/pkg/database/migrations/*`：schema 停在 30
- `config/boundary-baseline.json`：基线已由 v0.17.6 清空
- `.harness/STATUS.md`：工作区里它带着另一轮工作的未提交改动，本轮不并入

## Implementation Notes

- 抑制注释一律紧贴被标注的行、沿用仓库既有写法：Go 用 `//nolint:<linter> // 理由`，CodeQL 用
  `// codeql <rule-id>: this is a false positive -- 理由`。理由里写清楚是谁在保护这条路径
  （`SanitizeLogValue` / 自写自读的 `.tmp` manifest），而不是只写 "false positive"。
- 加注释会移动行号，CodeQL 的 UI dismiss 记录按告警指纹而非行号存续；因此四条 sink 全部就地标注，
  让结论留在代码里而不依赖 GitHub 侧状态。
- 不改函数体、不改导出面、不改日志格式：`git diff --stat` 只有 13 行新增、0 行删除。

## Verification Plan

### Backend

- `cd backend && go build ./... && go vet ./... && gofmt -l .`
- `golangci-lint run --max-issues-per-linter 0 --max-same-issues 0 --new-from-rev=main ./...` → 0 issues
- `go test ./...`（本机非 race；race 由 CI `Backend Tests` 覆盖）

### Frontend

- `cd frontend && node node_modules/typescript/bin/tsc -b`

### Governance

- `npm run check:docs-frontmatter`、`check:harness-encoding`、`check:structure`、
  `check:task-packet`、`check:pr-governance`
- `npm run check:duplication`
- PR body 过 `node scripts/check-pr-governance.mjs --event`

### Release

- `Release Gate Summary` 在发布目标提交上成功
- `release:foundation:cut` 产出 `releases/pantheon-base-v0.17.7/` 与 `dist/` 四件产物
- `check-release-secrets` 0 命中
- annotated tag + GitHub Release（非 draft、非 prerelease）+ 四件资产
- `check-release-assets` 一致，`Foundation Release Verify` run 成功

## Linkage

- Task ID: `2026-10-27-v0177-lint-codeql-closure`
- Task Manifest: `.harness/tasks/2026-10-27-v0177-lint-codeql-closure/manifest.json`
- OpenSpec Change: none
- Superpowers Plan: none
- Plan References: `docs/VERSION_MANAGEMENT_GUIDE.md`、
  `docs/harness/tasks/2026-10-27-v0176-release-closeout.task.md`、
  `.harness/evidence/2026-10-24-single-tenant-scope-closeout/summary.md`（F5）
- Evidence Directory: `.harness/evidence/2026-10-27-v0177-lint-codeql-closure/`
- Review File: `.harness/evidence/2026-10-27-v0177-lint-codeql-closure/review.md`

## Evidence Required

- `go build`、`go vet`、`gofmt`、CI 口径 golangci-lint 的读数（0 issues 是本轮的关键断言）。
- 前端 `tsc -b` 与 `check-duplication` 读数。
- 治理链（docs frontmatter / structure / task packet / pr-governance）读数。
- `git diff --stat` 证明本轮只增注释、不删行。
- PR 必需 context 的结论与合并 SHA。
- `Release Gate Summary` 在发布目标提交上的 run 与结论。
- 四件资产的 SHA-256、`check-release-assets` 输出、`Foundation Release Verify` run。
- 环境限制显式记录：本机 TSan/cgo、`PANTHEON_NODE_BIN`、SonarCloud 403。

## Human Gates

- 质量门禁策略：`SonarCloud Scan` 自 2026-09-17 起在每一次 PR run 上都因
  `GET https://api.sonarcloud.io/analysis/jres → HTTP 403`（`sonar.token` / `SONAR_TOKEN` 无效或缺失）
  失败。这是凭据/权限类环境缺陷，修复需要维护者提供有效 token；本轮不改规则、不改 workflow。
- 最终视觉/功能验收：本轮无 UI/运行时变化，无需视觉验收。

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
- [x] 三处注释落在 base 主干的正确位置，`golangci-lint --new-from-rev=main` 归零。
- [x] 版本材料六件更新到 v0.17.7，内容与 `RELEASE_NOTES_v0.17.7.md` 一致。
- [ ] PR 必需 context 全绿并合并。
- [ ] 合并后的 main HEAD 上 `Release Gate Summary` 成功。
- [ ] `pantheon-base-v0.17.7` annotated tag + GitHub Release + 四件资产，`check-release-assets` 一致。
- [ ] `Foundation Release Verify` run 成功，发布事实回写。
- [ ] `pantheon-ops` 侧消费另立任务包，不在本包内声明完成。
