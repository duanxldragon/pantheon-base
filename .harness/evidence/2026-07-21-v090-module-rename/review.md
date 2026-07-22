# 2026-07-21-v090-module-rename — Review

## 范围核对（In / Out）

- In: module rename (go.mod + 142 .go + 生成器模板 + smoke 断言 + cleanup/drift)、三项门禁（depguard/boundary/coverage/MFA 文档）。
- Out: 业务逻辑/接口/权限/菜单/i18n 变更（仅 import 路径）、VERSION 文件、govulncheck 修复（PR #190）、ops lock 升级。

## 风险与回退

- 全局重命名风险：已通过 5 个原子 commit 拆分（T01-T05），可逐个 `git revert`。
- sed 误伤：替换模式带前导引号，物理路径与叙述文本不命中，残留 grep 0 验证。
- depguard glob：`modules/business/**/*.go` 不生效，POC 后改 `**/modules/business/**`，注入验证可拦截、全量无误伤。
- boundary 脚本 cwd 定位 bug：CI 内 `path.basename(root) === repoName` 回退修复，仓库内/工作区根两种调用均 exit 0。

## 质量关卡

- 工程师全局一致性审查：IS_PASS: YES。
- QA 独立验证：路由判定 NoOne（10 项全过）。

## 遗留

- 全量 lint 存量 98 项（gosec45/revive50/staticcheck3）为历史问题，go-lint PR report-only。
- 覆盖率阈值 11% 为起点，后续版本 ratchet 抬升。
- 仓库根历史 CodeQL/Dependabot 分析临时文件待清理。

Reviewer: software-team (lead Qi). Maintainer sign-off: 待打 tag 前确认。
