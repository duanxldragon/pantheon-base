## 变更摘要

- 改动层级： platform Harness governance; official Base -> Ops handoff evidence
- 改动模块： 五个原始任务的验收状态、任务包、证据/索引；前七项已合并PR497
- 目标问题： 旧stock consumer race与不完整依赖图曾阻断原始验收；修复已正式发布消费，任务状态仍待新审查收口
- 预期影响： 双路独立批准后关闭剩余五项，保留原12任务40条标准及全部失败历史；源码和门禁不变

## Harness 链路

- Task ID： 2026-11-05-base-freeze-release
- Task Manifest： .harness/tasks/2026-11-05-base-freeze-release/manifest.json
- Evidence： .harness/evidence/2026-11-05-base-freeze-release/commands.json
- Verification evidence： .harness/evidence/2026-11-05-base-freeze-release/summary.md
- Review Artifact： .harness/evidence/2026-11-05-base-freeze-release/review.md
- OpenSpec change： none
- Trivial change： no
- Quality Profile： auth-security
- Ratchet Decision： registry-only
- GitHub Signal： runtime-evidence-gate

## Harness adoption markers

> 保留本区块的英文 marker，供 `scripts/harness/check-adoption.mjs` 做机械检查。

- task id: 2026-11-05-base-freeze-release
- task manifest: .harness/tasks/2026-11-05-base-freeze-release/manifest.json
- evidence: .harness/evidence/2026-11-05-base-freeze-release/commands.json
- boundaries: five final original-scope governance transitions, original12/40 preserved; production source unchanged
- backend response contract: unchanged
- backend DTO contract: unchanged
- permission contract: unchanged; production SSRF/auth policy preserved
- audit coverage: old red/green and source-overlay failures retained; official no-overlay acceptance linked
- visual evidence: no new UI behavior; historical desktop/narrow artifacts retained; current hosted platform/system smoke140pass and four consumer generator suites pass
- inheritance contract: official Basev0.18.5 four GitHub assets atimmutable1da0834b; standard assembly and exact source validation; OpsPR177 merged92c1efcf
- base drift: 826 compared /816 identical /10 allowed; all847 reporthashes and1031 sourcefiles match
- Base/ops inheritance: Base owns fixture correction PR496; Ops owns composition normalization PR176 and consumes official corrective release PR177; Base497seven closures merged

## 边界说明

- [x] 本次改动仅涉及单一层级
- [ ] 本次改动涉及跨层，已说明边界与依赖

> 如果跨层，请补充说明：12项本地治理检查在最终状态转换后通过；CODE APPROVE/ARCH CLEAR同指纹五项批准见resume11-five-task-applied.json。原40标准/scope保留；本PR source diff为空。正式Base1890/0/1、FE218、FullSmoke/ReleaseGate成功；实际官方OpsreadonlyCGO2170/0/1/64packages，FE218/scripts59/migration32clean，四套标准smoke及托管platform/system140pass；Ops177已合并，模块/fixture/source1031文件未变。

此PR仅完成准确治理投影和本身CI/merge，不签freeze或豁免S3，不修复范围外Ops业务/生产问题。历史原始日志/报告/计划指纹有可解压SHA256档案。库存250含237archives，候选250completed/0inprogress。本次为什么跨层、各层分别承担什么职责、是否影响菜单/权限/i18n/审计。

## 验证记录

- [ ] 后端测试：`go test ./...`
- [ ] 前端构建：`cd frontend && npm run build`
- [ ] L0 静态契约：`cd frontend && npm run test:smoke:l0`
- [ ] L1 关键路径 smoke（PR 必过）：`cd frontend && npm run test:smoke:l1`
- [ ] L2 命中模块 smoke（PR 按改动路径自动选择，也可本地手跑）：`cd frontend && npm run test:smoke:module:<iam|config|i18n|audit|org|platform|all>`
- [ ] 如涉及系统域深链路，已补充专项 smoke：`cd frontend && npm run test:smoke:system:iam-authz`
- [x] 其他专项验证已补充
- [x] CodeQL 结果已检查并解释
- [ ] 如有 open CodeQL alert，已说明是新增问题、既有 baseline、误报还是已补 follow-up
- [ ] Full Smoke 仅在必要时手动或预发布执行，未错误纳入 PR 必过门禁
- [ ] GitHub required checks 通过
- [x] Copilot review 已请求，或已说明当前仓库/账号不可用
- [ ] 已启用或确认将启用 squash auto-merge

补充说明：

## 审核留痕

- Copilot review：automatic-policy
- CodeQL 结果： immutable Base and merged Ops security/CodeQL passed; this governance PR hosted checks pending
- GitHub checks 结果： this PR pending; Base497 and Ops177 allrequired success, hosted source gates preserved
- Auto-merge： not-enabled
- Duplication Gate 结果： source and prior PR gates passed at original thresholds; this PR pending
- 是否高风险改动： original security/inheritance acceptance; fresh non-author CODE/ARCH reports on identical plan/source SHA256
- Residual risk / follow-up： S3 realskip/no waiver; maintenancefreeze unsigned; OpsQA002freshdeployattempt and extra hostimportsetup gaps; networkpolicy/CImeasurement/securitybaselines/production/legacy-auth followups; nonrequiredVercel

## 检查清单

- [x] 已明确本次改动归属 `platform`、`system/auth`、`system/iam`、`system/org`、`system/config` 或 `business/*`
- [x] 未把认证、IAM、组织、配置等系统域职责混写
- [x] 前端新增展示文案已使用 i18n
- [x] 菜单、页面授权、操作授权、接口授权边界保持清晰
- [x] 涉及数据库/权限/菜单/接口变更时，文档已同步
- [x] 已确认不会泄露敏感配置、账号密码或 Token
- [ ] 已确认本次 PR 由 GitHub required checks、CodeQL 和分支保护负责最终合并门禁
