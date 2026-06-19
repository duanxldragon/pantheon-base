## 变更摘要

- 改动层级：
- 改动模块：
- 目标问题：
- 预期影响：

## Harness 链路

- Task ID：
- Task Manifest：
- Evidence：
- Verification evidence：
- Review Artifact：
- OpenSpec change：
- Trivial change：yes / no
- Quality Profile：auth-security / permission-policy / i18n / ui-runtime / generator / ci-workflow / none
- Ratchet Decision：no-repeat-observed / guide-updated / sensor-added / gate-updated / template-updated / adapter-updated / registry-only
- GitHub Signal：method-gate / repo-quality-gate / runtime-evidence-gate / external-flaky / not-applicable

## Harness adoption markers

> 保留本区块的英文 marker，供 `scripts/harness/check-adoption.mjs` 做机械检查。

- task id:
- task manifest:
- evidence:
- boundaries:
- backend response contract:
- backend DTO contract:
- permission contract:
- audit coverage:
- visual evidence:
- inheritance contract:
- base drift:
- Base/ops inheritance:

## 边界说明

- [ ] 本次改动仅涉及单一层级
- [ ] 本次改动涉及跨层，已说明边界与依赖

> 如果跨层，请补充说明：本次为什么跨层、各层分别承担什么职责、是否影响菜单/权限/i18n/审计。

## 验证记录

- [ ] 后端测试：`go test ./...`
- [ ] 前端构建：`cd frontend && npm run build`
- [ ] 轻量 smoke：`cd frontend && npm run test:smoke:platform:contracts && npm run test:smoke:system:pages`
- [ ] 如涉及系统域深链路，已补充专项 smoke：`cd frontend && npm run test:smoke:system:iam-authz`
- [ ] 其他专项验证已补充
- [ ] CodeQL 结果已检查并解释
- [ ] 如有 open CodeQL alert，已说明是新增问题、既有 baseline、误报还是已补 follow-up
- [ ] Full Smoke 仅在必要时手动或预发布执行，未错误纳入 PR 必过门禁
- [ ] GitHub required checks 通过
- [ ] Copilot review 已请求，或已说明当前仓库/账号不可用
- [ ] 已启用或确认将启用 squash auto-merge

补充说明：

## 审核留痕

- Copilot review：requested / automatic-policy / unavailable
- CodeQL 结果：
- GitHub checks 结果：
- Auto-merge：enabled / not-enabled / not-applicable
- Duplication Gate 结果：
- 是否高风险改动：
- Residual risk / follow-up：

## 检查清单

- [ ] 已明确本次改动归属 `platform`、`system/auth`、`system/iam`、`system/org`、`system/config` 或 `business/*`
- [ ] 未把认证、IAM、组织、配置等系统域职责混写
- [ ] 前端新增展示文案已使用 i18n
- [ ] 菜单、页面授权、操作授权、接口授权边界保持清晰
- [ ] 涉及数据库/权限/菜单/接口变更时，文档已同步
- [ ] 已确认不会泄露敏感配置、账号密码或 Token
- [ ] 已确认本次 PR 由 GitHub required checks、CodeQL 和分支保护负责最终合并门禁
