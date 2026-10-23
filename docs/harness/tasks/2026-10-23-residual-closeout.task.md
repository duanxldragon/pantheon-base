---
title: v0.17.2 残余项收口任务包（并发初始化死锁 + 墓碑语义 + 测试隔离 + 发布凭据预检）
doc_type: Remediation
layer: platform
depends_on_layers:
  - system/iam
  - system/auth
status: Active
linked_contracts:
  - docs/contracts/TENANT_CONTRACT_V1.md
  - docs/contracts/PLATFORM_CONTRACT.md
updated_at: 2026-10-23
---

# Task Packet: 2026-10-23-residual-closeout

## Goal

v0.17.1 在 `docs/reviews/PANTHEON_BASE_DELIVERY_REMEDIATION_2026-10-22.md` §5 显式登记了 5 项残余，
并声明它们不阻塞冻结。本包逐项关闭它们，然后发布 `v0.17.2`。

关闭过程中两项「未验证」直接变成了「验证即失败」，因此本包的核心不是重新标注，而是修缺陷：

1. **并发 provisioning 死锁**：不同 `code` 的两个租户同时创建时，设置/字典复制用
   `INSERT ... SELECT` 读同一张表，共享 next-key 锁与插入意向锁互斥，报
   `Error 1213 (40001): Deadlock found when trying to get lock`，调用方看到 500。
2. **墓碑可被复活**：`deleted` 是墓碑而非生命周期状态，但 `tenantStatusTransitionAllowed` 对未知的
   当前状态走 `default: return true`，`GetTenantByID` 又不过滤墓碑，于是 `PUT {"status":"active"}`
   能把已删除租户复活——带着删除时写入的合成编码、成员仍是停用。同一路径还允许给墓碑加成员、
   对墓碑重新初始化。

其余三项按「消除条件」处理：

3. **Redis 测试隔离度**：`go test ./...` 并行跑包且每个 `testredis.Open` 在清理时 flush 整库，
   兄弟包会把正在断言的键擦掉。改为每包独立逻辑库（`OpenDB` + 预留索引注册表）。
4. **race 检测的本地缺口**：真实原因是 `PATH` 上的 Cygwin `gcc`，不是缺工具链；
   `CC=/d/msys64/mingw64/bin/gcc.exe` 下 `-race` 可用。
5. **发布产物凭据残留**：v0.17.0 的产物不可回收（凭据已轮换），但可以消除复发条件——
   发布流程增加凭据预检，在打标之前拒绝携带凭据的 bundle。

同时把合同 §2.1 的第四态按既有 contract-change 流程补成 V1.3 澄清。

## Primary Layer

platform

改动集中在 `system/iam/tenant`（并发初始化、墓碑寻址）、`pkg/database`（唯一键冲突识别）、
`pkg/testredis`（测试隔离）与发布脚本；其余为文档与版本材料。

## Workspace Context

- Target Repository: `pantheon-base`
- Repository Role: `foundation-source`
- Upstream Dependencies: `pantheon-harness`
- Downstream Consumers: `pantheon-ops`
- Sync Expectation: `required`
- Release Requirement: `foundation-release`
- Downstream Sync Note: 无 schema 变更（仍为 29）、无接口移除或重命名；一处行为变更见下，
  `pantheon-ops` 可把锁推进到 v0.17.2。

## Dependency Layers

- `system/iam`：`tenant_service.go`（墓碑寻址、同 code 竞态错误整形）、`tenant_provision.go`（复制改为非锁定读 + 插入）。
- `platform`：`pkg/database/duplicate_key.go`（新增）、`pkg/testredis`（OpenDB 与预留索引）。
- 工具链：`scripts/foundation-release/check-release-secrets.mjs`（新增）、`publish-foundation-release.mjs`（前置调用）。
- 文档层：合同 V1.3、`CHANGELOG.md`、`RELEASE_NOTES_v0.17.2.md`、`README(.en).md`、`.harness/STATUS.md`、`VERSION`。

## Harness Profile

- Template: `admin-platform`
- Overlay: `pantheon-base`
- Quality Profile: `permission-policy`
- Portable Failure Class: `concurrent-write-deadlock` / `terminal-state-not-enforced` /
  `test-isolation-leak` / `unrecallable-release-artifact`
- Owner Layer: `consumer-repository`
- Ratchet Decision: `checker-tightened`
- Coverage Dimensions:
  - behaviour
  - maintainability
  - architecture-fitness

## Contract Anchors

- `docs/contracts/TENANT_CONTRACT_V1.md` §2.1（状态机、归档终态、V1.3 墓碑澄清）、
  §2.2（非归档租户至少一个 owner）、§5（错误码：缺失与他租户不可区分）。
- `docs/contracts/PLATFORM_CONTRACT.md`：平台能力面与文档职责。
- `AGENTS.md`：验证后才能声称完成；触碰系统域与共享合同升到 `L2`；证据与 human gate 必须留痕。

## Scope

### In

- `backend/modules/system/iam/tenant/tenant_provision.go`：`copyPlatformSettingsToTenant` /
  `copyPlatformDictsToTenant` 由 `INSERT ... SELECT` 改为「非锁定读 + 插入」，消除自引用死锁；
  幂等语义不变（既有租户行优先、跳过软删平台行、租户侧存在性检查不过滤 `deleted_at`）。
- `backend/modules/system/iam/tenant/tenant_service.go`：`GetTenantByID` 把墓碑视为不存在；
  `tenantStatusTransitionAllowed` 为 `deleted` 增加终态分支；`CreateTenant` 把 UNIQUE 冲突整形为
  `tenant.code.exists` / `tenant.code.reserved`（新增 `findTenantCodeBlocker` / `codeConflictError`）。
- `backend/pkg/database/duplicate_key.go`：`IsDuplicateKey`，同时识别 GORM 翻译错误与 MySQL 1062。
- `backend/pkg/testredis/redis.go`：`OpenDB` + `DB*` 预留索引常量；`Open` 行为不变。
- `backend/modules/system/iam/tenant/tenant_concurrency_test.go`：并发隔离与同 code 竞态两条真库用例。
- `backend/modules/system/iam/tenant/tenant_lifecycle_guard_test.go`：3 条墓碑用例。
- `scripts/foundation-release/check-release-secrets.mjs` + 测试：发布前凭据预检。
- 合同 V1.3 澄清（§2.1 + §9 变更记录 + EN 镜像）。
- 版本材料：`VERSION` → 0.17.2、`CHANGELOG.md`、`RELEASE_NOTES_v0.17.2.md`、`README(.en).md`、`.harness/STATUS.md`。

### Out

- `system_role_data_scope` / `system_role_permission` 写路径的同 code 竞态（已具备 `IsDuplicateKey`
  这个接缝，但只修了租户路径，其余登记为残余）。
- 为 `tenants.deleted_at` 补写值（合同 V1.3 明确它是预留列，两套标记会让「是否已删除」有两个答案）。
- 替换或重写已发布的 v0.17.0 / v0.17.1 资产。
- Casbin 模型、权限判定语义、`.github/workflows/**` 门禁阈值。

## Expected Files

### Create

- `RELEASE_NOTES_v0.17.2.md`
- `docs/harness/tasks/2026-10-23-residual-closeout.task.md`
- `.harness/tasks/2026-10-23-residual-closeout/manifest.json`
- `.harness/evidence/2026-10-23-residual-closeout/{summary.md,review.md,commands.json}`
- `backend/pkg/database/duplicate_key.go`
- `backend/modules/system/iam/tenant/tenant_concurrency_test.go`
- `scripts/foundation-release/check-release-secrets.mjs`
- `tests/scripts/foundation-release/check-release-secrets.test.mjs`

### Modify

- `backend/modules/system/iam/tenant/{tenant_service.go,tenant_provision.go}`
- `backend/modules/system/iam/tenant/{tenant_service_test.go,tenant_code_lifecycle_test.go,tenant_lifecycle_guard_test.go}`
- `backend/pkg/testredis/{redis.go,redis_test.go}`
- `backend/pkg/authtoken/token_test.go`
- `backend/modules/auth/login/login_runtime_test.go`
- `backend/modules/auth/session/{session_lifecycle_service_test.go,session_revocation_closure_test.go,session_tenant_scope_test.go}`
- `backend/internal/middleware/secure_action_middleware_test.go`
- `docs/contracts/TENANT_CONTRACT_V1.md`、`docs/contracts/TENANT_CONTRACT_V1.en.md`
- `docs/reviews/PANTHEON_BASE_DELIVERY_REMEDIATION_2026-10-22.md`（§5 残余置关闭）
- `scripts/foundation-release/publish-foundation-release.mjs`
- `VERSION`、`CHANGELOG.md`、`README.md`、`README.en.md`、`.harness/STATUS.md`

### Do Not Touch

- `backend/pkg/database/migrations/**`（schema 保持 29）
- `.github/workflows/**`
- 已发布的 `v0.17.0` / `v0.17.1` tag 与资产

## Implementation Notes

- 死锁根因是语句的自引用：MySQL 对 `INSERT ... SELECT` 读到的行加共享 next-key 锁，源表与目标表相同时
  这些锁与并发复制方的插入意向锁互斥。改成「先普通 `SELECT`（一致性读、不加锁）再插入」后不再竞争。
  选择修根因而不是加死锁重试：重试会把锁序问题吸收掉，以后同类回归就看不见了。
- 幂等语义必须逐条保留：既有租户键优先（先读租户已拥有的键再过滤）、跳过软删平台行
  （`deleted_at IS NULL`）、租户侧存在性检查**不过滤** `deleted_at`（软删行仍占唯一键）。
  `setting_value` / `remark` 可空，用指针保留 NULL 语义，不把 NULL 变成空串。
- 墓碑寻址的判定放在 `GetTenantByID`：`UpdateTenant`、`AddMember`、`ProvisionTenant` 与两个
  handler 都经由它，一处规则覆盖全部写路径；按 §5，墓碑与「不存在」对外不可区分。
  列表接口不受影响，运维仍可通过显式 `status=deleted` 过滤查看。
- 同 code 竞态的整形必须回读占用行，才能区分「被活跃租户占用」与「被墓碑占用」，
  返回与预检一致的两个错误码；预检本身保留，因为它给出更快的常规路径。
- 凭据预检的规则刻意收窄为三种形态（MySQL DSN、URL、`-p<值>`）。更宽的规则集（任何
  `password = ...` 赋值）在真实 v0.17.1 产物上报 42 处误报，全部是测试夹具、Go 结构体字面量与
  i18n 文案；一个会被绕过的门禁等于没有门禁。报告必须脱敏，否则等于把泄漏搬到 CI 日志。

## Verification Plan

- `cd backend && go build ./... && go vet ./... && gofmt -l .`
- `cd backend && PANTHEON_TEST_DSN=<real mysql> PANTHEON_TEST_DSN_REQUIRED=true PANTHEON_TEST_REDIS_REQUIRED=true go test -count=1 -p 1 ./...`
- `cd backend && go test -count=8 -run TestConcurrentProvisioning ./modules/system/iam/tenant/`
- `cd backend && for i in 1 2 3; do go test -count=1 ./pkg/authtoken/ ./modules/auth/login/ ./modules/auth/session/ ./internal/middleware/; done`
- `cd backend && CC=/d/msys64/mingw64/bin/gcc.exe CGO_ENABLED=1 go test -race ./pkg/tenant/ ./pkg/testredis/ ./internal/middleware/ ./modules/auth/session/ ./modules/system/iam/tenant/`
- `npm run test:foundation-release`
- `node scripts/foundation-release/check-release-secrets.mjs --release-version pantheon-base-v0.17.2`
- `npm run check:docs-frontmatter && npm run check:task-packet && npm run check:structure`
- 发布后：`node scripts/foundation-release/check-release-assets.mjs --release-version pantheon-base-v0.17.2`

## Linkage

- Task ID: `2026-10-23-residual-closeout`
- Task Manifest: `.harness/tasks/2026-10-23-residual-closeout/manifest.json`
- OpenSpec Change: none
- Superpowers Plan: none
- Plan References: `docs/contracts/TENANT_CONTRACT_V1.md`、`docs/reviews/PANTHEON_BASE_DELIVERY_REMEDIATION_2026-10-22.md`
- Evidence Directory: `.harness/evidence/2026-10-23-residual-closeout/`
- Review File: `.harness/evidence/2026-10-23-residual-closeout/review.md`

## Evidence Required

- 并发用例在旧代码上失败（`Error 1213`）与新代码上连续 8 轮通过的输出。
- 3 条墓碑用例在修复前失败、修复后通过的输出。
- 后端 build/vet/gofmt 与真库全量测试输出（0 失败 0 跳过）。
- 4 包并行 3 轮的 Redis 隔离结果。
- `-race` 在 5 个包上的结果（含实际使用的 `CC`）。
- `test:foundation-release` 与凭据预检对真实产物与合成泄漏样本的结果。
- `Release Gate` / `CI` / `Smoke` 在发布提交上的结论（仅 CI 可判定）。
- 四件发布产物的 checksum 与 `Foundation Release Verify` run。

## Human Gates

- 合同 V1.3 属共享合同变更，需 L2 评审；本包按既有 contract-change 流程记录触发与范围，
  **不自行宣告** runbook §8 的 G4 通过。
- 维护者最终验收（版本号与发布说明口径）。
- 发布动作（tag / Release 资产）按仓库治理执行。

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
