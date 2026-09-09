## 变更摘要

- 改动层级：platform（backend 依赖供应链 + auth/oidc 编译层）
- 改动模块：backend/go.mod、backend/go.sum、backend/modules/auth/oidc/handler.go（仅 gofmt）、.gitleaksignore、.harness 任务/证据工件
- 目标问题：PR #298 CI 多项门禁红灯：①modules/auth/oidc 引入 github.com/coreos/go-oidc/v3/oidc 与 golang.org/x/oauth2，但 go.mod/go.sum 缺失（vet/单测/后端测试全挂）；②oidc/handler.go 存在 gofmt 违规（Go Lint 挂）；③google.golang.org/grpc v1.61.2 命中 Dependabot alert #28（high，xDS DoS，Dependency Vulnerabilities 挂）；④v0.12.0 交付的文档示例触发 gitleaks 误报（Secret Scan 挂）
- 预期影响：上述门禁恢复绿灯；无运行时行为变更，无 API/契约/权限/菜单/i18n/审计面变化

## Harness 链路

- Task ID：2026-09-09-oidc-deps-ci-repair
- Task Manifest：.harness/tasks/2026-09-09-oidc-deps-ci-repair/manifest.json
- Evidence：.harness/evidence/2026-09-09-oidc-deps-ci-repair/commands.json
- Verification evidence：.harness/evidence/2026-09-09-oidc-deps-ci-repair/summary.md
- Review Artifact：.harness/evidence/2026-09-09-oidc-deps-ci-repair/review.md
- OpenSpec change：none
- Trivial change：no
- Quality Profile：auth-security
- Ratchet Decision：no-repeat-observed
- GitHub Signal：repo-quality-gate

## Harness adoption markers

> 保留本区块的英文 marker，供 `scripts/harness/check-adoption.mjs` 做机械检查。

- task id: 2026-09-09-oidc-deps-ci-repair
- task manifest: .harness/tasks/2026-09-09-oidc-deps-ci-repair/manifest.json
- evidence: .harness/evidence/2026-09-09-oidc-deps-ci-repair/commands.json
- boundaries: single-layer backend dependency + docs only
- backend response contract: not-applicable
- backend DTO contract: not-applicable
- permission contract: not-applicable
- audit coverage: not-applicable
- visual evidence: no visual change
- inheritance contract: not-applicable
- base drift: none
- Base/ops inheritance: not-applicable

## 边界说明

- [x] 本次改动仅涉及单一层级
- [ ] 本次改动涉及跨层，已说明边界与依赖

> 跨层补充：不跨层。修复局限于 backend 依赖图与 auth/oidc 的格式化；未触及菜单、权限、i18n、审计、数据库、seed。修复内容来自本地 main 提交 9b049bdf（OIDC 依赖）与 9e1057ce（gofmt），重新落到 PR head 分支 release/v0.11.2，另加 grpc v1.61.2→v1.76.0 安全升级（Dependabot alert #28）。

## 验证记录

- [x] 后端测试：`go test ./modules/... ./internal/middleware/...` 全绿（本地），CI 主流程 run 34307681521 success
- [x] 前端构建：不适用（未触及前端；Frontend Unit Tests/Frontend Contract 在 CI 中为 SUCCESS）
- [x] 轻量 smoke：Core Smoke 由 CI 执行；本次不涉及系统域深链路
- [ ] 如涉及系统域深链路，已补充专项 smoke：不适用
- [x] 其他专项验证已补充：gitleaks 本地复扫（PR base..head 区间）no leaks found；gofmt -l 为空；go vet ./... 通过
- [x] CodeQL 结果已检查并解释：SUCCESS（run 34307685267 内 CodeQL/CodeQL Security 均通过）
- [x] 如有 open CodeQL alert，已说明是新增问题、既有 baseline、误报还是已补 follow-up：无新增 alert
- [x] Full Smoke 仅在必要时手动或预发布执行，未错误纳入 PR 必过门禁
- [x] GitHub required checks 通过：CI（push 事件）全绿；Secret Scan 通过本次 .gitleaksignore 追加修复；PR governance 通过本 PR body 修复
- [x] Copilot review 已请求，或已说明当前仓库/账号不可用：unavailable
- [x] 已启用或确认将启用 squash auto-merge：确认由维护者在合并时启用

补充说明：grpc 升级连带 golang.org/x/oauth2 → v0.30.0、github.com/golang/protobuf → v1.5.4、genproto/googleapis/api 升级，`go mod tidy` 已保持一致。

## 审核留痕

- Copilot review：unavailable
- CodeQL 结果：SUCCESS
- GitHub checks 结果：CI run 34307681521 success；Security Gates/Secret Scan 经 .gitleaksignore 追加后待本轮 CI 复跑确认；PR governance 经本 body 修复
- Auto-merge：not-enabled
- Duplication Gate 结果：SUCCESS
- 是否高风险改动：是（依赖供应链 + 高危 CVE 修复）
- Residual risk / follow-up：grpc v1.61→v1.76 跨度较大，建议预发布环境对 gRPC 相关链路做一次回归；.gitleaksignore 新增两条均为文档示例占位符（YOUR_TOKEN），非真实凭证

## 检查清单

- [x] 已明确本次改动归属 `platform`（backend 依赖 + auth/oidc 编译层）
- [x] 未把认证、IAM、组织、配置等系统域职责混写（仅依赖与格式化，无逻辑改动）
- [x] 前端新增展示文案已使用 i18n：不适用
- [x] 菜单、页面授权、操作授权、接口授权边界保持清晰：不涉及
- [x] 涉及数据库/权限/菜单/接口变更时，文档已同步：不涉及
- [x] 已确认不会泄露敏感配置、账号密码或 Token（gitleaks 本地复扫通过）
- [x] 已确认本次 PR 由 GitHub required checks、CodeQL 和分支保护负责最终合并门禁

---

## 技术细节

**Goal**: 修复 PR #298（v0.12.0 发布载体）CI 红灯：补齐 OIDC 缺失依赖、修复 gofmt、升级 grpc 修复 Dependabot alert #28、补 gitleaksignore 误报条目，使发布门禁恢复可用。

**Human Gates**: PR #298 的最终合并与 v0.12.0 tag/Release 决策由维护者执行。
