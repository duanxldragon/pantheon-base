## 变更摘要

- 改动层级：platform（证据资产与密钥扫描配置）
- 改动模块：Release Gate 证据快照、`.gitleaksignore`
- 目标问题：Secret Scan 将 Sonar issue 的 `key` 字段误判为 `generic-api-key`；squash 合入会改变提交 SHA，使指纹豁免失效
- 预期影响：证据快照字段改名，扫描恢复绿色；不改变任何运行时行为

## Harness 链路

- Task ID：2026-11-05-base-freeze-release
- Task Manifest：.harness/tasks/2026-11-05-base-freeze-release/manifest.json
- Evidence：.harness/evidence/2026-11-05-base-freeze-release/commands.json
- Verification evidence：.harness/evidence/2026-11-05-base-freeze-release/summary.md
- Review Artifact：.harness/evidence/2026-11-05-base-freeze-release/review.md
- OpenSpec change：none
- Trivial change：yes
- Quality Profile：auth-security
- Ratchet Decision：guide-updated
- GitHub Signal：repo-quality-gate

## Harness adoption markers

- task id: 2026-11-05-base-freeze-release
- task manifest: .harness/tasks/2026-11-05-base-freeze-release/manifest.json
- evidence: .harness/evidence/2026-11-05-base-freeze-release/commands.json
- boundaries: Evidence-only field rename; no backend, frontend, schema, permission or workflow policy changes
- backend response contract: not applicable; no API changes
- backend DTO contract: not applicable; no DTO changes
- permission contract: not applicable; no permission changes
- audit coverage: existing 1889 pass / 0 fail / 1 skip race run unchanged; this diff touches JSON evidence only
- visual evidence: not applicable; no UI changes
- inheritance contract: Official release remains required
- base drift: none; this is a Base-side evidence correction
- Base/ops inheritance: Pending official release/consumer verification

## 边界说明

- [x] 本次改动仅涉及单一层级
- [ ] 本次改动涉及跨层，已说明边界与依赖

> 如果跨层，请补充说明：不跨层；仅证据快照与扫描豁免清单。

## 验证记录

- `node -e` 解析改名后的快照：`total=2`，两条 issue 仍可按 `sonarIssueRef` 追溯。
- Secret Scan 的实际闭环以本 PR 的 Security Gates 结果为准；上一轮 PR 已证明该规则会在原字段上报红。
- 本地未运行 gitleaks（需下载扫描器）；以托管 Secret Scan 作为判据，不声称本地通过。

## 审核留痕

- Copilot review：not available
- CodeQL 结果：not-applicable；仅证据字段改名
- GitHub checks 结果：pending current PR
- Auto-merge：not-enabled
- Duplication Gate 结果：pending current PR
- 是否高风险改动：no
- Residual risk / follow-up：`.gitleaksignore` 中两条历史指纹保留作重扫保护；若未来在同行写入真实凭据，规则仍会报红

## 检查清单

- [x] 已明确本次改动归属 `platform`、`system/auth`、`system/iam`、`system/org`、`system/config` 或 `business/*`
- [x] 未把认证、IAM、组织、配置等系统域职责混写
- [x] 前端新增展示文案已使用 i18n（本次无前端改动）
- [x] 菜单、页面授权、操作授权、接口授权边界保持清晰
- [x] 涉及数据库/权限/菜单/接口变更时，文档已同步（本次无此类变更）
- [x] 已确认不会泄露敏感配置、账号密码或 Token
- [x] 已确认本次 PR 由 GitHub required checks、CodeQL 和分支保护负责最终合并门禁
