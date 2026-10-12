# Pantheon Base - Harness 任务状态

**最后更新**: 2026-10-12
**当前版本**: v0.16.1（`pantheon-base-v0.16.1`，发布进行中）

## 当前最终验收状态

**判定：v0.16.1 发布准备中。** v0.16.0 发布时镜像了 v0.15.0 的"零产物"发布方式，导致消费侧（`pantheon-ops`）的 `foundation-release.lock.json` 至今仍锁定在 `pantheon-base-v0.13.0`。v0.16.1 是一次**补丁发布**，其唯一目的是重新产出四件可消费产物（`foundation-release-<v>.tgz` + `.sha256` + `repo.tar` + `repo.tar.sha256`），并把发布流程从"人工本地执行"改为"CI 可重复执行"。版本号与收口文档已进入候选提交，tag 与 GitHub Release 待 `Foundation Release Cut` 工作流触发后产出。

## 任务状态总览

| 状态 | 说明 |
|------|------|
| ✅ 已完成 | 全部历史任务 + 2026-10-07 整改任务包 + v0.15.0/v0.16.0 发布收口 |
| 🔄 进行中 | v0.16.1 发布收口（`2026-10-12-v0161-release-cut`） |
| 📋 待办 | `pantheon-ops` 消费 `pantheon-base-v0.16.1` |
| ⏸️ 暂停 | 无 |

## 2026-10-07 整改任务包（已收口）

- 父任务 `2026-10-07-release-readiness-remediation`：completed。
- Wave 0 子任务（`iam-data-scope` / `audit-request-body` / `auth-session-scope` / `login-log-identity` / `governance-gate-repair` / `upgrade-runbook`）：completed。
- Wave 1（`release-qualification`）：completed —— 候选提交的 CI、前端、后端、浏览器、MySQL 与治理证据齐备。
- Wave 2（`release-closeout`）：completed —— PR #368 合并、分支收口为 `main`、Release Gate 全绿、v0.15.0 发布。
- P1 followup（`performance-followup` / `ui-maintainability-followup`）：completed。

## 发布收口（v0.16.1）

- **版本**：`VERSION` = 0.16.1；tag `pantheon-base-v0.16.1`；GitHub Release 待 `Foundation Release Cut` 工作流产出。
- **性质**：补丁发布，**零消费侧接口变更**——无路由、权限码、菜单 seed、i18n key 或契约形状变动；`sharedPaths` 52 项与 v0.13.0 清单逐字节一致。
- **修复**：恢复四件可消费产物。v0.14.0 / v0.15.0 / v0.16.0 各发布 **0** 件产物，而 v0.12.1 / v0.13.0 各发布 **4** 件；消费侧锁因此长期停留在 v0.13.0。v0.16.1 是 v0.13.0 之后第一个可消费发布。
- **新增**：
  - `.github/workflows/foundation-release-cut.yml` —— 仅 `workflow_dispatch` 触发，在 CI 中执行 `release:foundation:cut` + `check:release-assets --local-only` + `release:foundation:publish`，默认 `dry_run=true`。所有输入经作业级 `env` 传递（规避 `githubactions:S7630` 脚本注入），发布用凭据由 `gh auth setup-git` 提供而非 `persist-credentials`。
  - `.github/workflows/foundation-release-verify.yml` —— Release 发布后自动核对四件产物（`release: [published]`）。
  - `.github/workflows/foundation-release-backfill.yml` —— 对历史 tag 补产物的手动回填通道（默认 dry-run）。
  - `scripts/foundation-release/check-release-assets.mjs` + 21 条无外部依赖测试 —— 四件产物契约的机器可校验门。
- **为什么必须由 CI 发布**：`publish-foundation-release.mjs` 强制要求目标提交上存在成功的 `Release Gate Summary` 检查运行，且本地发布脚本在本机无法执行（Node 无法 `spawnSync` 任何子进程，`git`/`gh`/`tar` 均返回 `EBUSY`，已在关闭沙箱后复测确认）。CI 发布同时天然满足"工作区干净"前置条件。
- **任务包**：`.harness/tasks/2026-10-12-v0161-release-cut/`。
- **消费侧前置校验（已通过）**：`sharedPaths` 52/52 一致；业务叠加装配的 6 个锚点在 v0.16.1 基线上各命中恰好一次。

## 发布收口（v0.16.0）

- **版本**：`VERSION` = 0.16.0；tag `pantheon-base-v0.16.0`；GitHub Release 已发布（**0 件产物**）。
- **性质**：内部工程发布（minor），**零消费侧接口变更**——无路由、权限码、菜单 seed、i18n key 或契约形状变动。
- **范围**：
  - #371 前后端命名与目录对齐（Go 包名 == 目录名；`frontend/src/modules/system/*` 镜像后端三层结构；`core/permissions`/`core/settings` 单数化、`AppLayout.tsx` 拆出 `index.tsx`）。
  - #372/#373/#374 冒烟分层（L0 静态 / L1 关键路径 / L2 模块 / L3 全量）并按业务模块拆分 `system-pages.spec.ts`；新增路径驱动的 `scripts/resolve-smoke-modules.mjs` 与 CI `pr-smoke-modules` 作业。
  - #370 清除 Dependabot #43（`sprintf-js` DoS，dev 依赖）；#374 清除拆分浮出的 17 条 SonarCloud 异味；#375 删除空 `openspec/` 骨架。
- **质量**：SonarCloud 未解决项 0、整体重复率 2.8%；CodeQL 0 error/critical；Dependabot 0 high/critical。
- **任务包**：`.harness/tasks/2026-10-12-v0160-release-closeout/`。

## 发布收口（v0.15.0）

- **版本**：`VERSION` = 0.15.0；tag `pantheon-base-v0.15.0`；GitHub Release 已发布。
- **安全**：SSRF IPv4 denylist 改为字节字面量构造（`backend/pkg/security/ssrf/validator.go`），清除 6 条 `go:S1313`；SonarCloud 未解决项为 0。
- **CI**：`Full Smoke` 窄屏弹层用例改为等待弹层稳定后再测量，消除测量时序 flake；必需检查与 Release Gate 全绿。
- **文档**：README（zh/en）移除里程碑/成熟度叙事并对齐 v0.15.0；过期报告归档至 `.harness/archive/2026-10/`。

## Dependabot 安全整改（2026-10-11）

- **告警**：#43 `sprintf-js`（GHSA-hp3w-g68c-fv3c / CVE-2026-97058，medium，dev 依赖，manifest `frontend/package-lock.json`）。
- **根因**：`nyc` / `vite-plugin-istanbul` → `@istanbuljs/load-nyc-config@1.1.0` → `js-yaml@3.15.2` → `argparse@1.0.10` → `sprintf-js@1.0.3`；上游最新版 1.1.3 仍在受影响区间（`<= 1.1.3`），无可用补丁版本。
- **修复**：`frontend/package.json` 增加 `overrides`，将 `@istanbuljs/load-nyc-config` 的 `js-yaml` 固定到顶层 `^5.4.2`；lockfile 仅移除 4 个孤立条目（45 行删除，零版本漂移）。
- **验证**：`npm ls sprintf-js` 为空；`npm ci --dry-run` 通过；`load-nyc-config` YAML 解析 PASS；lint / type-check 通过。
- **任务**：`.harness/tasks/2026-10-11-dependabot-sprintf-js-dos/manifest.json`。

## 归档

- 历史任务（116 个）见 [ARCHIVE.md](./ARCHIVE.md)。
- 2026-10 过期文档见 `.harness/archive/2026-10/`。

## 质量指标

- SonarCloud：Security Rating A，未解决项 0。
- CodeQL：0 open error/critical；Dependabot：0 high/critical。
- 覆盖率 / 重复率 / Lint / Docs Governance：达标。

## 维护者

duanxldragon
