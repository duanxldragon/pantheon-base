---
title: OIDC 脚手架去留必须决策（AUD-005）
doc_type: Remediation
layer: system/auth
status: Archived
depends_on_layers: []
linked_contracts:
  - docs/contracts/SYSTEM_AUTH_CONTRACT.md
  - docs/contracts/PLATFORM_CONTRACT.md
updated_at: 2026-10-31
---

# Task Packet: 2026-10-31-audit-p2-oidc-scaffold-decision

## Goal

`backend/modules/auth/oidc/` 有 587 行实现（`config.go 77` / `handler.go 115` / `provider.go 92` /
`service.go 303`），导出 `InitiateOIDCLogin`、`HandleOIDCCallback`、`GetOIDCConfig`，
**全仓非测试代码 0 引用、未注册任何路由、前端 0 命中**；同时
`docs/contracts/SYSTEM_AUTH_CONTRACT.md:168` 明确写着“未明确身份源前，不提前实现真实 SSO/OIDC”。

这是**代码违反自己的合同**，不是文档过期。它已存在一年多的迁移 `000029_oidc_fields`
（`oidc_subject/oidc_provider/oidc_last_sync/auth_type`）也一并进入了版本链。

本包不预设结论，只要求**做出决策并落盘**，因为现状的真实代价是：下一位维护者看到 587 行实现
会以为 OIDC 是已交付能力，看到合同禁令又会以为该删——**没人能判断该删还是该补**。

## Primary Layer

system/auth

## Dependency Layers

- `system/auth`（`modules/auth/oidc`、迁移、`.env.example`）
- 不触碰 `pkg/tenant`、Casbin、数据权限或业务域。

## Workspace Context

- Target Repository: `pantheon-base`
- Repository Role: `foundation-source`
- Upstream Dependencies: `pantheon-harness`
- Downstream Consumers: `pantheon-ops`
- Sync Expectation: none
- Release Requirement: foundation-release
- Downstream Sync Note: 若选删除并 drop 列，属 schema 变更，消费仓需在一次 release 内跟进；
  若选保留/补齐，无 schema 变更。

## Harness Profile

- Template: `admin-platform`
- Overlay: `pantheon-base`
- Quality Profile: `decision-record`
- Portable Failure Class: `premature-abstraction`
- Owner Layer: `foundation-source`
- Ratchet Decision: `guide-updated`
- Coverage Dimensions:
  - architecture-fitness
  - maintainability

交付层级：**L1**（决策 + 可能的删除；若补齐功能则升级为 L2）。

## Contract Anchors

- `docs/contracts/SYSTEM_AUTH_CONTRACT.md`：第 168 行明确“未明确身份源前不提前实现 SSO/OIDC”。
- `docs/contracts/PLATFORM_CONTRACT.md`：公共 API 与迁移变更要求。
- `docs/reviews/OIDC_RESPONSE_CONTRACT_2026-10-27.md`：既有 OIDC 响应契约记录（先读再决策）。

## Scope

### In

- 读 `docs/reviews/OIDC_RESPONSE_CONTRACT_2026-10-27.md` 与 `SYSTEM_AUTH_CONTRACT.md`，确认
  是否已有关于 OIDC 的前置决策；若已有，本包以对齐既有决策为第一优先。
- **三选一并落盘为决策记录**（写入 `.harness/evidence/.../decision.md` 并同步合同条款）：
  - **(a) 删除**：移除 `modules/auth/oidc/**`，新增一条迁移 drop 四个 `oidc_*`/`auth_type` 列
    （含 down，只重建结构不承诺恢复数据），并从 `.env.example` 移除 `PANTHEON_OIDC_*` 示例；
    同时修订合同条款（若未来要做，需重新评审）。
  - **(b) 隔离**：保留实现但移入 `internal/experimental/`（或加 `//go:build experimental`），
    从可发布面移除，合同标注“实验代码，不在支持范围”。
  - **(c) 补齐**：注册路由 + 补测试 + 补 `.env.example` + 补部署文档 + 修订合同条款，
    并把 `auth_type` 纳入登录流程。
- 无论选哪个，都要修正 `SYSTEM_AUTH_CONTRACT.md:168` 与现状的矛盾：**合同与代码不能各说一套**。
- 迁移编号注意：`2026-10-31-audit-p2-dead-code-legacy-surface` 占用 `000031`，
  本包若需迁移，取合并时下一个可用号，不得复用。

### Out

- 实际接入任何真实 IdP 并做端到端联调（属选 (c) 之后的独立任务）。
- 修改 `modules/auth/login/**` 的既有本地登录链路（选 (c) 时只做必要的 `auth_type` 分支）。
- 修改 Casbin、租户、数据权限。
- 删除历史评审报告（`docs/reviews/OIDC_RESPONSE_CONTRACT_2026-10-27.md` 是决策依据，保留）。
- 顺手重构 `modules/auth` 的其他部分。

## Expected Files

### Create

- `docs/harness/tasks/2026-10-31-audit-p2-oidc-scaffold-decision.task.md`
- `.harness/tasks/2026-10-31-audit-p2-oidc-scaffold-decision/manifest.json`
- `.harness/evidence/2026-10-31-audit-p2-oidc-scaffold-decision/decision.md`
- `.harness/evidence/2026-10-31-audit-p2-oidc-scaffold-decision/{commands.json,summary.md,review.md}`

### Modify

- `docs/contracts/SYSTEM_AUTH_CONTRACT.md`（消除 :168 与现状的矛盾）
- `backend/.env.example`（移除或补齐 `PANTHEON_OIDC_*`）
- `backend/cmd/server/main.go`（仅在选 (c) 时注册路由）
- `backend/modules/auth/module.go`（仅在选 (c) 时注册路由组）

### Do Not Touch

- `backend/modules/auth/login/**`（除选 (c) 必需的 `auth_type` 分支）
- `backend/pkg/database/migrations/000029_oidc_fields.*`（已进版本链，禁止改写）
- `backend/pkg/tenant/**`
- `backend/modules/business/**`
- `pantheon-ops/**`
- `docs/reviews/OIDC_RESPONSE_CONTRACT_2026-10-27.md`

## Implementation Notes

- 先读 `OIDC_RESPONSE_CONTRACT_2026-10-27.md`：如果维护者已经就该契约做过决定，本包的任务是
  执行那个决定，而不是重新论证。
- 选 (a) 的不可逆点不是删代码（可 revert），而是 **drop 列**。所以 (a) 必须分两步：
  先删代码并观察一个 release，再单独提迁移 drop 列；不要在一次提交里同时做。
- 选 (b) 最省事但最容易被误读为“还有人在维护”：隔离目录必须配一句 `README` 说明
  “不在支持范围，不得在生产启用”，否则只是把困惑从 `modules/auth/oidc` 挪到别处。
- 选 (c) 会引入外部身份源，属安全面扩张：必须同时补 CSRF/state/nonce 校验、账号绑定策略、
  以及“本地登录与 OIDC 并存时如何判定 `auth_type`”的规则。
- 合同条款必须跟着决策改：现状是“合同禁止 + 代码存在”，任何选项都要消除这个矛盾。
- `.env.example` 是部署面文档，OIDC 变量未登记这件事本身说明它从未被当作对外能力。

## Verification Plan

- `grep -rn "oidc\." backend --include=*.go`（决策前的引用面读数）
- `grep -rn "oidc" frontend/src`（前端引用面）
- `cd backend && go build ./... && go vet ./... && go test -short ./modules/auth/...`
- 若选 (a) 第二步：迁移 up/down 往返读数 + `information_schema` 确认列已消失/重建
- 若选 (c)：新增路由的 401/302 行为读数 + 前端入口存在性
- `node scripts/harness/check-evidence.mjs --root . --strict`

## Linkage

- Task ID: `2026-10-31-audit-p2-oidc-scaffold-decision`
- Task Manifest: `.harness/tasks/2026-10-31-audit-p2-oidc-scaffold-decision/manifest.json`
- OpenSpec Change: none
- Superpowers Plan: none
- Plan References: `docs/reviews/PANTHEON_BASE_GLOBAL_AUDIT_2026-10-31.md` §3.5、`docs/contracts/SYSTEM_AUTH_CONTRACT.md`、`docs/reviews/OIDC_RESPONSE_CONTRACT_2026-10-27.md`
- Evidence Directory: `.harness/evidence/2026-10-31-audit-p2-oidc-scaffold-decision/`
- Review File: `.harness/evidence/2026-10-31-audit-p2-oidc-scaffold-decision/review.md`

## Evidence Required

- `decision.md`：三方案对比、被否方案的理由、最终选择、对合同条款的修改
- `commands.json`：引用面检索读数、构建/测试读数、迁移往返读数（若涉及）
- `summary.md`：为什么“合同禁止 + 代码存在”必须被消除；选 (a) 为何要分两步
- `review.md`：逐条 reviewer posture

## Human Gates

- **删除 OIDC 或补齐 OIDC 都是维护者决策**，本包不自行拍板；决策记录须由维护者签署。
- 若选 (a) 第二步（drop 列），需确认无环境已启用 OIDC 并留一份导出。
- 若选 (c)，属安全面扩张，需安全评审 + 至少一位非作者复核。

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
- [x] 三选一决策已落盘并由维护者确认
- [x] `SYSTEM_AUTH_CONTRACT.md:168` 与代码不再矛盾
- [x] `.env.example` 与所选方案一致
- [x] 若选 (a)，代码删除与列删除分两步，未在同一次提交完成

## Execution Result（2026-10-31·已执行）

**决策：(a) 第一步**——删除不可达实现，保留迁移与列。维护者授权"按计划推进"。

| 项 | 结果 |
|---|---|
| 删除 | `backend/modules/auth/oidc/` 4 文件 / 587 行（删前备份 `/tmp/pantheon-oidc-backup-2026-10-31/`；HEAD `ef00738` 已入库可恢复） |
| 保留 | `000029_oidc_fields.{up,down}.sql` 与 `system_user` 四个 `oidc_*` 列（可空、无消费者、`auth_type` 默认 `local`）；drop 列登记为延后事项 |
| 合同 | `SYSTEM_AUTH_CONTRACT.md §7.3` 追加处置说明（删了什么/保留什么/什么延后/证据在哪）；EN 版同步；两份 `updated_at` → 2026-10-31 |
| 验证 | `go build ./...` exit 0；`go vet ./...` exit 0；`go test -short ./modules/auth/... ./pkg/contracts/...` 全 ok；删除后引用面 0 |
| 路径更正 | 任务包原写 `backend/.env.example`（不存在），实际为仓库根 `.env.example`，且其中从未登记 `PANTHEON_OIDC_*` |
| 下游影响 | ops 仍有自己的一份副本（源码复制式消费），包外引用 0；下次 `rebuild:from-base` 随 `sharedPaths` 一并移除 |

证据：`.harness/evidence/2026-10-31-audit-p2-oidc-scaffold-decision/`（`decision.md` / `commands.json` / `summary.md` / `review.md`）。
