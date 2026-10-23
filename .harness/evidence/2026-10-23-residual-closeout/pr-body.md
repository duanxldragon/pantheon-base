## 变更摘要

- 改动层级：platform（backend 为主，含发布脚本与文档）
- 改动模块：`pkg/testredis`（测试隔离）、`pkg/database`（新增 duplicate_key 识别）、`modules/system/iam/tenant`（provisioning 重试、墓碑修复、并发/墓碑用例）、`pkg/authtoken`、`internal/middleware`、`modules/auth/*`（Redis 测试分库）、`scripts/foundation-release`（凭据预检）、`docs/contracts`（V1.3 澄清）、README / CHANGELOG / VERSION / harness 文档
- 目标问题：v0.17.1 显式登记的 5 项残余（P2-4 Redis 测试隔离、P2-9 并发 provisioning、P3-1 凭据残留、P3-2 合同第四态、race 本地缺口）
- 预期影响：并发创建两个租户不再死锁（`Error 1213` 修复）；**真实缺陷修复**——已删除租户不再能被状态更新复活；Redis 测试各包独立逻辑库；发布打包前强制凭据预检；合同 §2.1 补 V1.3 墓碑澄清。无 schema 变更（仍 29），无接口移除或重命名

## Harness 链路

- Task ID：2026-10-23-residual-closeout
- Task Manifest：.harness/tasks/2026-10-23-residual-closeout/manifest.json
- Evidence：.harness/evidence/2026-10-23-residual-closeout/commands.json
- Verification evidence：.harness/evidence/2026-10-23-residual-closeout/summary.md
- Review Artifact：.harness/evidence/2026-10-23-residual-closeout/review.md
- OpenSpec change：none
- Trivial change：no
- Quality Profile：permission-policy
- Ratchet Decision：sensor-added
- GitHub Signal：method-gate

> 残余处置性质（诚实登记）：P2-4 与 race 缺口按"消除条件"处置（分库 / 定位可用工具链）；
> P2-9 与合同澄清经实测暴露为真实缺陷后修复（死锁、墓碑复活）；P3-1 按防复发门禁处置
> （历史产物不可变，不做回收）。

## Harness adoption markers

> 保留本区块的英文 marker，供 `scripts/harness/check-adoption.mjs` 做机械检查。

- task id: 2026-10-23-residual-closeout
- task manifest: .harness/tasks/2026-10-23-residual-closeout/manifest.json
- evidence: .harness/evidence/2026-10-23-residual-closeout/
- boundaries: platform only; provisioning retry and tombstone semantics in system/iam, duplicate-key helper in pkg/database, test isolation in pkg/testredis plus its consumers, release gate in scripts/foundation-release; no cross-layer responsibility moved
- backend response contract: concurrent same-code CreateTenant answers tenant.code.exists (ErrTenantCodeExists) instead of a raw 500; a deleted tenant's PUT status answers 404 tenant.not_found instead of reviving the row; AddMember and ProvisionTenant on a tombstone answer 404 tenant.not_found
- backend DTO contract: unchanged
- permission contract: unchanged - no Casbin model, policy semantics or PlatformCapabilityMiddleware rule touched
- audit coverage: unchanged - no new audit-worthy action introduced; existing tenant audit rows keep their attribution
- visual evidence: .harness/evidence/2026-10-23-residual-closeout/ (no UI change in this round)
- inheritance contract: sharedPaths unchanged; pantheon-ops can advance its lock to v0.17.2
- base drift: branch cut from origin/main 325e5dfc after the v0.17.1 harness closeout (#409); no competing branch in play
- Base/ops inheritance: no consumer-facing interface removed or renamed

## 边界说明

- [x] 本次改动仅涉及单一层级
- [ ] 本次改动涉及跨层，已说明边界与依赖

> 全部改动落在 `platform` 层内：并发修复与墓碑语义在 `system/iam/tenant`，唯一键冲突识别在
> `pkg/database`，测试隔离在 `pkg/testredis` 及其消费包，发布门禁在 `scripts/foundation-release`。
> 未移动任何认证 / IAM / 组织 / 配置的系统域职责边界；菜单、页面授权、操作授权、接口授权四层边界不变。

## 验证记录

- [x] 后端测试：`go test -count=1 -p 1 ./...`（真 MySQL 8.0.36 + Redis 7，`*_REQUIRED=true`）→ 48 包 ok，0 FAIL，0 SKIP
- [x] 并发专项：`TestConcurrentProvisioning*` 在 `-count=8` 与 `-race`（`CC=MinGW gcc`）下通过
- [x] 墓碑专项：`TestDeletedTenant*` 3 例通过（修复前 `TestDeletedTenantCannotBeRevivedByUpdate` 以复活成功失败，证明缺陷真实）
- [x] Redis 并行专项：4 个历史 flaky 包并行 3 轮全绿
- [x] 发布脚本：`node --test check-release-secrets.test.mjs` 18/18；`npm run -s test:foundation-release` 全绿；扫描器对 v0.17.1 产物与自身测试目录均 0 命中
- [x] 治理：check:docs-frontmatter / check:task-packet / check:structure / check:generated 全过
- [ ] 前端构建：本轮无前端改动，未执行
- [ ] CodeQL 结果已检查并解释：交由 CI
- [ ] GitHub required checks 通过：待 CI
- [ ] Copilot review 已请求，或已说明当前仓库/账号不可用：待提交后请求
- [ ] 已启用或确认将启用 squash auto-merge：待 CI 转绿后启用

补充说明：

race 检测在本机的缺口（v0.17.1 残余 5）根因是 PATH 将 `gcc.exe` 解析到 Cygwin 二进制，
race 启用的测试二进制无法链接。以 `CC=/d/msys64/mingw64/bin/gcc.exe` 定向后 `go test -race`
在本机可执行且全绿——race 覆盖不再仅来自 CI。

CI Secret Scan 曾对扫描器测试夹具的合成值（同 v0.17.0 泄漏形态的十六进制计数器）报
`generic-api-key`——门禁起作用正是本任务的目的。处置不削弱规则：现行行加 `gitleaks:allow`
并注明原因，`.gitleaksignore` 钉住首次引入该文件的历史提交指纹；本地复扫
`325e5dfc..HEAD` 为 0 命中。

## 审核留痕

- Copilot review：requested
- CodeQL 结果：待 CI
- GitHub checks 结果：待 CI
- Auto-merge：not-enabled（待 required checks 绿）
- Duplication Gate 结果：未本地执行；本轮新增 duplicate_key.go 与重试循环，判定以 CI 为准
- 是否高风险改动：否（无 P0；授权语义、Casbin 模型、迁移路径均未改动；行为变化集中在错误码整形与墓碑拒绝，均有用例钉住）
- Residual risk / follow-up：无新增。v0.17.1 登记的 5 项残余已全部处置（2 项缺陷修复、3 项消除条件 / 门禁），详见 remediation 报告 §5 重写版

## 检查清单

- [x] 已明确本次改动归属 `platform`、`system/auth`、`system/iam`、`system/org`、`system/config` 或 `business/*`
- [x] 未把认证、IAM、组织、配置等系统域职责混写
- [x] 前端新增展示文案已使用 i18n（本轮无前端改动）
- [x] 菜单、页面授权、操作授权、接口授权边界保持清晰
- [x] 涉及数据库/权限/菜单/接口变更时，文档已同步（`TENANT_CONTRACT_V1` V1.3、`CHANGELOG`、`RELEASE_NOTES_v0.17.2`、双 README、remediation 报告 §5）
- [x] 已确认不会泄露敏感配置、账号密码或 Token（扫描器测试夹具使用同形态合成值；证据文件中凭据以 `<redacted>` 呈现；发布打包新增凭据预检门禁）
- [x] 已确认本次 PR 由 GitHub required checks、CodeQL 和分支保护负责最终合并门禁
