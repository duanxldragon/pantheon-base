## 变更摘要

- 改动层级：platform（共享安全包与生成器验证）
- 改动模块：SSRF 清理注释、动态模块构建检查测试
- 目标问题：Release Gate 严格计数发现2项未关闭 Sonar 问题（go:S1186、godre:S8209）
- 预期影响：明确无 deadline 时的空清理回调意图，合并相邻同类型参数声明，保持执行行为

## Harness 链路

- Task ID：2026-11-05-base-freeze-release
- Task Manifest：.harness/tasks/2026-11-05-base-freeze-release/manifest.json
- Evidence：.harness/evidence/2026-11-05-base-freeze-release/commands.json
- Verification evidence：.harness/evidence/2026-11-05-base-freeze-release/summary.md
- Review Artifact：.harness/evidence/2026-11-05-base-freeze-release/review.md
- OpenSpec change：none
- Trivial change：no
- Quality Profile：auth-security
- Ratchet Decision：guide-updated
- GitHub Signal：repo-quality-gate

## Harness adoption markers

> 保留本区块的英文 marker，供 `scripts/harness/check-adoption.mjs` 做机械检查。

- task id: 2026-11-05-base-freeze-release
- task manifest: .harness/tasks/2026-11-05-base-freeze-release/manifest.json
- evidence: .harness/evidence/2026-11-05-base-freeze-release/commands.json
- boundaries: Two-file comment/parameter declaration cleanup; shared behavior and release gate policy preserved
- backend response contract: not applicable; no API changes
- backend DTO contract: not applicable; no DTO changes
- permission contract: not applicable; no permission changes
- audit coverage: 1889 pass / 0 fail / 1 skip; 47 passing test packages; independent CODE APPROVE / ARCH CLEAR; prior exact main Full Smoke passed
- visual evidence: .harness/evidence/2026-11-05-base-freeze-release/audit-screenshots/
- inheritance contract: Official release remains required
- base drift: Shared source changes belong to Base and reach Ops through official release
- Base/ops inheritance: Pending official release/consumer verification

## 边界说明

- [x] 本次改动仅涉及单一层级
- [ ] 本次改动涉及跨层，已说明边界与依赖

> 如果跨层，请补充说明：不跨层；两项改动分别位于共享安全包与生成器测试。

## 验证记录

Fresh `go test -race -json -p 1 -count=1 ./...`: 1889 pass / 0 fail / 1 skip; 47 passing test packages (S3 provider unavailable). All 14 governance checks passed. CODE APPROVE / ARCH CLEAR independently verified the exact two-file delta. Source hashes and raw-log hashes are recorded in `sonar-validation.json` and `review-source-manifest-sonar.json`. Frontend/runtime behavior is unchanged; prior rendered evidence and full smoke remain linked, with fresh hosted checks required on this candidate.

## 审核留痕

- Copilot review：unavailable; independent reviewer report linked in task evidence
- CodeQL 结果：Previous main CodeQL and Dependabot release checks passed; current candidate requires fresh checks
- GitHub checks 结果：Main0e56f922 Full Smoke passed; Release Gate blocked on2 exact Sonar issues
- Auto-merge：not-enabled
- Duplication Gate 结果：pending current PR
- 是否高风险改动：yes; shared SSRF and generator validation scope
- Residual risk / follow-up：Latest CI and Release Gate still required before publishing; Ops validation remains pending

## 检查清单

- [x] 已明确本次改动归属 `platform`、`system/auth`、`system/iam`、`system/org`、`system/config` 或 `business/*`
- [x] 未把认证、IAM、组织、配置等系统域职责混写
- [ ] 前端新增展示文案已使用 i18n
- [x] 菜单、页面授权、操作授权、接口授权边界保持清晰
- [ ] 涉及数据库/权限/菜单/接口变更时，文档已同步
- [x] 已确认不会泄露敏感配置、账号密码或 Token
- [x] 已确认本次 PR 由 GitHub required checks、CodeQL 和分支保护负责最终合并门禁
