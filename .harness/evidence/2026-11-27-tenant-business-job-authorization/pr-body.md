## 变更摘要

- 改动层级: system/auth / shared contracts / platform release
- 改动模块: durable business job authorization and Foundation v0.19.1
- 目标问题: Grant durable work from the current owner and roles inside its persisted tenant.
- 预期影响: Multi supports tenant-owned jobs. Compat continues to support tenant 0.

## Harness 链路

- Task ID: 2026-11-27-tenant-business-job-authorization
- Task Manifest: .harness/tasks/2026-11-27-tenant-business-job-authorization/manifest.json
- Evidence: .harness/evidence/2026-11-27-tenant-business-job-authorization/commands.json
- Verification evidence: .harness/evidence/2026-11-27-tenant-business-job-authorization/summary.md
- Review Artifact: .harness/evidence/2026-11-27-tenant-business-job-authorization/review.md
- OpenSpec change: none
- Trivial change: no
- Quality Profile: auth-security
- Ratchet Decision: sensor-added
- GitHub Signal: repo-quality-gate

## Harness adoption markers

- task id: 2026-11-27-tenant-business-job-authorization
- task manifest: .harness/tasks/2026-11-27-tenant-business-job-authorization/manifest.json
- evidence: .harness/evidence/2026-11-27-tenant-business-job-authorization/commands.json
- boundaries: Auth resolves current authority inside the resource tenant. Business owns source, targets and provider calls.
- backend response contract: Existing HTTP contract.
- backend DTO contract: Trusted JobInput retains its existing fields and types.
- permission contract: Current owner, active tenant and membership, and the exact registered action and tenant policy.
- audit coverage: Existing audit path covered by full backend race and hosted smoke.
- visual evidence: Backend authorization and release documentation.
- inheritance contract: Official Foundation v0.19.1 followed by the declared Ops rebuild.
- base drift: Shared changes are included in the Foundation assets.
- Base/ops inheritance: Ops T14 verifies consumption and file distribution.

## 边界说明

- [x] 本次改动涉及跨层，已说明边界与依赖

## 验证记录

- [x] 定向授权回归使用本地 MySQL 隔离库
- [x] Windows CGO race 全量通过，2,289 项通过，未配置真实 S3 的用例跳过
- [x] Go 增量 lint、文档治理、安全模式和 Foundation 脚本测试通过
- [x] 已补充独立代码和合同评审
- [ ] GitHub required checks 通过

## 审核留痕

- Copilot review: Existing native independent code and contract reviews are recorded in the task.
- CodeQL 结果: Candidate GitHub Security Gates required before merge.
- GitHub checks 结果: Hosted checks run on this PR.
- Auto-merge: Disabled. Squash merge follows required checks and feedback resolution.
- Duplication Gate 结果: Hosted Quality Gates verify this candidate.
- 是否高风险改动: yes, auth and shared authorization contract.
- Residual risk / follow-up: Exact-commit Full Smoke and Release Gate precede publication. Ops consumption and file distribution runtime verification follow publication.

## 检查清单

- [x] 已明确改动层级
- [x] 权限合同已同步
- [x] 已附验证与评审证据
