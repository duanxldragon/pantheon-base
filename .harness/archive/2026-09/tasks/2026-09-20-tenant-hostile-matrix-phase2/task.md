---
task_id: 2026-09-20-tenant-hostile-matrix-phase2
title: Hostile browser matrix phase 2 — auth-log/audit/settings/dynamic-module two-tenant coverage
created: 2026-09-20
status: completed
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

## Closeout（合入后回写，2026-09-20）

| 最小交付件 | 事实 |
|---|---|
| PR | https://github.com/duanxldragon/pantheon-base/pull/329 |
| Merge commit | `3f35a0666ac0fc2dc67af482f8a309dfcbfd4bc4` |
| Merged at | 2026-09-20T05:54:31Z |
| 分支收口 | `feat/tenant-hostile-matrix-phase2` 已从 origin 删除 |
| GitHub signal（PR 侧） | 32 success / 2 skipped；红的两条都是 advisory `Bench Perf Smoke`（缺陷在 #330 修掉），required 全绿后 auto-merge |
| GitHub signal（main tip `b3350be3`） | required：`CI`（含 Quality Gates / Frontend Contract）、`Security Gates`、`Code Quality Gates`、`Lint Workflows` 全绿；advisory `Core Smoke` 红，且先于本 PR 存在（见 FR-011） |
| Review | `review.md`：standard（test-only + fixture 脚本，无契约面） |
| Evidence | `commands.json` / `summary.md`（含 post-review lint 修复记录） |
| Ratchet | no-repeat-observed（本任务不新增规则；期间观察到的问题归入 FR-010 / FR-011） |

### Known gap（显式）

- 「phase1+phase2 9/9」是**本地 live multi-mode 后端**的证据。CI 中唯一运行
  `tests/smoke-core/` 租户 spec 的 job 是 advisory 的 `Core Smoke`
  （push-only + `continue-on-error`），它在 main 上自 ≥2026-09-05 起持续红，
  因此这些租户 spec 目前没有可信的 CI 绿信号；PR 路径上的 required 门禁
  不会执行它们。已记为 `FR-011`（registry-only，待维护者决定处置方式：
  给 CI 接上 multi-mode + fixture，或把租户 spec 移出 core smoke 范围）。
