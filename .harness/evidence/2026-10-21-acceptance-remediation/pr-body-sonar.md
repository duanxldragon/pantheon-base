## 变更摘要

- 改动层级：platform
- 改动模块：`system/iam`（tenant membership 写路径）、`.harness` evidence、`docs/reviews` 与任务包、`docs/harness` 任务文档
- 目标问题：PR #397 合并后仍唯一红灯的门禁 `SonarCloud Code Analysis`。map 条件已消除 `go:S1192` 与 `go:S3776` 两条新代码异味，但 `gosecurity:S3649` 在 `Service.AddMember` 报出三条 BLOCKER（`:711` 读、`:722` 写两条），说明该规则不看占位符是否绑定，只看请求传入的值是否参与构造查询
- 预期影响：写路径不再用请求 id 重新匹配行，而是对上一步刚读到的行按主键更新，并用 `Select` 显式命名列、用类型化 struct 传值，因此请求值不再出现在列名或条件位置； owner 保护与幂等语义不变（`TestAddMember` / `TestAddMember_Duplicate` / `TestAddMember_OwnerIsProtected` / `TestRemoveMember` 真 MySQL 通过）。读路径的污点边无法在不做抑制的前提下消除，处置结论写入 evidence 与台账

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
- boundaries: 只改 membership 写路径的定位方式与文档结论；不改权限判定、会话语义、响应契约、迁移与 Casbin 模型
- backend response contract: unchanged
- backend DTO contract: unchanged
- permission contract: unchanged
- audit coverage: 保持（成员行仍按既有唯一键存在，更新列不变）
- visual evidence: none（不触碰前端；本机不能起浏览器，且本次改动无 UI 面）
- inheritance contract: sharedPaths 未变动；base 先修，ops 通过 foundation release 同步
- base drift: none introduced
- Base/ops inheritance: ops 侧消费为独立变更，不手抄 base 文件

## 边界说明

- [x] 本次改动仅涉及单一层级

`AddMember` 先按 `(tenant_id, user_id)` 读出唯一行，再决定更新或拒绝。更新的目标行已由上一次读操作确定，
因此按主键定位比重新匹配更严格（同一行、同一事务窗口），也不给请求值任何进入 SQL 结构位置的机会。
owner 行的拒绝路径与重复添加的复活路径保持原状；读路径按 id 取行是多租户数据定位的业务本质，
若要消掉该污点边只能忽略输入或做扫描器抑制，两者都不做。

## 验证记录

- [x] `go build ./...` 与 `gofmt -l modules/system/iam/tenant` 干净
- [x] 目标用例（真 MySQL + 真 Redis）：`go test -count=1 ./modules/system/iam/tenant/ -run 'TestAddMember|TestRemoveMember|TestMember' -v` → 4 例 PASS
- [x] 后端全量（决定性）：`PANTHEON_TEST_DSN=<.env.test DSN> PANTHEON_TEST_REDIS_ADDR=127.0.0.1:6379 PANTHEON_TEST_REDIS_PASSWORD=<.env.test password> PANTHEON_NODE_BIN=<node> PANTHEON_WORKSPACE_ROOT=<repo> go test -count=1 ./...` → 46 包 ok，exit 0，无 FAIL、无 store-skip 提示
- [x] 文档门禁：`node scripts/frontmatter-check.mjs`、`node scripts/harness/check-task-packet.mjs --root .`、`node scripts/harness/check-evidence.mjs --strict`
- [x] Sonar 复测取证：匿名 API `pullRequest=397&sinceLeakPeriod=true` → `S3649`×3 BLOCKER、异味两条已消失
- [ ] `go test -race ./...`：本机无 C 工具链（cgo 无法启动），由 CI `quality.yml` / `ci.yml` 复验
- [ ] SonarCloud `Security Rating on New Code`：本提交减少一条 sink 路径，最终结论由下一轮 hosted analysis 给出
- [ ] GitHub required checks 通过：等待本 PR CI 结论
- [x] 未删除功能、未绕过校验、未降低安全要求、未屏蔽失败测试（未加 `NOSONAR`、未排除规则、未贴 `solo-override`）

补充说明：验收结论以实际代码为准；未验证项与环境限制记录在
`docs/reviews/PANTHEON_BASE_TEST_AND_ACCEPTANCE_REPORT_2026-10-21.md` §2.3 / §4.3 / §4.4。

## 审核留痕

- Copilot review：unavailable（solo 维护者仓库，未配置 Copilot review；需要第二人复核由维护者决定）
- CodeQL 结果：pending（本提交 CI 结论；#397 上 CodeQL 与 Security Gates 为绿）
- GitHub checks 结果：pending（本提交 CI 结论；#397 的 `Backend Tests` / `Unit Tests` / `CI Summary` / `Quality Gates` / `Coverage Gate` 已实测全绿并被自动化合并）
- Auto-merge：not-enabled
- Duplication Gate 结果：pending（本提交 CI 结论；#397 上为绿）
- 是否高风险改动：no（成员写路径定位方式与文档结论，不改权限判定与数据形状）
- Residual risk / follow-up：①`gosecurity:S3649` 读侧污点边需维护者在 Sonar 侧标记误报或在门禁上让步，这是本轮唯一未闭合门禁；②`release/v0.17.0` 的测试维度已由 #397 证明，安全维度待处置，处置前不打 `pantheon-base-v0.17.0` tag；③建议补 checker：runtime-sensitive 套件缺 `PANTHEON_TEST_REDIS_ADDR` 时失败而非 skip；④Tenant Smoke flaky 完整成因、凭据轮换（D2）、main 分支保护（F2）、advisory→blocking（B10）与台账延期项由维护者排期，明细见 `docs/reviews/PANTHEON_BASE_ISSUES_AND_REMEDIATION_2026-10-21.md` §4/§5

## 检查清单

- [x] 已明确本次改动归属 `platform`、`system/auth`、`system/iam`、`system/org`、`system/config` 或 `business/*`
- [x] 未把认证、IAM、组织、配置等系统域职责混写
- [x] 前端新增展示文案已使用 i18n（本提交不含前端改动）
- [x] 菜单、页面授权、操作授权、接口授权边界保持清晰
- [x] 涉及数据库/权限/菜单/接口变更时，文档已同步（本提交不动这些面，只同步 evidence、任务包与两份验收文档的结论）
- [x] 已确认不会泄露敏感配置、账号密码或 Token（DSN 与 Redis 口令以占位符记录）
- [x] 已确认本次 PR 由 GitHub required checks、CodeQL 和分支保护负责最终合并门禁
