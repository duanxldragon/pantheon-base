## 变更摘要

- 改动层级：platform（测试夹具 + 治理配置 + 证据文件）
- 目标问题：main 的 push 事件 Secret Scan 走全历史扫描，命中 #410 squash 提交 `43aec46e` 中扫描器测试夹具的合成值（`generic-api-key`）。分支 CI 未报是因为 PR 区间扫描只命中已被 `.gitleaksignore` 覆盖的历史提交；squash 把整个文件当作新增重新引入，而 `gitleaks:allow` 注释在秘密行的上一行——gitleaks v8 只认秘密**同一行**的标注
- 预期影响：夹具行标注移到同一行（附原因），`.gitleaksignore` 钉住 `0fcc38d0` 与 `43aec46e` 两个历史提交指纹；不弱化任何规则。顺带把证据包中的 PR 正文与实际发布版对齐

## Harness 链路

- Task ID：2026-10-23-residual-closeout
- Task Manifest：.harness/tasks/2026-10-23-residual-closeout/manifest.json
- Evidence：.harness/evidence/2026-10-23-residual-closeout/commands.json
- Verification evidence：.harness/evidence/2026-10-23-residual-closeout/summary.md
- Review Artifact：.harness/evidence/2026-10-23-residual-closeout/review.md
- OpenSpec change：none
- Trivial change：no
- Quality Profile：permission-policy
- Ratchet Decision：sensor-added
- GitHub Signal：method-gate

## Harness adoption markers

> 保留本区块的英文 marker，供 `scripts/harness/check-adoption.mjs` 做机械检查。

- task id: 2026-10-23-residual-closeout
- task manifest: .harness/tasks/2026-10-23-residual-closeout/manifest.json
- evidence: .harness/evidence/2026-10-23-residual-closeout/
- boundaries: platform only; a test fixture line and the gitleaks ignore table, no production code touched
- backend response contract: unchanged
- backend DTO contract: unchanged
- permission contract: unchanged
- audit coverage: unchanged
- visual evidence: .harness/evidence/2026-10-23-residual-closeout/ (no UI change)
- inheritance contract: sharedPaths unchanged; pantheon-ops lock target stays v0.17.2
- base drift: branch cut from origin/main 43aec46e (the #410 squash); no competing branch
- Base/ops inheritance: no consumer-facing interface removed or renamed

## 边界说明

- [x] 本次改动仅涉及单一层级
- [ ] 本次改动涉及跨层，已说明边界与依赖

> 只动测试夹具一行、`.gitleaksignore` 与证据文件；无生产代码、无接口、无 schema 变更。

## 验证记录

- [x] 本地全历史 `gitleaks detect`（v8.30.1，无 log-opts，等同 push 事件路径）→ **0 命中**
- [x] `node --test tests/scripts/foundation-release/check-release-secrets.test.mjs` → 10/10
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
- 是否高风险改动：否（治理配置与测试夹具，门禁行为修正且有本地全历史复验）
- Residual risk / follow-up：无新增；`.gitleaksignore` 新增两条指纹均有注释说明成因

## 检查清单

- [x] 已明确本次改动归属 `platform`
- [x] 未把认证、IAM、组织、配置等系统域职责混写
- [x] 菜单、页面授权、操作授权、接口授权边界保持清晰
- [x] 已确认不会泄露敏感配置、账号密码或 Token（本 PR 即在修复门禁误放行的标注方式；本地全历史扫描 0 命中）
- [x] 已确认本次 PR 由 GitHub required checks、CodeQL 和分支保护负责最终合并门禁
