---
title: Naming, Repository Layout, and Layer Boundary Remediation Plan
doc_type: Plan
layer: platform
status: Active
updated_at: 2026-09-22
---

# 命名、目录与分层边界整改计划

## 目标

让目录结构、文件命名和代码依赖边界遵循一套可执行、可审查、可回归的标准。本计划只覆盖本轮结构审查发现的问题，不改变今天已规划的六个运行时整改任务。

## 基线结论

- `backend/modules` 与 `frontend/src/modules` 的主域目录总体符合现行白名单。
- Go 文件、前端组件、hooks 已有 `check:structure` 机械门禁。
- `platform -> system`、`auth -> system/iam` 等生产代码依赖确实存在；现有门禁只覆盖 `business/*`，因此这些违规未被自动阻断。
- `docs/` 根部仍有历史文档散落，需逐项确认引用后再移动或归档。
- `auth`、`lowcode`、`generated` 是既有物理布局例外，必须明确为受控例外，禁止继续扩散。

## 任务顺序

### Wave 0：标准冻结与证据盘点

1. `2026-09-22-naming-boundary-canonical-standard`
2. `2026-09-22-document-layout-inventory`

### Wave 1：边界基线与门禁

3. `2026-09-22-layer-boundary-gate`
4. `2026-09-22-generated-artifact-governance`

### Wave 2：低风险目录收敛

5. `2026-09-22-document-relocation-and-archive`
6. `2026-09-22-frontend-style-naming-alignment`

## 统一完成门禁

- 任务必须有 manifest、task 文档及 `.harness/evidence/<task-id>/` 下的 commands、summary、review。
- 目录或命名变更必须先更新 canonical 规范，再更新 checker、CI、文档引用和测试。
- 边界任务必须先提交当前违规基线，再决定逐项修复、建立 adapter，或记录有期限的受控例外；不能通过扩大白名单消除结果。
- 生产代码边界检查必须区分 production 与 test/generated 文件；豁免必须有明确注释和证据。
- 不得直接移动仍被引用的文档或生成文件；先建立引用清单，再执行可回退迁移。
- 验证至少包括 `npm run check:structure`、边界 checker、受影响 Go/前端测试及 `go vet`。

## 执行状态（2026-09-23）

| # | 任务 | Wave | 状态 | evidence |
| --- | --- | --- | --- | --- |
| 1 | `2026-09-22-naming-boundary-canonical-standard` | 0 | ✅ completed | `.harness/evidence/2026-09-22-naming-boundary-canonical-standard/` |
| 2 | `2026-09-22-document-layout-inventory` | 0 | ✅ completed | `.harness/evidence/2026-09-22-document-layout-inventory/` |
| 3 | `2026-09-22-layer-boundary-gate` | 1 | ✅ completed（auth 模型级耦合冻结为基线至 2026-12-31） | `.harness/evidence/2026-09-22-layer-boundary-gate/` |
| 4 | `2026-09-22-generated-artifact-governance` | 1 | ✅ completed | `.harness/evidence/2026-09-22-generated-artifact-governance/` |
| 5 | `2026-09-22-document-relocation-and-archive` | 2 | ✅ completed | `.harness/evidence/2026-09-22-document-relocation-and-archive/` |
| 6 | `2026-09-22-frontend-style-naming-alignment` | 2 | ✅ completed | `.harness/evidence/2026-09-22-frontend-style-naming-alignment/` |

统一完成门禁已满足：6 个任务均有 manifest + task 文档 + `.harness/evidence/<task-id>/` 下的
`commands.json` / `summary.md` / `review.md`。落地门禁：`npm run check:structure`（等价
`node scripts/harness/check-structure-contract.mjs --root . --strict`）、
`check-boundaries --strict --baseline`、`check-generated --strict`、`check-doc-links`、
`check-doc-inventory`、`frontmatter-check`、Go build/vet/test、tsc/vite build 全绿。

显式残余 gap：

- ~~`auth/login`、`auth/login/login_runtime.go`、`auth/security/security_service.go` 对
  `system/iam/user` 的模型级依赖冻结在 `config/boundary-baseline.json`（需 `UserReader` 契约）。~~
  **2026-09-23 关闭**：`pkg/contracts/authuser` 端口落地，生产代码已不再 import `system/iam/user`；
  基线中 3 条条目成为 stale，已删除，并由 `check-boundaries --strict` 的 stale 检测兜住回归。
- ~~生成器尚未对新产出的模块文件写标记；门禁当前覆盖 11 个稳定产物。~~
  **2026-09-24 关闭**：标记写入已由 2026-09-23 落地（exporter 导出层统一打标）；
  `check-generated` 现动态发现 `backend|frontend/**/modules/business/<module>/` 文本产物
  与 `schema/generated/<scope>/*.json`，与 11 个稳定产物一并 `--strict` 校验，
  负例测试见 `tests/scripts/harness-check-generated.test.mjs`（task
  `2026-09-24-fix-report-residual-closeout`）。
- ~~`scripts/check-arch-boundaries.mjs` 未接入 CI，与 `check-boundaries.mjs` 职责重叠。~~
  **2026-09-23 关闭**：脚本已删除（它依赖外部 `rg`、`checkGeneratedRegistry` 与
  `check-generated.mjs` 重复，`checkSystemCrossDependency` 找的是不存在的
  `service|repository|handler` 目录，属死规则）。其中唯一有效的意图已按真实不变量
  移植到 `check-boundaries.mjs`：`system/*` 子域内部不得互相 import，只能在
  `backend/modules/system/system_modules.go` 组合根接线。
- `docs/` 根部保留 4 个 `testing-*.md` 与 2 个 harness 指南（盘点判定 KEEP_ADD_INDEX）。

## 非目标

- 不迁移 `auth` 或 `lowcode` 的既有顶层物理目录。
- 不重写业务模块，不改变 API、数据库、权限或运行时行为。
- 不触碰今天已规划的 session、租户设置、上传授权、分页、请求维护和 Redis 任务。
