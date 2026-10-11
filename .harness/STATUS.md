# Pantheon Base - Harness 任务状态

**最后更新**: 2026-10-11
**当前版本**: v0.15.0（`pantheon-base-v0.15.0`）

## 当前最终验收状态

**判定：发布收口完成。** 2026-10-07 最终验收报告所列 F01–F06 与 G01–G03 的代码、治理与文档修复均已收口；同一候选提交的 GitHub 必需检查与 Release Gate 全绿，SonarCloud 未解决项清零，v0.15.0 已作为不可变 tag 与 GitHub Release 发布。本地与远端仅保留 `main` 分支。

## 任务状态总览

| 状态 | 说明 |
|------|------|
| ✅ 已完成 | 全部历史任务 + 2026-10-07 整改任务包 + 发布收口 |
| 🔄 进行中 | 无 |
| 📋 待办 | 无 |
| ⏸️ 暂停 | 无 |

## 2026-10-07 整改任务包（已收口）

- 父任务 `2026-10-07-release-readiness-remediation`：completed。
- Wave 0 子任务（`iam-data-scope` / `audit-request-body` / `auth-session-scope` / `login-log-identity` / `governance-gate-repair` / `upgrade-runbook`）：completed。
- Wave 1（`release-qualification`）：completed —— 候选提交的 CI、前端、后端、浏览器、MySQL 与治理证据齐备。
- Wave 2（`release-closeout`）：completed —— PR #368 合并、分支收口为 `main`、Release Gate 全绿、v0.15.0 发布。
- P1 followup（`performance-followup` / `ui-maintainability-followup`）：completed。

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
