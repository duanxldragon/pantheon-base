## 变更摘要

- 改动层级：platform（呈现/聚合）+ system/auth（登录审计归属）+ system/iam（菜单、租户、角色边界）
- 改动模块：`backend/pkg/tenant`、`backend/modules/system/iam/{menu,tenant,role}`、`backend/modules/auth/{login,mfa}`、`frontend/src/core/{entitlements,layout}`、`frontend/src/modules/{lowcode,platform,system/iam/tenant}`、登录页、五语言资源、单测与任务证据
- 目标问题：维护者人工验收提出的三类缺陷——①租户管理员仍看到「租户管理/菜单管理/国际化管理」并落到 403；②租户安全审计的登录日志为空；③免费/基础/专业/旗舰四个套餐的控制台完全相同
- 预期影响：租户会话不再收到平台专用菜单或权限键；登录/安全事件按会话归属租户写入；套餐差异由前台注册表驱动，后端不按套餐初始化控制台功能，角色权限仍是授权边界

## Harness 链路

- Task ID：`2026-10-22-tenant-plan-entitlements-and-audit`
- Task Manifest：`.harness/tasks/2026-10-22-tenant-plan-entitlements-and-audit/manifest.json`
- Evidence：`.harness/evidence/2026-10-22-tenant-plan-entitlements-and-audit/commands.json`
- Verification evidence：`.harness/evidence/2026-10-22-tenant-plan-entitlements-and-audit/summary.md`
- Review Artifact：`.harness/evidence/2026-10-22-tenant-plan-entitlements-and-audit/review.md`
- OpenSpec change：none
- Trivial change：no
- Quality Profile：permission-policy
- Ratchet Decision：sensor-added
- GitHub Signal：repo-quality-gate

## Harness adoption markers

- task id: 2026-10-22-tenant-plan-entitlements-and-audit
- task manifest: .harness/tasks/2026-10-22-tenant-plan-entitlements-and-audit/manifest.json
- evidence: .harness/evidence/2026-10-22-tenant-plan-entitlements-and-audit/commands.json
- boundaries: system/auth+system/iam+platform presentation; authorization semantics unchanged
- backend response contract: unchanged endpoints; tenant-scoped menu trees exclude platform-only rows
- backend DTO contract: unchanged
- permission contract: tenant-owned roles can no longer be assigned platform-only menu/permission keys; platform roles unchanged
- audit coverage: improved — login success/failure/MFA/security events attributed to the session tenant; compat stays tenant 0
- visual evidence: .harness/evidence/2026-10-22-tenant-plan-entitlements-and-audit/artifacts/（27 张，四套餐菜单/403/登录日志/低代码入口/生成器锁定态/创建矩阵）+ 标签探针截图 2 张
- inheritance contract: no sharedPaths change; no foundation release cut in this PR
- base drift: none introduced
- Base/ops inheritance: no ops-side changes; consumption requires a future foundation release

## 边界说明

- [ ] 本次改动仅涉及单一层级
- [x] 本次改动涉及跨层，已说明边界与依赖

补充：平台专用面只有一个分类源 `backend/pkg/tenant/platform_scope.go`，菜单读取、provisioning、角色写入、权限缓存四处共用；前端镜像仅用于渲染兜底。套餐差异只存在于前台 `frontend/src/core/entitlements/plans.ts`，模块声明 feature，shell 统一过滤；客户端门禁是 UX，不是授权。

## 验证记录

- [x] 后端全量：真实 MySQL 8 + Redis 7，`go test -race -p 1 -count=1 ./...` exit 0，46 包 ok，无 FAIL、无 data race
- [x] 后端定向：`login`、`menu`、`tenant`、`role` 四包回归通过（新增审计归属、菜单过滤、provisioning 修复、角色可分配性用例）
- [x] 前端单测：`vitest run` 30 文件 / 214 用例通过（含套餐注册表 6、菜单回归 2、widget 门禁 1、会话 store 3、标签可达性 2）
- [x] 前端类型与 lint：`tsc -b`、`eslint .` exit 0
- [x] 前端构建：13 步 prebuild（Arco patch + 12 项 contract）+ Vite build 通过
- [x] i18n：2929 key，zh-CN/en-US/ja-JP/ko-KR/fr-FR 缺失 0
- [x] 浏览器级：四套餐真实租户（300/301/302/303）创建并登录；菜单、直连 403、登录日志、低代码入口、数据源锁定态、平台创建矩阵均有 JSON + 截图证据；在最终登录重置与标签修复后已重跑
- [x] 标签专项：免费租户直连 `/system/tenant` 得 403、直连 `/system/generator` 得升级页，标签栏均保持 `["工作台"]`（`tab-residual-result.json`）
- [x] 文档门禁：`frontmatter-check`（340 docs / 247 with frontmatter）、`check-task-packet`（本包 PASS）
- [x] 未删除功能、未绕过校验、未降低安全要求、未屏蔽失败测试
- [ ] 本地全量并行 `-race` 曾出现 Redis 状态竞争假失败，本轮采用 `-p 1` 串行；hosted 并行腿是最终信号
- [ ] CodeQL / Sonar / GitHub required checks：pending（本提交 CI 结论）

## 审核留痕

- Copilot review：unavailable（solo 维护者仓库）
- CodeQL 结果：pending（本提交 CI 结论）
- GitHub checks 结果：pending（本提交 CI 结论）
- Auto-merge：not-enabled
- Duplication Gate 结果：pending（本提交 CI 结论）
- 是否高风险改动：yes（权限面、审计归属、租户菜单）
- Residual risk / follow-up：①套餐门禁是 UX，若需 API 级商业强制须另立后端 entitlement 需求；②v0.17.0 `repo.tar`/tgz 仍含已失效旧凭据，处置需维护者决定；③历史延期 P2/P3（C3/C5/C6/C7、E3、C8–C12、D3–D6）不在本 PR 范围

## 检查清单

- [x] 已明确本次改动归属 `platform` / `system/auth` / `system/iam`
- [x] 未把认证、IAM、组织、配置等系统域职责混写
- [x] 前端新增展示文案已使用 i18n
- [x] 菜单、页面授权、操作授权、接口授权边界保持清晰
- [x] 涉及数据库/权限/菜单/接口变更时，文档已同步（无迁移变更；权限与菜单边界已写入报告）
- [x] 已确认不会泄露敏感配置、账号密码或 Token（归档验收脚本已移除本地口令默认值）
- [x] 已确认本次 PR 由 GitHub required checks、CodeQL 和分支保护负责最终合并门禁
