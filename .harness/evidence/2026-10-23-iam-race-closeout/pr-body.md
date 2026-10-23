## 变更摘要

- 改动层级：platform（`system/iam`）
- 改动模块：`backend/modules/system/iam/tenant/{tenant_provision.go,tenant_provision_dicts_test.go,tenant_concurrency_test.go}`、`backend/modules/system/iam/role/{role_helper.go,role_backfill_test.go,role_replace_concurrency_test.go}`、`backend/modules/system/iam/user/{user_helper.go,user_concurrency_test.go}`、`backend/pkg/testmysql/locking.go`、`RELEASE_NOTES_v0.17.3.md`、任务包与 evidence
- 目标问题：关闭 v0.17.4 之后登记的 5 项残留——同租户并发 provisioning 的先查后写、replace 式授权的删除后重插、历史 `tenant_id = 0` 权限行未修复、本机 TSan 无法启动、已发布 v0.17.3 notes 的过期表述
- 预期影响：同租户 provisioning 与 replace 式授权串行化，历史权限行在 backfill 时自动归位；竞态从 500 收敛为既有 409 或成功；无 schema、路由、权限码、菜单 seed 或错误信封变化

## Harness 链路

- Task ID：2026-10-23-iam-race-closeout
- Task Manifest：.harness/tasks/2026-10-23-iam-race-closeout/manifest.json
- Evidence：.harness/evidence/2026-10-23-iam-race-closeout/commands.json
- Verification evidence：.harness/evidence/2026-10-23-iam-race-closeout/summary.md
- Review Artifact：.harness/evidence/2026-10-23-iam-race-closeout/review.md
- OpenSpec change：none
- Trivial change：no
- Quality Profile：permission-policy
- Ratchet Decision：sensor-added
- GitHub Signal：repo-quality-gate

## Harness adoption markers

> 保留本区块的英文 marker，供 `scripts/harness/check-adoption.mjs` 做机械检查。

- task id: 2026-10-23-iam-race-closeout
- task manifest: .harness/tasks/2026-10-23-iam-race-closeout/manifest.json
- evidence: .harness/evidence/2026-10-23-iam-race-closeout/
- boundaries: system/iam tenant provisioning and replace-style grant writes only; no schema, route, permission-code, menu-seed, workflow or frontend change
- backend response contract: unchanged in this PR
- backend DTO contract: unchanged
- permission contract: unchanged; grant rows keep the (tenant_id, role_id, permission_key) natural key
- audit coverage: unchanged
- visual evidence: not-applicable
- inheritance contract: no sharedPaths or contract document change
- base drift: branch cut from main b3071847
- Base/ops inheritance: pantheon-ops needs no change; it gains the fixes by advancing its foundation pin

## 边界说明

- [x] 本次改动仅涉及单一层级
- [ ] 本次改动涉及跨层，已说明边界与依赖

补充说明：改动全部在 `platform / system/iam`。`tenant_provision.go` 只改锁与写入语义；`role_helper.go`、`user_helper.go` 只改替换式写入与历史行修复；不触碰前端、路由、菜单 seed、权限码与数据库 schema（仍为 29）。

## 验证记录

- [x] 后端测试：`set -a; . ./.env.test; set +a; PANTHEON_NODE_BIN=<node> PANTHEON_TEST_DSN_REQUIRED=true PANTHEON_TEST_REDIS_REQUIRED=true go test ./... -count=1` → 46 packages ok，0 FAIL，0 SKIP
- [x] 专项回归：同租户并发收敛含平台默认拷贝、拷贝锁探针（MySQL 3572 + 回滚）、role/user replace 串行化、backfill 归属与去重 → 全部 PASS（真实 MySQL）
- [x] 先红后绿：provisioning 用例在修复前报 `Duplicate entry '1-owner' for key 'user.uk_system_user_tenant_username'`；两个 replace 用例在修复前 NOWAIT 探针未报错；backfill 用例在修复前 `elements differ`
- [x] `gofmt -l .`、`go build ./...`、`go vet ./...` 均干净
- [x] 治理检查：frontmatter、task packet、structure、generated、failure registry 全通过；新增 evidence 通过 `check-evidence --strict` 与 `check-review --strict`
- [x] SonarCloud：Quality Gate OK，New Code Duplication 0.0%（阈值 3%），New Code Open Issues 0；重复的 NOWAIT 探针与串行化脚手架已收敛到 `pkg/testmysql/locking.go`
- [ ] 前端构建：未涉及前端文件，not-applicable
- [ ] L0/L1/L2 smoke：未涉及前端或路由变化，not-applicable
- [ ] CodeQL 结果：待 CI
- [x] GitHub required checks：CI 运行 39969299263（head 973f5be2）的 Backend Tests 已通过 `go test -race ./...`（MySQL 8 + Redis，Linux），作为第 4 项残留的权威 race 证据；其余 required checks 在最终 head 上复核
- [ ] Copilot review：待 PR Automation
- [ ] 已启用或确认将启用 squash auto-merge

补充说明：`PANTHEON_NODE_BIN` 与 `PANTHEON_WORKSPACE_ROOT` 必须设置；缺少时 `modules/lowcode/dynamicmodule` 会在测试逻辑之前报 `module.generate.server_export_failed`（首轮已复现，补齐后全绿）。

## 审核留痕

- Copilot review：requested
- CodeQL 结果：待 CI
- GitHub checks 结果：待 CI
- Auto-merge：enabled by PR Automation
- Duplication Gate 结果：待 CI
- 是否高风险改动：yes（命中 `system/iam` 与权限链路，需两名非作者 review）
- Residual risk / follow-up：本机无法启动 TSan（error 87），race 证据由 CI Linux 提供；已发布 v0.17.3 tag 与资产不可变，仅仓库文件与可变 release body 带更正；`system_dict_item` 无唯一键，拷贝串行化依赖租户行锁

## 检查清单

- [x] 已明确本次改动归属 `platform`（`system/iam`）
- [x] 未把认证、IAM、组织、配置等系统域职责混写
- [x] 前端新增展示文案已使用 i18n：未涉及前端
- [x] 菜单、页面授权、操作授权、接口授权边界保持清晰
- [x] 涉及数据库/权限/菜单/接口变更时，文档已同步：无 schema / 路由 / 权限码变化，任务包与 evidence 已同步
- [x] 已确认不会泄露敏感配置、账号密码或 Token
