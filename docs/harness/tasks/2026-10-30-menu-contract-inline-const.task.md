---
title: 菜单合同传感器解析内联 const 与显式报错（Base-first）
doc_type: Remediation
layer: platform
depends_on_layers: []
status: Archived
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
  - docs/harness/VERIFICATION_EVIDENCE_SPEC.md
updated_at: 2026-10-30
---

# Task Packet: 2026-10-30-menu-contract-inline-const

## Goal

`frontend/scripts/check-menu-contract.mjs` 的 Go 包常量表只从 `const ( name = "value" )`
块形式建表，行内 `const name = "value"` 会被漏收；漏收之后 `extractField()` 对该字段
静默返回空串，与「字段不存在」不可区分。消费者 `pantheon-ops` 在 SonarCloud S1192
去重过程中把 seed 值改成引用包级常量，正好撞上这条缝：为了过门禁只能把常量塞回
`const ( … )` 块（ops 侧 `serviceModuleKey` 的绕行，记录在其任务包 residual risk
⑥/⑦）。本包在 Base 侧修根因：常量表同时收集两种声明形式；已保留为 seed 的块里
出现无法解析的裸标识符引用时，输出一条带文件、字段名与标识符的具名错误而不是空串；
并把可测的接缝（`collectGoConsts` / `extractField` / `goConstTable` /
`recordUnresolvedConstRefs` / `takeUnresolvedGoConstRefs`）导出、加
`pathToFileURL` 直接执行守卫，配 `tests/scripts/check-menu-contract.test.mjs`
单元测试。零 schema、零路由、零权限、零 i18n 资源变化——只改传感器本身。

## Primary Layer

platform

## Dependency Layers

- `platform`（治理传感器 + 其单元测试 + failure-registry 记录）。不触碰
  `backend/**`、`frontend/src/**`、`system/*`、`business/*`、workflow 文件。

## Workspace Context

- Target Repository: `pantheon-base`
- Repository Role: `foundation-source`
- Upstream Dependencies: `pantheon-harness`
- Downstream Consumers: `pantheon-ops`
- Sync Expectation: `required`
- Release Requirement: `foundation-release`
- Downstream Sync Note: ops 侧同名文件与本文件在修复前逐字节相同；修复只经
  foundation release 流向消费者，不手抄。ops 的常量块绕行不需要回滚——常量块形式
  仍被收集，绕行只是不再必要。

## Harness Profile

- Template: `admin-platform`
- Overlay: `pantheon-base`
- Quality Profile: `permission-policy`
- Portable Failure Class: `static-sensor-gap`
- Owner Layer: `foundation-source`
- Ratchet Decision: `sensor-added`
- Coverage Dimensions:
  - behaviour
  - maintainability

交付层级：**L2**（改动的是门禁传感器语义：同一条 seed 在修复前后的门禁结论会不同；
且该传感器经 foundation release 流入消费者，属继承边界）。

## Contract Anchors

- `docs/contracts/PLATFORM_CONTRACT.md`：菜单/权限/i18n seed 一致性由该传感器机器核验。
- `docs/harness/VERIFICATION_EVIDENCE_SPEC.md`：验证结论用度量而非断言；本包的
  「修复前失败 / 修复后通过」是一对可复现读数。
- `docs/harness/failure-registry.md`：FR-022 记录「传感器把解析失败静默降级为空值」这一类。
- `docs/designs/REPOSITORY_LAYOUT.md`：§8.3 治理脚本的归属与观测要求——传感器缺陷回底座修，
  不在消费者打补丁。

## Scope

### In

- `frontend/scripts/check-menu-contract.mjs`：
  - `collectGoConsts(source, table)` 收集两种声明形式（块条目 + 行内 `const`，含可选
    显式类型与行尾注释），显式不收集 `var`/`:=` 运行时赋值；
  - `constReference()` 只把**裸标识符**视为常量引用，`item.Key`、`strings.ToLower(x)`、
    `menuKey(i)` 这类表达式不算；
  - `recordUnresolvedConstRefs(block, fieldNames, scope)` 把无法解析的裸引用写入累加器，
    `takeUnresolvedGoConstRefs()` 排空并交给 `main()` 作为**第一批**错误输出；
  - 三个 seed 解析循环只在「该块被保留为 seed」时登记；i18n 两个循环在
    locale/group 命中时登记（即使 `key` 已空），否则静默丢 key 的正是本缺陷本身；
  - 导出接缝 + `pathToFileURL` 直接执行守卫。
- `tests/scripts/check-menu-contract.test.mjs`：10 条用例，覆盖两种声明形式、显式类型、
  行尾注释、`var`/`:=` 不被当作常量、块内 seed 与行内常量都能解析、表达式引用不报、
  裸标识符未声明时报且可排空、`goConstTable` 按包目录聚合同包非测试文件。
- `package.json`：`test:menu-contract` 别名（`test:scripts` 已 glob 到该文件，CI 走
  `ci.yml` 的 `npm run test:scripts`）。
- `docs/harness/failure-registry.md`：FR-022。
- 任务包、manifest 与 evidence。

### Out

- 任何 `backend/**` seed、菜单 manifest、路由、权限键、i18n 资源变化（本包不动被核验对象）
- `.github/workflows/*`、`sonar-project.properties`、门禁规则的增删
- `VERSION` / `CHANGELOG.md` / foundation release 切版与发布（发布是不可逆动作，留维护者）
- 修改 `pantheon-ops`：消费者的常量块绕行不回滚，等下一次 foundation release 自然吸收
- 用 `NOSONAR`、`//nolint`、`eslint-disable` 或降低阈值来让任何读数变绿

## Expected Files

### Create

- `docs/harness/tasks/2026-10-30-menu-contract-inline-const.task.md`
- `.harness/tasks/2026-10-30-menu-contract-inline-const/manifest.json`
- `.harness/evidence/2026-10-30-menu-contract-inline-const/commands.json`
- `.harness/evidence/2026-10-30-menu-contract-inline-const/summary.md`
- `.harness/evidence/2026-10-30-menu-contract-inline-const/review.md`
- `.harness/evidence/2026-10-30-menu-contract-inline-const/pr-body.md`

### Modify

- `frontend/scripts/check-menu-contract.mjs`
- `tests/scripts/check-menu-contract.test.mjs`（新建后由本包持有）
- `package.json`
- `docs/harness/failure-registry.md`

### Do Not Touch

- `backend/**`、`frontend/src/**`
- `.github/workflows/*`、`sonar-project.properties`
- `VERSION`、`CHANGELOG.md`、`docs/release-notes/**`
- `backend/modules/system/i18n/builtin_locale_resources.json` 与
  `frontend/src/i18n/resources/*.ts`（工作树中既有的未提交 i18n 改动，属别的在途工作，
  本 PR 不 stage、不提交、不背书）

## Implementation Notes

- 漏收的直接后果不是「报错」而是「假通过/假失败」：`goConstTable` 少一个条目时
  `extractField` 返回空串，`parseBackendSeeds` 的保留条件 `path || pagePerm || perms`
  随之落空，整条 seed 从核验集合消失。
- 修复前后的对照读数是实测的，不是推断的：把 `auth/login` 菜单 seed 的
  `Path: "/system/login-log"` 改为引用同包行内常量后，HEAD 版传感器输出
  `后端缺少菜单 seed: /system/login-log`（把传感器缺陷误判成后端缺 seed），
  修复版输出 `✅ … 19 个菜单，23 条路由，102 个权限，23 个组件键`；再把引用改成未声明
  标识符，修复版第一条错误即
  `后端 seed 引用了无法解析的常量: Path: probeUndeclaredConst (…login_menu.go)`。
  两个对照都在工作树内临时改动、运行、随后 `cp` 还原，`git status` 确认该文件干净。
- 具名错误排在 `main()` 错误列表最前：解析失败是原因，下游的
  「后端缺少菜单 seed」是后果，顺序颠倒会让读者先去补 seed 而不是修传感器。
- 只对「被保留的 seed 块」登记，是为了不把 Go 代码里恰好长成 `{ Key: item.Key }`
  的片段当 seed 报（第一版实现就在 `system/i18n/i18n_seed.go:94` 上产生 4 条噪声，
  已用「裸标识符」判定 + 「保留块」判定双重收敛）。
- 行内常量收集不引入 `var` 污染：`var` / `:=` 两种形式有显式用例断言不被收录。
- ops 侧的绕行（常量放进 `const ( … )` 块）在修复后仍然合法，两种形式都被收集，
  因此消费者无需为吸收本修复而改动业务 seed 文件。

## Verification Plan

- `npm run test:menu-contract` → 10/10 pass
- `npm run test:scripts` → 181/181 pass, 0 fail
- `cd frontend && npm run check:menu-contract` → exit 0（19 菜单 / 23 路由 / 102 权限 / 23 组件键）
- 对照实验：HEAD 版传感器 vs 修复版，对同一份行内常量 seed 的输出差异（见 Implementation Notes）
- `npm run check:harness-adoption -- --strict` → 本包文件 0 finding（既有 2 条 finding 属于工作树里未提交的 i18n JSON，非本包）
- `npm run check:docs-frontmatter`、`check:task-packet`、`check:task-packet-template`、
  `check:structure`、`check:harness-encoding`、`check:harness-docs`、
  `check:failure-registry`、`check:generated`、`check:generated-modules`、
  `check:ui-quality-gate`、`check:duplication` → exit 0
- `node scripts/harness/check-evidence.mjs --root . --strict`、
  `node scripts/harness/check-review.mjs --root . --strict` → exit 0
- `node scripts/check-pr-governance.mjs`（经 `scripts/create-pr.mjs` 对 PR 正文执行）→ exit 0
- `git diff --stat` 证明改动面只有传感器、测试、package.json 别名、failure-registry 一行与本包文档

## Linkage

- Task ID: `2026-10-30-menu-contract-inline-const`
- Task Manifest: `.harness/tasks/2026-10-30-menu-contract-inline-const/manifest.json`
- OpenSpec Change: none
- Superpowers Plan: none
- Plan References: `docs/harness/failure-registry.md`、`docs/designs/REPOSITORY_LAYOUT.md`
- Evidence Directory: `.harness/evidence/2026-10-30-menu-contract-inline-const/`
- Review File: `.harness/evidence/2026-10-30-menu-contract-inline-const/review.md`

## Evidence Required

- `commands.json`：单元测试读数、全量 `test:scripts` 读数、菜单合同门禁读数、修复前后
  对照实验读数、各条治理门禁读数
- `summary.md`：根因、判定规则（裸标识符 + 保留块）、对消费者的影响
- `review.md`：逐条对照 reviewer posture 的读数 + Machine Readable 块

## Human Gates

- 本包不切 foundation release、不动 `VERSION`/`CHANGELOG`：ops 要吸收这个传感器修复
  需要一次 patch 发布，发布是不可逆动作，由维护者决定时点。
- 工作树中已有未提交的 i18n 资源改动（`builtin_locale_resources.json` +
  `frontend/src/i18n/resources/*.ts`），本 PR 显式不 stage；如果它们与别的在途任务冲突，
  由维护者裁决。

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
- [x] 两种常量声明形式都被收集，`var`/`:=` 有显式不收集断言
- [x] 未解析的裸引用成为第一批具名错误，不再静默返回空串
- [x] 修复前/修复后对照读数实测并写入 evidence（含 HEAD 版误判为「后端缺少菜单 seed」的证据）
- [x] 传感器接缝导出 + 直接执行守卫，单元测试进 `test:scripts` glob 与 CI
- [x] 合并已执行（PR #471 squash 到 `03e13d48`，36/37 检查绿、2 项预期跳过，分支已删）；foundation
      release 时点仍由维护者决定（本包 scope out，见 evidence knownGaps）
