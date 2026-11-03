---
title: 入口文档必须与当前实现一致（AUD-003/004/007/016/024）
doc_type: Remediation
layer: platform
status: Archived
depends_on_layers: []
linked_contracts:
  - docs/contracts/TENANT_CONTRACT_V1.md
  - docs/contracts/PLATFORM_CONTRACT.md
updated_at: 2026-10-31
---

# Task Packet: 2026-10-31-audit-p1-entry-doc-truthfulness

## Goal

审计在入口文档上确认了 5 组失真，全部能被代码或配置直接反证：

| 编号 | 文档 | 失真 |
| --- | --- | --- |
| AUD-003a | `README.md:11-15` | “当前 foundation release v0.17.8”，而 `origin/main:VERSION` = 0.18.2，tag 已到 `pantheon-base-v0.18.2`，`docs/release-notes/RELEASE_NOTES_v0.18.2.md` 存在 |
| AUD-003b | `README.md:31` | “配额强制”，但 user/role 写路径无任何 quota 校验，且同文件 `:20` 写“配额仍然只展示不强制”。**已由 W2 于 2026-10-31 处置**：同一行还含“完整数据隔离”失实（属 AUD-002），W2 整行改完，本包不再重复编辑该行 |
| AUD-003c | `README.md:262` | “尚未提供 CONTRIBUTING 或 Issue Templates”，但 `CONTRIBUTING.md` 与 `.github/ISSUE_TEMPLATE/` 三份模板都在 |
| AUD-004 | `DESIGN.md:22,87,375` | 多租户仍写作“未来/P2/按边界预留，不在租户模型未明确前提前实现”，且全文无租户章；§4.3 的拆分理由引用已不存在的职责混合 |
| AUD-007 | `docs/designs/README.md` | 索引缺口 18 份设计；声称“均已补齐 .en companion”，实际 5 份没有；frontmatter `updated_at` 停在 2026-06-27 |
| AUD-016 | `docs/README.md:151-157` | 指导用已废弃的 `database/system_init.sql` 建库；`go run ./backend/cmd/server` 在仓库根不可执行（`backend/` 才是 Go module 根） |
| AUD-024 | `README.md:238-249` | 引用 2026-10-03 的门禁快照并称“0 个阻塞性失败”，无可复核的 run 链接 |

本包把这些入口改成“读代码得到的事实”，并让版本号只有一个可维护来源。

## Primary Layer

platform

## Dependency Layers

- `platform`（入口文档 + 设计索引）
- 仅文档，无代码、迁移、CI、i18n 运行时改动。

## Harness Profile

- Template: `admin-platform`
- Overlay: `pantheon-base`
- Quality Profile: `docs-truthfulness`
- Portable Failure Class: `doc-code-drift`
- Owner Layer: `foundation-source`
- Ratchet Decision: `guide-updated`
- Coverage Dimensions:
  - maintainability
  - architecture-fitness

交付层级：**L1**（纯文档，但触碰 README/DESIGN 属共享认知面，需一次评审）。

## Contract Anchors

- `docs/contracts/TENANT_CONTRACT_V1.md`：DESIGN 增补租户章时的事实来源（compat/multi 双模、
  §1 In/Out、§2 资源分类、§4 Casbin domain）。
- `docs/contracts/PLATFORM_CONTRACT.md`：入口文档对分层与能力面的描述口径。
- `docs/contracts/DOCUMENT_GOVERNANCE_CONTRACT.md`：索引与元数据要求。

## Scope

### In

- `README.md` + `README.en.md`：
  - 版本表改为“以 `VERSION` 与 `docs/release-notes/README.md` 为准”，不再在正文里硬编码 release 号；
  - ~~“配额强制”改为“配额展示（未强制）”，并给出 `tenant_ops_view.go:159` 与写路径无校验的事实~~
    —— **已由 W2 于 2026-10-31 处置**（同一行还含 AUD-002 的“完整数据隔离”，整行已改完；本包只做核对，不再编辑该行）；
  - 修正 community files 段落（CONTRIBUTING 与 Issue Templates 均已存在）；
  - 删除/改写 2026-10-03 的门禁快照，改为“以最近一次 required checks 的 run 为准”。
- `DESIGN.md` + `DESIGN.en.md`：
  - 新增“多租户（compat 与 multi 双模）”一节，链接 `TENANT_CONTRACT_V1`，说明已交付面
    （租户 CRUD/初始化/成员/套餐/审计/切换）与未做面（配额强制、自定义域名、自助注册）；
  - **该节必须与 `TENANT_CONTRACT_V1 §2.6` 一致**：业务域为单租户语义、不参与租户隔离（W2 已定，
    2026-10-31）。不得把“业务域按租户隔离”写进 DESIGN；
  - §3.3 P2 列表与 §9 第 10 条改为“已交付 / 仍为边界预留”的准确表述；
  - §4.3 的拆分理由改为历史背景，不再以“当前 user_service 同时承担认证”描述现状。
- `docs/README.md` + `docs/README.en.md`：
  - §6 本地启动改为 docker compose → 迁移 → seed → `cd backend && go run ./cmd/server`；
  - 明确 `database/system_init.sql` 仅历史参考；
  - 把 8 份 `docs/TENANT_*.md` 纳入索引（或随 `2026-10-31-audit-p2-doc-lifecycle-archive` 迁入子目录）。
- `docs/designs/README.md` + `.en.md`：补齐 18 条缺失条目；把“均已补齐 .en companion”改为
  “主要文档有 .en companion，清单见下”；更新 `updated_at`。

### Out

- 删除或改写 `docs/history/**`、`docs/reviews/**` 的历史结论。
- 补写 5 份缺失的 `.en.md`（成本高于收益，改为在索引里如实声明）。
- 修改任何产品代码、迁移、CI、i18n 资源。
- 在 README 里新增“未来路线图”或功能承诺。

## Expected Files

### Create

- `docs/harness/tasks/2026-10-31-audit-p1-entry-doc-truthfulness.task.md`
- `.harness/tasks/2026-10-31-audit-p1-entry-doc-truthfulness/manifest.json`
- `.harness/evidence/2026-10-31-audit-p1-entry-doc-truthfulness/{commands.json,summary.md,review.md}`

### Modify

- `README.md`、`README.en.md`
- `DESIGN.md`、`DESIGN.en.md`
- `docs/README.md`、`docs/README.en.md`
- `docs/designs/README.md`、`docs/designs/README.en.md`

### Do Not Touch

- `docs/history/**`、`docs/reviews/**`
- `CHANGELOG.md`、`VERSION`、`docs/release-notes/**`
- `backend/**`、`frontend/**`、`.github/**`

## Implementation Notes

- 版本号只留一个可维护来源：README 的版本表改为指向 `VERSION` 与 release-notes 索引，
  正文不再抄写具体 release 号。这次失真的机制正是“正文手抄 + 没人复核”。
- “配额”必须区分“展示”与“强制”两个词：`tenant_ops_view.go:159` 读 `QuotaFor` 做展示，
  `user`/`role` 写路径没有 quota 校验。文档只描述已存在的行为。
- DESIGN 增补租户章时，事实来源是合同与代码，不是历史评审报告；尤其不要把
  `TENANT_RESOURCE_SCOPE_MATRIX §4`（已过期）当成现状。
- `docs/README.md` 的启动命令要可执行：`backend/go.mod` 决定 `go run` 必须在 `backend/` 内执行。
- 索引条目用相对链接，写完后跑 `check-doc-links` 验证，避免“补索引补出死链”。

## Verification Plan

- `npm run check:docs-frontmatter`
- `node scripts/harness/check-doc-links.mjs --root . --strict`
- `node scripts/harness/check-doc-inventory.mjs --root . --strict`
- 逐条反证：`git show origin/main:VERSION`、`grep -c 'quota' backend/modules/system/iam/user`、
  `ls CONTRIBUTING.md .github/ISSUE_TEMPLATE`、`grep -n 'ProtectedGroup' docs/designs/MODULE_CONTRACT.md`
- `ls docs/designs/*.md | wc -l` 与索引条目数对齐（补齐 18 条）
- 人工复核：README 版本表不再包含具体 release 号

## Linkage

- Task ID: `2026-10-31-audit-p1-entry-doc-truthfulness`
- Task Manifest: `.harness/tasks/2026-10-31-audit-p1-entry-doc-truthfulness/manifest.json`
- OpenSpec Change: none
- Superpowers Plan: none
- Plan References: `docs/reviews/PANTHEON_BASE_GLOBAL_AUDIT_2026-10-31.md`、`docs/contracts/TENANT_CONTRACT_V1.md`
- Evidence Directory: `.harness/evidence/2026-10-31-audit-p1-entry-doc-truthfulness/`
- Review File: `.harness/evidence/2026-10-31-audit-p1-entry-doc-truthfulness/review.md`

## Evidence Required

- `commands.json`：五组失真的反证命令与输出、四条文档门禁读数、索引条目计数
- `summary.md`：每条失真“原文 → 事实 → 新表述”的三列对照
- `review.md`：逐条 reviewer posture + 是否引入新承诺的确认

## Human Gates

- README/DESIGN 是仓库门面：新表述不得引入未实现的功能承诺（本轮只允许把已实现的说清）。
- 若维护者希望保留“当前 release”字样，需同时给出复核机制（本条登记为 gap）。

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
- [x] README 不再硬编码 release 号，且 quota/community 两处与代码一致
- [x] DESIGN 具备租户章且与 TENANT_CONTRACT_V1 一致
- [x] docs/README 的建库与启动命令可执行
- [x] designs 索引补齐 18 条且 .en 声明属实
