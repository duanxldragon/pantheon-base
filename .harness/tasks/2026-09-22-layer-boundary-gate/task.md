---
task_id: 2026-09-22-layer-boundary-gate
title: Enforce production layer dependency boundaries
created: 2026-09-22
status: completed
priority: P0
layer: platform
risk: medium
---

# Task Packet — 2026-09-22-layer-boundary-gate

## 背景

`NAMING_AND_BOUNDARIES_REMEDIATION_PLAN_2026-09-22.md` Wave 1 第 3 项。结构审查确认：

生产代码里确有 `platform -> system` 与 `auth -> system/iam` 的跨层依赖，但现有门禁只覆盖

`business/*`，这些违规不会被自动阻断。规划要求“先固化可审查基线，再逐项修复或建立明确

adapter；不得通过扩大白名单隐藏违规”。

## 实际违规（本次核实）

| # | 位置 | 依赖 | 处置 |
| --- | --- | --- | --- |
| 1 | `backend/modules/platform/routes.go` | `system/org/dept` | ✅ 修复：adapter 移入组合根 |
| 2 | `backend/modules/auth/login/login_service.go` | `system/iam/user` | ⛔ 冻结基线（详见下方 gap） |
| 3 | `backend/modules/auth/login/login_runtime.go` | `system/iam/user` | ⛔ 冻结基线 |
| 4 | `backend/modules/auth/security/security_service.go` | `system/iam/user` | ⛔ 冻结基线 |
| 5 | `frontend/src/modules/platform/widgets.tsx` | `system/menu/api`（仅类型） | ⛔ 冻结基线 |
| 6–9 | 4 个 auth 页面 | `system/components/shared/list-page.css` | ⛔ 冻结基线 |

## 交付物

1. **修复 platform 违规**：新增 `backend/cmd/server/platform_org_governance.go`（组合根 adapter），
   `platform/routes.go` 去掉 `dept` import，`RegisterPlatformRoutes` 增加
   `OrgGovernanceTaskLoader` 参数，`main.go` 注入。platform 不再 import system 实现。
2. **门禁扩展**：`scripts/harness/check-boundaries.mjs` 新增 `platform` 与 `auth` 两类
   生产代码规则（后端 Go + 前端 TS），显式豁免 `_test.go` / `*.test.*` / `*.spec.*`；
   新增 `--baseline <path>` 机制：命中基线的已知项放行并回显，未命中的新违规在 `--strict`
   下 exit 1；基线中已不再命中的条目报 stale warning，防止基线腐烂。
3. **基线**：`config/boundary-baseline.json` 冻结 8 条已知违规，逐条带 `reason` 与
   `reviewBy: 2026-12-31`。
4. **CI**：`.github/workflows/ci.yml` 的 boundary 步骤改名为 “Check layer boundaries”，
   命令加 `--baseline config/boundary-baseline.json`。
5. **测试**：`tests/scripts/harness-check-boundaries.test.mjs`（6 例）。

## 为什么 auth 走基线而不是本次重构

`auth/login` 与 `auth/security` 直接以 `user.SystemUser` **GORM 模型**查询用户状态

（`s.db.Model(&user.SystemUser{})`、密码历史、MFA），不是单纯的类型引用。解除需要先定义

`UserReader/UserCredential` 契约并在组合根注入，属于安全关键（登录/会话/MFA）的结构性

重构。按规划“先固化基线，再逐项修复”的顺序，本次把它冻结为有期限的基线并写明 ratchet

方向；硬塞进一次提交会显著放大登录链路回归风险。

## 验证集合（已执行）

| 验证 | 命令 | 结果 |
| --- | --- | --- |
| 后端构建 | `go build ./...` | 通过 |
| platform + cmd vet | `go vet ./modules/platform/... ./cmd/server/...` | 干净 |
| platform 包测试 | `go test ./modules/platform/...` | ok 2.9s |
| 门禁（本仓库，基线） | `node scripts/harness/check-boundaries.mjs --strict --repo pantheon-base --baseline config/boundary-baseline.json` | 0 finding / 8 baselined / exit 0 |
| 门禁单测 | `node --test tests/scripts/harness-check-boundaries.test.mjs` | 6 pass / 0 fail |
| 结构门禁 | `node scripts/harness/check-structure-contract.mjs --root . --strict` | 0 findings |
| 文档内链 | `node scripts/harness/check-doc-links.mjs --root . --strict` | 0 findings |

## Human gate

- 无新权限面、无接口/数据库变更；`platform` 组合根改动行为等价（adapter 逻辑原样迁移）。
  变更经 PR required checks + 非作者评审把关。

## 评审视角（Reviewer 检查点）

- [x] 是否是“扩大白名单消音”？——否；新规则默认阻断，已知项进带期限的基线，且有 stale 检测。
- [x] platform 修复是否行为等价？——adapter 逐字段原样迁移，platform 包测试通过。
- [x] 测试文件是否被误伤？——`_test.go` / `*.test.*` 显式豁免并有单测覆盖。
- [x] 基线是否可追溯？——逐条 `reason` + `reviewBy`，文件头写明“不得用来消音新违规”。

## 残余 gap（显式）

- 3 个后端 auth 文件对 `system/iam/user` 的**模型级**耦合未解除（需 `UserReader` 契约 +
  组合根注入），冻结至 2026-12-31。
- `frontend/src/modules/platform/widgets.tsx` 的类型依赖、4 个 auth 页面的共享 CSS 依赖
  未迁移（需把 `MenuNode` / `list-page.css` 提升为共享契约），冻结至 2026-12-31。
- 老的 `scripts/check-arch-boundaries.mjs` 仍未接入 CI，与 `check-boundaries.mjs` 职责重叠；
  收敛属后续 ratchet。
