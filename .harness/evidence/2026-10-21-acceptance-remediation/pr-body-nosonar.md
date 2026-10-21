## 变更摘要

- 改动层级：system/iam（`Service.AddMember`）＋治理与文档
- 改动模块：`backend/modules/system/iam/tenant/tenant_service.go`、`.harness` evidence/summary/review、`docs/reviews` 三份文档、`docs/harness` 任务文档、`CHANGELOG.md`、`RELEASE_NOTES_v0.17.0.md`、`.harness/STATUS.md`
- 目标问题：main 上 `Release Gate` 唯一红项 `gosecurity:S3649`（`Service.AddMember()` 两条 BLOCKER，`:711` 读 / `:726` 写）。维护者已定案：「既然是误报，那应该可以处理，我希望在代码层面屏蔽，sonar 上的规则我不想动」
- 预期影响：两条 sink 行尾各加 `// NOSONAR gosecurity:S3649`；Sonar 规则配置、Quality Gate 阈值、`Release Gate` 定义均不动；无接口、权限、迁移、i18n 变更。目标是让分支级 `new_security_rating` 回到 A、`Release Gate` 全绿、Open issues 归零

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
- boundaries: 只改 `Service.AddMember` 的两条 sink 与相应注释/文档；不改 CI workflow、不改 Sonar 规则、不改门禁配置
- backend response contract: unchanged
- backend DTO contract: unchanged
- permission contract: unchanged（`AddMember` 的鉴权与租户范围判断未动）
- audit coverage: unchanged（未新增/删除审计事件）
- visual evidence: none（不触碰前端，无 UI 面）
- inheritance contract: sharedPaths 未变动
- base drift: none introduced
- Base/ops inheritance: 无 ops 侧改动

## 边界说明

- [x] 本次改动仅涉及单一层级

抑制前提逐条可核：`tenantID`/`userID` 在进入服务前已是 `strconv.ParseUint` / DTO required binding 产出的 `uint64`，
只经 `membershipScope(tenantID, userID)` 落成 GORM 绑定 `?` 参数；`role` 是校验后的枚举值，`Select("role","status")` 是常量列名。
该规则把「请求值参与构造 GORM 调用」一律视作注入源，与参数绑定无关，这条污点边无法在不抑制的前提下消除，因此按维护者指示在代码层抑制。
为容纳行尾注释，两处调用由链式换行改写为单语句，语义等价：查询条件、更新列、错误返回路径逐一对应（本地单测与全量套件复验）。
代价如实记录：抑制后该边不再以红灯形式提醒，因此注释必须与 sink 同行，且理由链完整保存在
`docs/reviews/PANTHEON_BASE_ISSUES_AND_REMEDIATION_2026-10-21.md` §5。

## 验证记录

- [x] `gofmt -l backend/modules/system/iam/tenant/tenant_service.go` → 无输出
- [x] `go build ./...` → 通过
- [x] `go vet ./modules/system/iam/tenant/` → 通过
- [x] `go test -count=1 ./modules/system/iam/tenant/ -run 'TestAddMember|TestRemoveMember|TestMember'`（真实 MySQL + Redis）→ ok
- [x] `go test -count=1 ./...`（真实 MySQL + Redis + `PANTHEON_NODE_BIN`/`PANTHEON_WORKSPACE_ROOT`）→ exit 0，46 packages ok，无 FAIL；首轮缺 node 变量时 `modules/lowcode/dynamicmodule` 报 R6 已知的 `module.generate.server_export_failed`，补齐后该包 ok 16.738s
- [x] hosted 前置实测：main 当前 open issues `total = 2`（全部为该函数的两条 `S3649`），`project_status = ERROR` 仅 `new_security_rating = 5`；
      本 PR 合入后应以 `total = 0` 与 `status = OK` 收口（未实测前不写成已达成）
- [x] 未删除功能、未绕过校验、未降低安全要求、未屏蔽失败测试
- [x] 未改 Sonar 规则配置、未改 Quality Gate 阈值、未贴 `solo-override`

## 审核留痕

- Copilot review：unavailable（solo 维护者仓库，未配置 Copilot review）
- CodeQL 结果：pending（本提交 CI 结论；main 上为 success）
- GitHub checks 结果：pending（本提交 CI 结论）
- Auto-merge：not-enabled（仓库侧 `Automate Solo PR` 在门禁全绿时自动合并）
- Duplication Gate 结果：pending（本提交 CI 结论）
- 是否高风险改动：no（两条行尾注释 + 等价语句改写；鉴权、租户范围、审计均未动）
- Residual risk / follow-up：①抑制会隐藏未来同一 sink 的真实回归——理由链与行号已固定记录，审阅时应优先核对该函数；
  ②`pantheon-base-v0.17.0` tag 只在合并后 main 分支级 Sonar 实测 `status = OK`、open issues `total = 0`、`Release Gate` 绿之后再打；
  ③D2 已入库凭据轮换、F2 main 分支保护、B10 advisory→blocking 仍为维护者动作；
  ④Dependabot alert #44（`github.com/klauspost/compress` v1.18.6，high）在 main 上处于 open，已有 PR #400 待合，属独立发布前置项；
  ⑤建议补 checker：runtime-sensitive 套件缺 `PANTHEON_TEST_REDIS_ADDR` 时应失败而非 skip（显式延期）

## 检查清单

- [x] 已明确本次改动归属 `system/iam`（租户成员写入路径）
- [x] 未把认证、IAM、组织、配置等系统域职责混写
- [x] 前端新增展示文案已使用 i18n（本提交不含前端改动）
- [x] 菜单、页面授权、操作授权、接口授权边界保持清晰（未触碰）
- [x] 涉及数据库/权限/菜单/接口变更时，文档已同步（本提交仅同步文档，不改这些面）
- [x] 已确认不会泄露敏感配置、账号密码或 Token（DSN 与 Redis 口令仅以占位符记录）
- [x] 已确认本次 PR 由 GitHub required checks、CodeQL 和分支保护负责最终合并门禁
