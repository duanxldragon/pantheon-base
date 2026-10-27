---
title: v0.17.8 发布收口任务包（base 归属的两处依赖漏洞）
doc_type: Remediation
layer: platform
depends_on_layers: []
status: Active
linked_contracts:
  - docs/designs/FOUNDATION_RELEASE_MODEL.md
  - docs/VERSION_MANAGEMENT_GUIDE.md
  - SECURITY.md
updated_at: 2026-10-27
---

# Task Packet: 2026-10-27-v0178-dep-vuln-closure

## Goal

把 `pantheon-ops` 主干上 `Security Gates` 的两处红灯按 base-first 落到 base 主干，并切成一个可消费的
patch release `pantheon-base-v0.17.8`。

红灯不是 ops 能自己关的。ops `main` 的 run `40457897311`（job `Dependency Vulnerabilities`，
122035403107）四项输入读数是 `govulncheck: success` / `npm audit (root): success` /
`npm audit (frontend): failure` / `osv call analysis: failure`，而这两个失败项的输入文件
`backend/go.mod` 与 `frontend/package-lock.json` 在 ops 的 `business-overlay.json` 里既不在
`repositoryOverlayPaths` 也不在 `replaceRoots` 白名单内——它们是 base 拥有、每次
`rebuild:from-base` 会被 base 快照覆盖的文件。在消费者侧手动抬版本会在下一轮重建时被回退，
所以修复只能落在 base。

两处缺陷：

- **V1（P2）**：`backend/go.mod` 声明 `go 1.26.9`，而 `GO-2026-6809`（`crypto/x509`
  `Certificate.Verify`，「不信任被攻破的中间证书」）在 1.26.10 修复。ops 的 OSV 扫描把这一条判为
  `called: true`，于是 `Enforce OSV call analysis` 这一步失败。修法是把 go directive 抬到
  `1.26.10`。
- **V2（P2）**：`frontend/package-lock.json` 锁到 `zod 4.3.6`，命中
  `GHSA-mrhx-c7xc-m3w5`（`zod < 4.6.6`，校验超大受限集合时内存耗尽，severity high），
  使 `npm audit --audit-level=high` 在 frontend 返回 failure。`zod` 不是直接依赖，它经
  `eslint-plugin-react-hooks` 与 `zod-validation-error` 进入，且 `src/` 里没有任何 `import 'zod'`，
  所以是 dev-only 的传递依赖；抬到锁文件允许的最新 `4.6.7`。

这一轮同时关闭 `docs/reviews/PANTHEON_BASE_FINAL_ACCEPTANCE_REVIEW_2026-10-21.md` 与
`docs/reviews/PANTHEON_BASE_ISSUES_AND_REMEDIATION_2026-10-21.md` §78 早已写下的结论：
「govulncheck 1 项工具链级漏洞（升级 Go 1.26.10 即可）」。

## Primary Layer

platform

改动全部落在工具链与依赖锁定面（`go.mod`、`package-lock.json`、`Dockerfile`、`VERSION` 与版本
文档），不进入任何业务模块或系统域。

## Workspace Context

- Target Repository: `pantheon-base`
- Repository Role: `foundation-source`
- Upstream Dependencies: `pantheon-harness`
- Downstream Consumers: `pantheon-ops`
- Sync Expectation: `required`
- Release Requirement: `foundation-release`
- Downstream Sync Note: 无 schema 变更（仍是 30）、无路由、无权限码、无菜单 seed、无 i18n 文案、
  无公开符号变化。ops 侧只需要把 `foundation-release.lock.json` 推进到 v0.17.8 并
  `npm run rebuild:from-base`；重建后 `backend/go.mod` 与 `frontend/package-lock.json` 自动带上
  修复，`Security Gates` 的两项失败输入翻绿。
- 本机限制：`go test -race` 需要 cgo，本机未启用，race 读数由 Linux CI `Backend Tests` 提供。
  `osv-scanner` 的递归模式遵守 `.gitignore`，而 `pantheon-base/.gitignore` 忽略 `.tmp/`，本轮的 linked
  worktree 恰好建在 `pantheon-base/.tmp/wt-v0178`，所以最初那条 `No package sources found` 是扫描范围
  问题而不是漏洞结论；当时写下的「跳过点开头目录段」原因已被对照实验证伪，并在 review R2 更正。加
  `--no-ignore` 后，与消费者同一条 `--recursive --call-analysis=go` 在修复后的 base 树上 exit 0，base
  侧因此自带门禁读数；ops 消费后的 run 只作为那条聚合步骤转绿的确认，而不是唯一的证明。
- GitHub 传输：git 与 api.github.com 是两条独立通道，会各自单独失效。

## Dependency Layers

- 无。本轮不触碰 `system/*` 或 `business/*` 的任何源码。

## Harness Profile

- Template: `admin-platform`
- Overlay: `pantheon-base`
- Quality Profile: `ci-workflow`
- Portable Failure Class: `dependency-vulnerability` / `ownership-routing`
- Owner Layer: `foundation-source`
- Ratchet Decision: `adapter-updated`
- Coverage Dimensions:
  - architecture-fitness
  - maintainability

交付层级：**L2**。理由是本轮改的是继承边界上的所有权路由（base-owned 依赖锁定文件）并触发一次
foundation release，属于 AGENTS.md 里「触碰继承边界时升到 L2」的条目。

## Contract Anchors

- `docs/designs/FOUNDATION_RELEASE_MODEL.md`：四件资产、`Release Gate Summary` 前置、
  `Foundation Release Verify`。
- `docs/VERSION_MANAGEMENT_GUIDE.md` §2.4 与 §6：patch 序列先例（v0.17.1–v0.17.7）与 ops 侧同步动作。
- `SECURITY.md` 的 Dependabot / 发布前告警条目：「发布前不得存在未处理的 high/critical 告警」。
  本轮被这一条推动——`GHSA-mrhx-c7xc-m3w5` 是 high，而承载它的 `frontend/package-lock.json` 归 base
  所有，所以发布动作必须从 base 开始。它目前不是 ops 的开放 Dependabot alert（告警列表为空），
  红灯来自 `Security Gates` 的 `npm audit --audit-level=high`。
- `.harness/archive/2026-09/evidence/2026-09-22-production-redis-and-security-gates/summary.md`：
  仓库内既有的同类先例——当初也是只抬 `go` directive（1.26.5 → 1.26.6）清掉 7 个可达 stdlib CVE，
  并以 govulncheck 复扫作为证据。本轮沿用同一口径。
- `docs/reviews/PANTHEON_BASE_ISSUES_AND_REMEDIATION_2026-10-21.md` §78：本缺陷的既有登记。

## Scope

### In

- `backend/go.mod`：`go 1.26.9` → `go 1.26.10`（仅此一行）
- `frontend/package-lock.json`：`node_modules/zod` 条目 4.3.6 → 4.6.7（version / resolved / integrity）
- `Dockerfile`：`golang:1.26.5-alpine` → `golang:1.26.10-alpine`，并注释说明它必须与 `go.mod` 手工对齐
- 版本对齐文档：`README.md`、`README.en.md`、`docs/DEPLOYMENT_GUIDE.md` 的工具链基线与
  current release 表述
- 版本材料六件：`VERSION`、`CHANGELOG.md`、`RELEASE_NOTES_v0.17.8.md`、`README.md`、`README.en.md`
- task packet、manifest、evidence 三件与 `pr-body.md`
- 本地验证：`go build` / `go vet` / `gofmt` / `go test`（新工具链）、`govulncheck` v1.3.0 复扫、
  `npm ci` + `tsc -b` + `npm run build` + `npm run lint`、`npm audit` 的 before/after 差分、
  OSV v2.3.3 的 before/after lockfile 差分、治理链
- 开 PR、看护 CI、合并
- 在合并提交上切割并发布 `pantheon-base-v0.17.8`，`check-release-assets` 与
  `Foundation Release Verify` 通过
- 发布事实（tag object、四件资产哈希、run id）回写

### Out

- 在 `pantheon-ops` 直接手改 `backend/go.mod` / `frontend/package-lock.json`：这两个文件归 base 拥有，
  消费者侧改动会被下一次 `rebuild:from-base` 覆盖，属于禁止的手抄路径
- 放宽或修改任何门禁阈值：`Enforce OSV call analysis`、`npm audit --audit-level=high` 与
  `Enforce dependency vulnerability gate` 保持原样，本轮只修输入
- 升级 `golang.org/x/crypto`（`GO-2026-5932`，openpgp「按设计不安全」）：该条在两处扫描里都是
  `called: false`，advisory 且无修复版本，base 代码不调用 openpgp；本轮记录为残留而不是关闭
- 修改 `.github/workflows/security.yml` 的扫描口径或引入 `|| true`
- 改写已发布的 v0.17.0–v0.17.7 tag 与资产
- `SONAR_TOKEN` 相关处置：ops `SonarCloud Scan` 与 base 同名 job 因 JRE metadata 查询 403 失败，
  是维护者凭据问题，见 Human Gates

## Expected Files

### Create

- `RELEASE_NOTES_v0.17.8.md`
- `docs/harness/tasks/2026-10-27-v0178-dep-vuln-closure.task.md`
- `.harness/tasks/2026-10-27-v0178-dep-vuln-closure/manifest.json`
- `.harness/evidence/2026-10-27-v0178-dep-vuln-closure/{commands.json,summary.md,review.md,pr-body.md}`

### Modify

- `backend/go.mod`（1 行）
- `frontend/package-lock.json`（3 行：version / resolved / integrity）
- `Dockerfile`（1 行镜像标签 + 1 行说明注释）
- `README.md`、`README.en.md`、`docs/DEPLOYMENT_GUIDE.md`（工具链基线与 current release 表述）
- `VERSION`、`CHANGELOG.md`

### Do Not Touch

- `docs/contracts/*`：本轮不改任何契约文本
- `backend/pkg/database/migrations/*`：schema 停在 30
- `config/boundary-baseline.json`：基线已由 v0.17.6 清空
- `.github/workflows/*`：门禁口径不动，只修被扫描的输入
- `.harness/STATUS.md`：base 主检出当前由另一会话在 `fix/tenant-member-integrity-2026-10-27` 上使用，
  本轮不并入它的未提交状态
- `go.sum`：`go` directive 与 dev-only 的 zod 都不产生新的 go 依赖，`go mod tidy` 无需改摘要

## Implementation Notes

- go directive 是这一轮唯一的产品输入变化。CI 与 Docker 分别用两种方式读它：workflow 用
  `go-version-file: backend/go.mod`（自动跟随），`Dockerfile` 用镜像标签（必须手改）。只改前者会让
  容器构建停在 1.26.5 并在 `go mod download` 时触发工具链下载，所以两处一起改才是自洽的。
- `package-lock.json` 采用「只改 `node_modules/zod` 三条字段」的最小 diff。`npm update zod` 在本机能
  解析出正确的 version / resolved / integrity，但它同时会删掉 6 处可选依赖的 `libc` 数组——那是本机
  npm 与 CI npm 写 lock 的差异，与本轮无关，因此把那部分噪声退回，只保留 zod 三条。`npm ci` 与
  `npm run build` 在改后的 lock 上跑通，就是「这个 lock 仍是可安装的一致状态」的证明。
- zod 的影响面限于 dev 工具链：`src/` 无引用，只有 `eslint-plugin-react-hooks`（用它校验自身配置）
  和 `zod-validation-error` 依赖 `^3.25.0 || ^4.0.0`。4.6.7 满足该范围，`npm run lint` 全绿即为
  兼容读数。
- OSV 复现口径：本轮无法在 worktree 原地跑 `--call-analysis=go`（见本机限制），改用同一版本的
  lockfile 扫描做 before/after 差分。差分显示 `1.26.9` 下同时出现 `stdlib GO-2026-6809` 与
  `zod GHSA-mrhx-c7xc-m3w5`，`1.26.10` + `zod 4.6.7` 后两条都消失，只剩 `x/crypto GO-2026-5932`
  且它在 ops 扫描里本就是 `called: false`。真正的调用图证据由 `govulncheck` v1.3.0 在 base 源码上
  提供：`No vulnerabilities found`（0 called）。

## Verification Plan

### Backend

- `cd backend && go version` → go1.26.10（GOTOOLCHAIN=auto 按新 directive 拉取）
- `go build ./... && go vet ./... && gofmt -l .`
- `go test -count=1 ./...`
- `go run golang.org/x/vuln/cmd/govulncheck@v1.3.0 ./...` → `No vulnerabilities found`（关键断言）

### Frontend

- `npm ci`（证明 hand-minimal lock 可安装）
- `node node_modules/typescript/bin/tsc -b`
- `npm run build`
- `npm run lint`（zod 唯一的运行时消费者是 eslint 插件）
- `npm audit --package-lock-only --registry=https://registry.npmjs.org --audit-level=high`
  的 before/after：before `1 high`，after `found 0 vulnerabilities`

### Security differential

- `osv-scanner@v2.3.3 scan --lockfile` 对 before / after 两份 lockfile 的读数对比

### Governance

- `node scripts/frontmatter-check.mjs`、`scripts/harness/check-structure-contract.mjs --strict`、
  `check-encoding --strict`、`check-task-packet`、`check-evidence --strict`、`check-review --strict`、
  `check-adoption --strict`、`check-doc-links --strict`、`check-doc-inventory --strict`、
  `check-generated --strict`、`check-duplication`
- PR body 过 `node scripts/check-pr-governance.mjs --event`

### Release

- `Release Gate Summary` 在发布目标提交上成功
- `release:foundation:cut` 产出 `releases/pantheon-base-v0.17.8/` 与 `dist/` 四件产物
- `check-release-secrets` 0 命中
- annotated tag + GitHub Release（非 draft、非 prerelease）+ 四件资产
- `check-release-assets` 一致，`Foundation Release Verify` run 成功

### Consumer（ops 侧收口，另立任务包）

- ops 推进 `foundation-release.lock.json` 到 v0.17.8 → `rebuild:from-base` →
  `check:business-overlay` / `test:business-overlay`
- ops `main` 的 `Security Gates`：`Dependency Vulnerabilities` 四项输入全部 success

## Linkage

- Task ID: `2026-10-27-v0178-dep-vuln-closure`
- Task Manifest: `.harness/tasks/2026-10-27-v0178-dep-vuln-closure/manifest.json`
- OpenSpec Change: none
- Superpowers Plan: none
- Plan References: `docs/VERSION_MANAGEMENT_GUIDE.md`、
  `docs/harness/tasks/2026-10-27-v0177-lint-codeql-closure.task.md`、
  `docs/reviews/PANTHEON_BASE_ISSUES_AND_REMEDIATION_2026-10-21.md`（§78 既有登记）、
  `.harness/archive/2026-09/evidence/2026-09-22-production-redis-and-security-gates/summary.md`（同类先例）
- Evidence Directory: `.harness/evidence/2026-10-27-v0178-dep-vuln-closure/`
- Review File: `.harness/evidence/2026-10-27-v0178-dep-vuln-closure/review.md`

## Evidence Required

- 新工具链下的 `go version`、`go build`、`go vet`、`gofmt`、`go test` 读数。
- `govulncheck` v1.3.0 的 `No vulnerabilities found`（0 called）——本轮的关键安全断言。
- `npm ci`、`tsc -b`、`npm run build`、`npm run lint` 读数，证明 zod 4.6.7 不破坏 dev 工具链。
- `npm audit` before/after（1 high → 0）与 OSV lockfile before/after 差分。
- `git diff --stat` 证明改动面只有 `go.mod` 1 行、lock 3 行、Dockerfile 与版本文档。
- 治理链读数与 PR 必需 context 结论、合并 SHA。
- `Release Gate Summary` run、四件资产 SHA-256、`check-release-assets`、
  `Foundation Release Verify` run。
- ops `main` 上 `Security Gates` 由红转绿的 run 读数（消费轮取权威证据）。
- 环境限制显式记录：本机 TSan/cgo、OSV 在点开头路径下的遍历行为、npm audit 需要真实 registry、
  `SONAR_TOKEN` 403。

## Human Gates

- 质量门禁策略：`golang.org/x/crypto` 的 `GO-2026-5932`（openpgp 按设计不安全、无修复版本）在两处
  扫描里都是 `called: false`，因此现在不阻断任何门禁；是否把它列为「必须替换为
  `github.com/ProtonMail/go-crypto`」的硬性要求，属维护者的依赖风险策略，本轮只登记不动。
- 质量门禁策略：`SonarCloud Scan` 自 2026-09-17 起在 base 与 ops 的每次 run 都因
  `GET https://api.sonarcloud.io/analysis/jres → HTTP 403` 失败，需要维护者提供有效 `SONAR_TOKEN`
  并轮换此前泄露过的 token；本轮不改 Sonar 规则、不改 workflow。
- 最终视觉/功能验收：本轮无 UI/运行时变化，无需视觉验收。

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
- [x] 两处 base-owned 依赖版本落在正确文件，且有 before/after 差分自证。
- [x] 版本材料六件更新到 v0.17.8，与 `RELEASE_NOTES_v0.17.8.md` 一致。
- [ ] PR 必需 context 全绿并合并。
- [ ] 合并后的 main HEAD 上 `Release Gate Summary` 成功。
- [ ] `pantheon-base-v0.17.8` annotated tag + GitHub Release + 四件资产，`check-release-assets` 一致。
- [ ] `Foundation Release Verify` run 成功，发布事实回写。
- [ ] `pantheon-ops` 消费 v0.17.8 后 `Security Gates` 转绿；该断言在消费者仓库自己的任务包里关闭。
