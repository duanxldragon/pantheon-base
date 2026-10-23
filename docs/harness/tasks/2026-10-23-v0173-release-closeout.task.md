---
title: v0.17.3 发布收口任务包（发布凭据门禁覆盖 repo.tar + 证据勘误 + 发布）
doc_type: Remediation
layer: platform
depends_on_layers:
  - platform
status: Active
linked_contracts:
  - docs/designs/FOUNDATION_RELEASE_MODEL.md
  - docs/contracts/PLATFORM_CONTRACT.md
updated_at: 2026-10-23
---

# Task Packet: 2026-10-23-v0173-release-closeout

## Goal

v0.17.2 发布后，对照已发布代码与证据包做了一轮复核，登记 R-1…R-5 并已在 PR #414（合并为
`933ffddd`）修复。本包把修复内容发布为 `v0.17.3`，让下一份可消费资产实际携带修正后的门禁与证据：

1. **发布凭据门禁覆盖 `repo.tar`（R-1，P1）**：v0.17.2 的预检只扫描 `bundle/`，
   而 v0.17.0 的凭据残留位于 tracked 证据文件，只随全量快照 `repo.tar` 分发。
   现同时扫描两种资产，`repo.tar` 缺失即失败关闭，并以回归用例钉住
   `.harness/archive/.../commands.json` 这条真实残留路径。
2. **证据勘误（R-2，P2）**：v0.17.2 证据中有三处表述与代码不符——死锁修复被写成 1213 重试、
   扫描器被写成 18 例且含 PEM/JWT、发布门禁被写成覆盖整个发布。以勘误方式修正并保留原始声明。
3. **发布状态与重复注释（R-3/R-5，P3）**：`STATUS` 在打标后仍写「发布中」；
   `GetTenantByID` 有一行重复的文档注释。前者改为已发布并核对 tag commit，后者仅删注释。
4. **租户选择器烟测稳定化（R-4，P2）**：窄视口用例在 Arco 弹层首帧居中定位时测量文档溢出，
   CI 采样到 87px 假阳性。改为等待弹层与触发器对齐后再测量，溢出断言与边界保持不变。

R-1/R-4 都按「消除条件」处理，不放松断言；FR-015 记录发布门禁覆盖缺口。
本发布没有运行时行为变更：生产代码只有一行注释差异，数据库 schema 仍为 29，
无路由、权限码、菜单 seed 或错误信封变化。

## Primary Layer

platform

改动集中在发布脚本（`scripts/foundation-release/`）、烟测与证据文件；其余为版本材料。

## Workspace Context

- Target Repository: `pantheon-base`
- Repository Role: `foundation-source`
- Upstream Dependencies: `pantheon-harness`
- Downstream Consumers: `pantheon-ops`
- Sync Expectation: `not-required`
- Release Requirement: `foundation-release`
- Downstream Sync Note: 无消费侧接口、schema 或权限变化；`pantheon-ops` 可继续停留在
  v0.17.2，或把锁推进到 v0.17.3 以取得修正后的发布门禁与证据。

## Dependency Layers

- `platform`：`scripts/foundation-release/{check-release-secrets,publish-foundation-release}.mjs`、
  `frontend/tests/smoke-core/auth-tenant-picker.spec.ts`。
- 文档层：`CHANGELOG.md`、`RELEASE_NOTES_v0.17.3.md`、`README(.en).md`、`.harness/STATUS.md`、`VERSION`。
- 证据层：v0.17.2 任务包的勘误、R-1…R-5 复核记录与 FR-015 登记。

## Harness Profile

- Template: `admin-platform`
- Overlay: `pantheon-base`
- Quality Profile: `permission-policy`
- Portable Failure Class: `static-sensor-gap` / `evidence-drift` / `measurement-race`
- Owner Layer: `consumer-repository`
- Ratchet Decision: `gate-updated`
- Coverage Dimensions:
  - runtime-quality
  - maintainability
  - architecture-fitness

## Contract Anchors

- `docs/designs/FOUNDATION_RELEASE_MODEL.md` §2.2（release 是消费接口）、§4（release 最低定义与四件资产）。
- `docs/contracts/PLATFORM_CONTRACT.md`：平台层职责与发布边界。
- `docs/harness/VERIFICATION_EVIDENCE_SPEC.md`：证据必须对应实际执行的命令与结果。

## Scope

### In

- 发布凭据预检同时扫描 `bundle/` 与 `repo.tar`，`repo.tar` 缺失时失败关闭；
  报告保持脱敏，规则集不放宽。
- 发布流程在打标前调用扩展后的预检；回归用例覆盖 `repo.tar` 残留、干净快照与缺失快照。
- 窄视口租户选择器烟测等待 Arco 弹层与触发器对齐后再断言溢出。
- v0.17.2 证据勘误（summary / review / commands / manifest / STATUS / RELEASE_NOTES）。
- 删除 `GetTenantByID` 的重复注释行。
- 版本材料：`VERSION` → 0.17.3、`CHANGELOG.md`、`RELEASE_NOTES_v0.17.3.md`、`README(.en).md`、`.harness/STATUS.md`。
- 按 `docs/VERSION_MANAGEMENT_GUIDE.md` §6 发布 `pantheon-base-v0.17.3` 四件资产。

### Out

- 任何生产运行时逻辑、数据库 schema（保持 29）与迁移。
- 路由、权限码、菜单 seed、错误信封与租户生命周期语义。
- 追溯修改已发布的 v0.17.0 / v0.17.1 / v0.17.2 tag 与资产。
- 放宽任何门禁阈值、跳过测试或以 suppression 换取绿灯。

## Expected Files

### Create

- `RELEASE_NOTES_v0.17.3.md`
- `docs/harness/tasks/2026-10-23-v0173-release-closeout.task.md`
- `.harness/tasks/2026-10-23-v0173-release-closeout/manifest.json`
- `.harness/evidence/2026-10-23-v0173-release-closeout/{summary.md,review.md,commands.json}`

### Modify

- `VERSION`
- `CHANGELOG.md`
- `README.md`
- `README.en.md`
- `.harness/STATUS.md`

### Do Not Touch

- `backend/**` 生产代码（本轮只随 v0.17.3 发布已合入的修复，不再修改）
- `backend/pkg/database/migrations/**`
- `.github/workflows/**`
- 已发布的 v0.17.0 / v0.17.1 / v0.17.2 tag 与资产

## Implementation Notes

- 发布说明只陈述 v0.17.2 之后实际合入的变更（commit `b13fbf33`、`933ffddd`），
  不把 v0.17.2 的缺陷修复重复计入 v0.17.3。
- `cut-foundation-release.mjs` 不会自动读取 `RELEASE_NOTES_*.md`；必须显式传
  `--release-notes`、`--upgrade-notes`、`--consumer-impact`，否则发布元数据会写
  “No … provided.”。
- 发布门禁保持 `Release Gate Summary` 在目标提交上 success 的硬前置；凭据预检在打标之前运行。
- `repo.tar` 扫描把归档复制进临时目录后再解包，避免 Git-for-Windows GNU tar 把绝对
  Windows 路径解释为远端主机；扫描报告继续只输出文件、行号与掩码。
- 发布资产不可回滚，因此 v0.17.3 的验证证据在打标前保存，发布后只追加事实。

## Verification Plan

- `node --test tests/scripts/foundation-release/check-release-secrets.test.mjs`
- `npm run -s test:foundation-release`
- `node scripts/foundation-release/check-release-secrets.mjs --path tests/scripts/foundation-release`
- `npm run -s check:docs-frontmatter && npm run -s check:task-packet && npm run -s check:structure && npm run -s check:generated`
- `node scripts/harness/check-failure-registry.mjs`
- `cd frontend && npx tsc --noEmit && npx eslint tests/smoke-core/auth-tenant-picker.spec.ts --max-warnings 0`
- `cd frontend && npx playwright test tests/smoke-core/auth-tenant-picker.spec.ts`
- `node scripts/foundation-release/cut-foundation-release.mjs --release-version pantheon-base-v0.17.3 --release-line release/0.17 --base-commit <merge-sha> --release-notes <file> --upgrade-notes <text> --consumer-impact <text>`
- `node scripts/foundation-release/check-release-secrets.mjs --release-version pantheon-base-v0.17.3`
- `node scripts/foundation-release/publish-foundation-release.mjs --release-version pantheon-base-v0.17.3 --release-line release/0.17 --base-commit <merge-sha> --repo duanxldragon/pantheon-base --remote github-api`
- `node scripts/foundation-release/check-release-assets.mjs --release-version pantheon-base-v0.17.3`
- `gh release view pantheon-base-v0.17.3 --json assets,tagName,isDraft,isPrerelease`

## Linkage

- Task ID: `2026-10-23-v0173-release-closeout`
- Task Manifest: `.harness/tasks/2026-10-23-v0173-release-closeout/manifest.json`
- OpenSpec Change: none
- Superpowers Plan: none
- Plan References: `docs/VERSION_MANAGEMENT_GUIDE.md` §6、`.harness/evidence/2026-10-23-residual-closeout/review.md`（发布后复核 addendum）
- Evidence Directory: `.harness/evidence/2026-10-23-v0173-release-closeout/`
- Review File: `.harness/evidence/2026-10-23-v0173-release-closeout/review.md`

## Evidence Required

- 扫描器单测与 foundation-release 套件的通过计数。
- 真实 v0.17.3 发布资产的凭据扫描结果（文件数、0 命中）。
- 治理检查（frontmatter / task packet / structure / generated / failure registry）结果。
- 窄视口租户选择器烟测结果。
- `Release Gate Summary` 在合并提交上的结论。
- 四件资产的 SHA-256 与 `Foundation Release Verify` run。
- 发布命令的实际参数与 `gh release view` 输出（脱敏）。

## Human Gates

- 维护者最终验收（版本号与发布说明口径）。
- 发布动作（tag / Release 资产）按仓库治理执行。

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
