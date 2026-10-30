---
title: 菜单过滤 IN 子句常量化回流底座，消除 ops shared-drift（Base-first）
doc_type: Remediation
layer: platform
depends_on_layers: []
status: Active
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
  - docs/harness/VERIFICATION_EVIDENCE_SPEC.md
updated_at: 2026-10-31
---

# Task Packet: 2026-10-31-base-menu-filter-sql-literal-convergence

## Goal

`pantheon-ops` 在关闭 SonarCloud 漏洞/缺陷（ops PR #156）时，把它从底座继承来的
`backend/modules/business/retired_modules.go` 里的菜单过滤条件从
`query.Where(column+" IN ?", values)` 改成三条整句子句常量
（`menuModuleInClause` / `menuPathInClause` / `menuComponentInClause`），因为 ops 独有的
`scripts/check-gorm-sql-literal.mjs` 断言「GORM 的 SQL 文本与列名必须是字面量或包级常量」。
底座没有这条断言，文件仍是列名拼接形式，于是 ops 的
`npm run check:shared-drift`（以及每周 `Base Compatibility Rebuild` 工作流的
「Check shared-file drift against base HEAD」一步）报
`DRIFT_MODIFIED backend/modules/business/retired_modules.go` 并 FAIL。

本包按 Base-first 把这条安全收紧回流到底座：底座采用与消费者逐字节相同的形式。
效果是三件事同时成立——shared-drift 门禁转绿、底座自身也满足「SQL 文本不来自运行期
列名拼接」这条不变式、`.foundation/allowed-drift.json` 不被用来给偏差开后门。
行为零变化：三个调用点传入的句子常量展开后与原拼接结果完全一致
（`module IN ?` / `path IN ?` / `component IN ?`），取值仍只经 `?` 绑定。

## Primary Layer

inheritance-sync

## Workspace Context

- Target Repository: `pantheon-base`
- Repository Role: `foundation-source`
- Upstream Dependencies: `pantheon-harness`
- Downstream Consumers: `pantheon-ops`
- Sync Expectation: completed
- Release Requirement: none
- Downstream Sync Note: 收敛方向是 ops→base（消费者已有的形式回流底座），落地后两侧
  该文件逐字节相同，ops 无需为吸收本改动而再改一次；`Sync Expectation: completed`
  指的就是这一步已经以字节对齐的方式完成，不依赖新的 foundation release。

## Dependency Layers

- `business/*`（被改文件所在层，只改 SQL 子句的构造形式）。
- 不动 `system/*`、`platform` 传感器、workflow、`.foundation/**`。

## Harness Profile

- Template: `admin-platform`
- Overlay: `pantheon-base`
- Quality Profile: `permission-policy`
- Portable Failure Class: `inheritance-drift`
- Owner Layer: `foundation-source`
- Ratchet Decision: `no-repeat-observed`
- Coverage Dimensions:
  - behaviour
  - architecture-fitness

交付层级：**L2**（触碰继承边界：改的是消费者逐字节继承的底座文件；且改动内容是
SQL 构造形式，属查询安全面）。

## Contract Anchors

- `docs/contracts/PLATFORM_CONTRACT.md`：底座与消费者共享文件的对齐要求。
- `docs/harness/VERIFICATION_EVIDENCE_SPEC.md`：结论用读数表达；本包的「修复前 2 条违规 /
  修复后 0 条」与「DRIFT_MODIFIED / OK」都是成对实测读数。

被回流的不变式本身写在消费者的 `scripts/check-gorm-sql-literal.mjs`（跨仓路径，非本仓可
解析锚点，故不入 Contract Anchors）：其头部说明该断言把一次人工 gosecurity:S3649 复核变成
可维护规则，本包把它的代码形态搬到底座。

## Scope

### In

- `backend/modules/business/retired_modules.go`：新增三条包级句子句常量；
  `applyMenuFieldFilter` 的参数由 `column string` 改为 `inClause string`，两个
  `Or` / `Where` 调用点直接用整句常量，不再做 `column + " IN ?"` 拼接；三个调用点传常量。
  与 ops 现有文件保持逐字节相同（含其注释与 `gorm-sql-literal:allow` 标记行）。
- 任务包、manifest 与 evidence。

### Out

- 修改 `.foundation/allowed-drift.json`（ops 侧共享偏差白名单）——用白名单把这条
  DRIFT_MODIFIED 静音，是把安全收紧记成「允许的偏差」，本包选择回源头修而不是记豁免。
- 把 `scripts/check-gorm-sql-literal.mjs` 作为新门禁引入底座：那要动 `package.json`
  与 `.github/workflows/*`（底座 CI 面，属需两位批准的高风险范围），本包不做，记为显式缺口。
- 任何行为/接口/权限/schema 变化，任何 seed、路由、i18n 资源变化。
- `VERSION` / `CHANGELOG.md` / `docs/release-notes/**` 与 foundation release 切版发布。
- 修改 `pantheon-ops` 的任何文件（消费者侧已是要收敛成的形式，本包落地后它自己就绿）。
- 用 `NOSONAR`、`//nolint`、`eslint-disable`、降阈值或改白名单让任何读数变绿。

## Expected Files

### Create

- `docs/harness/tasks/2026-10-31-base-menu-filter-sql-literal-convergence.task.md`
- `.harness/tasks/2026-10-31-base-menu-filter-sql-literal-convergence/manifest.json`
- `.harness/evidence/2026-10-31-base-menu-filter-sql-literal-convergence/commands.json`
- `.harness/evidence/2026-10-31-base-menu-filter-sql-literal-convergence/summary.md`
- `.harness/evidence/2026-10-31-base-menu-filter-sql-literal-convergence/review.md`
- `.harness/evidence/2026-10-31-base-menu-filter-sql-literal-convergence/pr-body.md`

### Modify

- `backend/modules/business/retired_modules.go`

### Do Not Touch

- `.foundation/allowed-drift.json`、`scripts/business-overlay/**`
- `backend/modules/business/**` 除本文件以外的任何文件
- `.github/workflows/*`、`sonar-project.properties`、`package.json`
- `VERSION`、`CHANGELOG.md`、`docs/release-notes/**`
- `backend/modules/system/i18n/builtin_locale_resources.json` 与
  `frontend/src/i18n/resources/*.ts`（工作树中既有的未提交 i18n 改动，属别的在途工作，
  本 PR 不 stage、不提交、不背书）

## Implementation Notes

- 这条 drift 的成因不是谁写错，而是两仓门禁不对称：ops 有
  `check-gorm-sql-literal.mjs`，底座没有。不对称下消费者为满足更严门禁而改继承文件，
  必然产生 shared-drift；正解是把不变式搬到源头，而不是在白名单里登记「这里允许不同」。
- 采用整句子句常量（`"module IN ?"`）而不是列名常量，是因为前者让 SQL 文本整条来自
  字面量，检查器无需做「列名是否为常量」的数据流推断即可判定。
- 文件与 ops 逐字节相同是硬要求：`check-shared-drift.mjs` 用
  `git -C <base> show HEAD:<path>` 的字节哈希比对，任何注释差异都会重新产生
  `DRIFT_MODIFIED`。因此底座保留了对 ops 独有脚本的注释引用，这一处「注释指向
  本仓尚无的脚本」是刻意的代价，记入 knownGaps，由是否把检查器引入底座的决定来消解。
- `applyMenuFieldFilter` 的形参名从 `column` 改为 `inClause` 不只是改名：它把「这里传的是
  整条子句、不是列名」写进签名，防止后来者又把 `+ " IN ?"` 拼回去。

## Verification Plan

- `cd backend && go vet ./... && go build ./...` → exit 0
- `cd backend && go test -count=1 ./...` → 47 个包 ok，0 FAIL
- `CGO_ENABLED=1 go test -race -count=1 ./...` → 本机 ThreadSanitizer 初始化失败
  （见 knownGaps），以无 `-race` 全量 + CI 的 race 作业覆盖
- `gofmt -l backend/modules/business/retired_modules.go` → 空
- 成对探针：把收敛前/收敛后的该文件各自放进临时 root，用 ops 的
  `node ../pantheon-ops/scripts/check-gorm-sql-literal.mjs --root <tmp>` 跑，
  预期收敛前 2 条违规、收敛后 0 条
- `cd ../pantheon-ops && node scripts/business-overlay/check-shared-drift.mjs --base ../pantheon-base`
  → 提交后由 `FAIL … 1 modified` 变 `OK shared drift check: 812 shared files identical to base, 10 allowlisted drift, 161 business-overlay files skipped`
- `npm run check:task-packet`、`check:task-packet-template`、`check:docs-frontmatter`、
  `check:structure`、`check:harness-encoding`、`check:duplication`
- `node scripts/harness/check-evidence.mjs --root . --strict`、
  `node scripts/harness/check-review.mjs --root . --strict`
- `node scripts/create-pr.mjs --title ... --body-file .harness/evidence/.../pr-body.md`
- `git diff --stat` 证明业务面只有这一个文件

## Linkage

- Task ID: `2026-10-31-base-menu-filter-sql-literal-convergence`
- Task Manifest: `.harness/tasks/2026-10-31-base-menu-filter-sql-literal-convergence/manifest.json`
- OpenSpec Change: none
- Superpowers Plan: none
- Plan References: `docs/harness/VERIFICATION_EVIDENCE_SPEC.md`、`docs/contracts/PLATFORM_CONTRACT.md`
- Evidence Directory: `.harness/evidence/2026-10-31-base-menu-filter-sql-literal-convergence/`
- Review File: `.harness/evidence/2026-10-31-base-menu-filter-sql-literal-convergence/review.md`

## Evidence Required

- `commands.json`：vet/build/test 读数、成对探针读数（2 → 0）、ops shared-drift 前后读数、
  治理门禁读数、`-race` 环境缺口的原始错误
- `summary.md`：drift 成因（门禁不对称）、为什么选回流源头而非白名单、行为不变的论证
- `review.md`：逐条 reviewer posture 读数 + Machine Readable 块

## Human Gates

- 合并归维护者批准（L2）；本包不切 foundation release、不动 `VERSION`/`CHANGELOG`。
- 是否把 `check-gorm-sql-literal.mjs` 引入底座 CI（需动 `package.json` 与 workflow，
  属高风险范围）由维护者决定；本包只把不变式的代码形态搬到底座。
- 工作树中既有的未提交 i18n 改动本 PR 显式不 stage；若与别的在途任务冲突由维护者裁决。

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
- [x] 底座该文件与消费者逐字节相同，`check:shared-drift` 不再报 DRIFT_MODIFIED
- [x] 成对探针读数（收敛前 2 条违规 / 收敛后 0 条）实测并写入 evidence
- [x] 未使用白名单/豁免/降阈值让任何读数变绿
