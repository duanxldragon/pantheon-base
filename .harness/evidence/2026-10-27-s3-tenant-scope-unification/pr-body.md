## 变更摘要

- 改动层级：跨层——`platform`（`backend/pkg/tenant` 共享构件）+ `system/auth` + `system/iam` + `system/org` + `system/config`；未触碰 `business/*` 与 `frontend/**`。
- 改动模块：`backend/pkg/tenant`；`system/iam`（role / user / permission）；`system/org`（dept / post）；`system/config`（dict / setting）；`platform`（dashboard）；`system/auth`（login / security / session / oidc）。
- 目标问题：代码精简 programme 的三个剩余 S3 波次——RC-012/RC-027 租户 scope 三件套在 14 个服务重复、RC-026 OIDC handler 六处裸响应疑似信封漂移、RC-022 role data-scope 镜像模型漂移风险。
- 预期影响：纯内部实现与文档变更。路由、响应信封、权限码、菜单、i18n key、错误码、schema、迁移、seed 均不变。生产代码 tracked 25 文件 +267/−364，加上新增共享 helper 53 行后净 −44；新增测试 486 行（快照 84 + 两租户冒烟 402）。

## Harness 链路

- Task ID：2026-10-27-s3-tenant-scope-unification
- Task Manifest：.harness/tasks/2026-10-27-s3-tenant-scope-unification/manifest.json
- Evidence：.harness/evidence/2026-10-27-s3-tenant-scope-unification/commands.json
- Verification evidence：.harness/evidence/2026-10-27-s3-tenant-scope-unification/summary.md
- Review Artifact：.harness/evidence/2026-10-27-s3-tenant-scope-unification/review.md
- OpenSpec change：none
- Trivial change：no
- Quality Profile：permission-policy
- Ratchet Decision：sensor-added
- GitHub Signal：repo-quality-gate
- 伴随任务包：2026-10-27-s3-oidc-envelope（`.harness/evidence/2026-10-27-s3-oidc-envelope/`）、2026-10-27-s3-role-data-scope-model（`.harness/evidence/2026-10-27-s3-role-data-scope-model/`），各自 commands/summary/review 齐备

## Harness adoption markers

- task id: 2026-10-27-s3-tenant-scope-unification
- task manifest: .harness/tasks/2026-10-27-s3-tenant-scope-unification/manifest.json
- evidence: .harness/evidence/2026-10-27-s3-tenant-scope-unification/commands.json
- boundaries: platform + system/auth + system/iam + system/org + system/config; business/* untouched
- backend response contract: unchanged (OIDC responses classified and kept; comments only)
- backend DTO contract: unchanged
- permission contract: unchanged; data-scope resolution code untouched
- audit coverage: not-applicable (no audit behavior changed; setting audit call sites only switched to the shared helper)
- visual evidence: not-applicable (no UI change)
- inheritance contract: none (no contract revision)
- base drift: none
- Base/ops inheritance: internal-only change, follows the next foundation release; no ops action

## 边界说明

- [ ] 本次改动仅涉及单一层级
- [x] 本次改动涉及跨层，已说明边界与依赖

> 跨层原因：租户 scope 是 `platform` 共享构件，调用方分布在 `system/*` 与 `system/auth`；改动只是把各服务内的同构副本替换为共享实现，各层职责不变（system 层仍持有自己的业务查询与模块特有策略）。不涉及菜单/权限/i18n 变更；`setting` 覆盖叠加全局读范围、`dashboard` 表白名单、`login.Runtime` 组合根属有意保留的模块特有面。

## 验证记录

- [x] 后端测试：`cd backend && go test -count=1 ./...` → 47 ok / 0 FAIL / 6 无测试包
- [ ] 前端构建：`cd frontend && npm run build`（本次无前端改动，不适用）
- [ ] L0 静态契约：`cd frontend && npm run test:smoke:l0`（无前端改动，不适用）
- [ ] L1 关键路径 smoke（PR 必过）：`cd frontend && npm run test:smoke:l1`（无前端改动，不适用）
- [ ] L2 命中模块 smoke：`cd frontend && npm run test:smoke:module:<...>`（无前端改动，不适用）
- [ ] 如涉及系统域深链路，已补充专项 smoke：`cd frontend && npm run test:smoke:system:iam-authz`（无前端改动，不适用）
- [x] 其他专项验证已补充：`gofmt -l modules pkg` 空；`go build ./...`、`go vet ./...` exit 0；`grep func.*tenantOwnerID` = 0；`grep func.*scoped(db *gorm.DB)` = 0；`grep roleDataScopePolicy` = 0；`go list -deps permission | grep role` = 0；`check-doc-links --strict`、`check-doc-inventory --strict` 0 findings；`check-task-packet` 0 error；`check-evidence --strict`、`check-review --strict` 0 error；`check-security-patterns` 无违规
- [ ] CodeQL 结果已检查并解释（由 CI required check 产出）
- [ ] 如有 open CodeQL alert，已说明是新增问题、既有 baseline、误报还是已补 follow-up
- [ ] Full Smoke 仅在必要时手动或预发布执行，未错误纳入 PR 必过门禁
- [ ] GitHub required checks 通过（等待 CI）
- [ ] Copilot review 已请求，或已说明当前仓库/账号不可用
- [ ] 已启用或确认将启用 squash auto-merge（高风险改动，等待两名非作者批准后由维护者开启）

补充说明：本机为 Windows，`go test -race` 因 cgo 不可用而无法执行（`-race requires cgo`），race 读数由 CI Linux 承担；两租户冒烟因本机无 MySQL DSN 而 skip，CI 以 `PANTHEON_TEST_DSN_REQUIRED=true` 强制执行。

## 审核留痕

- Copilot review：unavailable（agent 会话无法请求；请维护者触发）
- CodeQL 结果：等待 CI required check；本地 `scripts/check-security-patterns.mjs` 未发现违规
- GitHub checks 结果：pending CI
- Auto-merge：not-enabled（高风险改动，需两名非作者批准）
- Duplication Gate 结果：pending CI
- 是否高风险改动：yes（`system/auth`、`system/iam`、`system/config` 与共享 `pkg/tenant`）
- Residual risk / follow-up：①本机 race 与 MySQL 运行读数由 CI 承担；②SSO 落地时回调成功载荷与 config 发现端点需随 session/SPA 消费方迁到 common 信封；③role data-scope 的迁移索引命名（`idx_` 非唯一 vs model `uk_` 唯一）与遗留列属迁移治理包。

## 检查清单

- [x] 已明确本次改动归属 `platform`、`system/auth`、`system/iam`、`system/org`、`system/config` 或 `business/*`
- [x] 未把认证、IAM、组织、配置等系统域职责混写
- [x] 前端新增展示文案已使用 i18n（本次无前端文案新增）
- [x] 菜单、页面授权、操作授权、接口授权边界保持清晰
- [x] 涉及数据库/权限/菜单/接口变更时，文档已同步（本次无此类变更；相关 review/证据已落档）
- [x] 已确认不会泄露敏感配置、账号密码或 Token
- [x] 已确认本次 PR 由 GitHub required checks、CodeQL 和分支保护负责最终合并门禁
