---
task_id: 2026-09-22-frontend-style-naming-alignment
title: Align frontend stylesheet naming
created: 2026-09-22
status: completed
priority: P2
layer: platform
risk: low
---

# Task Packet — 2026-09-22-frontend-style-naming-alignment

## 背景

`NAMING_AND_BOUNDARIES_REMEDIATION_PLAN_2026-09-22.md` Wave 2 第 6 项。前端 12 个样式文件里，

组件专属样式表与组件名的对应关系不一致（有些 PascalCase、有些小写目录名），共享样式的归属

也没有明确规则。

## 命名规范（先固化，再迁移）

在 `docs/designs/REPOSITORY_LAYOUT.md §5.2` 明确三层：

1. **组件专属样式** `ComponentName.css`，与组件同目录，文件名必须等于组件名（不是 BEM 块名、
   不是目录名）。
2. **分组 / 模块级共享样式** 以目录名命名（`auth.css`）或放在显式 `shared/` 子目录
   （`system/components/shared/list-page.css`）。
3. **跨模块 / 全局共享样式** 集中在 `frontend/src/assets/` 或全局 `index.css`。

BEM 类名（如 `.time-range-filter__trigger`）不随文件名变化。

## 执行的重命名（4 个）

| 原 | 新 | 组件 |
| --- | --- | --- |
| `components/patterns/filters/time-range-filter.css` | `TimeRangeFilter.css` | `TimeRangeFilter.tsx` |
| `modules/platform/dashboard.css` | `Dashboard.css` | `Dashboard.tsx` |
| `modules/system/profile/profile.css` | `ProfileCenter.css` | `ProfileCenter.tsx` |
| `modules/system/user/user.css` | `UserList.css` | `UserList.tsx` |

导入同步更新（4 处）。`dashboard.css → Dashboard.css` 是纯大小写变更，用两段式 `mv`
（`.dashboard.tmp.css` 中转）规避大小写不敏感文件系统。

## 保留并记录理由

- `components/operational/operational.css`：`operational/` 组件组的共享样式，按目录名命名。
- `modules/auth/auth.css`：auth 模块级共享样式，按目录名命名。
- `modules/system/components/shared/list-page.css`：显式 `shared/` 目录，跨模块列表页共享。
- `core/layout/index.css`：布局入口样式。

## 边界

- **不改任何 CSS 内容**，只改文件名与 import 路径 → 编译产物 CSS 与视觉行为不变。
- 不重命名 BEM 类名（`.time-range-filter__*` 等保持不变）。
- 不移动共享样式位置（`list-page.css` 的跨模块归属属边界 task 的基线欠债，见
  `config/boundary-baseline.json`）。

## 验证集合（已执行）

| 验证 | 命令 | 结果 |
| --- | --- | --- |
| 前端类型检查 | `tsc --noEmit -p tsconfig.app.json` | exit 0 |
| 生产构建 | `vite build` | ✓ built in 1.03s |
| ESLint（4 个改动组件） | `eslint <files>` | exit 0 |
| 旧 import 残留 | `git grep 'time-range-filter.css\|dashboard.css\|profile.css\|user.css' -- frontend/src` | none |
| 结构门禁 | `check-structure-contract --strict` | 0 findings |
| 文档内链 / frontmatter | `check-doc-links` / `frontmatter-check` | 0 findings / passed |

## 视觉证据 gap（显式）

本次是**纯文件名重命名**，CSS 内容逐字节未变，BEM 类名未变，因此不产出渲染截图；视觉行为

等价于改动前。若门禁要求 UI 任务必须带截图，请在此任务上记录该 gap 已由“内容零变更”论证替代。

## Human gate

- 无视觉/行为变更、无接口/权限变更 → 无新 gate。

## 评审视角（Reviewer 检查点）

- [x] 是否改动视觉？——否，只改文件名；CSS 内容与类名零变更。
- [x] 大小写敏感路径是否安全？——是；`dashboard.css` 用两段式 mv，TS 导入大小写已与磁盘一致。
- [x] 是否遗漏导入？——`git grep` 旧名残留为 none；tsc + vite build 通过。
- [x] 规范是否先于迁移？——是，先更新 §5.2 再重命名。

## 残余 gap（显式）

- 共享样式的**跨模块位置**（`list-page.css` 被 auth 引用）未收敛，属边界基线欠债。
- `operational.css` / `auth.css` 的“按目录名命名”属规范允许的分组样式，不是违规。
