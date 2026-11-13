## 变更摘要

- 改动层级：platform（密钥扫描豁免清单）
- 改动模块：`.gitleaksignore`
- 目标问题：字段改名只影响新树，squash 提交 `0c5b1073` 仍含原始 `key` 字段，历史扫描继续报 `generic-api-key`
- 预期影响：逐条登记该历史提交的精确指纹；代码、扫描规则与门禁策略均不变

## Harness 链路

- Task ID：2026-11-05-base-freeze-release
- Task Manifest：.harness/tasks/2026-11-05-base-freeze-release/manifest.json
- Evidence：.harness/evidence/2026-11-05-base-freeze-release/commands.json
- Verification evidence：.harness/evidence/2026-11-05-base-freeze-release/summary.md
- Review Artifact：.harness/evidence/2026-11-05-base-freeze-release/review.md
- OpenSpec change：none
- Trivial change：yes
- Quality Profile：auth-security
- Ratchet Decision：no-repeat-observed
- GitHub Signal：repo-quality-gate

## Harness adoption markers

- task id: 2026-11-05-base-freeze-release
- task manifest: .harness/tasks/2026-11-05-base-freeze-release/manifest.json
- evidence: .harness/evidence/2026-11-05-base-freeze-release/commands.json
- boundaries: Ignore-list only; no source, workflow, rule or gate-policy change
- backend response contract: not applicable; no API changes
- backend DTO contract: not applicable; no DTO changes
- permission contract: not applicable; no permission changes
- audit coverage: unchanged; evidence-only diff
- visual evidence: not applicable; no UI changes
- inheritance contract: Official release remains required
- base drift: none
- Base/ops inheritance: Pending official release/consumer verification

## 边界说明

- [x] 本次改动仅涉及单一层级
- [ ] 本次改动涉及跨层，已说明边界与依赖

> 如果跨层，请补充说明：不跨层；仅扫描豁免清单。

## 验证记录

- `git log -S` 核实含原始字段的提交只有 `77471d73` 与 `0c5b1073`，两条指纹已登记。
- 新树字段已改为 `sonarIssueRef`，扫描不再命中该模式。
- 实际判据以本 PR 的 Secret Scan 结果为准；本地未安装 gitleaks。

## 审核留痕

- Copilot review：not available
- CodeQL 结果：not-applicable；仅豁免清单
- GitHub checks 结果：pending current PR
- Auto-merge：not-enabled
- Duplication Gate 结果：pending current PR
- 是否高风险改动：no
- Residual risk / follow-up：如后续再次改写历史导致 SHA 变化，需重新登记；不改扫描规则、不扩大豁免范围

## 检查清单

- [x] 已明确本次改动归属 `platform`、`system/auth`、`system/iam`、`system/org`、`system/config` 或 `business/*`
- [x] 未把认证、IAM、组织、配置等系统域职责混写
- [x] 前端新增展示文案已使用 i18n（本次无前端改动）
- [x] 菜单、页面授权、操作授权、接口授权边界保持清晰
- [x] 涉及数据库/权限/菜单/接口变更时，文档已同步（本次无此类变更）
- [x] 已确认不会泄露敏感配置、账号密码或 Token
- [x] 已确认本次 PR 由 GitHub required checks、CodeQL 和分支保护负责最终合并门禁
