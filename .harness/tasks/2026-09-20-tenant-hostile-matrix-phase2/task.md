---
task_id: 2026-09-20-tenant-hostile-matrix-phase2
title: Hostile browser matrix phase 2 — auth-log/audit/settings/dynamic-module two-tenant coverage
created: 2026-09-20
status: in-review
priority: P2
layer: system
risk: test-only-plus-fixture-script
---

# Task Packet — 2026-09-20-tenant-hostile-matrix-phase2

## 背景

`tenant-verification-and-gray` 的 review finding #1 要求扩展 hostile
双租户浏览器矩阵。phase 1（2026-09-15）已覆盖登录选择器、dashboard、
上传命名空间、refresh rotation；phase 2 补齐剩余表面。

## 范围

### In

- 新 spec `frontend/tests/smoke-core/tenant-hostile-browser-matrix-phase2.spec.ts`：
  1. auth-log 表面：login-log 与 security-event 页面按租户渲染且 pinned
  2. audit 表面：operation-log 列表/详情/导出 pinned 到操作租户
  3. settings 表面：tenant-bound setting 组读取 per-tenant；cache refresh scoped
  4. dynamic-module 表面：module registry 列表 per-tenant 可读；未验证写被拒
- fixture 恢复脚本 `frontend/scripts/tenant-matrix-fixture-setup.mjs`：
  通过管理 API 幂等重建 `matrix_browser_a/_b` dict fixtures
  （tenantmatrixdb down 会清除它们，此前为手工预置无脚本化）

### Out

- 不改产品代码、路由、权限、菜单、i18n
- 不修改 phase 1 spec 与 tenantmatrixdb 工具
- 性能/负载场景（非本任务）

## 验收标准

- phase1 + phase2 双 spec 在真实 multi 模式后端 9/9 通过
- 环境静息态恢复：flag=compat、租户 101/202、cleanup 脚本可用
- 门禁：task-packet / frontmatter / pr-governance 全绿

## 风险与缓解

- 仅新增测试与 fixture 脚本，无契约面 → 无生产风险
- 本地 Clash 系统代理会拦截 playwright APIRequestContext（cookie 丢失
  → csrf.missing）；CI 无系统代理不受影响；本地运行需 NO_PROXY=127.0.0.1
- fixture 脚本将此前不可再生的手工预置步骤脚本化，消除了 down 后矩阵
  测试不可复跑的缺口

## Evidence

- `.harness/evidence/2026-09-20-tenant-hostile-matrix-phase2/`
