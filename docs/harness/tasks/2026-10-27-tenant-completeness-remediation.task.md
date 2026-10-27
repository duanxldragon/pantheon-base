---
title: 租户功能完整性整改计划（2026-10-27 审查整改）
doc_type: Remediation
layer: system/iam
depends_on_layers:
  - system/auth
  - platform
status: Active
linked_contracts:
  - docs/reviews/TENANT_FUNCTIONAL_COMPLETENESS_REVIEW_2026-10-27.md
  - docs/contracts/TENANT_CONTRACT_V1.md
  - docs/api/TENANT_API.md
updated_at: 2026-10-27
---

# Task Packet: 2026-10-27-tenant-completeness-remediation

## Goal

2026-10-27 对租户域做了前后端与运营面的只读功能完整性审查，结论是 **单租户路径已完成，但「租户开发已完成」不成立**：
1 个 P1（跨租户成员关系只有登录、没有授权，登录选择器与租户切换器会把用户送进空菜单控制台）、
2 个 P2（`DeleteTenant` 允许删除仍为 `active` 的租户；`AddMember` 不校验用户存在，可产生幽灵 owner、
破坏「每个非归档租户至少一个 owner」）、以及 6 项 P3 漂移。

本程序把审查结论拆成 8 个可独立评审、独立回滚的波次：

- **W1** 删除守卫回到契约：非 `archived` 一律拒绝删除，前端同步禁用删除动作。
- **W2** 成员写入完整性：`AddMember` 校验用户存在，owner 计数只统计真实可登录用户，成员添加改为用户选择器。
- **W3** 多租户成员授权决策：在三个方案（收窄 / 打通 / 收缩）中拍板，产出决策文档。
- **W4** 按 W3 的决策落地（默认方案 A：收窄成员语义 + 过滤不可用租户候选）。
- **W5** 契约、API 文档与前端类型对齐（`/members/page` 未挂载、`status` 类型漂移、过期设计文档）。
- **W6** 平台租户控制台的 UI 自动化，并把 W1/W2/W4 的行为断言补进冒烟。
- **W7** 套餐能力阶梯决策（V1 Out 的商业化语义，不阻塞 V1 收口）。
- **W8** 删除租户域死入口（旧 raw-JSON handler/routes、`tenant_bootstrap.go`），无损迁移其测试。

**本程序不改数据库 schema、不执行迁移或数据修复、不升级依赖、不改动 `pantheon-ops` 业务代码。**

## Primary Layer

system/iam

## Dependency Layers

- system/auth
- platform

## Harness Profile

- Template: admin-platform
- Overlay: pantheon-base
- Quality Profile: auth-security
- Portable Failure Class: tenant-authorization-gap / contract-drift
- Owner Layer: consumer-repository
- Coverage Dimensions:
  - behaviour
  - maintainability
  - architecture-fitness
  - runtime-quality

## Contract Anchors

- `AGENTS.md`
- `CLAUDE.md`
- `docs/contracts/TENANT_CONTRACT_V1.md`
- `docs/api/TENANT_API.md`
- `docs/reviews/TENANT_FUNCTIONAL_COMPLETENESS_REVIEW_2026-10-27.md`
- `docs/runbooks/TENANT_TROUBLESHOOTING.md`
- `docs/runbooks/TENANT_MIGRATION_RUNBOOK.md`
- `docs/acceptances/CODE_REVIEW_STANDARD.md`

## Scope

### In

- 8 个波次 packet：W1–W8，全部登记在 `.harness/tasks/2026-10-27-tenant-*`
- W1：将 `DeleteTenant` 的准入守卫改为「非 `archived` 一律拒绝」；保留归档租户「有活跃成员也可删」的同事务停用逻辑；新增错误码与 i18n key；前端删除动作在非 `archived` 行禁用；同步把 13 处「删未归档租户」的既有测试夹具改为先归档（实测清单见 wave manifest Findings，不许反向放宽守卫）
- W2：`AddMember` 校验 `user_id` 对应未删除用户；`ensureNotLastOwner` 的 owner 计数 JOIN `system_user`（未删除且启用）；成员添加 UI 换成租户内用户选择器；补对应回归测试；同步把 `tenant_service_test.go` / `tenant_lifecycle_guard_test.go` / `tenant_handler_test.go` 里所有「指向不存在用户」的成员夹具改为真实用户（当前这些测试全绿，正说明校验不存在）
- W3：多租户成员授权决策文档（方案 A 收窄 / B 打通跨租户角色绑定 / C 收缩为单租户成员），含成本、失败场景与推荐
- W4：按 W3 决策落地；默认方案 A = 收窄 `AddMember` 到本租户用户 + 登录候选、自动解析与 `switchable` 过滤掉「无角色绑定」的租户
- W5：`TENANT_API.md` 删除未挂载的 `/members/page` 兼容别名描述；`MemberUsageQuery.status` 改为 `active | disabled`；`MULTI_TENANT_DESIGN.md` 加「愿景非 V1 契约」状态横幅；owner 转移按「add-owner → remove-owner」两步写明
- W6：新增租户控制台 e2e（列表 CRUD、归档/删除、成员增删、运营总览、套餐编辑）；强化登录选择器用例，使其断言「能用」而不只是「能登录」
- W7：套餐能力阶梯决策文档（A 接受「自定义 plan 仅配额、能力矩阵只管四档」并把后果写清 / B 服务端驱动 entitlements（需迁移，另立包）/ C 移除套餐 UI 门控），不计入 V1 完成度。注意这是**已文档化**的限制（`planOptions.ts:4-20`、`TenantList.tsx:256-260`、`outsideLadder` 警告），不是本次新发现的静默缺陷
- W8：删除 `tenant_handler.go`、`tenant_routes.go`、`tenant_bootstrap.go`；`tenant_handler_test.go` 的 5 个测试迁移到生产 handler/服务（分页 2 个改写到已挂载路由，envelope/no-leak/sentinel 3 个指向 `PlatformHandler`），不降低覆盖
- 每个波次独立的 manifest、evidence 目录与 review；每波合并后的 foundation release 与 `base -> ops` 同步验证

### Out

- 数据库 schema、迁移、回填或任何数据修复（含历史跨租户 membership 行的自动清理）
- 计费、售卖、升降级、账期等 §1 Out 的商业化语义
- 独立 schema/库、自定义域名、品牌、公开注册
- 把租户内角色（owner/admin/member）隐式映射为 IAM 角色（契约 §2.2 明文禁止）
- 依赖升级或新增依赖
- 修改 `pantheon-ops` 业务代码；只做兼容性验证
- 缩减 `frontend/src/index.ts` 的导出集合
- 使用维护者专属的 `solo-override` 路径
- 为了让测试通过而放宽或删除既有断言

## Expected Files

### Create

- `docs/harness/tasks/2026-10-27-tenant-completeness-remediation.task.md`
- `.harness/tasks/2026-10-27-tenant-completeness-remediation/manifest.json`
- `.harness/tasks/2026-10-27-tenant-delete-archive-guard/manifest.json`
- `.harness/tasks/2026-10-27-tenant-member-integrity/manifest.json`
- `.harness/tasks/2026-10-27-tenant-multi-membership-decision/manifest.json`
- `.harness/tasks/2026-10-27-tenant-multi-membership-authorization/manifest.json`
- `.harness/tasks/2026-10-27-tenant-contract-docs-alignment/manifest.json`
- `.harness/tasks/2026-10-27-tenant-console-ui-automation/manifest.json`
- `.harness/tasks/2026-10-27-tenant-plan-ladder-decision/manifest.json`
- `.harness/tasks/2026-10-27-tenant-dead-surface-removal/manifest.json`

### Modify

- 本波次只创建计划产物；业务代码、文档与测试由各波次 packet 声明

### Do Not Touch

- `backend/pkg/database/migrations/**`
- `database/**`
- `frontend/src/index.ts`
- `pantheon-ops/**`
- 已发布的 tag 与 release 资产

## Implementation Notes

- 波次顺序：W1、W2 可并行；W3 必须早于 W4；W5 在 W1/W2/W4 之后读取最终行为；W6 依赖 W1、W2（以及 W4 的决策结论）；W7、W8 可独立排期。
- W3/W7 是决策包，不是实现包：交付物是决策文档，不是 diff；维护者未拍板前，W4 不启动。
- 任何新增错误码或 i18n key 必须同时登记到契约 §5、`TENANT_API.md` 与前端错误映射，三处缺一按未完成处理。
- 「不可用租户候选过滤」与「成员写入校验」是同一件事的两端：只做一端会让登录选择器继续提供空菜单控制台。
- 历史数据里已经存在的跨租户 membership 不在本程序修复范围内；W4 只能保证不再**新产生**，并把它们从登录候选里**隐藏**。清理脚本单独立项。
- 每波只做一类变更，保证 `git bisect` 可用；W1 的守卫与前端禁用可以同波但分两个提交。
- Planner/Dispatcher 不得直接修改 `backend/` 与 `frontend/src/`；每个波次由 Generator 适配器执行，交接记录写入 manifest 与 evidence。
- 只有「行为可能变化」时才可以拒绝：无法证明等价或无法复现审查结论的波次，按 `abandoned` 关闭并写明原因，不允许按 `completed` 关闭。

## Verification Plan

- `cd backend && go build ./...`（2026-10-27 实测通过）
- `cd backend && go vet ./...`（实测通过）
- `export PANTHEON_TEST_DSN='<dsn>' PANTHEON_TEST_DSN_REQUIRED=true && cd backend && go test -count=1 ./...`
  （2026-10-27 实测：46 包 ok / exit 0。**必须带 DSN**：不带时 tenant 包 119 个测试里有 85 个静默 skip，整包 0.04s 报 ok，看起来是绿的其实什么都没验证）
- `export PANTHEON_TEST_DSN='<dsn>' PANTHEON_TEST_DSN_REQUIRED=true && cd backend && go test -count=1 ./modules/system/iam/tenant/... ./pkg/tenant/... ./modules/auth/... ./internal/middleware/...`
  （2026-10-27 实测：tenant 包 119 pass / 0 skip / 0 fail）
- `cd frontend && npm run build`（实测通过；prebuild 含 14 项契约检查）
- `cd frontend && npm run lint`（实测通过）
- `cd frontend && npx tsc -b`（实测通过）
- `cd frontend && npx vitest run`（2026-10-27 实测：34 文件 / 230 测试通过；无 entitlements 覆盖）
- `cd frontend && npm run check:menu-contract`
- `cd frontend && npm run check:i18n-hardcode`
- `cd frontend && npm run check:system-page-admission`
- `node scripts/harness/check-task-packet.mjs --root .`
- `node scripts/harness/check-evidence.mjs --strict .harness/evidence/<wave-task-id>/commands.json`
- `node scripts/harness/check-review.mjs --strict .harness/evidence/<wave-task-id>/review.md`
- `cd ../pantheon-ops && go build ./... && npm run build`
- W6 额外：`cd frontend && npm run test:smoke:tenant`（脚本内为 3 个矩阵/隔离 spec + viewpoint，共 4 文件；需要后端 :8080 + MySQL + Redis + `tenantmatrixdb` 夹具。2026-10-27 12:40 在实栈上实测 **15 passed / 0 failed**（矩阵 10 + 视角 5，约 95s）；5173 被占用时用 `run-smoke-suite.mjs --port 5178`，playwright 走 `PANTHEON_WEB_BASE_URL` 因此无需改测试。**夹具必须手动收尾**：runner 只调 `up`，跑完要 `tenant-matrix-fixture-setup.mjs down` + `cleanup-smoke-fixtures.mjs`。这条基线证明既有隔离用例是绿的，**不覆盖** W6 要补的控制台 CRUD/成员/套餐）

## Linkage

- Task ID: `2026-10-27-tenant-completeness-remediation`
- Task Manifest: `.harness/tasks/2026-10-27-tenant-completeness-remediation/manifest.json`
- OpenSpec Change: `none`
- Superpowers Plan: `none`
- Plan References: `docs/reviews/TENANT_FUNCTIONAL_COMPLETENESS_REVIEW_2026-10-27.md`, `docs/contracts/TENANT_CONTRACT_V1.md`, `docs/api/TENANT_API.md`
- Evidence Directory: `.harness/evidence/2026-10-27-tenant-completeness-remediation/`
- Review File: `.harness/evidence/2026-10-27-tenant-completeness-remediation/review.md`

## Evidence Required

- 每个波次的 `commands.json`：cwd、status、真实输出摘要；未执行的标注 `not-run` 与原因
- 每个波次的 `summary.md`：改动清单、`git diff --stat`、关闭的 TC 编号
- 每个波次的 `review.md`：行为变更的失败场景复现记录（W1/W2/W4 必须给出「修复前失败、修复后通过」的测试名）
- W3/W7：决策文档（选项、成本、失败场景、推荐、最终决定）
- W4：登录候选过滤前后的接口响应快照（同一用户、同一 membership 集合）
- W6：Playwright 运行输出与关键页面截图；未运行则记录 `not-run` 与环境缺口
- 程序收口 `summary.md`：8 个波次的结论汇总，明确哪些 TC 已关闭、哪些显式延期

## Human Gates

- W1：确认以「非 `archived` 一律拒绝删除」回到契约，而不是反过来放宽契约文字。
- W3：在方案 A（收窄成员语义）、B（打通跨租户角色绑定）、C（收缩为单租户成员）之间拍板。
- W4：按 W3 的结论确认实现范围；若选 B/C，本 packet 需按决策重写后再执行。
- W6：是否把 `smoke-tenant` 从 report-only 升级为阻塞门禁（涉及 CI 策略变更）。
- W7：套餐能力阶梯是否立项为 V2 商业化工作，还是维持现状并只保留配额阈值。
- W8：确认旧 handler 的测试迁移方案不会降低现有覆盖。

## Completion Checklist

- [ ] Layer and boundary declared
- [ ] Contract anchors read
- [ ] Verification run or exception recorded
- [ ] Evidence saved or summarized
- [ ] Review completed
- [ ] W1 合并：非 `archived` 租户无法删除，归档租户仍可在有成员时删除并同事务停用；13 处既有删除夹具已改为先归档而非删测试
- [ ] W2 合并：不存在的 `user_id` 无法加入成员，幽灵 owner 不再计入 owner 数，成员添加 UI 不再手输 id
- [ ] W3 有维护者签字的决策文档
- [ ] W4 合并：登录候选、自动解析与 `switchable` 不再提供无角色绑定的租户；新写入的成员关系符合决策
- [ ] W5 合并：API 文档不再登记未挂载路由，前端成员状态类型与 UI 一致，设计文档标注愿景身份
- [ ] W6 合并：租户控制台 CRUD/成员/套餐有自动化覆盖，登录选择器用例断言「能用」
- [ ] W7 有结论（立项或维持现状），且明确不计入 V1 完成度
- [ ] W8 合并：死入口删除且测试覆盖未下降
- [ ] `pantheon-ops` 能对同步后的 foundation release 构建通过
- [ ] 全程未改动 schema、迁移、权限码、菜单、i18n key（除 W1 显式新增的删除错误 key）与 `frontend/src/index.ts`
