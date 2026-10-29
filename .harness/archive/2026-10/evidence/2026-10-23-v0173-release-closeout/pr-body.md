## 变更摘要

- 改动层级：platform（版本材料 + 发布收口证据）
- 改动模块：`VERSION`、`CHANGELOG.md`、`RELEASE_NOTES_v0.17.3.md`、`README(.en).md`、`.harness/STATUS.md`、v0.17.3 任务包与证据
- 目标问题：把已合入的 v0.17.2 发布后复核修复（R-1…R-5）装进下一份可消费资产。v0.17.2 的凭据门禁只扫描 `bundle/`，而 v0.17.0 残留只在 `repo.tar` 中；修复已在 `main`，但不在任何可消费资产里。本 PR 准备 `v0.17.3` 版本材料，合并并通过 `Release Gate` 后打标发布
- 预期影响：无运行时行为变更（v0.17.2..HEAD 的后端差异只有一行注释）；schema 仍为 29；无路由、权限码、菜单或错误信封变化；`sharedPaths` 仍为 52

## Harness 链路

- Task ID：2026-10-23-v0173-release-closeout
- Task Manifest：.harness/tasks/2026-10-23-v0173-release-closeout/manifest.json
- Evidence：.harness/evidence/2026-10-23-v0173-release-closeout/commands.json
- Verification evidence：.harness/evidence/2026-10-23-v0173-release-closeout/summary.md
- Review Artifact：.harness/evidence/2026-10-23-v0173-release-closeout/review.md
- OpenSpec change：none
- Trivial change：no
- Quality Profile：permission-policy
- Ratchet Decision：gate-updated
- GitHub Signal：repo-quality-gate

## Harness adoption markers

> 保留本区块的英文 marker，供 `scripts/harness/check-adoption.mjs` 做机械检查。

- task id: 2026-10-23-v0173-release-closeout
- task manifest: .harness/tasks/2026-10-23-v0173-release-closeout/manifest.json
- evidence: .harness/evidence/2026-10-23-v0173-release-closeout/
- boundaries: platform version material only; no runtime code, schema, routes, permissions or menus touched
- backend response contract: unchanged
- backend DTO contract: unchanged
- permission contract: unchanged
- audit coverage: unchanged
- visual evidence: not applicable (no UI change; the tenant-picker smoke assertion is unchanged)
- inheritance contract: sharedPaths unchanged at 52
- base drift: branch cut from origin/main 933ffddd (the #414 merge); no competing branch
- Base/ops inheritance: no consumer-facing interface removed or renamed; pantheon-ops may stay on v0.17.2

## 边界说明

- [x] 本次改动仅涉及单一层级
- [ ] 本次改动涉及跨层，已说明边界与依赖

> 只动版本材料与发布证据；已合入的门禁修复不在本 PR 修改范围内。

## 验证记录

- [x] 凭据扫描器单测：12/12
- [x] `test:foundation-release`：57/57，0 失败 0 跳过
- [x] 扫描器自检：`--path tests/scripts/foundation-release` → clean（6 文件）
- [x] 治理检查：frontmatter / task packet / structure / generated / failure registry 全绿
- [x] 后端：`go build ./... && go vet ./... && gofmt -l .` 干净
- [x] 前端：`tsc --noEmit`、ESLint 干净；租户选择器烟测 3/3（含窄视口）
- [ ] CodeQL 结果已检查并解释：交由 CI
- [ ] GitHub required checks 通过：待 CI
- [ ] Copilot review 已请求：待提交后请求
- [ ] 已启用或确认将启用 squash auto-merge：待 CI 转绿后启用

## 审核留痕

- Copilot review：requested
- CodeQL 结果：待 CI
- GitHub checks 结果：待 CI
- Auto-merge：not-enabled（待 required checks 绿）
- Duplication Gate 结果：未本地执行；本轮无生产代码
- 是否高风险改动：否（版本材料与发布证据；无运行时变化）
- Residual risk / follow-up：完整后端真库套件未在本轮重跑（后端仅注释差异，v0.17.2 包已全量绿）；本地烟测因 5173 被占用使用已有 Vite 服务，spec 自行 mock API；已发布 v0.17.0 资产仍含已轮换口令且不可回收

## 检查清单

- [x] 已明确本次改动归属 `platform`
- [x] 未把认证、IAM、组织、配置等系统域职责混写
- [x] 前端新增展示文案已使用 i18n（本轮无文案变更）
- [x] 菜单、页面授权、操作授权、接口授权边界保持清晰
- [x] 涉及数据库/权限/菜单/接口变更时，文档已同步（本轮无此类变更）
- [x] 已确认不会泄露敏感配置、账号密码或 Token
- [x] 已确认本次 PR 由 GitHub required checks、CodeQL 和分支保护负责最终合并门禁
