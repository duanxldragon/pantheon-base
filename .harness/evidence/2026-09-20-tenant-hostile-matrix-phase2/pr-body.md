## 变更摘要

- 改动层级：system（tenant verification 测试面）
- 改动模块：`frontend/tests/smoke-core/`（新增 phase2 矩阵 spec）+ `frontend/scripts/`（fixture 恢复脚本）
- 目标问题：`tenant-verification-and-gray` review finding #1 要求扩展 hostile 双租户浏览器矩阵——phase 1（2026-09-15）覆盖登录选择器/dashboard/上传/refresh rotation 后，auth-log、audit、settings、dynamic-module 四个表面仍无双租户浏览器覆盖；且 matrix dict fixtures 为手工预置、`tenantmatrixdb down` 后无法复原
- 预期影响：仅新增测试与 fixture 脚本，产品代码/契约/权限/菜单/i18n 零改动；fixtures 从「不可再生」变为幂等脚本化

## Harness 链路

- Task ID：2026-09-20-tenant-hostile-matrix-phase2
- Task Manifest：.harness/tasks/2026-09-20-tenant-hostile-matrix-phase2/manifest.json
- Evidence：.harness/evidence/2026-09-20-tenant-hostile-matrix-phase2/commands.json
- Verification evidence：.harness/evidence/2026-09-20-tenant-hostile-matrix-phase2/summary.md
- Review Artifact：.harness/evidence/2026-09-20-tenant-hostile-matrix-phase2/review.md
- OpenSpec change：none
- Trivial change：no
- Quality Profile：auth-security
- Ratchet Decision：no-repeat-observed
- GitHub Signal：repo-quality-gate

## Harness adoption markers

> 保留本区块的英文 marker，供 `scripts/harness/check-adoption.mjs` 做机械检查。

- task id: 2026-09-20-tenant-hostile-matrix-phase2
- task manifest: .harness/tasks/2026-09-20-tenant-hostile-matrix-phase2/manifest.json
- evidence: .harness/evidence/2026-09-20-tenant-hostile-matrix-phase2/commands.json
- boundaries: new smoke-core spec + fixture provisioning script only; no product code, no routes, no Casbin/policy, no menu/i18n, no tenantmatrixdb changes
- backend response contract: none (asserts existing responses only)
- backend DTO contract: none
- permission contract: none (read surfaces only; unverified write rejection re-asserted)
- audit coverage: none (audit surfaces are read-side assertions)
- visual evidence: table-card render assertions per tenant page; no pixel/visual snapshot change
- inheritance contract: none
- base drift: none
- Base/ops inheritance: ops consumes via next foundation release; no manual copy

## 边界说明

- [x] 本次改动仅涉及单一层级
- [ ] 本次改动涉及跨层，已说明边界与依赖

> 全部改动收敛在测试与测试基础设施；后端与产品前端零改动。

## 验证记录

- [x] 后端测试：不适用（无后端改动）
- [ ] 前端构建：不适用（测试文件不进构建产物）
- [x] 轻量 smoke：phase1 + phase2 双 spec 在真实 multi 模式后端 9/9 通过（30.9s，--workers=1）；登录选择器、wrong-password、dashboard+refresh、upload namespace、dict fixtures、auth-log、audit、settings、dynamic-module 全部覆盖
- [x] 如涉及系统域深链路，已补充专项 smoke：本 PR 即 tenant 隔离专项矩阵扩展
- [x] 其他专项验证已补充：运行后环境静息态恢复验证（flag=compat、租户 101/202 via tenantmatrixdb up、cleanup-smoke-fixtures 登录恢复可用）；fixture 脚本幂等重跑通过
- [x] CodeQL 结果已检查并解释：无新信任边界（只读断言 + fixture 脚本）；由 PR required checks 执行
- [ ] 如有 open CodeQL alert，已说明：不适用
- [x] Full Smoke 仅在必要时手动或预发布执行，未错误纳入 PR 必过门禁
- [ ] GitHub required checks 通过：推送后由分支保护执行
- [x] Copilot review 已请求，或已说明当前仓库/账号不可用：创建 PR 后按仓库策略请求
- [x] 已启用或确认将启用 squash auto-merge

补充说明：本地环境运行要点已记入 evidence summary——① Clash 系统代理会拦截 playwright APIRequestContext 的 POST 并丢 cookie（表现为 csrf.missing），需 `NO_PROXY=127.0.0.1,localhost`，CI 无系统代理不受影响；② `PANTHEON_API_BASE_URL` 必须含 `/api/v1` 后缀；③ vite 代理默认 8080，矩阵运行需 `--proxy-target` 指向矩阵后端；④ `tenantmatrixdb down` 会清除 dict fixtures 且其迁移回滚在共享库上因 v16 PREPARE 语法失败（kill-switch 先生效，恢复路径 `up` + fixture 脚本）。

## 审核留痕

- Copilot review：requested
- CodeQL 结果：由 PR required checks 执行并留痕于 GitHub
- GitHub checks 结果：推送后由分支保护判定
- Auto-merge：enabled
- Duplication Gate 结果：not-applicable（新增独立 spec 与脚本，无重复模式）
- 是否高风险改动：no（测试-only + fixture 脚本；产品代码零改动）
- Residual risk / follow-up：tenantmatrixdb down 的 v16 回滚语法问题（pre-existing 工具债，记入 evidence gaps）

## 检查清单

- [x] 已明确本次改动归属 system（tenant verification）
- [x] 未把认证、IAM、组织、配置等系统域职责混写（未触碰产品代码）
- [x] 前端新增展示文案已使用 i18n：不适用（spec 复用既有 i18n 文案断言）
- [x] 菜单、页面授权、操作授权、接口授权边界保持清晰（仅断言既有边界）
- [x] 涉及数据库/权限/菜单/接口变更时，文档已同步（task packet + evidence 记录）
- [x] 已确认不会泄露敏感配置、账号密码或 Token（commands.json 中 DSN 已脱敏）
- [x] 已确认本次 PR 由 GitHub required checks、CodeQL 和分支保护负责最终合并门禁
