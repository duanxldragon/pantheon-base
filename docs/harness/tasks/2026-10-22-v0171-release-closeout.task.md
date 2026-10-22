---
title: v0.17.1 交付收口任务包（Release Gate + 租户生命周期 + UI 一致性 + 发布）
doc_type: Remediation
layer: platform
depends_on_layers:
  - system/iam
status: Active
linked_contracts:
  - docs/contracts/TENANT_CONTRACT_V1.md
  - docs/contracts/PLATFORM_CONTRACT.md
updated_at: 2026-10-22
---

# Task Packet: 2026-10-22-v0171-release-closeout

## Goal

2026-10-22 的独立交付验收（基线 `main 92b94474` / 发布 `v0.17.0 → 728feb2b`）判定 **FAIL（暂不可交付）**：
无 P0，但三项交付完整性阻塞，另有两项验收新发现的租户生命周期缺口与一处 UI 不一致。本包把它们一次收口，
并从脱敏后的主干发布 `v0.17.1`：

1. **主干 Release Gate 红**：`92b94474` 有 8 条未处理 SonarCloud 问题，主干切不出任何发布。
2. **整改未落库**：`fix/tenant-plan-entitlements-and-audit` 工作区 30 个修改 + 4 个未跟踪文件、无 evidence。
3. **消费侧文档矛盾**：README 写 v0.16.1；`TENANT_API` 记 `/api/v1/tenants*`（实测 404）；scope 矩阵称单租户；
   部署指南无 `tenant_mode`。
4. **归档租户无法删除**：§2.1 把归档定义为退场路径，§2.2 禁止移除最后 owner，两者叠加使已开通租户永远删不掉。
5. **初始化失败残留租户行**：provisioning 失败后租户行留存，占着 UNIQUE `code` 且无 owner，只能手工修。
6. **字典页治理栏样式不一致**：三个指标下各有描述文案，其余系统列表只有 label + value。

## Primary Layer

platform

改动集中在 `system/iam/tenant`（生命周期）、`frontend/src/modules/system/config/dict` 与 `core` 侧 i18n，
其余为文档与版本材料。

## Workspace Context

- Target Repository: `pantheon-base`
- Repository Role: `foundation-source`
- Upstream Dependencies: `pantheon-harness`
- Downstream Consumers: `pantheon-ops`
- Sync Expectation: `required`
- Release Requirement: `foundation-release`
- Downstream Sync Note: 无消费侧接口变更、无新增迁移；`pantheon-ops` 可把锁推进到 v0.17.1。

## Dependency Layers

- `system/iam`：`tenant_service.go`（删除与创建补偿）、`tenant_lifecycle_guard_test.go`（新增用例）。
- `platform`：`DictPage.tsx`、5 个语言包。
- 文档层：`CHANGELOG.md`、`RELEASE_NOTES_v0.17.1.md`、`README(.en).md`、`.harness/STATUS.md`、`VERSION`。

## Harness Profile

- Template: `admin-platform`
- Overlay: `pantheon-base`
- Quality Profile: `permission-policy`
- Portable Failure Class: `gate-debt-blocks-release` / `lifecycle-deadlock` / `half-initialized-entity` /
  `ui-pattern-drift`
- Owner Layer: `consumer-repository`
- Ratchet Decision: `checker-tightened`
- Coverage Dimensions:
  - behaviour
  - maintainability
  - architecture-fitness

## Contract Anchors

- `docs/contracts/TENANT_CONTRACT_V1.md` §2.1（archived 终态与退场路径）、§2.2（非归档租户至少一个 owner）、
  §2.3（平台全局占位不可删除）、§5（错误码语义）。
- `docs/contracts/PLATFORM_CONTRACT.md`：平台能力面与文档职责。
- `AGENTS.md`：验证后才能声称完成；触碰系统域升到 `L2`；UI 变更需渲染证据。

## Scope

### In

- `backend/modules/system/iam/tenant/tenant_service.go`：`DeleteTenant` 对归档租户放行并在同一事务内停用成员；
  `CreateTenant` 在 provisioning 失败时补偿删除租户行。
- `backend/modules/system/iam/tenant/tenant_lifecycle_guard_test.go`：新增 2 条真库用例（归档删除、初始化回滚）。
- `backend/pkg/database/migrations/000020_tenant_phase1_core_tables.down.sql`：每个破坏性步骤改为先查
  `information_schema`，修复回滚链在 `000024.down` 已删列后报 `Error 1091` 中断的问题（forward 路径不变）。
- `backend/pkg/database/migrate_down_test.go`：新增 `TestMigrationChainRollsBackAndReapplies`（up→down→up）。
- `frontend/src/modules/system/config/dict/DictPage.tsx`：移除三个指标的 `description`。
- `frontend/src/assets/list-page.css`：设置页治理栏四个指标保持单行（页面级覆盖，`auto-fit` 下限 120→96px），
  960px 以上一行、≤920px 移动断点回到 2×2，其他系统页不受影响。
- `frontend/src/i18n/resources/{zh-CN,en-US,ja-JP,ko-KR,fr-FR}.ts`：删除随之失效的 3 个 key。
- 版本材料：`VERSION` → 0.17.1、`CHANGELOG.md`、`RELEASE_NOTES_v0.17.1.md`、`README(.en).md`、`.harness/STATUS.md`。
- 收口任务包：`2026-10-22-delivery-audit-remediation` 置 `completed`。

### Out

- Casbin 模型、权限判定语义、`PlatformCapabilityMiddleware` 规则。
- 数据库 schema 版本与 forward 迁移（保持 29）；本轮只动 down 路径的守卫。
- 并发 provisioning 串行化（B7）、Redis fail-open（A5）、审计表索引（C5）、ja/ko/fr 翻译覆盖（E4）。
- 替换或重写已发布的 v0.17.0 资产。

## Expected Files

### Create

- `RELEASE_NOTES_v0.17.1.md`
- `docs/harness/tasks/2026-10-22-v0171-release-closeout.task.md`
- `.harness/tasks/2026-10-22-v0171-release-closeout/manifest.json`
- `.harness/evidence/2026-10-22-v0171-release-closeout/{summary.md,review.md,commands.json}`

### Modify

- `backend/modules/system/iam/tenant/{tenant_service.go,tenant_lifecycle_guard_test.go}`
- `frontend/src/modules/system/config/dict/DictPage.tsx`
- `frontend/src/i18n/resources/*.ts`
- `VERSION`、`CHANGELOG.md`、`README.md`、`README.en.md`、`.harness/STATUS.md`
- `.harness/tasks/2026-10-22-delivery-audit-remediation/manifest.json`

### Do Not Touch

- `backend/pkg/database/migrations/**`
- `backend/internal/middleware/platform_capability_middleware.go`
- `.github/workflows/**`（门禁阈值与 required checks 不变）
- 已发布的 `v0.17.0` tag 与资产

## Implementation Notes

- `DeleteTenant` 先读行拿 `status`，再判成员：`memberCount > 0 && status != archived` 仍返回
  `tenant.has_active_members`；归档租户则在事务内把 active 成员置 `disabled`，再释放编码、置 `deleted`。
  这样既守住 §2.2（只约束非归档租户），又让 §2.1 的退场路径可达。
- `CreateTenant` 的补偿删除用 `Unscoped().Delete`：行从未可用，保留它只会占用 UNIQUE `code` 且违反 §2.2；
  删除失败时记录原始错误与回滚错误，不掩盖首个失败原因。
- 字典页只删 `description` 字段，不动 `label`/`value`/`action`；说明信息仍在治理抽屉（`GovernanceRailSummary`）。
- 版本材料按 `docs/VERSION_MANAGEMENT_GUIDE.md` §6 清单推进；patch 发布，无迁移、无接口变更。

## Verification Plan

- `cd backend && go build ./... && go vet ./... && gofmt -l .`
- `cd backend && PANTHEON_TEST_DSN=<real mysql> PANTHEON_TEST_DSN_REQUIRED=true PANTHEON_TEST_REDIS_REQUIRED=true go test ./...`
- `cd backend && go test -count=1 ./modules/system/iam/tenant/ ./modules/system/iam/user/ ./modules/system/iam/role/ ./modules/system/iam/permission/`
- `cd frontend && ./node_modules/.bin/tsc --noEmit && ./node_modules/.bin/eslint src --max-warnings 0 && ./node_modules/.bin/vitest run && npm run prebuild && ./node_modules/.bin/vite build`
- 浏览器验收：字典页与用户/岗位页治理栏对比截图，17 路由 0 console error、0 个 `/api/` ≥400。
- `npm run check:docs-frontmatter && npm run check:task-packet && npm run check:structure`
- 发布后：`node scripts/foundation-release/check-release-assets.mjs --release-version pantheon-base-v0.17.1`

## Linkage

- Task ID: `2026-10-22-v0171-release-closeout`
- Task Manifest: `.harness/tasks/2026-10-22-v0171-release-closeout/manifest.json`
- OpenSpec Change: none
- Superpowers Plan: none
- Plan References: `docs/contracts/TENANT_CONTRACT_V1.md`、`docs/reviews/PANTHEON_BASE_DELIVERY_ASSESSMENT.md`（仓库外验收报告）
- Evidence Directory: `.harness/evidence/2026-10-22-v0171-release-closeout/`
- Review File: `.harness/evidence/2026-10-22-v0171-release-closeout/review.md`

## Evidence Required

- 后端 build/vet/gofmt 与真库全量测试输出（0 失败 0 跳过）。
- 4 条生命周期用例的真库运行结果。
- 前端 tsc/eslint/vitest/prebuild/vite build 结果。
- 字典页与用户/岗位页治理栏对比截图与 DOM 证据。
- `Release Gate` / `CI` / `Smoke` / `Tenant Smoke` 在发布提交上的结论。
- 四件发布产物的 checksum 与 `Foundation Release Verify` run。
- 环境限制声明（本机 `-race` 不可跑；Sonar 判定由 CI 给出）。

## Human Gates

- 维护者最终验收（版本号与发布说明口径）。
- 发布动作（tag / Release 资产）按仓库治理执行。

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
