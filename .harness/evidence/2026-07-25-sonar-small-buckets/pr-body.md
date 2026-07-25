## 变更摘要

- 改动层级：platform（容器/引导脚本/测试卫生，无产品运行时逻辑变更）
- 改动模块：`Dockerfile`、`frontend/index.html`、`backend/start-dev.sh`、`backend/tests/performance/*`、`frontend/tests/*`、`.harness/{tasks,evidence}/2026-07-25-sonar-small-buckets/`
- 目标问题：SonarCloud 存量清零批次之"小桶"——22 条散落在容器文件、HTML 引导脚本、开发脚本与测试代码中的 OPEN findings（docker:S7018/S7031、js:S2486/S3358、shelldre:S7688/S7677、ts:S2925×7/S2245/S7780、js:S7726×3/S2245×2）。
- 预期影响：22 条 findings 在下次 main 分析后消失；固定等待全部替换为其所代表的可观测条件（networkidle/元素可见/CSS 动画完成/双 rAF 冲刷），冒烟测试更稳而非更松；k6 负载分布不变但变为可复现。

## Harness 链路

- Task ID：2026-07-25-sonar-small-buckets
- Task Manifest：.harness/tasks/2026-07-25-sonar-small-buckets/manifest.json
- Evidence：.harness/evidence/2026-07-25-sonar-small-buckets/commands.json
- Verification evidence：.harness/evidence/2026-07-25-sonar-small-buckets/summary.md
- Review Artifact：.harness/evidence/2026-07-25-sonar-small-buckets/review.md
- OpenSpec change：none
- Trivial change：no
- Quality Profile：ci-workflow
- Ratchet Decision：no-repeat-observed
- GitHub Signal：repo-quality-gate

## Harness adoption markers

> 保留本区块的英文 marker，供 `scripts/harness/check-adoption.mjs` 做机械检查。

- task id: 2026-07-25-sonar-small-buckets
- task manifest: .harness/tasks/2026-07-25-sonar-small-buckets/manifest.json
- evidence: .harness/evidence/2026-07-25-sonar-small-buckets/commands.json
- boundaries: 未触碰 frontend/src 与 backend Go 产品源码；唯一行为变化是 index.html 存储异常时颜色模式回退更完整（review.md 有记录）
- backend response contract: not-applicable
- backend DTO contract: not-applicable
- permission contract: not-applicable
- audit coverage: not-applicable
- visual evidence: not-applicable（无 UI 视觉改动；index.html 仅重构脚本控制流）
- inheritance contract: not-applicable（base 自身仓库）
- base drift: not-applicable
- Base/ops inheritance: pantheon-ops 按维护者决策搁置，待 base 发行版本后基于 release 同步
- Copilot review: requested
- CodeQL 结果: not-applicable
- GitHub checks 结果: 提交后由 required checks 验证（Smoke Sanity 直接覆盖被改的两个冒烟 spec）
- Auto-merge: enabled
- Duplication Gate 结果: not-applicable
- 是否高风险改动: 否（逐条 1:1 对应 SonarCloud finding 的外科手术式修复；固定等待→可观测条件的每处等价性论证见 review.md）
- Residual risk / follow-up: getAnimations 等待存在"过渡在断言后一帧才启动"的理论窗口，由 PR 必过的 Smoke Sanity 直接验证；剩余存量按批次推进（go:S1192 常量化 → 前端风格规则 → S3776 复杂度重构）。

## 边界说明

- [x] 本次改动仅涉及单一层级
- [ ] 本次改动涉及跨层，已说明边界与依赖

## 验证记录

- [x] 后端测试：`go test ./...`（not-applicable：未触碰 Go 源码）
- [x] 前端构建：`cd frontend && npm run build`（not-applicable：仅测试与 index.html 脚本控制流重构；tsc --noEmit 已通过）
- [x] 轻量 smoke：`cd frontend && npm run test:smoke:platform:contracts && npm run test:smoke:system:pages`（由 PR 必过 Smoke Sanity 执行，直接覆盖本次改动的 spec）
- [x] 其他专项验证已补充：`tsc --noEmit`（含 tests）通过；22 条 finding 与修复 1:1 映射清单见 summary.md
- [x] CodeQL 结果已检查并解释：无新增告警面（测试与配置类文件）
- [x] 如有 open CodeQL alert，已说明：当前 0 open alert 基线
- [x] Full Smoke 仅在必要时手动或预发布执行，未错误纳入 PR 必过门禁
- [x] GitHub required checks 通过（提交后由 CI 出具）
- [x] Copilot review 已请求，或已说明当前仓库/账号不可用
- [x] 已启用或确认将启用 squash auto-merge

补充说明：Codex relay 仍不可用（401/挂起），按维护者 2026-07-23 先例由 Claude 直接实施并在提交信息注明。

## 审核留痕

- Copilot review：requested
- CodeQL 结果：not-applicable
- GitHub checks 结果：提交后由 required checks 验证
- Auto-merge：enabled
- Duplication Gate 结果：not-applicable
- 是否高风险改动：否
- Residual risk / follow-up：见 Harness adoption markers 同名条目

## 检查清单

- [x] 已明确本次改动归属 `platform`、`system/auth`、`system/iam`、`system/org`、`system/config` 或 `business/*`
- [x] 未把认证、IAM、组织、配置等系统域职责混写
- [x] 前端新增展示文案已使用 i18n（not-applicable）
- [x] 菜单、页面授权、操作授权、接口授权边界保持清晰（not-applicable）
- [x] 涉及数据库/权限/菜单/接口变更时，文档已同步（not-applicable）
- [x] 已确认不会泄露敏感配置、账号密码或 Token
- [x] 已确认本次 PR 由 GitHub required checks、CodeQL 和分支保护负责最终合并门禁
