## 变更摘要

- 改动层级：system/iam（permission 子域）
- 改动模块：`backend/modules/system/iam/permission/`（workbench 绑定表 + 3 个测试文件）
- 目标问题：审计项 D（DESIGN_SUPPLEMENT_AUDIT_20260910 §7.2，1.0 冻结前）——权限工作台的权限键→API 路由绑定表为手工维护且无守护；实跑核实发现**真实漂移已发生**：`system:user:create` 绑定 `POST /api/v1/system/user/create`，而实际注册是 `POST /api/v1/system/user`，导致「受控补齐」会创建指向不存在路由的死策略，真实创建路由依旧 403
- 预期影响：修正漂移绑定；绑定表升级为带治理契约的受守护表（新增路由漂移机械门禁，任何路由改名/改方法不同步绑定表时 CI 红灯）；整改流程语义不变

## Harness 链路

- Task ID：2026-09-20-permission-workbench-route-binding
- Task Manifest：.harness/tasks/2026-09-20-permission-workbench-route-binding/manifest.json
- Evidence：.harness/evidence/2026-09-20-permission-workbench-route-binding/commands.json
- Verification evidence：.harness/evidence/2026-09-20-permission-workbench-route-binding/summary.md
- Review Artifact：.harness/evidence/2026-09-20-permission-workbench-route-binding/review.md
- OpenSpec change：none
- Trivial change：no
- Quality Profile：permission-policy
- Ratchet Decision：sensor-added
- GitHub Signal：repo-quality-gate

## Harness adoption markers

> 保留本区块的英文 marker，供 `scripts/harness/check-adoption.mjs` 做机械检查。

- task id: 2026-09-20-permission-workbench-route-binding
- task manifest: .harness/tasks/2026-09-20-permission-workbench-route-binding/manifest.json
- evidence: .harness/evidence/2026-09-20-permission-workbench-route-binding/commands.json
- boundaries: permission workbench binding table + drift guard only; no Casbin middleware, no policy CRUD, no remediation action, no frontend changes
- backend response contract: none (workbench DTO unchanged)
- backend DTO contract: none
- permission contract: binding table corrected to match live registrations; remediation now provably targets existing routes (drift guard)
- audit coverage: none (no audit behavior change)
- visual evidence: none (no UI change)
- inheritance contract: none
- base drift: none
- Base/ops inheritance: ops consumes via next foundation release; no manual copy

## 边界说明

- [x] 本次改动仅涉及单一层级
- [ ] 本次改动涉及跨层，已说明边界与依赖

> 全部改动收敛在 system/iam/permission 子域；Casbin 中间件与策略 CRUD 零改动。

## 验证记录

- [x] 后端测试：permission 包全量 DB-backed ok 7.9s；无 DSN skip 路径 ok 0.034s；相邻域（iam menu/role/user、audit、contracts、middleware，-short DB-backed）全绿
- [ ] 前端构建：不适用（无前端改动）
- [ ] 轻量 smoke：不适用（无 UI 改动）
- [x] 如涉及系统域深链路，已补充专项 smoke：新增路由漂移守卫 `TestRequiredAPIRoutesExistOnEngine`（构建真实路由表逐条校验绑定表）+ 探针哨兵测试
- [x] 其他专项验证已补充：路由注册逐一对照审计（11/12 匹配，1 条漂移已修正）；`go vet`/`gofmt` clean
- [x] CodeQL 结果已检查并解释：无新信任边界（只读访问器 + 测试）；由 PR required checks 执行
- [ ] 如有 open CodeQL alert，已说明：不适用
- [x] Full Smoke 仅在必要时手动或预发布执行，未错误纳入 PR 必过门禁
- [ ] GitHub required checks 通过：推送后由分支保护执行
- [x] Copilot review 已请求，或已说明当前仓库/账号不可用：创建 PR 后按仓库策略请求
- [x] 已启用或确认将启用 squash auto-merge

补充说明：完整「从路由注册表派生绑定表」（engine→service 导出，横跨全部模块注册函数）记录为后续方向——本任务的漂移守卫即其未来验收器。历史环境中若已按旧绑定下发过死策略，按路径存在性的清理属 ratchet 候选（Bootstrap 现仅按角色存在性清理孤儿策略）。

## 审核留痕

- Copilot review：requested
- CodeQL 结果：由 PR required checks 执行并留痕于 GitHub
- GitHub checks 结果：推送后由分支保护判定
- Auto-merge：enabled
- Duplication Gate 结果：not-applicable（绑定表为数据表，漂移守卫为新增测试文件）
- 是否高风险改动：yes（system/iam 权限链）——行为面收窄到绑定表一条修正 + 机械门禁；政策 CRUD/中间件/整改动作零改动；全量回归绿
- Residual risk / follow-up：运行时路由表派生（后续方向）；死策略按路径清理（ratchet 候选）

## 检查清单

- [x] 已明确本次改动归属 system/iam
- [x] 未把认证、IAM、组织、配置等系统域职责混写（未触碰 auth/org/config）
- [x] 前端新增展示文案已使用 i18n：不适用（无前端改动）
- [x] 菜单、页面授权、操作授权、接口授权边界保持清晰（授权边界本身未变，绑定表指向已修正）
- [x] 涉及数据库/权限/菜单/接口变更时，文档已同步（task packet 记录方案取舍与后续方向）
- [x] 已确认不会泄露敏感配置、账号密码或 Token
- [x] 已确认本次 PR 由 GitHub required checks、CodeQL 和分支保护负责最终合并门禁
