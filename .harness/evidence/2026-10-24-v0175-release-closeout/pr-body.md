## 变更摘要

- 改动层级：platform（发布材料）
- 改动模块：`VERSION`、`CHANGELOG.md`、`README.md`、`README.en.md`、`RELEASE_NOTES_v0.17.5.md`、`.harness/STATUS.md`、任务包 `docs/harness/tasks/2026-10-24-v0175-release-closeout.task.md`、manifest 与 evidence
- 目标问题：把 PR #420（`45aa7389`）已合并的五项 IAM 并发收口发布为 `pantheon-base-v0.17.5`——同租户并发 provisioning、replace 式授权、历史 `tenant_id = 0` 权限行、CI race 证据、v0.17.3 说明更正；这些修复此前只存在于 `main`，没有任何可消费产物携带
- 预期影响：仅版本材料与发布证据，`backend/**` 生产代码零改动；schema 仍为 29，无路由、权限码、菜单 seed、工作流或错误信封变化

## Harness 链路

- Task ID：2026-10-24-v0175-release-closeout
- Task Manifest：.harness/tasks/2026-10-24-v0175-release-closeout/manifest.json
- Evidence：.harness/evidence/2026-10-24-v0175-release-closeout/commands.json
- Verification evidence：.harness/evidence/2026-10-24-v0175-release-closeout/summary.md
- Review Artifact：.harness/evidence/2026-10-24-v0175-release-closeout/review.md
- OpenSpec change：none
- Trivial change：no
- Quality Profile：permission-policy
- Ratchet Decision：sensor-added
- GitHub Signal：repo-quality-gate

## Harness adoption markers

> 保留本区块的英文 marker，供 `scripts/harness/check-adoption.mjs` 做机械检查。

- task id: 2026-10-24-v0175-release-closeout
- task manifest: .harness/tasks/2026-10-24-v0175-release-closeout/manifest.json
- evidence: .harness/evidence/2026-10-24-v0175-release-closeout/
- boundaries: version material and release evidence only; the released production content is the system/iam and pkg/testmysql change already merged in 45aa7389; no schema, route, permission-code, menu-seed, workflow or frontend change
- backend response contract: unchanged in this PR; released contract was unchanged in #420
- backend DTO contract: unchanged
- permission contract: unchanged; grant rows keep the (tenant_id, role_id, permission_key) natural key
- audit coverage: unchanged
- visual evidence: not-applicable
- inheritance contract: no sharedPaths or contract document change
- base drift: branch cut from main 45aa7389
- Base/ops inheritance: pantheon-ops needs no change; it gains the fixes by advancing its foundation pin to v0.17.5

## 边界说明

- [x] 本次改动仅涉及单一层级
- [ ] 本次改动涉及跨层，已说明边界与依赖

补充说明：本 PR 只新增/更新版本材料、任务包与 evidence。生产改动（`system/iam` 三个模块与 `pkg/testmysql`）已随 #420 合入 `main`，本次不再修改；`git diff --name-only pantheon-base-v0.17.4..HEAD` 中没有任何 migration 或 `.github/workflows` 文件。

## 验证记录

- [x] 后端构建：`go build ./...`、`go vet ./...`、`gofmt -l .` 全部干净
- [x] 后端测试：`set -a; . ../.env.test; set +a; PANTHEON_TEST_DSN_REQUIRED=true PANTHEON_TEST_REDIS_REQUIRED=true go test -timeout 600s -count=1 ./...` → 46 packages ok，0 FAIL，0 SKIP（6 个包无测试文件，`EXIT=0`）
- [x] 专项回归（真实 MySQL）：同租户收敛 + 拷贝锁 + 跨租户隔离 2.926s PASS；role replace 锁 + backfill 归位/去重/平台命名空间修复 2.201s PASS；user replace 锁 + 重复键 409 映射 1.758s PASS
- [x] 治理检查：frontmatter 349 docs、task packet 54 文件 0 error（40 条历史 warning）、structure 0 findings / 2557 文件、generated 0 findings / 11 产物、failure registry 0 error；`check-evidence --strict` 与 `check-review --strict` 通过
- [x] `git diff --stat pantheon-base-v0.17.4..HEAD`：21 文件 / 1533 插入 / 119 删除，其中 backend 9 文件全部在 `system/iam` 与 `pkg/testmysql`
- [ ] 前端构建：未涉及前端文件，not-applicable
- [ ] L0/L1/L2 smoke：未涉及前端或路由变化，not-applicable
- [ ] CodeQL 结果：待 CI
- [ ] GitHub required checks：待 CI（含 `quality.yml` `backend-tests` 的 `go test -race ./...`，作为 race 残留的权威证据）
- [ ] Copilot review：待 PR Automation
- [ ] Duplication Gate 结果：待 CI
- [ ] 已启用或确认将启用 squash auto-merge

补充说明：本机 TSan 无法启动（Windows error 87），race 证据以 CI Linux 的 `Backend Tests` 为准；上一轮 head `973f5be2` 的 run `39970863908` 已通过该 job。

## 审核留痕

- Copilot review：requested
- CodeQL 结果：待 CI
- GitHub checks 结果：待 CI
- Auto-merge：enabled by PR Automation
- Duplication Gate 结果：待 CI
- 是否高风险改动：no（本 PR 自身仅版本材料；其中发布的 `system/iam` 改动已在 #420 合入并按 `2026-10-23-iam-race-closeout` 审查）
- Residual risk / follow-up：本机无法启动 TSan（error 87），race 证据由 CI 提供；拷贝串行化依赖租户行锁（`system_dict_item` 无唯一键）；已发布 v0.17.0–v0.17.4 的 tag 与资产不可变

## 检查清单

- [x] 已明确本次改动归属 `platform`（发布材料）
- [x] 未把认证、IAM、组织、配置等系统域职责混写
- [x] 前端新增展示文案已使用 i18n：未涉及前端
- [x] 菜单、页面授权、操作授权、接口授权边界保持清晰
- [x] 涉及数据库/权限/菜单/接口变更时，文档已同步：本次无 schema / 路由 / 权限码变化，版本材料与 evidence 已同步
- [x] 已确认不会泄露敏感配置、账号密码或 Token
