## 变更摘要

- 改动层级：platform（含 system/iam 与前端 shell 呈现层）
- 改动模块：`system/iam`（tenant、user、role）、`pkg/database`（迁移 down 守卫）、前端 `core/entitlements`、`core/layout`、`store`、`modules/system/config`、`assets/list-page.css`
- 目标问题：独立交付验收对 `main 92b94474` 判定 **FAIL（交付完备性）**——主干 `Release Gate` 红、整改只存在于未提交工作区、消费侧文档与实现/发布互相矛盾；同批发现两处租户生命周期缺口、一处回滚断链与两处治理栏呈现不一致
- 预期影响：主干恢复可发布状态；归档租户可删除；provisioning 失败不再残留租户行；`migrate down` 可完整回滚并可重放；跨租户用户读写返回 404；字典页与设置页治理栏与其他系统页一致。无新增迁移，schema 保持 29，无消费侧接口变更

## Harness 链路

- Task ID：2026-10-22-v0171-release-closeout
- Task Manifest：.harness/tasks/2026-10-22-v0171-release-closeout/manifest.json
- Evidence：.harness/evidence/2026-10-22-v0171-release-closeout/commands.json
- Verification evidence：.harness/evidence/2026-10-22-v0171-release-closeout/summary.md
- Review Artifact：.harness/evidence/2026-10-22-v0171-release-closeout/review.md
- OpenSpec change：none
- Trivial change：no
- Quality Profile：permission-policy
- Ratchet Decision：sensor-added
- GitHub Signal：method-gate

> 收口任务包 `2026-10-22-delivery-audit-remediation`（证据在
> `.harness/evidence/2026-10-22-delivery-audit-remediation/`）记录"审计发现已修复并验证"，
> 本包记录"修复已提交、过门禁并发布"。两者刻意分开：在本地构建绿、但改动还没提交的状态下冻结，
> 正是审计点名的缺陷。

## Harness adoption markers

> 保留本区块的英文 marker，供 `scripts/harness/check-adoption.mjs` 做机械检查。

- task id: 2026-10-22-v0171-release-closeout
- task manifest: .harness/tasks/2026-10-22-v0171-release-closeout/manifest.json
- evidence: .harness/evidence/2026-10-22-v0171-release-closeout/
- boundaries: platform only; tenant lifecycle in system/iam, migration guard in pkg/database, presentation in frontend shell; no cross-layer responsibility moved
- backend response contract: DELETE /api/v1/system/tenant/:id now succeeds for an archived tenant with members; live tenant with members still returns tenant.has_active_members; foreign/missing user id both answer 404 user.not_found; role.key.reserved answers 400
- backend DTO contract: unchanged
- permission contract: unchanged - no Casbin model, policy semantics or PlatformCapabilityMiddleware rule touched
- audit coverage: unchanged - existing tenant audit rows keep their attribution
- visual evidence: .harness/evidence/2026-10-22-v0171-release-closeout/ (governance bar measured on /system/dict, /system/user, /system/post, /system/setting at 1600/1440/1280/1100/960/900)
- inheritance contract: sharedPaths unchanged at 52; pantheon-ops can advance its lock to v0.17.1
- base drift: release/v0.17.1 is cut from origin/main 92b94474; the earlier fix/tenant-plan-entitlements-and-audit branch was content-identical to main (squash-merged as #407) and is superseded
- Base/ops inheritance: no consumer-facing interface removed or renamed

## 边界说明

- [x] 本次改动仅涉及单一层级
- [ ] 本次改动涉及跨层，已说明边界与依赖

> 全部改动落在 `platform` 层内：租户生命周期在 `system/iam`，迁移守卫在 `pkg/database`，呈现层在
> 前端 shell 与 system/config 页面。未移动任何认证 / IAM / 组织 / 配置的系统域职责边界；
> 菜单、页面授权、操作授权、接口授权四层边界不变。

## 验证记录

- [x] 后端测试：`go test -count=1 -p 1 ./...`（真 MySQL 8.0.36 + Redis 7，`*_REQUIRED=true`）→ 46 包 ok，0 FAIL，0 SKIP
- [x] 前端构建：`npm run prebuild`（13 步）+ `vite build` → `✓ built in 1.89s`
- [x] L0 静态契约：`npm run test:smoke:l0`（check:smoke-coverage-contract / check:smoke-web-base / check:system-page-admission 均在 prebuild 内通过）
- [x] L1 关键路径 smoke（PR 必过）：本地跑 `platform-shell-critical` + `system-user-crud` 两个 spec，7 passed（2.0m），exit 0
- [x] L2 命中模块 smoke：改动路径命中 `iam` 与 `config`，本地以真库集成测试与浏览器探针覆盖
- [ ] 如涉及系统域深链路，已补充专项 smoke：`test:smoke:system:iam-authz` 未本地执行，交由 CI
- [x] 其他专项验证已补充：迁移回滚链 `TestMigrationChainRollsBackAndReapplies`（up→down→up）
- [ ] CodeQL 结果已检查并解释：交由 CI
- [ ] 如有 open CodeQL alert，已说明是新增问题、既有 baseline、误报还是已补 follow-up：交由 CI
- [x] Full Smoke 仅在必要时手动或预发布执行，未错误纳入 PR 必过门禁
- [ ] GitHub required checks 通过：待 CI
- [ ] Copilot review 已请求，或已说明当前仓库/账号不可用：待提交后请求
- [ ] 已启用或确认将启用 squash auto-merge：待 CI 转绿后启用

补充说明：

新增 5 条真库用例：`TestDeleteTenantArchivedWithMembersSucceeds`、
`TestCreateTenantRollsBackWhenProvisioningFails`、`TestRemoveMemberRefusesLastOwner`、
`TestUpdateTenantRejectsArchivedReactivation`、`TestMigrationChainRollsBackAndReapplies`。

其中迁移用例做了**反向验证**：把 `000020.down` 换回上一版，该用例即以
`Error 1091 (42000): Can't DROP 'tenant_id'` 失败——证明缺陷真实存在且用例有效，而不是"陪跑"。

## 审核留痕

- Copilot review：requested
- CodeQL 结果：待 CI
- GitHub checks 结果：待 CI
- Auto-merge：not-enabled（待 required checks 绿）
- Duplication Gate 结果：未本地执行；本轮提取常量是减少字面量重复，Sonar 判定以 CI 为准
- 是否高风险改动：否（无 P0；授权语义、Casbin 模型、迁移 forward 路径均未改动）
- Residual risk / follow-up：并行跑包时 Redis 键空间共享导致 `TestBatchRevokeSessions_IsTenantScoped` 偶发失败；不同 code 的并发 provisioning 未串行化；v0.17.0 产物内含已失效开发凭据（不可回收）；合同 §2.1 缺 `deleted` 第四态（补合同需 L2）；本机 `go test -race` 因 MinGW 链接器不可执行，race 覆盖仅来自 CI

## 检查清单

- [x] 已明确本次改动归属 `platform`、`system/auth`、`system/iam`、`system/org`、`system/config` 或 `business/*`
- [x] 未把认证、IAM、组织、配置等系统域职责混写
- [x] 前端新增展示文案已使用 i18n（本轮只删除失效 key，未新增硬编码文案）
- [x] 菜单、页面授权、操作授权、接口授权边界保持清晰
- [x] 涉及数据库/权限/菜单/接口变更时，文档已同步（`TENANT_API`、scope 矩阵、`DEPLOYMENT_GUIDE`、`CHANGELOG`、`RELEASE_NOTES`）
- [x] 已确认不会泄露敏感配置、账号密码或 Token（证据文件中凭据以 `<redacted>` 呈现）
- [x] 已确认本次 PR 由 GitHub required checks、CodeQL 和分支保护负责最终合并门禁
