## 变更摘要

- 改动层级：platform
- 改动模块：`system/iam`（tenant membership 读路径）、`system/auth`（session 维护视图测试）、`pkg/tenant`（作用域 SQL 测试结构）、`.harness` evidence 与 `docs/reviews` 验收文档
- 目标问题：#396 合并时四项红灯的唯一根因与 SonarCloud 新代码门禁。①R5：`TestSessionAdminOps_CompatPinsToPlatformTenant` 因本机未配 Redis 地址而被 `pkg/testredis.Open` 静默 skip，本地假绿、CI 真红（`got total=3`），断言本身把维护视图总数当活跃会话数；②G1：SonarCloud Quality Gate 的 Security Rating on New Code 未达 A，`gosecurity:S3649`（BLOCKER，`Service.AddMember()`）+ `go:S1192` + `go:S3776`；③文档失实：把 MySQL-only 全量称为决定性证据、把 Tenant Smoke 说成第二根因已关闭
- 预期影响：`Backend Tests` / `Unit Tests` 的失败用例在配好 MySQL+Redis 后真实通过；`CI Summary` 与 `Quality Gates` 作为下游聚合随之转绿；Sonar 三条新代码问题清除；证据与台账改为区分「代码已证 / CI 待证 / 未覆盖」并记录 skip 掩盖这一复发型缺陷。产品运行语义不变：会话查询与成员读写行为、响应契约、权限判定均未改动

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
- boundaries: 只修测试断言、membership 查询的参数化形态与 evidence 叙述；不改会话查询语义、不改权限判定、不动 Casbin 模型与迁移
- backend response contract: unchanged（无请求/响应字段与错误体变化）
- backend DTO contract: unchanged
- permission contract: unchanged（平台能力判定与租户作用域沿用 #396 已合并的实现）
- audit coverage: 保持（会话维护视图仍返回全量含 revoked 行，`ActiveCount` / `RevokedCount` 口径不变）
- visual evidence: none（本机不能起浏览器；本提交不触碰任何前端展示面，浏览器层由 CI Tenant Smoke 复验）
- inheritance contract: sharedPaths 未变动；base 先修，ops 通过 foundation release 同步
- base drift: none introduced
- Base/ops inheritance: ops 侧消费为独立变更，不手抄 base 文件

## 边界说明

- [x] 本次改动仅涉及单一层级

R5 的定位结论是「测试期望错，产品代码对」：证据链在
`backend/modules/auth/session/session_helpers.go:124-154`——`applyAdminSessionFilters` 在 `query == nil` 时原样返回 db，即内部维护视图按设计不加任何过滤，
`Total` 天然含 revoked 行；`ListAllSessions` 另以 `SUM(CASE …)` 给出 `ActiveCount`。因此修的是断言，
不是把过滤加进产品代码（那会改变 FIX-3 的撤销审计口径）。G1 的 map 条件同理：两键恒在，不像 struct 条件会丢零值租户 ID，
生成的仍是同一批绑定占位符。

## 验证记录

- [x] 后端全量（决定性）：`PANTHEON_TEST_DSN=<.env.test DSN> PANTHEON_TEST_REDIS_ADDR=127.0.0.1:6379 PANTHEON_TEST_REDIS_PASSWORD=<.env.test password> PANTHEON_NODE_BIN=<node> PANTHEON_WORKSPACE_ROOT=<repo> go test -count=1 ./...` → 46 包 ok，exit 0，日志内 0 次 store-skip 提示
- [x] 目标包复跑：`go test -count=1 ./pkg/tenant/ ./modules/system/iam/tenant/ ./modules/auth/session/`（真 MySQL + 真 Redis）→ 0.120s / 44.602s / 4.988s 全 ok
- [x] `go build ./...` 与 `gofmt -l` 干净
- [x] 失败取证保留：`go test -count=1 ./modules/auth/session/ -run TestSessionAdminOps_CompatPinsToPlatformTenant`（仅 MySQL）复现 CI 同款 `session_tenant_scope_test.go:225 got total=3`
- [x] CI 红灯取证：`gh pr checks 396` + `gh run view --job 119067894874/119067544459/119069015404/119069653739 --log-failed`，Sonar 结论取自 check-run 119067749735 与 SonarCloud 匿名 issues API
- [x] 文档门禁：`node scripts/frontmatter-check.mjs`（337 docs / 244 frontmatter）、`node scripts/harness/check-task-packet.mjs --root .`、`node scripts/harness/check-evidence.mjs --strict`
- [ ] `go test -race ./...`：本机无 C 工具链（cgo 无法启动），由 CI `quality.yml` / `ci.yml` 复验
- [ ] L1/L2 浏览器 smoke：本机不能起浏览器；且同 commit 上 Tenant Smoke 先红后绿属 flaky，本提交不声称修好它
- [ ] SonarCloud 新代码门禁：本提交清除三条问题，结论只能由下一轮 hosted analysis 证明
- [ ] GitHub required checks 通过：等待本 PR CI 结论
- [x] 未删除功能、未绕过校验、未降低安全要求、未屏蔽失败测试（未改 `continue-on-error`，未加 skip，未改断言方向以适配实现）

补充说明：验收结论以实际代码为准；「没有发现问题」与「证明没有问题」区分处理，未验证项与环境限制记录在
`docs/reviews/PANTHEON_BASE_TEST_AND_ACCEPTANCE_REPORT_2026-10-21.md` §2.3 / §4.3 / §4.4。

## 审核留痕

- Copilot review：unavailable（solo 维护者仓库，未配置 Copilot review；需要第二人复核由维护者决定）
- CodeQL 结果：pending（本提交 CI 结论；#396 上 CodeQL 与 Security Gates 为绿）
- GitHub checks 结果：pending（本提交 CI 结论；#396 合并时四项红已逐项取证到单一根因）
- Auto-merge：not-enabled
- Duplication Gate 结果：pending（本提交 CI 结论；#396 上为绿）
- 是否高风险改动：no（测试断言、查询参数化形态与 evidence 叙述；不改判定逻辑、不改契约、不改迁移）
- Residual risk / follow-up：①`release/v0.17.0` 在本提交转绿前测试门禁状态为「未证明」，不得据此打 `pantheon-base-v0.17.0` tag；②Tenant Smoke flaky 的完整成因未定位，`smoke-tenant` 仍 advisory（B10 升 blocking 的前提是复验绿）；③建议补一条 checker：runtime-sensitive 套件缺 `PANTHEON_TEST_REDIS_ADDR` 时应失败而非 skip（本轮两次 skip 掩盖的共性，显式延期）；④凭据轮换（D2）、main 分支保护（F2）、台账 A4-A10/B7-B11/C3-C12/D3-D6/E3-E7/F10-F14 延期项由维护者排期，明细见 `docs/reviews/PANTHEON_BASE_ISSUES_AND_REMEDIATION_2026-10-21.md` §4/§5

## 检查清单

- [x] 已明确本次改动归属 `platform`、`system/auth`、`system/iam`、`system/org`、`system/config` 或 `business/*`
- [x] 未把认证、IAM、组织、配置等系统域职责混写
- [x] 前端新增展示文案已使用 i18n（本提交不含前端改动）
- [x] 菜单、页面授权、操作授权、接口授权边界保持清晰
- [x] 涉及数据库/权限/菜单/接口变更时，文档已同步（本提交不动这些面，仅同步 CHANGELOG、RELEASE_NOTES 与两份验收文档的叙述与结论）
- [x] 已确认不会泄露敏感配置、账号密码或 Token（DSN 与 Redis 口令在 evidence 中以占位符记录，未写入仓库）
- [x] 已确认本次 PR 由 GitHub required checks、CodeQL 和分支保护负责最终合并门禁
