---
title: v0.17.6 发布收口任务包（租户运营：套餐落库 + 平台域读面 + 兼容作用域收口 + 无障碍）
doc_type: Remediation
layer: system/iam
depends_on_layers:
  - platform
  - system/config
  - system/org
status: Active
linked_contracts:
  - docs/designs/FOUNDATION_RELEASE_MODEL.md
  - docs/contracts/TENANT_CONTRACT_V1.md
  - docs/contracts/PLATFORM_CONTRACT.md
updated_at: 2026-10-27
---

# Task Packet: 2026-10-27-v0176-release-closeout

## Goal

把 v0.17.5 之后合入主干的五个工作（PR #423、#424、#427、#426、#425）切成一个可消费的 foundation
release `pantheon-base-v0.17.6`，让 `pantheon-ops` 能推进它的 pin 并消费到租户运营能力。

本轮内容与 v0.17.5 的性质不同：它**不是**无 schema 变更的 patch。

- **套餐定义落库**（`000030_tenant_plan_definitions`，`tenant_plans` 平台全局表）：阈值不再是
  `tenant_production.go` 里的 `GetDefaultQuota` switch；种子按 code 守卫、不写 `UPDATE`，对既有租户
  是 no-op。`-1` 表示 unlimited，`0` 被服务层拒绝。
- **三个平台域读面**：`GET /system/tenant-ops/overview`、`GET /system/tenant-ops/member`、
  `GET|POST|PUT /system/tenant-ops/plan*`，配 5 个新权限码与新的「租户运营」菜单组；前端三页
  （总览、成员与配额、套餐编辑器）与 5 语言 copy 同批落地。
- **兼容模式租户作用域收口**（PR #424）：六个服务此前丢弃已解析的 `tenant_id = 0` 上下文，
  单租户页面因此能读到其它租户的行。
- **运行期发现的 5 个缺陷**（PR #427）：角色保存不同步 Casbin 视图、同租户内切换返回 500、
  安全事件确认错误码、重置密码不清锁定、权限工作台与部门路径越界。
- **无障碍与本地化**：`PasswordInput` 给全部密码面的可见性切换补 `aria-label`，
  `check:password-toggle` 进 `prebuild` 守回归；`<html lang>` 跟随当前语言。
- **boundary ratchet 执行完毕**：`MenuNode` 提升到 `frontend/src/api/menu.ts`，
  `config/boundary-baseline.json` 的 `entries` 为空数组。
- **依赖**：前端 6 个 npm 包（#425）与 3 个 GitHub Action SHA（#426）。

发布之外本轮不新增任何生产运行时逻辑；缺陷修复已在 #424 与 #427 合入。

## Primary Layer

system/iam

套餐定义、租户运营读面与前端控制台都在 `modules/system/iam/tenant` 与其前端对偶里；新的表、
权限码与路由归 IAM 域所有。选择它而不是 `platform`，因为 platform 只被菜单聚合与 `MenuNode`
契约提升间接影响。

## Workspace Context

- Target Repository: `pantheon-base`
- Repository Role: `foundation-source`
- Upstream Dependencies: `pantheon-harness`
- Downstream Consumers: `pantheon-ops`
- Sync Expectation: `required`
- Release Requirement: `foundation-release`
- Downstream Sync Note: **schema 从 29 升到 30**（`000030_tenant_plan_definitions`），
  `pantheon-ops` 推进 pin 后必须跑迁移；新增 5 个权限码与「租户运营」菜单组是 additive，
  旧角色不受影响，但要看到新页面需要重跑 runtime seed 或显式授权；
  `sharedPaths` 未变，消费面只有 `foundation-release.lock.json`。
- 本机限制：Git Bash 无 npm，前端一律用 `node node_modules/<tool>/bin/...` 直接调用；
  `go test` 里的生成模块用例需要 `PANTHEON_NODE_BIN` 与 `PANTHEON_WORKSPACE_ROOT`
  （见 `.harness/evidence/2026-10-24-single-tenant-scope-closeout/summary.md` 的 F5），
  否则 16 个用例以 `module.generate.server_export_failed` 失败——那是 node 解析问题，不是产品缺陷。
- GitHub 传输：git 与 api.github.com 是两条独立通道，会各自单独失效。

## Dependency Layers

- `platform`：`MenuNode` 从 `modules/system/iam/menu/api` 提升为公共契约后，platform 侧导入路径变化。
- `system/config`（dict）：兼容模式 reorder 与作用域修复。
- `system/org`（dept、post）：兼容模式 import/export 路径映射与租户戳写入。

## Harness Profile

- Template: `admin-platform`
- Overlay: `pantheon-base`
- Quality Profile: `permission-policy`
- Portable Failure Class: `scope-leak` / `contract-drift` / `inaccessible-control` / `hardcoded-entitlement`
- Owner Layer: `foundation-source`
- Ratchet Decision: `ratchet-executed`
- Coverage Dimensions:
  - behaviour
  - maintainability
  - architecture-fitness
  - runtime-quality

交付层级：**L2**（触碰共享契约、系统域、权限码、菜单 seed、schema 与发布链路）。

## Contract Anchors

- `docs/contracts/TENANT_CONTRACT_V1.md` §2.4（套餐定义与展示语义）、§2.5（租户运营面）：
  配额**只展示不强制**是合同里写死的边界，本轮不改。
- `docs/designs/FOUNDATION_RELEASE_MODEL.md`：四件资产、`Release Gate Summary` 前置、
  `Foundation Release Verify`。
- `docs/designs/REPOSITORY_LAYOUT.md` §8.1 / §8.3：`frontend/src/api/menu.ts` 是公共契约位置；
  boundary baseline 的 ratchet 要求提升而非长期豁免。
- `docs/VERSION_MANAGEMENT_GUIDE.md` §2.4 与 §6：patch 先例（v0.17.1–v0.17.5 全部为 patch）、
  发布检查清单与 ops 侧同步动作。

## Scope

### In

- 版本材料：`VERSION` 0.17.5 → 0.17.6、`CHANGELOG.md` 新条目、`RELEASE_NOTES_v0.17.6.md`、
  `README.md` / `README.en.md` 版本行与交付状态段、`.harness/STATUS.md`。
- 发布材料：三个 notes（release / upgrade / consumer-impact）、task packet、manifest、
  evidence 三件（`summary.md`、`review.md`、`commands.json`）与 `pr-body.md`。
- 本地验证：真库全量套件（含 `PANTHEON_NODE_BIN`）、`go build`/`vet`/`gofmt`、
  CI 口径 `golangci-lint run --new-from-rev=main ./...`、前端 tsc + eslint + `vite build`、
  全量治理 checker。
- 开 PR、看护 CI 至五个必需 context 全绿、合并。
- 在合并后的 main HEAD 上等 `Release Gate Summary` 成功，然后
  `release:foundation:cut` → 凭据预检 → `publish-foundation-release` → `check-release-assets` →
  `Foundation Release Verify`。
- 发布事实收口（tag object、四件资产 SHA-256、run id）并回写 `docs/harness` 与 STATUS。

### Out

- 配额强制（商业语义变更，合同明确排除）。
- 自助重置密码（维护者已决定交给管理员）。
- FR-016 / FR-017 的 CI 接入：4 个 checker 加 npm script 与 workflow 属门禁策略，留维护者拍板。
- SonarCloud 规则或项目配置变更。
- 已发布 v0.17.0–v0.17.5 tag 与资产的重写。
- 为通过门禁而跳过用例、放宽阈值或使用 suppression。
- `pantheon-ops` 侧改动：本包只负责把可消费产物做出来，消费在 ops 仓的任务包里收口。

## Expected Files

### Create

- `RELEASE_NOTES_v0.17.6.md`
- `docs/harness/tasks/2026-10-27-v0176-release-closeout.task.md`
- `.harness/tasks/2026-10-27-v0176-release-closeout/manifest.json`
- `.harness/evidence/2026-10-27-v0176-release-closeout/summary.md`
- `.harness/evidence/2026-10-27-v0176-release-closeout/review.md`
- `.harness/evidence/2026-10-27-v0176-release-closeout/commands.json`
- `.harness/evidence/2026-10-27-v0176-release-closeout/pr-body.md`

### Modify

- `VERSION`
- `CHANGELOG.md`
- `README.md`、`README.en.md`
- `.harness/STATUS.md`

### Do Not Touch

- `backend/pkg/database/migrations/**`（schema 已随 #427 到 30，本轮不再改）
- `backend/modules/**`、`frontend/src/**` 的任何生产代码
- `config/boundary-baseline.json`（已为空，保持为空）
- `.github/workflows/**`（门禁策略变更需维护者批准）
- `docs/contracts/**`（合同语义未变）
- 已发布的 `RELEASE_NOTES_v0.17.{0..5}.md`

## Implementation Notes

- 版本号取 **patch**（0.17.6）而不是 §2.3 字面的 minor，理由是本仓 v0.17.1→v0.17.5 的一致先例：
  0.17.x 是同一 release line 内的收口序列，`--release-line release/0.17` 保持不变。
- 发布材料 PR 先合并，再在新 main HEAD 上等 `Release Gate Summary`；目标提交必须是发布链路上被
  Release Gate 判定过的那一个，不能拿 PR head 或历史提交。
- `publish-foundation-release.mjs` 的硬前置逐项核对：worktree 干净、`releases/<tag>/manifest.json`
  的 `releaseVersion` 匹配、四件产物存在且 SHA-256 自洽、凭据预检通过、GitHub Release 不存在。
- 三个 notes 只能经 `--release-notes/--upgrade-notes/--consumer-impact` 传入，脚本不会自动读
  `RELEASE_NOTES_*.md`；沿用 v0.17.5 的做法：release notes 取仓库文件正文，另两件写在临时文件里。
- README 与 STATUS 里 tag 链接与「四件资产由 `Foundation Release Verify` 断言」属前瞻性表述，
  发布后的真实事实（tag object、资产哈希、run id）在收口提交里补写，不预先编造。

## Verification Plan

- `cd backend && go build ./... && go vet ./... && gofmt -l .`
- `cd backend && set -a; . ../.env.test; set +a; PANTHEON_NODE_BIN='D:\nodejs\node.exe' PANTHEON_WORKSPACE_ROOT='D:\workspace\go\pantheon-platform\pantheon-base' PANTHEON_TEST_DSN_REQUIRED=true PANTHEON_TEST_REDIS_REQUIRED=true go test -count=1 ./...`
- `cd backend && golangci-lint run --new-from-rev=main ./...`（CI 口径；裸跑有历史存量）
- `cd frontend && node node_modules/typescript/bin/tsc -b`
- `cd frontend && node node_modules/eslint/bin/eslint.js src tests --max-warnings 0`
- `cd frontend && node node_modules/vite/bin/vite.js build`
- `npm run -s check:docs-frontmatter && npm run -s check:task-packet -- --root . && npm run -s check:structure && npm run -s check:generated`
- `node scripts/harness/check-boundaries.mjs --strict` 与 CI 形态
  `--strict --baseline config/boundary-baseline.json`
- `node scripts/harness/check-failure-registry.mjs`
- `node scripts/harness/check-runtime-evidence.mjs --strict`
- `node scripts/harness/check-evidence.mjs --strict .harness/evidence/2026-10-27-v0176-release-closeout/commands.json`
- `node scripts/harness/check-review.mjs --strict .harness/evidence/2026-10-27-v0176-release-closeout/review.md`
- `node scripts/harness/check-inheritance-contract.mjs --root ..`（这是 workspace 级 gate：
  它读 `root/.github/pull_request_template.md` 与 `root/pantheon-ops/AGENTS.md`，
  在 base 仓内用 `--root .` 会把 base 自己的 PR 模板当成 ops 模板来判）
- `node scripts/foundation-release/cut-foundation-release.mjs --release-version pantheon-base-v0.17.6 --release-line release/0.17 --base-commit <merge-sha> --release-notes "$(cat RELEASE_NOTES_v0.17.6.md)" --upgrade-notes "$(cat <temp>/v0176-upgrade-notes.md)" --consumer-impact "$(cat <temp>/v0176-consumer-impact.md)"`
- `node scripts/foundation-release/check-release-secrets.mjs --release-version pantheon-base-v0.17.6`
- `node scripts/foundation-release/publish-foundation-release.mjs --release-version pantheon-base-v0.17.6 --release-line release/0.17 --base-commit <merge-sha> --repo duanxldragon/pantheon-base`
- `node scripts/foundation-release/check-release-assets.mjs --release-version pantheon-base-v0.17.6 --repo duanxldragon/pantheon-base`
- `gh release view pantheon-base-v0.17.6 --repo duanxldragon/pantheon-base --json assets,tagName,isDraft,isPrerelease`
- CI 决定、不由本地代替：PR 上五个必需 context、合并提交上的 `Release Gate Summary`、
  tag 上的 `Foundation Release Verify`。

## Linkage

- Task ID: `2026-10-27-v0176-release-closeout`
- Task Manifest: `.harness/tasks/2026-10-27-v0176-release-closeout/manifest.json`
- OpenSpec Change: none
- Superpowers Plan: none
- Plan References: `docs/VERSION_MANAGEMENT_GUIDE.md` §3.2 / §6、
  `docs/harness/tasks/2026-10-24-v0175-release-closeout.task.md`、
  `.harness/evidence/2026-10-24-single-tenant-scope-closeout/summary.md`（F5）
- Evidence Directory: `.harness/evidence/2026-10-27-v0176-release-closeout/`
- Review File: `.harness/evidence/2026-10-27-v0176-release-closeout/review.md`

## Evidence Required

- 真库全量套件的 ok / FAIL / SKIP 计数，且需说明 `PANTHEON_NODE_BIN` 的前置。
- `go build`、`go vet`、`gofmt`、CI 口径 golangci-lint 的结果。
- 前端 tsc、eslint `--max-warnings 0`、`vite build` 与 `prebuild` 契约链结果。
- 治理链全部 checker 的读数（task packet 用 `--root .`，boundary 两种形态都要跑）。
- SonarCloud Quality Gate 与 `main` 上未解决 issue 数。
- PR 五个必需 context 的结论与合并 SHA。
- `Release Gate Summary` 在发布目标提交上的 run 与结论。
- 凭据预检结果（扫描文件数、0 命中，脱敏）。
- 四件资产的 SHA-256、`check-release-assets` 输出、`Foundation Release Verify` run。
- 环境限制显式记录：本机 TSan、`PANTHEON_NODE_BIN`、dependabot 触发 run 拿不到
  `RELEASE_GATE_TOKEN`。

## Human Gates

- 质量门禁策略：FR-016 / FR-017 是否接入 CI、`Automate Solo PR` 在 dependabot run 上恒红的处置。
- 最终视觉/功能验收：租户运营三页与登录页改动已由维护者在 PR #427 前逐项看过。
- 发布本身不请求中途确认：门禁绿灯 + evidence 即视为放行；红灯处置属于上一项。

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
- [x] 版本材料六件更新到 v0.17.6，内容与 `RELEASE_NOTES_v0.17.6.md` 一致。
- [x] task packet 13 段齐备，`check:task-packet --root .` 0 error。
- [x] manifest 与 evidence 三件通过 `check-evidence --strict` 与 `check-review --strict`。
- [x] 真库全量套件在设置 `PANTHEON_NODE_BIN` / `PANTHEON_WORKSPACE_ROOT` 后 0 FAIL、0 SKIP。
- [x] 后端 build / vet / gofmt / CI 口径 lint 干净。
- [x] 前端 tsc / eslint / 契约链 / build 干净。
- [x] 治理链（含 boundary 两种形态）全绿。
- [x] SonarCloud Quality Gate OK，`main` 未解决 issue 为 0。
- [x] 发布材料 PR 合并，五个必需 context 全绿。
- [ ] 合并后的 main HEAD 上 `Release Gate Summary` 成功。
- [ ] `release:foundation:cut` 产出 `releases/pantheon-base-v0.17.6/` 与 `dist/` 四件产物。
- [ ] 凭据预检 0 命中。
- [ ] `pantheon-base-v0.17.6` annotated tag + GitHub Release（非 draft、非 prerelease）+ 四件资产。
- [ ] `check-release-assets` 一致，`Foundation Release Verify` run 成功。
- [ ] 发布事实（tag object、资产哈希、run id）回写并收口。
- [ ] `pantheon-ops` 侧消费另立任务包，不在本包内声明完成。
