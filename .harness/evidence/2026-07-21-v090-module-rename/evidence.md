# v0.9.0 冻结存证 — Go module 重命名 + 三项门禁

- **日期**: 2026-07-21
- **分支**: `fix/v090-module-rename`
- **团队**: software-base-v090（主理人齐活林 / 架构师高见远 / 工程师寇豆码 / QA 严过关）
- **维护者**: 小龙

## 目标

冻结 pantheon-base v0.9.0，供 pantheon-ops 通过 foundation release 继承。处理发布前遗留问题：Go module 重命名残留 + fix-report 第四节三项门禁。

## 提交清单（原子 commit，可逐个 revert）

| Commit | 内容 |
|---|---|
| `7ce38847` | chore(scripts): add module rename + verify scripts and design docs（T01） |
| `7cd82ee5` | chore(backend): rename go module pantheon-platform → pantheon-base（T02） |
| `24ebf94f` | chore(frontend,scripts): sync generator templates, tests, cleanup/drift（T03） |
| `42c5e606` | ci: add boundary-gate + coverage-gate, depguard, MFA baseline doc（T04） |

## 改动面

1. **Go module 重命名**：`backend/go.mod` module 声明 + 142 个 `.go` 文件 339 处 import → `pantheon-base/...`（永不带 `backend/` 段）。
2. **代码生成器模板**：`backendGenerator.ts` 5 处模板 import 同步，消除 ops 新生成模块编译炸弹。
3. **测试断言与脚本**：smoke 断言 4 处、`cleanup-generated-modules.mjs` 失效正则规范化（去旧 `backend/` 段）、`triage-base-drift.mjs` 归一化。
4. **三项门禁**：depguard business-boundary（files glob `**/modules/business/**`）、`check-boundaries.mjs --repo` + CI boundary-gate、`check-coverage.mjs` + CI coverage-gate、`DEPLOYMENT_GUIDE.md` MFA 强制安全基线。

## 验证结果

- `grep -rIn '"pantheon-platform/' backend/ frontend/ scripts/` → 0 命中（仅豁免项）。
- `cd backend && go build ./... && go vet ./... && go test -race -short ./...` → 全绿。
- `node scripts/harness/check-boundaries.mjs --strict --repo pantheon-base` → exit 0（修复了 CI 内 cwd 定位 root 的边界 bug）。
- **depguard POC**：注入违规 import `_ "pantheon-base/modules/system/iam/user"` 到 business，golangci-lint depguard 正确拦截（"not allowed"）；全量扫描 depguard 0 命中、不误伤。files glob 用 `**/modules/business/**`（`modules/business/**/*.go` 不生效）。
- `node scripts/harness/check-coverage.mjs backend/coverage.txt --threshold 11` → exit 0。
- **实测总覆盖率 12.2%**（total statements），初始阈值取 90% = 11%，后续 ratchet。

## 关键决策（维护者拍板）

Q1=A 改 DEV_DB_INIT_GUIDE.md / Q2=B 设计文档只改代码示例 / Q3=POC（files glob 验证后用 `**/modules/business/**`）/ Q4=阈值取现状×0.9 / Q5=A base CI 只扫自己 / Q6=A 单 commit / Q7=A 彻底切割不留 replace。

## 遗留与后续

- `VERSION` 文件维持 harness shell 版本（1.4.0），base 产品线版本以 git tag 为载体 → 打 `pantheon-base-v0.9.0`。
- govulncheck 修复分支 `fix/codeql-log-injection-alerts`（`fb667de7`）走 PR 合并。
- 仓库根历史 CodeQL/Dependabot 分析临时文件待清理。
- 全量 lint 存量 98 项（gosec 45/revive 50/staticcheck 3）为历史问题，与本任务无关，go-lint PR 上 report-only。

**维护者 sign-off**: 待打 tag 前确认。
