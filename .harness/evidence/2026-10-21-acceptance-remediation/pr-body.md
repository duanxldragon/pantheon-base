## 变更摘要

- 改动层级：platform
- 改动模块：platform（`pkg/tenant`、`internal/middleware`、`cmd/server`）、`system/iam`（tenant、role）、`system/config`（setting、dict）、`system/auth`（session、oidc）、frontend 会话边界、docs
- 目标问题：2026-10-21 全景企业级验收发现的 1 个 P0 与 6 个 P1/P1-latent 缺陷，加上主干长期红灯的 Tenant Smoke 第二根因：共享菜单/i18n 写面缺平台能力判定（B1/B3）、compat 模式租户作用域未固定且 multi→compat 无降级守卫（B2）、租户挂起/成员移除不撤销会话（B5）、新租户 provisioning 不复制字典（B4）、角色键命名空间单向守卫（B6）、OIDC schema 游离在编号迁移链外且唯一键缺租户维度（C1/C4）、tenant handler 旧式错误体泄漏内部错误（C2）、路由预热缓存与 operation token 跨会话边界泄漏（E1/E2）、AddMember 非幂等（F1）、生产构建未强制 Gin release mode（D1）
- 预期影响：租户无法再改写全体租户可见的共享资源，compat 与 multi 的数据可见范围与模式一致，会话生命周期与授权生命周期对齐，新租户开箱有字典，Tenant Smoke 的两个根因在代码层均已关闭；无 API 路由/权限码/菜单键删除，ops 消费侧无需改动即可继承

## Harness 链路

- Task ID：`2026-10-21-acceptance-remediation`
- Task Manifest：`.harness/tasks/2026-10-21-acceptance-remediation/manifest.json`
- Evidence：`.harness/evidence/2026-10-21-acceptance-remediation/commands.json`
- Verification evidence：`.harness/evidence/2026-10-21-acceptance-remediation/summary.md`
- Review Artifact：`.harness/evidence/2026-10-21-acceptance-remediation/review.md`
- OpenSpec change：none
- Trivial change：no
- Quality Profile：permission-policy
- Ratchet Decision：sensor-added
- GitHub Signal：runtime-evidence-gate

## Harness adoption markers

- task id: 2026-10-21-acceptance-remediation
- task manifest: .harness/tasks/2026-10-21-acceptance-remediation/manifest.json
- evidence: .harness/evidence/2026-10-21-acceptance-remediation/commands.json
- boundaries: platform 判定收口 + system/iam、system/config、system/auth 的缺陷闭合 + 前端会话边界；不动 Casbin 模型、不改 workflow、不做业务模块扩展
- backend response contract: changed（`/system/tenant/*` 统一为 common 错误信封，不透出内部错误；HTTP 码与既有成功体不变）
- backend DTO contract: unchanged（无请求/响应字段删除）
- permission contract: 收紧（共享写面新增平台能力判定；角色键命名空间双向互斥；OIDC 唯一键含租户）
- audit coverage: 保持（会话撤销写 revoked_at 不删行，remediation event 仍按租户过滤）
- visual evidence: none（本机不能起浏览器；浏览器层由 CI Tenant Smoke 复验）
- inheritance contract: sharedPaths 未变动；base 先修，ops 通过 foundation release 同步
- base drift: none introduced
- Base/ops inheritance: ops 侧消费为独立变更，不手抄 base 文件

## 边界说明

- [x] 本次改动仅涉及单一层级
- [ ] 本次改动涉及跨层，已说明边界与依赖

判定权在 platform 层：`pkg/tenant` 的租户作用域解析与 `internal/middleware` 的平台能力判定是共享契约，
`system/iam`、`system/config`、`system/auth` 只是把各自路径接回既有判定，没有新增概念。
菜单键、权限键、i18n key、路由与响应成功体均未删除；变化的是「谁被允许写共享资源」与「compat/multi 下可见的数据范围」，
两者都是既有契约（`TENANT_CONTRACT_V1` §2.3、§3.3/§3.4）要求而实现未落实的部分。

## 验证记录

- [x] 后端测试：`go test -count=1 ./pkg/tenant/... ./internal/... ./modules/system/... ./modules/auth/... ./pkg/database/... ./cmd/...`（真实 MySQL，`PANTHEON_TEST_DSN` 取自 `.env.test`）
- [x] `go build ./...` + `go vet ./modules/... ./pkg/...`
- [x] 前端类型检查：`node ./node_modules/typescript/bin/tsc -b`
- [x] 前端单测：`node ./node_modules/vitest/vitest.mjs run`
- [x] 前端构建：`node ./node_modules/vite/bin/vite.js build`
- [x] 文档门禁：`node scripts/frontmatter-check.mjs`
- [x] 任务包门禁：`node scripts/harness/check-task-packet.mjs --root .`
- [x] 新增回归：`tenant_scope_sql_test.go`、`platform_capability_middleware_test.go`、`role_key_namespace_test.go`、`tenant_provision_dicts_test.go`、`tenant_service_session_revocation_test.go`、`tenant_handler_test.go`、`setting_tenant_mode_guard_test.go`、`requestOperationTokenSession.test.ts`、`routeWarmDataSessionBoundary.test.ts`
- [ ] `go test -race ./...`：本机无 C 工具链（cgo 无法启动），由 CI `quality.yml` / `ci.yml` 复验
- [ ] L1/L2 浏览器 smoke：本机不能起浏览器，由 CI `Tenant Smoke (multi-mode advisory)` 复验
- [ ] CodeQL 结果已检查并解释：等待 CI 本提交运行结论
- [x] 无 open CodeQL alert 需要新增说明（本提交未引入新数据流面）
- [ ] GitHub required checks 通过：等待本 PR CI 结论
- [x] 未删除功能、未绕过校验、未降低安全要求、未屏蔽失败测试（修复过程中自身引入的 R1-R4 回退在证据与问题台账中显式记录）

补充说明：验收结论以实际代码为准；「没有发现问题」与「证明没有问题」区分处理，未验证项记录在
`docs/reviews/PANTHEON_BASE_TEST_AND_ACCEPTANCE_REPORT_2026-10-21.md` §4.3 与环境限制表。

## 审核留痕

- Copilot review：unavailable（solo 维护者仓库，未配置 Copilot review；需要第二人复核由维护者决定）
- CodeQL 结果：pending（本提交 CI 结论）
- GitHub checks 结果：pending（本提交 CI 结论）
- Auto-merge：not-enabled
- Duplication Gate 结果：pending（本提交 CI 结论）
- 是否高风险改动：yes（`system/iam` 租户边界、`system/auth` 会话边界、共享 `pkg/tenant` 与迁移 000029）
- Residual risk / follow-up：①浏览器层 Tenant Smoke 待 CI 确认；②HTTP 层跨租户 curl 矩阵与备份/恢复升级演练未在本机执行；③迁移 000029 需在 ops/生产部署前先行；④凭据轮换（D2）、main 分支保护（F2）、Tenant Smoke 由 advisory 升 blocking（B10）、台账 A4-A10/B7-B11/C3-C12/D3-D6/E3-E7/F10-F14 的延期项由维护者排期，明细见 `docs/reviews/PANTHEON_BASE_ISSUES_AND_REMEDIATION_2026-10-21.md`

## 检查清单

- [x] 已明确本次改动归属 `platform`、`system/auth`、`system/iam`、`system/org`、`system/config` 或 `business/*`
- [x] 未把认证、IAM、组织、配置等系统域职责混写
- [x] 前端新增展示文案已使用 i18n（本次前端只改会话边界缓存，无新增文案）
- [x] 菜单、页面授权、操作授权、接口授权边界保持清晰
- [x] 涉及数据库/权限/菜单/接口变更时，文档已同步（scope matrix、freeze decision、CHANGELOG、RELEASE_NOTES、docs/README）
- [x] 已确认不会泄露敏感配置、账号密码或 Token（tenant handler 反而停止透出内部错误）
- [x] 已确认本次 PR 由 GitHub required checks、CodeQL 和分支保护负责最终合并门禁
