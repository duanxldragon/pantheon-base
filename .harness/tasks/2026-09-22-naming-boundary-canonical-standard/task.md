---
task_id: 2026-09-22-naming-boundary-canonical-standard
title: Freeze canonical naming, layout, and layer-boundary standard
created: 2026-09-22
status: completed
priority: P1
layer: platform
risk: low
---

# Task Packet — 2026-09-22-naming-boundary-canonical-standard

## 背景

`NAMING_AND_BOUNDARIES_REMEDIATION_PLAN_2026-09-22.md` Wave 0 第 1 项。结构审查

发现：目录白名单、前端/后端命名、文档分类、生成文件规则和分层依赖方向散落在

多个 checker、合同和设计文档里，没有唯一 canonical 规范。后续边界门禁、生成治理、

文档迁移都必须先有一份权威标准才能落地。

## 目标

发布一份可执行、可审查、可回归的仓库结构标准，覆盖：

1. 目录白名单（`backend/**`、`frontend/**`、根目录稳定入口）；
2. 后端 Go 与前端 TS/TSX 的文件后缀词典；
3. 文档分类与目录归属；
4. 生成文件规则（生成源、生成产物、手工层、漂移检查、生成标记）；
5. `platform / auth / system/* / business/*` 的允许依赖方向矩阵；
6. `auth` / `lowcode` / `generated` 等受控例外；
7. 规范 → 门禁映射和变更流程。

## 交付物

- `docs/designs/REPOSITORY_LAYOUT.md`：从“仓库目录布局”扩展为
  “仓库布局、命名与分层边界规范”，新增 §5 文件命名词典、§6 文档分类、
  §7 生成文件规则、§8 分层依赖矩阵、§9 受控例外、§10 机械门禁与更新点。
- `docs/designs/REPOSITORY_LAYOUT.en.md`：英文 companion 同构镜像。
- 任务文档与证据：`.harness/tasks/.../`、`.harness/evidence/.../`。

## 关键决策

- **不新建文档**：manifest scope 明确把 `docs/designs/REPOSITORY_LAYOUT.md`
  作为 canonical 落点；`check-structure-contract.mjs` 的契约源注释、doc-inventory
  与 `docs/designs/README.md` 都引用该文件名，扩展并行新建会立即制造第二份规范。
- **只固化事实，不虚构门禁**：§5.1 后缀词典来自实际 `backend/modules` 文件名分布；
  §8.2 矩阵与 `check-boundaries.mjs` / `check-arch-boundaries.mjs` 现有规则对齐；
  尚未落地的部分（生成标记、`check:generated`、`platform -> system` / `auth -> iam`
  未阻断）在 §7.2、§8.3、§10.1 显式标为 **gap**，不写成“已强制”。
- **受控例外显式化**：`auth` / `lowcode` / `generated` 的物理独立从“心照不宣”变成
  §9 的登记表（owner + 理由 + 复核条件 + 禁止扩散），对应计划的“必须明确为受控例外”。

## 边界

- 层级：platform / governance（低风险）→ L1。
- 只改治理文档：`docs/designs/REPOSITORY_LAYOUT{,.en}.md`、`.harness/**`。
- 不改生产代码，不改 checker 白名单，不移动任何文件（后续 Wave 1/2 任务负责）。

## 验证集合（已执行）

| 验证 | 命令 | 结果 |
| --- | --- | --- |
| 结构契约门禁 | `node scripts/harness/check-structure-contract.mjs --root . --strict` | 0 findings / 1939 tracked files |
| 任务包模板 | `node scripts/check-task-packet-template.mjs` | OK |
| 文档 frontmatter（本仓库严格版） | `node scripts/frontmatter-check.mjs` | passed, 266 docs |
| 文档 frontmatter（harness 版） | `node scripts/harness/check-doc-frontmatter.mjs --root . --strict` | 0 error（仅既有 legacy warning） |
| 文档内链 | `node scripts/harness/check-doc-links.mjs --root . --strict` | 0 findings |
| 结构门禁单测 | `node --test tests/scripts/harness-check-structure-contract.test.mjs` | 11 pass / 0 fail |

> 说明：本机 `npm` 被指向 WSL relay 且 `/bin/bash` 缺失，无法执行 `npm run`；已改跑
> `package.json` 中对应脚本的等价 `node` 命令，命令与脚本定义一一对应。

## Human gate

- 纯治理文档扩展，无运行时、接口、权限、i18n、数据库变更；无新 gate。
  变更经 PR required checks + 非作者评审把关。

## 评审视角（Reviewer 检查点）

- [x] 是否制造了第二份规范？——否，扩展同一文件，两份 companion 同构。
- [x] 是否把未实现的规则写成已强制？——否，生成标记、`check:generated`、
      `platform -> system` 未阻断均在文中标记为 gap。
- [x] 例外表是否变成白名单扩容？——否，例外带 owner/理由/复核条件，并写明“塞进例外
      表等同掩盖问题”。
- [x] 是否与现有 checker / CI 对齐？——§10.1 映射表逐条对齐
      `check-structure-contract.mjs`、`check-boundaries.mjs`、`frontmatter-check.mjs`、
      `check-arch-boundaries.mjs`、`cleanup-generated-modules.mjs` 及对应 workflow。

## 残余 gap（显式）

- 生成文件标记尚未落地、`check:generated` 尚未实现、`check-arch-boundaries.mjs`
  尚未接入 CI：由 Wave 1 `2026-09-22-generated-artifact-governance` 承接。
- `platform -> system` 与 `auth -> system/iam` 违规仍未阻断：由 Wave 1
  `2026-09-22-layer-boundary-gate` 固化基线并收口。
- 文档搬迁与前端样式命名：Wave 2 任务承接。
